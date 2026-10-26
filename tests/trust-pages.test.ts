import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {buildSeo,injectSeo,sitemap} from '../src/server/seo';
import {STATIC_TRUST_PAGES,TRUST_PAGE_LIST} from '../src/lib/trustPages';
import TrustPageContent from '../src/components/TrustPageContent';
import {FooterContent} from '../src/components/SiteFooter';
import {footerDiscoveryLinks} from '../src/lib/footerLinks';
const noArchive:any={getAll:async()=>{throw Error('Archive temporarily unavailable');}};
const template='<html><head><title>old</title><meta name="robots" content="noindex"><link rel="canonical" href="https://old.invalid"></head><body><div id="root"></div></body></html>';
test('trust pages share exact React content with initial HTML, are indexable with one canonical, and survive unavailable archive storage',async()=>{
 for(const page of TRUST_PAGE_LIST){
  const result=await buildSeo(noArchive,page.path,'https://promty.ir');
  assert.equal(result.status,200);assert.equal(result.noindex,false);
  assert.equal(result.content,renderToStaticMarkup(createElement(TrustPageContent,{page})));
  const html=injectSeo(template,result);
  assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
  assert.match(html,new RegExp('href="https://promty.ir'+page.path+'"'));
  assert.match(html,/<meta name="robots" content="index, follow"/);
  assert.match(html,/<div id="root"><main[^>]*><article/);
  assert.ok(html.includes('<h1>'+page.h1+'</h1>'));
  for(const section of page.sections)assert.ok(result.content.includes(section.body));
  const schemas=[...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(x=>JSON.parse(x[1]));
  assert.equal(schemas[0]['@type'],'BreadcrumbList');assert.equal(schemas[1]['@type'],page.schemaType);
  assert.equal(schemas[1].url,'https://promty.ir'+page.path);
  assert.ok(!html.includes('FAQPage'));
 }
 assert.match((await buildSeo(noArchive,'/contact?utm_source=test','https://promty.ir')).head,/rel="canonical" href="https:\/\/promty.ir\/contact"/);
 assert.ok(renderToStaticMarkup(createElement(TrustPageContent,{page:STATIC_TRUST_PAGES['/contact']})).includes('href="mailto:betavan.co@gmail.com"'));
});
test('sitemap includes trust pages once, even with no published prompts',()=>{
 const xml=sitemap([],'https://promty.ir');
 for(const page of TRUST_PAGE_LIST)assert.equal(xml.split('<loc>https://promty.ir'+page.path+'</loc>').length-1,1);
});
test('footer links only to populated discoverable archives and actual trust pages, without coming-soon content',()=>{
 const links=footerDiscoveryLinks({archiveFacets:{useCases:{'vis-09':5,'vis-06':0,'unknown':99}},facets:{tools:{gemini:5,claude:0,'javascript:bad':99}}});
 assert.deepEqual(links.map(x=>x.href),['/','/use-case/vis-09','/tool/gemini']);
 const html=renderToStaticMarkup(createElement(FooterContent,{branding:{siteLogo:'',footerAbout:'',footerCopyright:''},siteTitle:'پرامپتی',discoveryLinks:links}));
 assert.ok(!html.includes('به‌زودی'));assert.ok(!html.includes('aria-disabled'));
 for(const href of [...links.map(x=>x.href),'/guide','/about','/contact','https://betavan.com','https://t.me/promty_ir','https://www.instagram.com/promty.ir/'])assert.ok(html.includes('href="'+href+'"'),href);
 assert.deepEqual(footerDiscoveryLinks({}),[{label:'همهٔ پرامپت‌ها و منابع',href:'/'}]);
});
test('HTTP trust pages: direct HTML and client SEO endpoint use same snapshot, with canonical and sitemap discovery',async()=>{
 const root=path.resolve('.'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'promty-trust-')),port=13994;
 fs.mkdirSync(path.join(dir,'dist'));fs.writeFileSync(path.join(dir,'dist/index.html'),template);
 fs.writeFileSync(path.join(dir,'db.json'),JSON.stringify({prompts:[],users:[],settings:{},categories:[],taxonomies:[]}));
 const child=spawn(process.execPath,['--import',path.join(root,'node_modules/tsx/dist/loader.mjs'),path.join(root,'server.ts')],{cwd:dir,env:{...process.env,DATABASE_URL:'',STORAGE_BACKEND:'json',NODE_ENV:'production',LOCAL_PREVIEW:'1',HOST:'127.0.0.1',PORT:String(port),JWT_SECRET:'trust-fixture-secret-'.repeat(4),ADMIN_EMAIL:'trust@test.invalid',ADMIN_PASSWORD:'fixture-only-password',APP_ORIGIN:'https://promty.ir'}});
 let output='';child.stdout.on('data',x=>output+=x);child.stderr.on('data',x=>output+=x);const base='http://127.0.0.1:'+port;
 try{
  let ready=false;for(let i=0;i<100;i++){try{if((await fetch(base+'/api/config')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,50));}
  assert.ok(ready,output.slice(-500));
  for(const page of TRUST_PAGE_LIST){
   const response=await fetch(base+page.path);assert.equal(response.status,200);assert.match(response.headers.get('content-type')!,/text\/html/);
   assert.notEqual(response.headers.get('x-robots-tag'),'noindex');const html=await response.text();
   assert.ok(html.includes(page.h1));assert.match(html,/<meta name="robots" content="index, follow"/);
   const metadata=await(await fetch(base+'/api/seo?path='+encodeURIComponent(page.path))).json();
   assert.equal(metadata.status,200);assert.ok(html.includes(metadata.content));assert.match(metadata.head,/BreadcrumbList/);
   assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
  }
  const response=await fetch(base+'/sitemap.xml'),xml=await response.text();assert.match(response.headers.get('content-type')!,/application\/xml/);
  for(const page of TRUST_PAGE_LIST)assert.ok(xml.includes('<loc>https://promty.ir'+page.path+'</loc>'));
 }finally{child.kill('SIGTERM');if(child.exitCode===null)await new Promise<void>(resolve=>child.once('exit',()=>resolve()));fs.rmSync(dir,{recursive:true,force:true});}
});
