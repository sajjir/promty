import {test} from 'node:test';
import assert from 'node:assert/strict';
import {verifySourceFidelity} from '../src/lib/agentSourceFidelity';
import {normalizeAgentAnalysis} from '../src/lib/normalizeAgentAnalysis';
import {getPromptFieldDefaults,localizePromptFieldValues,missingAdvancedFields} from '../src/lib/promptFieldDefaults';
import type {FieldSchema} from '../src/types';

const field:FieldSchema={key:'tone',label:'لحن',type:'select',required:true,sourceText:'warm',defaultValue:'warm',defaultValueFa:'صمیمی',advanced:true,allowCustom:false,options:['warm|صمیمی','friendly|دوستانه']};
test('source reconstruction detects a lost prohibition and unauthorized rewrite',()=>{
 const source='Write in a warm tone. Do not invent product claims.';
 assert.equal(verifySourceFidelity(source,'Write in a [[tone]] tone. Do not invent product claims.',[field]).status,'verified');
 for(const body of ['Write in a [[tone]] tone.','Write in a [[tone]] tone. Invent product claims.']) assert.equal(verifySourceFidelity(source,body,[field]).status,'needs-review');
 assert.equal(verifySourceFidelity(source,source,[]).status,'verified');
 assert.equal(verifySourceFidelity(source,'PROMPT: '+source,[]).status,'needs-review');
});
test('all six existing necessary inputs can be preserved without invented defaults',()=>{
 const keys=['product','audience','benefits','price','tone','cta'];
 const fields:FieldSchema[]=keys.map(key=>({key,label:key,type:'text',required:true,sourceText:`{{${key}}}`,defaultValue:'',defaultValueFa:'',advanced:false}));
 const source=keys.map(k=>`Input: {{${k}}}`).join('\n');
 const body=keys.map(k=>`Input: [[${k}]]`).join('\n');
 assert.equal(verifySourceFidelity(source,body,fields).status,'verified');
 assert.equal(verifySourceFidelity(source,body,fields.map((f,i)=>i===0?{...f,defaultValue:'made up'}:f)).status,'needs-review');
});
test('source spans and defaults must be grounded; code indentation stays significant',()=>{
 const source='Use warm colors.';
 for(const f of [{...field,sourceText:'absent'}, {...field,defaultValue:'vibrant'}, {...field,options:['vibrant|زنده']}])
 assert.equal(verifySourceFidelity(source,'Use [[tone]] colors.',[f]).status,'needs-review');
 assert.equal(verifySourceFidelity('if x:\n    return x','if x:\nreturn x',[]).status,'needs-review');
});
test('defaults localize without changing stored values and incomplete advanced inputs are discoverable',()=>{
 assert.deepEqual(getPromptFieldDefaults([field]),{tone:'warm'});
 assert.deepEqual(localizePromptFieldValues([field],{tone:'warm'},'fa'),{tone:'صمیمی'});
 assert.deepEqual(localizePromptFieldValues([field],{tone:'friendly'},'fa'),{tone:'دوستانه'});
 assert.equal(missingAdvancedFields([field],{}).length,1);
});
test('model claims cannot self-verify fidelity and suggestions remain separate',()=>{
 const source='Use warm colors.';
 const editorial={catalogVersion:'v1',classificationReason:'طراحی',needsReview:true,reviewNotes:[],execution:{requiredCapabilities:[],routes:[]},fixedConstraints:['حفظ جزئیات'],improvementSuggestions:[{title:'پیشنهاد',reason:'برای خوانایی',proposedChange:'افزودن توضیح'}],referenceImageReason:'ورودی عکس الزام نشده',referenceImageEvidence:'',fidelity:{status:'verified',reason:'model claim'}};
 const raw={title:'عنوان',body:'Use [[tone]] colors.',bodyFa:'از رنگ‌های [[tone]] استفاده کن.',fieldsSchema:[field],useCase:'vis-09',resourceType:'prompt',requiresReferenceImage:false,editorial};
 assert.equal(normalizeAgentAnalysis(raw).editorial?.fidelity?.status,'needs-review');
 const parsed=normalizeAgentAnalysis(raw,{sourceText:source});
 assert.equal(parsed.editorial?.fidelity?.status,'verified');
 assert.equal(parsed.body,'Use {{tone}} colors.');
 assert.deepEqual(parsed.editorial?.improvementSuggestions,editorial.improvementSuggestions);
 assert.ok(!parsed.body.includes('افزودن توضیح'));
});

test('contradictory source-language metadata stays visibly flagged for the editor',()=>{
 const source='Write a product description using only verified information. Do not invent specifications, discounts or certificates.';
 const raw={title:'توضیح محصول',body:source,bodyFa:'ترجمه برای آزمون قرارداد',fieldsSchema:[],useCase:'bus-15',resourceType:'prompt',requiresReferenceImage:false,language:'persian',editorial:{catalogVersion:'v1',classificationReason:'توضیحات محصول',needsReview:true,reviewNotes:[],execution:{requiredCapabilities:[],routes:[]}}};
 const p=normalizeAgentAnalysis(raw,{sourceText:source});
 assert.equal(p.editorial?.needsReview,true);
 assert.ok(p.editorial?.reviewNotes.some(n=>n.includes('متن منبع حروف فارسی ندارد')));
 const second=normalizeAgentAnalysis(p,{sourceText:source});
 assert.equal(second.editorial?.reviewNotes.filter(n=>n.includes('متن منبع حروف فارسی ندارد')).length,1);
});
