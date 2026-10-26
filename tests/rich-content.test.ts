import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cleanRichHtml,parseArticleContent,videoEmbedUrl,markdownToEditorHtml} from '../src/lib/richContent';
import {buildSeo,sitemap} from '../src/server/seo';
import {validateBlogInput} from '../src/server/blogRepository';
import {defaultPage} from '../src/lib/sitePages';
test('rich HTML retains editorial tools and strips executable content, unsafe styles and untrusted frames',()=>{
 const source='<h1>Title</h1><blockquote><p><strong>Quote</strong></p></blockquote><pre><code>&lt;script&gt;literal&lt;/script&gt;</code></pre><p style="text-align:center;color:#123456;position:fixed" onclick="bad()">Body</p><table><tr><td>Cell</td></tr></table><img src="/dl/library/inline.webp" alt="Product" onerror="bad()"><script>alert(1)</script><svg onload="bad()"></svg><a href="javascript:alert(1)">bad link</a><iframe src="https://evil.invalid/embed/1"></iframe><iframe src="https://www.youtube.com/embed/abcdefghijk" onload="bad()"></iframe><iframe src="https://www.aparat.com/video/video/embed/videohash/Ab12C/vt/frame"></iframe>';
 const safe=cleanRichHtml(source);assert.match(safe,/<h2>Title<\/h2>/);assert.match(safe,/<blockquote>/);assert.match(safe,/<table>/);assert.match(safe,/text-align:center/);assert.match(safe,/color:#123456/);assert.match(safe,/&lt;script&gt;literal/);
 for(const bad of ['onclick','onerror','onload','position:','<script>','<svg','javascript:','evil.invalid'])assert.ok(!safe.includes(bad),bad);
 assert.match(safe,/youtube-nocookie.com\/embed\/abcdefghijk/);assert.match(safe,/aparat.com\/video\/video\/embed/);assert.match(safe,/sandbox="allow-scripts allow-same-origin allow-presentation"/);
 const parsed=parseArticleContent(safe,'html');assert.equal(parsed.toc.length,1);assert.deepEqual(parsed.imageUrls,['/dl/library/inline.webp']);
 assert.equal(videoEmbedUrl('https://youtu.be/abcdefghijk'),'https://www.youtube-nocookie.com/embed/abcdefghijk');
 for(const bad of ['https://www.youtube.com.evil.invalid/embed/abcdefghijk','https://www.aparat.com/evil','//youtube.com/embed/abcdefghijk','http://youtu.be/abcdefghijk','https://user:pw@youtu.be/abcdefghijk'])assert.equal(videoEmbedUrl(bad),null);
});
test('HTML prompt cards remain block-only and Markdown conversion preserves existing semantics',()=>{
 const html=markdownToEditorHtml('## Heading\n\n[prompt:public]\n\n```html\n[prompt:literal]\n```');
 const parsed=parseArticleContent(html,'html');assert.deepEqual(parsed.promptIds,['public']);assert.deepEqual(parseArticleContent('<blockquote><p>[prompt:nested]</p></blockquote>','html').promptIds,[]);assert.match(html,/\[prompt:literal\]/);
 const result=validateBlogInput({slug:'rich-article',title:'Rich',excerpt:'Excerpt',authorName:'Editor',category:'Guide',status:'DRAFT',relatedPromptIds:[],contentFormat:'html',contentMd:html+'<script>bad()</script>'});
 assert.equal(result.contentFormat,'html');assert.ok(!result.contentMd.includes('<script>'));assert.deepEqual(result.relatedPromptIds,['public']);
});
test('editable pages render identical safe body in server metadata and appear in sitemap only when published',async()=>{
 const page={slug:'launch',title:'Launch guide',excerpt:'Page description',contentHtml:'<h2>Start</h2><p>Safe body</p>',status:'PUBLISHED' as const,updatedAt:'2026-10-26T00:00:00Z'};
 const repo:any={getAll:async()=>({prompts:[],totalCount:0})};const pages:any={get:async(slug:string)=>slug==='launch'?page:defaultPage(slug)};
 const result=await buildSeo(repo,'/pages/launch','https://promty.ir',20,undefined,[],pages);assert.equal(result.status,200);assert.match(result.head,/Launch guide/);assert.match(result.content,/Safe body/);assert.match(result.content,/<h1>Launch guide<\/h1>/);
 const draft=await buildSeo(repo,'/pages/draft','https://promty.ir',20,undefined,[],pages);assert.equal(draft.status,404);
 const xml=sitemap([],'https://promty.ir',[],[page,{...page,slug:'draft',status:'DRAFT'}]);assert.match(xml,/\/pages\/launch/);assert.ok(!xml.includes('/pages/draft'));
});
