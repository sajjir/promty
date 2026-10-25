import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeAgentAnalysis, resolveAgentUseCase } from '../src/lib/normalizeAgentAnalysis';
import { renderPrompt } from '../src/lib/renderPrompt';
const fixture = JSON.parse(fs.readFileSync(new URL('./fixtures/deepseek-cartoon-2026-10-22.json', import.meta.url), 'utf8'));

test('owner DeepSeek result imports primary use case, source type, both languages and review metadata', () => {
  const p=normalizeAgentAnalysis(fixture);
  assert.equal(p.useCase,'vis-09'); assert.equal(p.resourceType,'prompt');
  assert.equal(p.requiresReferenceImage,true); assert.deepEqual(p.tools,[]);
  assert.equal(p.fieldsSchema.length,2); assert.equal(p.editorial?.needsReview,false);
  assert.deepEqual(p.editorial,fixture[0].editorial);
  assert.match(p.body,/{{line_weight}}/); assert.match(p.bodyFa!,/{{shading_style}}/);
  const values=Object.fromEntries(p.fieldsSchema.map(f=>[f.key,f.options![0].split('|')[0]]));
  const rendered=renderPrompt(p.body,values);
  assert.ok(rendered.includes('clean black hand-drawn outlines')); assert.doesNotMatch(rendered,/\[\[|{{/);
});
test('single record, n8n output strings and internal QA envelopes unwrap without dropping metadata',()=>{
  for(const value of [fixture[0],{output:JSON.stringify(fixture)},{record:fixture[0],catalogProposals:[]},{data:{output:JSON.stringify(fixture[0])}}])
    assert.deepEqual(normalizeAgentAnalysis(value),normalizeAgentAnalysis(fixture));
});
test('multiple records, invalid JSON and malformed fields fail clearly',()=>{
  for(const input of [[],[fixture[0],fixture[0]],{output:'bad JSON'}, {...fixture[0],fieldsSchema:[{key:'bad key',label:'x',type:'text'}]}, {...fixture[0],fieldsSchema:[{key:'test',label:'x',type:'select',options:[]}]}])
    assert.throws(()=>normalizeAgentAnalysis(input));
});
test('unknown classifications require review; reference IDs resolve to canonical site slugs',()=>{
  assert.equal(resolveAgentUseCase('useCase:VIS-09'),'vis-09');
  assert.equal(resolveAgentUseCase('BUS-01'),'business-ideas');
  const p=normalizeAgentAnalysis({...fixture[0],useCase:'made-up'});
  assert.equal(p.useCase,'');assert.equal(p.editorial?.needsReview,true);
});
test('normalizing template variables preserves unrelated literal text and selected option values',()=>{
  const p=normalizeAgentAnalysis({...fixture[0],body:fixture[0].body+'\n[[unrelated_literal]]'});
  assert.match(p.body,/\[\[unrelated_literal\]\]/);
  assert.deepEqual(p.fieldsSchema,fixture[0].fieldsSchema);
});
