import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseSafeMarkdown,safeMarkdown,safeContentUrl} from '../src/lib/safeMarkdown';
import {validateBlogInput} from '../src/server/blogRepository';
import {buildSeo,sitemap} from '../src/server/seo';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
import BlogArticle from '../src/components/BlogContent';
import type {BlogPost} from '../src/lib/blogTypes';
const post:BlogPost={id:'post',slug:'test-guide',title:'آموزش <script>جدید</script>',excerpt:'شرح آموزش',contentMd:'## شروع\n\nمتن اصلی\n\n[prompt:public]\n\n### جزئیات\n\nپایان',authorName:'تحریریه پرامپتی',category:'آموزش',coverImage:null,coverImageAlt:null,status:'PUBLISHED',publishedAt:'2026-01-01T00:00:00Z',createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-02T00:00:00Z',prompts:[{id:'public',title:'پرامپت فعال',description:'شرح',isActive:true},{id:'private',title:'PRIVATE TITLE',description:'secret',isActive:false}]};
test('Markdown is safe: no executable raw HTML, unsafe schemes, injected event handlers or clobbering ids',()=>{
 const input=['<script>alert(1)</script>','<img src=x onerror=alert(1)>','[x](javascript:alert(1))','[x](JaVaScRiPt&#58;alert(1))','![x](data:image/svg+xml;base64,xxx)','[x](//evil.invalid)','## __proto__','## __proto__','![safe](/dl/library/safe.webp)','[go](https://example.org/a)'].join('\n\n');
 const html=safeMarkdown(input);
 assert.ok(!/<script\b|<img[^>]+onerror=|href="(?:javascript:|data:|\/\/)|src="data:/i.test(html));
 assert.match(html,/&lt;script&gt;/);assert.match(html,/id="blog-heading-1"/);assert.match(html,/id="blog-heading-2"/);assert.ok(!html.includes('id="__proto__"'));
 assert.match(html,/src="\/dl\/library\/safe.webp"/);assert.match(html,/href="https:\/\/example.org\/a"/);
 for(const url of ['javascript:alert(1)','data:image/svg+xml,x','//evil.invalid','https://user:pass@example.org','/\\evil.invalid','https:\n//evil.invalid'])assert.equal(safeContentUrl(url),false,url);
});
test('shortcodes are top-level blocks, remain literal inside code fences and inline text, and TOC matches generated anchors',()=>{
 const parsed=parseSafeMarkdown('## اول\n\n[prompt:one]\n\n```text\n[prompt:private]\n```\n\nمتن [prompt:inline]\n\n### دوم\n\n[prompt:two]');
 assert.deepEqual(parsed.promptIds,['one','two']);assert.deepEqual(parsed.toc.map(x=>x.id),['blog-heading-1','blog-heading-2']);assert.match(parsed.blocks.filter(x=>x.kind==='html').map(x=>(x as any).html).join(''),/\[prompt:private\]/);
});
test('validation whitelists fields, requires meaningful alt, and joins inline prompt references without trusting client publication timestamps',()=>{
 const raw={...post,relatedPromptIds:['public'],publishedAt:'2099-01-01',id:'spoof'};
 const result=validateBlogInput(raw);assert.deepEqual(result.relatedPromptIds,['public']);assert.ok(!('publishedAt' in result));assert.ok(!('id' in result));
 assert.throws(()=>validateBlogInput({...raw,slug:'Bad / Slug'}));assert.throws(()=>validateBlogInput({...raw,coverImage:'javascript:alert(1)',coverImageAlt:'x'}));assert.throws(()=>validateBlogInput({...raw,coverImage:'/dl/library/one.webp',coverImageAlt:''}));assert.throws(()=>validateBlogInput({...raw,relatedPromptIds:['bad/id']}));
});
test('article SSR and React use the same body; schema, TOC, live prompt links and draft isolation remain factual',async()=>{
 const repo:any={getAll:async()=>({prompts:[],totalCount:0})};const blog:any={get:async(slug:string)=>slug===post.slug?post:null,list:async(page=1)=>({data:[post],total:1,page,pageSize:12}),forPrompt:async()=>[post]};
 const result=await buildSeo(repo,'/blog/'+post.slug,'https://promty.ir',20,blog);
 assert.equal(result.status,200);assert.equal(result.content,renderToStaticMarkup(createElement(BlogArticle,{post})));assert.match(result.head,/"@type":"Article"/);assert.match(result.head,/2026-01-01/);assert.match(result.content,/href="\/prompts\/public"/);assert.ok(!result.content.includes('PRIVATE TITLE'));assert.ok(!result.head.includes('FAQPage'));assert.match(result.head,/rel="canonical" href="https:\/\/promty.ir\/blog\/test-guide"/);
 const draft=await buildSeo(repo,'/blog/draft','https://promty.ir',20,blog);assert.equal(draft.status,404);assert.equal(draft.noindex,true);
 const missingPage=await buildSeo(repo,'/blog?page=2','https://promty.ir',20,blog);assert.equal(missingPage.status,404);
 const xml=sitemap([],'https://promty.ir',[post,{...post,id:'draft',slug:'private-draft',status:'DRAFT'},{...post,id:'future',slug:'future',publishedAt:'2099-01-01T00:00:00Z'},{...post,id:'deleted',slug:'removed',deletedAt:'2026-01-01T00:00:00Z'}]);assert.ok(xml.includes('/blog/test-guide'));assert.ok(!xml.includes('private-draft'));assert.ok(!xml.includes('/blog/future'));assert.ok(!xml.includes('/blog/removed'));
});
