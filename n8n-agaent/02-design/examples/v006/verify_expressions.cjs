const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = process.argv[2] || __dirname;
const input = JSON.parse(fs.readFileSync(path.join(root, 'test-input.json'), 'utf8'));
const record = JSON.parse(fs.readFileSync(path.join(root, 'reference-output.json'), 'utf8'));
const checks=[];
for (const name of ['design','qa']) {
 const exported=fs.readFileSync(path.join(root, `${name}-user.txt`),'utf8');
 const editor=fs.readFileSync(path.join(root, `${name}-user-editor.txt`),'utf8');
 assert.equal(exported.slice(1),editor);
 assert.ok(exported.startsWith('={{ ') && exported.trimEnd().endsWith(' }}'));
 const code=exported.trim().slice(3,-2);
 const script=new vm.Script(code);
 for (const [label,request] of [ ['catalog supplied',input], ['old webhook request',{sourceText:input.sourceText,allowedTaxonomies:input.allowedTaxonomies}], ['explicit empty override',{...input,classificationCatalog:{version:'empty-test',groups:[],useCases:[],resourceTypes:['prompt']}}]]) {
  const candidates=name==='qa'?[record,{output:record},{output:JSON.stringify(record)},{text:JSON.stringify(record)}]:[{}];
  for (const candidate of candidates) {
   const output=JSON.parse(script.runInNewContext({JSON,$json:candidate,$:(node)=>{assert.equal(node,'Webhook');return {first:()=>({json:{body:request}})}}},{timeout:1000}));
   assert.equal(output.sourceText,request.sourceText);
   assert.deepEqual(output.allowedTaxonomies,request.allowedTaxonomies);
   assert.deepEqual(output.classificationCatalog,request.classificationCatalog??null);
   assert.deepEqual(output.executionEvidence,request.executionEvidence??[]);
   if(name==='qa') assert.deepEqual(output.candidate,candidate.output??candidate.text??candidate);
   checks.push({agent:name,case:label,passed:true});
  }
 }
}
// Read-only compatibility probe: the archived strict Code v002 has a closed old key list.
const legacyPath=path.join(root,'legacy-code-v002.input.js');
if(fs.existsSync(legacyPath)) {
 const script=new vm.Script('(function(){\n'+fs.readFileSync(legacyPath,'utf8')+'\n})()');
 let error=null;
 try {script.runInNewContext({$input:{all:()=>[{json:{output:JSON.stringify(record)}}]},$:(node)=>({first:()=>({json:{body:input}})})},{timeout:1000});}
 catch(e) {error=e.message;}
 assert.match(error,/unsupported root property/);
 checks.push({case:'legacy Code v002 correctly identified as incompatible',passed:true,observed:error});
}
const report={kind:'JavaScript VM simulation; not n8n runtime',passed:checks.length,checks};
fs.writeFileSync(path.join(root,'expression-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({expressionAndCompatibilityChecks:checks.length}));
