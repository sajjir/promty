import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sitemap,buildSeo} from '../src/server/seo';
import {promptImageAlt,publicImageUrls} from '../src/lib/promptImages';
const prompt:any={id:'sample',title:'تصویر محصول',isActive:true,useCase:'product-image',body:'Keep identity intact.',fieldsSchema:[],tools:['gemini','chatgpt','other'],tags:[],sampleImage:'/dl/library/sample.webp?x=1&y=2',coverImage:'/dl/library/sample.webp?x=1&y=2',mediaGallery:['https://cdn.example.test/real.webp','javascript:alert(1)'],updatedAt:'2026-10-26T00:00:00Z'};
test('image sitemap has namespace, valid deduplicated image locations, XML escaping and no draft assets',()=>{
 const urls=publicImageUrls(prompt,'https://promty.ir');assert.equal(urls.length,2);assert.ok(!urls.some(x=>x.startsWith('javascript:')));
 const xml=sitemap([prompt,{...prompt,id:'draft',isActive:false,sampleImage:'https://private.invalid/secret.webp',coverImage:undefined,mediaGallery:[]}],'https://promty.ir');
 assert.match(xml,/xmlns:image="http:\/\/www.google.com\/schemas\/sitemap-image\/1.1"/);assert.equal((xml.match(/<image:image>/g)||[]).length,2);assert.match(xml,/x=1&amp;y=2/);assert.ok(!xml.includes('private.invalid'));assert.ok(!xml.includes('image:caption'));
});
test('snapshot retains full source and sibling links; image alt is contextual and layout dimensions explicit',async()=>{
 const repo:any={getAll:async()=>({prompts:[prompt,...Array.from({length:9},(_,i)=>({...prompt,id:'related-'+i,title:'محصول '+i}))],totalCount:10})};
 const page=await buildSeo(repo,'/prompts/sample','https://promty.ir');assert.match(page.content,/Keep identity intact/);assert.match(page.content,/width="1600" height="900"/);assert.match(page.content,/\/use-case\/product-image/);assert.equal((page.content.match(/href="\/prompts\/related-/g)||[]).length,5);
 assert.match(promptImageAlt(prompt),/gemini، chatgpt/);assert.ok(!promptImageAlt(prompt).includes('other'));
});
