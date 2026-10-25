import type { Prompt } from '../types';
/** Describe the prompt context, without claiming a tool generated the sample. */
export function promptImageAlt(prompt: Pick<Prompt,'title'|'tools'>, index?: number) {
  const tools=(prompt.tools||[]).slice(0,2).join('، ');
  return `تصویر ${index===undefined?'نمونه':`نمونهٔ ${index+1}`} برای ${prompt.title}${tools?` — ابزارهای مرتبط: ${tools}`:''}`;
}
export function publicImageUrls(prompt: Pick<Prompt,'coverImage'|'sampleImage'|'mediaGallery'>, origin:string) {
  return [...new Set([prompt.coverImage,prompt.sampleImage,...(prompt.mediaGallery||[])].filter(Boolean).flatMap(raw=>{
    try {const url=new URL(raw!,origin);return ['https:','http:'].includes(url.protocol)?[url.href]:[];}catch{return [];}
  }))].slice(0,1000);
}
