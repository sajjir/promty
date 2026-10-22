import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defaultHomepageSections,getHomepageSectionsError,normalizeHomepageSections} from '../src/lib/homepageSections';
import {buildHomepageSections} from '../src/server/buildHomepageSections';
import type {Prompt} from '../src/types';
const prompt=(id:string,patch:Partial<Prompt> & {editorial?:unknown}={})=>({id,title:id,body:'text',isActive:true,usageCount:1,createdAt:'2026-10-21',fieldsSchema:[],tags:[],tools:[],domains:[],...patch} as Prompt);

test('homepage shelves exclude drafts, unpublished review metadata and zero-copy trends',()=>{
 const rows=[prompt('zero',{usageCount:0,useCase:'vis-09'}),prompt('older',{usageCount:5,useCase:'vis-09'}),prompt('popular',{usageCount:50,useCase:'vis-09'}),prompt('draft',{isActive:false,usageCount:9999,useCase:'vis-09',editorial:{reviewNotes:['secret']} as any})];
 const shelves=buildHomepageSections(rows,defaultHomepageSections());
 assert.equal(shelves.length,5);assert.equal(shelves[0].title,'ترندها');
 assert.deepEqual(shelves[0].prompts.map(p=>p.id),['popular','older']);
 for(const shelf of shelves)assert.ok(shelf.prompts.every(p=>p.isActive && p.id!=='draft' && !Object.hasOwn(p,'editorial')));
});
test('category selection includes descendants, respects a specific job, ordering, count and disabled positions',()=>{
 const config=defaultHomepageSections();config[2]={...config[2],group:'visual',useCase:'vis-09',limit:4};config[3].enabled=false;
 const rows=Array.from({length:7},(_,i)=>prompt(String(i),{useCase:'vis-09',createdAt:`2026-10-${10+i}`}));
 rows.push(prompt('different',{useCase:'business-ideas',createdAt:'2026-10-22'}));
 const shelf=buildHomepageSections(rows,config).find(s=>s.id==='featured-1')!;
 assert.equal(shelf.total,7);assert.deepEqual(shelf.prompts.map(p=>p.id),['6','5','4','3']);
 assert.equal(buildHomepageSections(rows,config).some(s=>s.id==='featured-2'),false);
});
test('invalid settings cannot change sources, escape the catalog or exceed the position/card limits',()=>{
 const valid=defaultHomepageSections();assert.equal(getHomepageSectionsError(valid),null);
 for(const mutate of [(v:any[])=>v.pop(),(v:any[])=>v[0].enabled=false,(v:any[])=>v[2].source='trending',(v:any[])=>v[2].group='invented',(v:any[])=>v[2].useCase='vis-09',(v:any[])=>v[2].limit=1000,(v:any[])=>v[2].title=' ']){
  const v=structuredClone(valid);mutate(v);assert.ok(getHomepageSectionsError(v));
 }
 const normalized=normalizeHomepageSections([{...valid[2],title:'نام من',secret:'private'}]);
 assert.equal(normalized.length,6);assert.equal(normalized[2].title,'نام من');assert.equal(Object.hasOwn(normalized[2],'secret'),false);
});
