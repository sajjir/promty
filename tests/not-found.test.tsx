import React from 'react';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import NotFoundContent from '../src/components/NotFoundContent';
import {homepageChipCounts} from '../src/server/homepageChipCounts';
import {buildSeo} from '../src/server/seo';
import type {HomepageChip} from '../src/lib/homepageChips';
const chips:HomepageChip[]=[
 {id:'cartoon',title:'کارتون دلخواه',useCase:'vis-09',tool:'gemini',icon:'/dl/library/icon.webp',enabled:true},
 {id:'empty',title:'بدون محتوا',useCase:'vis-06',tool:'',icon:'',enabled:true},
 {id:'off',title:'غیرفعال',useCase:'vis-09',tool:'',icon:'',enabled:false}
];
const rows:any[]=[{id:'one',title:'public',body:'public',isActive:true,useCase:'vis-09',tools:['gemini']},{id:'private',title:'PRIVATE',body:'SECRET',isActive:false,useCase:'vis-06',tools:[]}];
const repo:any={getAll:async()=>({prompts:rows,totalCount:rows.length})};
test('404 shares configured scenario order/icons and only links to published matches',async()=>{
 const counts=homepageChipCounts(rows,chips);
 assert.deepEqual(counts,{cartoon:1,empty:0});
 for(const route of ['/missing','/prompts/private','/prompts/absent','/use-case/invalid','/blog/absent']){
  const page=await buildSeo(repo,route,'https://promty.ir',20,{get:async()=>null,list:async()=>({data:[],total:0,page:1,pageSize:20}),forPrompt:async()=>[]},chips);
  assert.equal(page.status,404,route);
  assert.match(page.head,/noindex, follow/);
  assert.match(page.content,/not-found-face/);
  assert.match(page.content,/href="\/use-case\/vis-09\?tool=gemini#prompt-archive-view"/);
  assert.match(page.content,/src="\/dl\/library\/icon.webp"/);
  assert.match(page.content,/aria-disabled="true"/);
  assert.ok(!page.content.includes('href="/use-case/vis-06'));
  assert.ok(!page.content.includes('غیرفعال'));
  assert.ok(!page.content.includes('SECRET'));
  assert.ok(page.content.indexOf('کارتون دلخواه')<page.content.indexOf('بدون محتوا'));
 }
});
test('unloaded counts cannot send visitors to empty archives; empty configuration retains home escape',()=>{
 const pending=renderToStaticMarkup(<NotFoundContent chips={chips}/>);
 assert.ok(!pending.includes('href="/use-case/'));
 assert.match(pending,/aria-busy="true"/);
 const empty=renderToStaticMarkup(<NotFoundContent/>);
 assert.match(empty,/href="\/"/);
 assert.match(empty,/بازگشت به آرشیو/);
});
