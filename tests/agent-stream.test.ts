import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseAgentResponse, readAgentResponse} from '../src/server/readAgentResponse';
const nodeName='Respond — نتیجه معتبر';
const frame=(type:string,content?:unknown,name=nodeName)=>({type,content,metadata:{nodeName:name,runIndex:0,itemIndex:0}});
const result={title:'آزمون',body:'پرامپت'};
const valid=[frame('begin'),frame('item',JSON.stringify({protocol:'promty.validated-result.v1',record:result})),frame('end')];
const lines=(frames:any[])=>frames.map(f=>JSON.stringify(f)).join('\n')+'\n';
test('stream ignores model output and accepts only completed validated response',()=>{
 assert.deepEqual(parseAgentResponse(lines([frame('item',JSON.stringify({record:{body:'unverified'}}),'QA/Verifier'),...valid])),result);
 assert.deepEqual(parseAgentResponse(JSON.stringify([result])),[result]);
});
test('incomplete, failed, malformed, duplicated and wrong-final-node streams are rejected',()=>{
 for(const frames of [valid.slice(0,2),[...valid,frame('error','failed','Design')],[frame('item','{}'),frame('end')],[...valid,...valid],valid.map(f=>({...f,metadata:{...f.metadata,nodeName:'Design'}}))])
  assert.throws(()=>parseAgentResponse(lines(frames)));
 assert.throws(()=>parseAgentResponse(lines(valid)+'{"type":'));
});
test('network chunks can split Persian UTF-8 and JSON across arbitrary boundaries',async()=>{
 const bytes=new TextEncoder().encode(lines(valid));
 const response=new Response(new ReadableStream({start(c){for(let i=0;i<bytes.length;i+=3)c.enqueue(bytes.slice(i,i+3));c.close();}}));
 assert.deepEqual(await readAgentResponse(response),result);
});
test('body stream failures and excessive response size cannot import a partial result',async()=>{
 await assert.rejects(readAgentResponse(new Response(new ReadableStream({start(c){c.enqueue(new TextEncoder().encode(lines(valid)));c.error(new Error('connection lost'));}}))),/connection lost/);
 await assert.rejects(readAgentResponse(new Response('x'.repeat(2*1024*1024+1))),/حجم/);
});
