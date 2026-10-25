import {test} from 'node:test';
import assert from 'node:assert/strict';
import {demoPrompts} from '../scripts/archive-demo-data';
import {filterPrompts,buildArchiveFacets,paginatePrompts} from '../src/server/repositories/filterPrompts';
import {updateFilterDraft,clearFilterDraft} from '../src/lib/filterDraft';
test('access facet supports free/premium OR, combines with resource type and counts before pagination',()=>{
 const rows=demoPrompts.slice(0,3).map((p,i)=>({...p,id:'access-'+i,isPremium:i===1,resourceType:'prompt' as const}));
 assert.deepEqual(filterPrompts(rows,{access:'premium'}).map(p=>p.id),['access-1']);
 assert.equal(filterPrompts(rows,{access:'free'}).length,2);
 assert.equal(filterPrompts(rows,{access:['free','premium']}).length,3);
 assert.equal(filterPrompts(rows,{access:'premium',resourceType:'skill'}).length,0);
 assert.deepEqual(buildArchiveFacets(rows,{access:'premium'}).archiveFacets.access,{free:2,premium:1});
 assert.equal(paginatePrompts(filterPrompts(rows,{access:'free'}),{page:1,limit:1}).totalCount,2);
 let draft=updateFilterDraft(new URLSearchParams('q=keep'),'access',['free','premium']);
 assert.deepEqual(draft.getAll('access'),['free','premium']);
 assert.equal(clearFilterDraft(draft).toString(),'q=keep');
});
