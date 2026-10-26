import type {FieldSchema,PersonalizationReview} from '../types';
export function promptVariableCounts(text:string,strict=true){
 let fence='';const prose=text.split('\n').map(line=>{const m=line.match(/^\s*(`{3,}|~{3,})/);if(m){if(!fence)fence=m[1];else if(fence[0]===m[1][0]&&m[1].length>=fence.length)fence='';return '';}return fence?'':line;}).join('\n');
 const counts=new Map<string,number>();for(const m of prose.matchAll(/\[\[([^\]\n]+)\]\]|\{\{([^{}\n]+)\}\}/g)){const key=m[1]||m[2];if(!/^[a-z][a-z0-9_]*$/.test(key)){if(strict)throw Error('نام یکی از متغیرهای متن آماده‌شده معتبر نیست.');continue;}counts.set(key,(counts.get(key)||0)+1);}return counts;
}
export function checkPersonalization(body:string,bodyFa:string,fields:FieldSchema[],sourceText?:string,review?:unknown):PersonalizationReview|undefined{
 const keys=new Set(fields.map(f=>f.key)),en=promptVariableCounts(body),fa=promptVariableCounts(bodyFa);
 if(en.size!==keys.size||[...keys].some(k=>!en.has(k))||en.size!==fa.size||[...en].some(([k,n])=>fa.get(k)!==n))throw Error('متغیرهای متن اصلی، ترجمه و فیلدهای فرم تطبیق ندارند؛ نتیجه وارد نشد.');
 if(sourceText!==undefined&&[...promptVariableCounts(sourceText,false).keys()].some(k=>!keys.has(k)))throw Error('بعضی ورودی‌های موجود در متن خام، بدون فیلد شخصی‌سازی برگشته‌اند.');
 if(review===undefined)return;
 const object=(v:any)=>v&&typeof v==='object'&&!Array.isArray(v);const text=(s:any)=>typeof s==='string'&&!!s.trim();const r=review as any;
 if(!object(r)||!['fields','fixed'].includes(r.decision)||!text(r.reason)||!Array.isArray(r.dimensions)||!r.dimensions.length)throw Error('گزارش تصمیم شخصی‌سازی کامل نیست.');
 if((r.decision==='fields')!==!!fields.length)throw Error('دلیل شخصی‌سازی با فیلدهای برگشتی ناسازگار است.');
 const audited=new Set();
 const dimensions=r.dimensions.map((d:any)=>{if(!object(d)||!text(d.sourceText)||!text(d.label)||!text(d.reason)||!['field','fixed','prerequisite'].includes(d.disposition)||sourceText!==undefined&&!sourceText.includes(d.sourceText))throw Error('شاهد یا دلیل بررسی فیلدها معتبر نیست.');
 if(d.disposition==='field'){const f=fields.find(f=>f.key===d.key);if(!f||audited.has(d.key)||f.sourceText!==d.sourceText)throw Error('فیلد با گزارش بررسی شخصی‌سازی یکسان نیست.');audited.add(d.key);}else if(d.key!==null)throw Error('قید ثابت یا پیش‌نیاز نباید کلید فیلد داشته باشد.');
 return {sourceText:d.sourceText,label:d.label,disposition:d.disposition,key:d.key,reason:d.reason};});
 if(audited.size!==fields.length)throw Error('دلیل انتخاب بعضی فیلدها در گزارش وجود ندارد.');
 return {decision:r.decision,reason:r.reason,dimensions};
}
