import React from 'react';
import type {StaticTrustPageConfig} from '../lib/trustPages';
export default function TrustPageContent({page}:{page:StaticTrustPageConfig}) {
 return <article className="trust-page" dir="rtl">
  <nav className="trust-breadcrumb" aria-label="مسیر صفحه"><a href="/">خانه</a><span aria-hidden="true">/</span><span aria-current="page">{page.h1}</span></nav>
  <header className="trust-page-header"><p className="trust-eyebrow">پرامپتی · راهنما و ارتباط</p><h1>{page.h1}</h1><p>{page.description}</p></header>
  <div className="trust-page-sections">{page.sections.map(section=><section key={section.id} aria-labelledby={`trust-${section.id}`}>
   <h2 id={`trust-${section.id}`}>{section.heading}</h2><p>{section.body}</p>
   {section.bullets&&<ul>{section.bullets.map(text=><li key={text}>{text}</li>)}</ul>}
   {section.links&&<div className="trust-page-links">{section.links.map(link=><a key={link.href} href={link.href} dir={link.href.startsWith('mailto:')?'auto':undefined}>{link.label}</a>)}</div>}
  </section>)}</div>
  <nav className="trust-page-related" aria-label="صفحات راهنما"><a href="/">آرشیو پرامپت‌ها</a><a href="/guide">راهنمای استفاده</a><a href="/about">درباره پرامپتی</a><a href="/contact">تماس و گزارش مشکل</a></nav>
 </article>;
}
