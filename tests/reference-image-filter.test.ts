import {test} from 'node:test';
import assert from 'node:assert/strict';
import {filterPrompts,buildArchiveFacets,paginatePrompts} from '../src/server/repositories/filterPrompts';
import {archiveFilterKeys,readFilterValues,setFilterValues} from '../src/lib/archiveFilters';
import type {Prompt} from '../src/types';
const base={title:'محصول',description:'فروشگاه',body:'body',fieldsSchema:[],tags:[],isPremium:false,isActive:true,createdAt:'2026-01-01',updatedAt:'2026-01-01',usageCount:0,useCase:'product-image',resourceType:'prompt' as const};
const rows:Prompt[]=[{...base,id:'a',requiresReferenceImage:true,outputFormats:['image']},{...base,id:'b',requiresReferenceImage:false,outputFormats:['image']},{...base,id:'c',requiresReferenceImage:true,outputFormats:['text']},{...base,id:'d',isActive:false,requiresReferenceImage:true,outputFormats:['code']},{...base,id:'e',outputFormats:['image']}];
test('reference-image is an independent input filter, combines with output and hides drafts',()=>{
 assert.deepEqual(filterPrompts(rows,{referenceImage:'required',isActive:true}).map(p=>p.id),['a','c']);
 assert.deepEqual(filterPrompts(rows,{referenceImage:'required',outputFormat:'image',isActive:true}).map(p=>p.id),['a']);
 assert.equal(filterPrompts(rows,{isActive:true}).length,4);
 assert.equal(filterPrompts(rows,{referenceImage:'required',q:'ناموجود',isActive:true}).length,0);
});
test('counts omit only own facet; filtering precedes pagination',()=>{
 assert.deepEqual(buildArchiveFacets(rows,{referenceImage:'required',outputFormat:'image',isActive:true}).archiveFacets.referenceImage,{required:1});
 const result=paginatePrompts(filterPrompts(rows,{referenceImage:'required',isActive:true}),{page:2,limit:1});
 assert.equal(result.totalCount,2);assert.equal(result.prompts[0].id,'c');
});
test('reference selection survives URL round trip and clears independently',()=>{
 assert.ok(archiveFilterKeys.includes('referenceImage'));
 const params=new URLSearchParams('q=محصول&group=business&page=2');
 setFilterValues(params,'referenceImage',['required']);
 assert.deepEqual(readFilterValues(params,'referenceImage'),['required']);
 setFilterValues(params,'referenceImage',[]);
 assert.equal(params.get('q'),'محصول');assert.equal(params.has('referenceImage'),false);
});
