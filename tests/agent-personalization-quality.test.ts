import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {normalizeAgentAnalysis} from '../src/lib/normalizeAgentAnalysis';
import {checkPersonalization,promptVariableCounts} from '../src/lib/agentPersonalization';
const root=new URL('../n8n-agaent/fast-preparation/quality-2026-10-26/',import.meta.url);
const source=fs.readFileSync(new URL('fixtures/cartoon-source.txt',root),'utf8');
const reference=JSON.parse(fs.readFileSync(new URL('fixtures/cartoon-reference.json',root),'utf8'));
const code=fs.readFileSync(new URL('runtime-helpers.js',root),'utf8');
const runtime=vm.runInNewContext(code+';({prepareFastInput,buildFastRequest,finishFastResponse,existingInputKeys})',{Date,JSON,Object,Set,Map});
const namespaceValues:any={useCase:['vis-09'],resourceType:['prompt'],intent:['visual-generation'],language:['english'],difficulty:['beginner'],domain:['design'],outputFormat:['image'],fieldType:['text','select']};
const registry:any={version:'quality-fixture-v1',terms:Object.entries(namespaceValues).flatMap(([namespace,values]:any)=>values.map((slug:string)=>({namespace,slug,status:'active'}))),catalogContext:{useCaseIndex:[['vis-09','بازآفرینی تصویر با سبک و مرجع','visual']],domainIndex:[['design','طراحی']],toolIndex:[]}};
const input=runtime.prepareFastInput({sourceText:source},'test',0);
const context=runtime.buildFastRequest(input,registry,'Synthetic runtime test','models/gemini-3.5-flash-lite',2000);
const response=(record:any,finishReason='STOP')=>({candidates:[{finishReason,content:{parts:[{text:JSON.stringify(record)}]}}]});
test('original cartoon remains lossless with two bounded controls and both-language schema parity',()=>{
 const result=runtime.finishFastResponse(response(reference),context,32000);assert.equal(result.ok,true,result.message);
 assert.equal(result.record.editorial.fidelity.status,'verified');assert.equal(result.metrics.modelCalls,1);
 const p=normalizeAgentAnalysis(result.record,{sourceText:source});assert.equal(p.fieldsSchema.length,2);assert.equal(p.editorial?.personalizationReview?.decision,'fields');
 assert.equal(p.editorial?.fidelity?.status,'verified');assert.match(p.body,/{{line_weight}}/);assert.match(p.bodyFa!,/{{shading_style}}/);
 const missing=structuredClone(reference);missing.fieldsSchema=[];assert.equal(runtime.finishFastResponse(response(missing),context,20000).ok,false);
 const mismatch=structuredClone(reference);mismatch.bodyFa=mismatch.bodyFa.replace('[[shading_style]]','ثابت');assert.equal(runtime.finishFastResponse(response(mismatch),context,20000).ok,false);assert.throws(()=>normalizeAgentAnalysis(mismatch,{sourceText:source}),/تطبیق/);
});
test('zero fields is valid only with a coherent fixed decision; forged audit and loss of constraints fail',()=>{
 const fixedSource='Return exactly OK. Do not add any other text.';
 const record={...structuredClone(reference),body:fixedSource,bodyFa:'دقیقاً OK را برگردان. هیچ متن دیگری اضافه نکن.',requiresReferenceImage:false,fieldsSchema:[],editorial:{...structuredClone(reference.editorial),referenceImageReason:'عکس لازم نیست.',referenceImageEvidence:'',personalizationReview:{decision:'fixed',reason:'خروجی دقیق و غیرقابل تغییر خواسته شده و ورودی یا تنظیم دیگری ندارد.',dimensions:[{sourceText:'Return exactly OK.',label:'خروجی دقیق',disposition:'fixed',key:null,reason:'تغییر آن هدف دستور را از بین می‌برد.'}]}}};
 const ctx={...context,sourceText:fixedSource};assert.equal(runtime.finishFastResponse(response(record),ctx,20000).ok,true);
 const missing=structuredClone(record);delete (missing.editorial as any).personalizationReview;assert.equal(runtime.finishFastResponse(response(missing),ctx,20000).ok,false);
 const forged=structuredClone(record);forged.editorial.personalizationReview.dimensions[0].sourceText='not in source';assert.equal(runtime.finishFastResponse(response(forged),ctx,20000).ok,false);
 const lost=structuredClone(reference);lost.body=lost.body.replace('unwanted text or watermarks.','');assert.equal(runtime.finishFastResponse(response(lost),context,20000).ok,false);
});
test('existing input slots cannot silently return an empty schema, and fenced code is not a form input',()=>{
 const raw={...reference,body:'Write about {{product_name}}.',bodyFa:'دربارهٔ {{product_name}} بنویس.',fieldsSchema:[],editorial:undefined};
 assert.throws(()=>normalizeAgentAnalysis(raw,{sourceText:raw.body}),/تطبیق|بدون فیلد/);
 const six=['product','audience','benefits','price','tone','cta'];assert.equal(promptVariableCounts(six.map(k=>'{{'+k+'}}').join(' ')).size,6);
 assert.equal(promptVariableCounts('```js\nconst x="{{literal}}";\n```').size,0);
 assert.equal(runtime.existingInputKeys('```js\n{{literal}}\n```\n{{product_name}}').length,1);
 const fields=six.map(key=>({key,label:key,type:'text' as const,required:true,sourceText:'{{'+key+'}}',defaultValue:'',defaultValueFa:'',advanced:false}));
 const body=six.map(k=>'[['+k+']]').join(' ');assert.doesNotThrow(()=>checkPersonalization(body,body,fields,six.map(k=>'{{'+k+'}}').join(' ')));
});
test('quality budget permits a complete 32-second result and rejects late or truncated answers',()=>{
 assert.equal(context.timeoutMs,39000);assert.equal(context.request.generationConfig.thinkingConfig.thinkingLevel,'MEDIUM');
 assert.equal(context.request.generationConfig.responseJsonSchema.properties.fieldsSchema.maxItems,undefined);
 assert.equal(runtime.finishFastResponse(response(reference),context,32000).ok,true);
 assert.equal(runtime.finishFastResponse(response(reference),context,44000).code,'ANALYSIS_DEADLINE');
 assert.equal(runtime.finishFastResponse(response(reference,'MAX_TOKENS'),context,20000).code,'INCOMPLETE_MODEL_OUTPUT');
 assert.throws(()=>runtime.prepareFastInput({sourceText:source},'webhook',0));
});
