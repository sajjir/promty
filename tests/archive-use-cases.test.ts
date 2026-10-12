import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { demoPrompts } from '../scripts/archive-demo-data';
import { filterPrompts, buildArchiveFacets, paginatePrompts } from '../src/server/repositories/filterPrompts';
import { getUseCase, normalizeArchivePrompt, groupAncestors } from '../src/lib/archiveCatalog';
import { readFilterValues, setFilterValues, filterValues } from '../src/lib/archiveFilters';
import { renderPrompt } from '../src/lib/renderPrompt';

const ids = (filters: any) => filterPrompts(demoPrompts, filters).map(p => p.id);
test('18 examples: task first, independent source/tool/output filters, no duplicate records', () => {
  assert.equal(new Set(demoPrompts.map(p => p.id)).size, 18);
  assert.equal(ids({resourceType:'skill'}).length,4);
  assert.equal(ids({resourceType:'agent-guide'}).length,3);
  assert.equal(ids({resourceType:'prompt'}).length,11);
  assert.deepEqual(ids({group:'product',outputFormat:'video'}), ['demo-clothing-video']);
  assert.deepEqual(ids({group:'product',outputFormat:'image'}), ['demo-jewelry-image']);
  assert.deepEqual(ids({useCase:'book-writing',resourceType:'agent-guide',outputFormat:'text'}), ['demo-book-agent-guide']);
  assert.deepEqual(ids({useCase:'book-writing',outputFormat:'markdown'}), []);
  assert.deepEqual(ids({useCase:'business-ideas',tool:'claude'}), ['demo-business-ideas']);
  assert.deepEqual(ids({useCase:'business-ideas',tool:'gemini'}), ['demo-business-ideas']);
  assert.deepEqual(ids({group:'software',outputFormat:'video'}), []);
  assert.deepEqual(ids({useCase:'unknown'}), []);
  for (const prompt of demoPrompts) {
    assert.equal(prompt.category,getUseCase(prompt.useCase)?.title);
    assert.equal(prompt.isDemo,true);
    const rendered = renderPrompt(prompt.body,{context:'ورودی آزمایشی',goal:'هدف مشخص'});
    assert.equal(/\{\{\w+\}\}/.test(rendered),false);
    assert.ok(rendered.includes('ورودی آزمایشی'));
    if (prompt.resourceType === 'skill') assert.match(rendered,/^---\nname: [a-z-]+\ndescription: "[^\n]+"\n---\n/);
  }
});
test('Persian search ranks the complete use case, supports Arabic letters and ZWNJ', () => {
  for (const [q,id] of [
    ['ويديو محصول پوشاك','demo-clothing-video'], ['جواهرات','demo-jewelry-image'],
    ['اپليكيشن اندرويدي','demo-android-app'], ['ایده پردازی کسب و کار','demo-business-ideas'],
    ['کوچینگ','demo-personal-coaching'], ['نوشتن کتاب','demo-book-agent-guide'],
    ['دسترس پذیری','demo-accessibility-skill'], ['فروش ماهانه','demo-sales-skill'],
  ]) assert.equal(ids({q})[0],id,q);
  assert.deepEqual(ids({q:'unfindable-123456'}), []);
});
test('learning/teaching legacy filters return one canonical teaching record', () => {
  const old = {...demoPrompts[4],intent:'Learning',intents:['learning','teaching'],useCase:'learning-plan'};
  assert.equal(filterPrompts([old],{intent:'teaching'})[0].intent,'teaching');
  assert.equal(filterPrompts([old],{intent:'learning'}).length,1);
  assert.deepEqual(normalizeArchivePrompt(old).intents,['teaching']);
});
test('local import is idempotent, preserves existing content/private state, and creates a private backup', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'promty-import-test-'));
  const dbPath = path.join(dir,'db.json');
  const original = {prompts:[{...demoPrompts[4],id:'v3y6myxnu',intent:'learning',useCase:undefined,body:'KEEP ORIGINAL BODY',usageCount:19}],users:[{id:'preserve'}],settings:{siteTitle:'keep'},savedPrompts:[{id:'keep-bookmark'}],taxonomies:[]};
  fs.writeFileSync(dbPath,JSON.stringify(original));
  const args = ['--import',path.resolve('node_modules/tsx/dist/loader.mjs'),path.resolve('scripts/import-local-archive.ts'),dbPath];
  try {
    assert.throws(()=>execFileSync(process.execPath,args,{env:{...process.env,LOCAL_PREVIEW:'0'},stdio:'pipe'}));
    const first = JSON.parse(execFileSync(process.execPath,args,{env:{...process.env,LOCAL_PREVIEW:'1'},encoding:'utf8'}));
    assert.equal(first.added,18);assert.equal(first.reclassified,1);
    const current=JSON.parse(fs.readFileSync(dbPath,'utf8'));
    assert.equal(current.prompts.length,19);assert.equal(current.prompts[0].body,'KEEP ORIGINAL BODY');assert.equal(current.prompts[0].usageCount,19);
    assert.equal(current.prompts[0].useCase,'learning-plan');assert.equal(current.prompts[0].intent,'teaching');
    for (const key of ['users','settings','savedPrompts']) assert.deepEqual(current[key],original[key]);
    assert.deepEqual(JSON.parse(fs.readFileSync(first.backup,'utf8')),JSON.parse(JSON.stringify(original)));
    assert.equal(fs.statSync(first.backup).mode & 0o777,0o600);
    const second = JSON.parse(execFileSync(process.execPath,args,{env:{...process.env,LOCAL_PREVIEW:'1'},encoding:'utf8'}));
    assert.equal(second.added,0);assert.equal(second.reclassified,0);
    assert.deepEqual(JSON.parse(fs.readFileSync(dbPath,'utf8')),current);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});

