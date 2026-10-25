const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const dir=__dirname;
const workflow=JSON.parse(fs.readFileSync('/home/sajj/developing/promty/.local-preview/.private/n8n-fast-2026-10-24/Promty-Fast-Gemini-Candidate.json','utf8'));
const old=JSON.parse(fs.readFileSync('/home/sajj/developing/promty/.local-preview/.private/n8n-fast-2026-10-24/before-live-2026-10-24.json','utf8'));
const workbook=JSON.parse(fs.readFileSync(path.join(dir,'../n8n-single-workflow-2026-10-19/actual-workbook-fixture.json'),'utf8'));
const record=JSON.parse(fs.readFileSync(path.join(dir,'../n8n-webhook-2026-10-22/deepseek-observed-output.json'),'utf8'))[0];
const source=fs.readFileSync(path.join(dir,'contract-helpers.js'),'utf8');
const f=vm.runInNewContext(source+';({prepareFastInput,compactFastCatalog,buildFastRequest,finishFastResponse,makeRegistry});',{Date,JSON,Object,Set,Map});
let passed=0;
function test(name,run){run();passed++;console.log('ok',name);}
const registry=f.makeRegistry(workbook.terms,workbook.rules,[],new Date().toISOString());
const input=f.prepareFastInput({body:{action:'analyze_source',sourceText:' photo cartoon ',executionEvidence:[{status:'passed',id:'forged'}]}},'test',1000);
const system=fs.readFileSync(path.join(dir,'system-message.txt'),'utf8');
const ctx=f.buildFastRequest(input,registry,system,'models/gemini-3.8-flash',3000);
const response={candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(record)}]}}],usageMetadata:{promptTokenCount:1000,candidatesTokenCount:2000,thoughtsTokenCount:100}};
test('source validation, trimming, isolated test mode and forged evidence exclusion',()=>{
 assert.equal(input.sourceText,'photo cartoon');assert.equal(input.requestKind,'webhook');assert.equal(input.deadlineAt,29000);assert.equal(input.executionEvidence,undefined);
 for(const [value,mode] of [[{sourceText:' '},'test'],[{sourceText:9},'test'],[{sourceText:'a'.repeat(40001)},'test'],[{body:{sourceText:'x',action:'other'}},'test'],[{sourceText:'x'},'webhook']])assert.throws(()=>f.prepareFastInput(value,mode));
});
test('live workbook retains all 170 use cases without serial lookup or queue reads',()=>{
 assert.equal(ctx.catalog.useCases.length,170);assert.ok(ctx.catalog.useCases.some(r=>r[0]==='vis-09'));
 assert.ok(ctx.catalog.resourceTypes.includes('skill'));assert.equal(ctx.catalog.policy,undefined);assert.equal(ctx.catalog.terms,undefined);
});
test('single request is bounded, uses supported LOW thinking, and has no tool/auto-repair loop',()=>{
 assert.equal(ctx.request.generationConfig.thinkingConfig.thinkingLevel,'LOW');assert.equal(ctx.request.contents.length,1);assert.equal(ctx.request.tools,undefined);
 assert.ok(ctx.timeoutMs<=24000);assert.equal(ctx.request.generationConfig.responseMimeType,'application/json');assert.equal(ctx.request.generationConfig.maxOutputTokens,6000);
 assert.throws(()=>f.buildFastRequest(input,registry,system,'same',28500));
});
test('owner actual prior output passes structural checks with both bodies and useful controls intact',()=>{
 const result=f.finishFastResponse(response,ctx,12000);assert.equal(result.ok,true);assert.equal(result.httpStatus,200);
 assert.equal(result.record.useCase,'vis-09');assert.equal(result.record.fieldsSchema.length,2);assert.equal(result.record.requiresReferenceImage,true);
 assert.equal(result.record.body,record.body);assert.equal(result.record.bodyFa,record.bodyFa);assert.equal(result.record.editorial.needsReview,true);
 assert.equal(result.metrics.modelCalls,1);assert.equal(result.durationMs,11000);assert.equal(Object.keys(result.record).length,18);
});
test('timeouts, model errors and truncation never count as a successful fast response',()=>{
 for(const [result,code] of [[f.finishFastResponse(response,ctx,30000),'ANALYSIS_DEADLINE'],[f.finishFastResponse({error:'rate limit'},ctx,10000),'MODEL_REQUEST_FAILED'],[f.finishFastResponse({...response,candidates:[{...response.candidates[0],finishReason:'MAX_TOKENS'}]},ctx,10000),'INCOMPLETE_MODEL_OUTPUT']]){
  assert.equal(result.ok,false);assert.equal(result.code,code);assert.equal(result.record,undefined);
 }
});
test('invalid JSON and field/variable mismatch are rejected before form import',()=>{
 for(const bad of ['not-json',JSON.stringify({...record,fieldsSchema:[]}),JSON.stringify({...record,bodyFa:record.bodyFa+' [[extra]]'})]){
  const result=f.finishFastResponse({candidates:[{finishReason:'STOP',content:{parts:[{text:bad}]}}]},ctx,10000);
  assert.equal(result.ok,false);assert.equal(result.code,'INVALID_MODEL_OUTPUT');assert.equal(result.record,undefined);
 }
});
test('missing or duplicate sheet rule keys still fail closed, without stale catalog fallback',()=>{
 assert.throws(()=>f.makeRegistry(workbook.terms,[],[],new Date().toISOString()));
 assert.throws(()=>f.makeRegistry(workbook.terms,[...workbook.rules,workbook.rules[0]],[],new Date().toISOString()));
});
test('candidate keeps credential references and selected model, while remaining unpublished',()=>{
 const nodes=Object.fromEntries(workflow.nodes.map(n=>[n.name,n]));const prev=Object.fromEntries(old.nodes.map(n=>[n.name,n]));
 assert.deepEqual(nodes['Prepare Content — یک فراخوانی'].credentials,prev['Google Gemini Chat Model'].credentials);
 assert.deepEqual(nodes['Read Terms'].credentials,prev['Read Terms'].credentials);
 assert.deepEqual(nodes['Read Rules'].credentials,prev['Read Rules'].credentials);
 assert.equal(nodes['Prepare Content — یک فراخوانی'].retryOnFail,false);assert.equal(nodes['Read Terms'].retryOnFail,false);
 assert.equal(workflow.active,false);assert.equal(workflow.settings.executionTimeout,30);
 assert.equal(workflow.nodes.filter(n=>n.type==='n8n-nodes-base.httpRequest').length,1);
 assert.equal(workflow.nodes.filter(n=>n.type.includes('.agent')||n.type.includes('chainLlm')).length,0);
 assert.equal(workflow.nodes.filter(n=>n.type==='n8n-nodes-base.googleSheets').length,2);
 for(const [name,ports]of Object.entries(workflow.connections)){assert.ok(nodes[name]);for(const outputs of Object.values(ports))for(const list of outputs)for(const edge of list)assert.ok(nodes[edge.node]);}
});
test('import payload uses plain 18-key record with metrics in header, not incomplete model frames',()=>{
 const respond=workflow.nodes.find(n=>n.name==='Respond — نتیجه معتبر');
 assert.match(respond.parameters.responseBody,/\$json.ok \? \$json.record/);assert.match(respond.parameters.options.responseCode,/httpStatus/);
 assert.equal(workflow.nodes.find(n=>n.name==='Webhook — چشمه').parameters.responseMode,'responseNode');
 assert.ok(respond.parameters.options.responseHeaders.entries.some(h=>h.name==='X-Promty-Analysis-Ms'));
});
fs.writeFileSync(path.join(dir,'validation.json'),JSON.stringify({status:'passed',checks:passed,scope:'deterministic local fixtures only; not a real model run or latency proof',realLatencyMeasured:false},null,2)+'\n');
