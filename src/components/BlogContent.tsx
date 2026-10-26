import React from 'react';
import {parseSafeMarkdown} from '../lib/safeMarkdown';
import {blogHref,type BlogPost,type BlogSummary,type BlogPrompt} from '../lib/blogTypes';
import {blogDate,BlogPromptCard} from './BlogCards';
export {BlogCards,BlogIndexContent,RelatedArticles} from './BlogCards';
export default function BlogArticle({post,preview=false}:{post:BlogPost;preview?:boolean}){
 const parsed=parseSafeMarkdown(post.contentMd);const available=new Map(post.prompts.filter(p=>p.isActive||preview).map(p=>[p.id,p]));
 return <article className="blog-article" dir="rtl"><nav className="trust-breadcrumb" aria-label="مسیر صفحه"><a href="/">خانه</a><span>/</span><a href="/blog">بلاگ و آموزش</a><span>/</span><span aria-current="page">{post.title}</span></nav>
 {preview&&<p className="blog-preview-note">پیش‌نمایش مدیر — این نمایش به معنی انتشار مقاله نیست.</p>}
 <header className="trust-page-header"><span className="blog-category">{post.category}</span><h1>{post.title}</h1><p>{post.excerpt}</p><div className="blog-meta"><span>نویسنده: {post.authorName}</span>{post.publishedAt&&<time dateTime={post.publishedAt}>انتشار: {blogDate(post.publishedAt)}</time>}{post.publishedAt&&<time dateTime={post.updatedAt}>به‌روزرسانی: {blogDate(post.updatedAt)}</time>}</div></header>
 {post.coverImage&&<img className="blog-cover" src={post.coverImage} alt={post.coverImageAlt||''} width="1200" height="675"/>}
 {parsed.toc.length>0&&<nav className="blog-toc" aria-label="فهرست مطالب"><h2>در این آموزش</h2><ol>{parsed.toc.map(item=><li key={item.id} data-level={item.level}><a href={'#'+item.id}>{item.text}</a></li>)}</ol></nav>}
 <div className="blog-prose">{parsed.blocks.map((block,i)=>block.kind==='html'?<div key={i} dangerouslySetInnerHTML={{__html:block.html}}/>:available.has(block.promptId)?<BlogPromptCard key={i} prompt={available.get(block.promptId)!}/>:preview?<p key={i} className="blog-preview-note">این کارت پس از انتخاب پرامپت مرتبط یا ذخیرهٔ مقاله نمایش داده می‌شود.</p>:null)}</div>
 {available.size>0&&<section className="blog-related"><h2>پرامپت‌های این آموزش</h2><div className="blog-grid">{[...available.values()].map(prompt=><BlogPromptCard key={prompt.id} prompt={prompt}/>)}</div></section>}
 <nav className="trust-page-related"><a href="/blog">همهٔ آموزش‌ها</a><a href="/">رفتن به آرشیو پرامپت‌ها</a><a href="/contact">گزارش مشکل این آموزش</a></nav>
 </article>;
}