test('multiple choices use OR within facets, AND across facets and never duplicate records', () => {
  const tools = ['claude','midjourney','deepseek'];
  const result = filterPrompts(demoPrompts, {tool:tools});
  const expected = demoPrompts.filter(p => p.tools?.some(tool => tools.includes(tool)));
  assert.deepEqual(new Set(result.map(p=>p.id)),new Set(expected.map(p=>p.id)));
  assert.equal(result.length,new Set(result.map(p=>p.id)).size);
  const combined = filterPrompts(demoPrompts,{group:['business','social'],tool:tools,outputFormat:['text','image'],resourceType:['prompt','skill']});
  assert.ok(combined.some(p=>p.id==='demo-jewelry-image'));
  assert.ok(combined.some(p=>p.id==='demo-instagram-post'));
  assert.ok(combined.every(p=>p.resourceType==='prompt' && p.outputFormats?.some(f=>['text','image'].includes(f))));
  assert.deepEqual(ids({useCase:['social-profile','instagram-story'],outputFormat:['text','image']}),['demo-instagram-story','demo-social-profile']);
  assert.deepEqual(ids({useCase:['social-profile','instagram-story'],tool:['codex']}),[]);
  assert.equal(ids({group:['business','product']}).length,ids({group:'business'}).length);
  assert.ok(ids({group:'business'}).includes('demo-clothing-video'));
  assert.ok(ids({group:'social'}).includes('demo-calendar-skill'));
  assert.deepEqual(groupAncestors('product'),['product','business']);
  const all = filterPrompts(demoPrompts,{tool:tools,sort:'title'});
  const first=paginatePrompts(all,{page:1,limit:2}), second=paginatePrompts(all,{page:2,limit:2});
  assert.equal(first.totalCount,expected.length);assert.equal(second.totalCount,expected.length);
  assert.equal(new Set([...first.prompts,...second.prompts].map(p=>p.id)).size,4);
  assert.ok(ids({domain:['social-media','programming'],intent:['coding','planning'],difficulty:['beginner','intermediate'],language:['english','persian']}).length>1);
});
test('facet counts permit adding alternatives, count nested business groups and combine intents once', () => {
  const filters={tool:['claude'],group:['business','social'],outputFormat:['text','image']};
  const counts=buildArchiveFacets(demoPrompts,filters);
  assert.equal(counts.facets.tools.midjourney,2); // Jewelry and profile remain available as OR alternatives.
  assert.equal(counts.archiveFacets.groups.product,undefined); // Current Claude choice excludes image tools.
  assert.ok(counts.archiveFacets.groups.social>0);
  const business=buildArchiveFacets(demoPrompts,{group:'business'});
  assert.equal(business.archiveFacets.groups.business,5);
  assert.equal(business.archiveFacets.groups.product,2);
  assert.ok(business.archiveFacets.useCases['product-video']);
  assert.equal(business.archiveFacets.useCases['instagram-story'],undefined);
  const both= {...demoPrompts[4],intent:'learning',intents:['teaching','learning']};
  assert.equal(buildArchiveFacets([both]).facets.intents.teaching,1);
});
test('URL selections survive serialization, remove one value, retain single-value and CSV compatibility', () => {
  const params=new URLSearchParams('tool=claude&tool=midjourney&tool=deepseek&group=business&q=test');
  assert.deepEqual(readFilterValues(params,'tool'),['claude','midjourney','deepseek']);
  setFilterValues(params,'tool',readFilterValues(params,'tool').filter(tool=>tool!=='midjourney'));
  assert.deepEqual(readFilterValues(new URLSearchParams(params.toString()),'tool'),['claude','deepseek']);
  assert.equal(params.get('q'),'test');assert.equal(params.get('group'),'business');
  assert.deepEqual(filterValues('claude,midjourney,claude'),['claude','midjourney']);
  assert.deepEqual(filterValues({unexpected:'object'}),[]);
  assert.deepEqual(filterValues([]),[]);
  assert.deepEqual(readFilterValues(new URLSearchParams('intent=learning&intent=Teaching'),'intent'),['teaching']);
});
