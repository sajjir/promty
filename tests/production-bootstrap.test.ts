import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const root=path.resolve('.');
test('production JSON bootstrap contains no demo prompts and preserves corrupt files instead of seeding over them', async () => {
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'promty-prod-empty-'));
 const port=13989;
 fs.mkdirSync(path.join(dir,'dist'));fs.writeFileSync(path.join(dir,'dist/index.html'),'<html><head></head><body></body></html>');
 const child=spawn(process.execPath,['--import',path.join(root,'node_modules/tsx/dist/loader.mjs'),path.join(root,'server.ts')],{cwd:dir,env:{...process.env,NODE_ENV:'production',LOCAL_PREVIEW:'0',STORAGE_BACKEND:'json',DATABASE_URL:'',PORT:String(port),HOST:'127.0.0.1',JWT_SECRET:'production-fixture-secret-'.repeat(3),ADMIN_EMAIL:'fixture@test.invalid',ADMIN_PASSWORD:'fixture-only-password',APP_ORIGIN:'https://test.invalid',MELIPAYAMAK_USERNAME:'fixture',MELIPAYAMAK_PASSWORD:'fixture',MELIPAYAMAK_OTP_BODY_ID:'1'}});
 let logs='';child.stdout.on('data',d=>logs+=d);child.stderr.on('data',d=>logs+=d);
 const call=(route:string)=>fetch(`http://127.0.0.1:${port}`+route);
 try {
  let ready=false;for(let i=0;i<100;i++){try{const response=await call('/api/config');if(response.ok){ready=true;break;}}catch{} await new Promise(r=>setTimeout(r,50));}
  assert.ok(ready,'temporary server startup failed: '+logs.slice(-500));
  assert.equal((await call('/api/settings/public')).status,200);
  const state=JSON.parse(fs.readFileSync(path.join(dir,'db.json'),'utf8'));
  assert.deepEqual(state.prompts,[]);assert.equal(fs.statSync(path.join(dir,'db.json')).mode & 0o777,0o600);
  const terms=(await (await call('/api/taxonomies')).json()).terms;
  for(const slug of ['codex','deepseek','code','report','chart','design','jewelry']) assert.ok(terms.some((t:any)=>t.slug===slug),slug);
  assert.equal((await (await call('/api/prompts')).json()).pagination.total,0);
  const saved=JSON.parse(fs.readFileSync(path.join(dir,'db.json'),'utf8'));
  saved.prompts=[{id:'keep',body:'preserve-existing',isActive:true,tools:[],domains:[],outputFormats:[]}];
  saved.taxonomies=saved.taxonomies.filter((t:any)=>t.slug!=='deepseek');
  const codex=saved.taxonomies.find((t:any)=>t.slug==='codex');codex.titleFa='عنوان مدیریت‌شده';codex.status='deprecated';
  fs.writeFileSync(path.join(dir,'db.json'),JSON.stringify(saved));
  await call('/api/taxonomies');
  const upgraded=JSON.parse(fs.readFileSync(path.join(dir,'db.json'),'utf8'));
  assert.deepEqual(upgraded.prompts,saved.prompts);assert.equal(upgraded.taxonomies.find((t:any)=>t.slug==='codex').titleFa,'عنوان مدیریت‌شده');assert.equal(upgraded.taxonomies.find((t:any)=>t.slug==='codex').status,'deprecated');
  assert.equal(upgraded.taxonomies.filter((t:any)=>t.slug==='deepseek').length,1);
  const corrupt='{"existing-data": "DO NOT OVERWRITE"';fs.writeFileSync(path.join(dir,'db.json'),corrupt);
  assert.equal((await call('/api/settings/public')).status,500);
  assert.equal(fs.readFileSync(path.join(dir,'db.json'),'utf8'),corrupt);
 } finally {child.kill('SIGTERM');await new Promise<void>(resolve=>child.once('exit',()=>resolve()));fs.rmSync(dir,{recursive:true,force:true});}
});


test('default production refuses missing PostgreSQL rather than silently bootstrapping JSON', async () => {
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'promty-postgres-required-'));
 const child=spawn(process.execPath,['--import',path.join(root,'node_modules/tsx/dist/loader.mjs'),path.join(root,'server.ts')],{cwd:dir,env:{...process.env,NODE_ENV:'production',LOCAL_PREVIEW:'0',STORAGE_BACKEND:'',DATABASE_URL:'',JWT_SECRET:'fixture-secret-'.repeat(4),ADMIN_EMAIL:'fixture@test.invalid',ADMIN_PASSWORD:'fixture-password-123',APP_ORIGIN:'https://test.invalid',MELIPAYAMAK_USERNAME:'fixture',MELIPAYAMAK_PASSWORD:'fixture',MELIPAYAMAK_OTP_BODY_ID:'1'}});
 let logs='';child.stderr.on('data',d=>logs+=d);
 try {const code=await new Promise<number|null>(resolve=>child.once('exit',resolve));assert.notEqual(code,0);assert.ok(logs.includes('Production PostgreSQL requires DATABASE_URL'));assert.equal(fs.existsSync(path.join(dir,'db.json')),false);}
 finally {fs.rmSync(dir,{recursive:true,force:true});}
});
