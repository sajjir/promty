import NotFoundContent from '../components/NotFoundContent';
import {normalizeHomepageChips,type HomepageChip} from '../lib/homepageChips';
import {homepageChipCounts} from './homepageChipCounts';
import BlogArticle,{BlogIndexContent,RelatedArticles} from '../components/BlogContent';
import {blogHref,type BlogRepository,type BlogSummary} from '../lib/blogTypes';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import TrustPageContent from '../components/TrustPageContent';
import {STATIC_TRUST_PAGES,TRUST_PAGE_LIST} from '../lib/trustPages';
import { promptImageAlt, publicImageUrls } from '../lib/promptImages';
import type { Prompt } from '../types';
import type { IPromptRepository } from './repositories/IPromptRepository';
import { getUseCase, useCases } from '../lib/archiveCatalog';
import { filterPrompts } from './repositories/filterPrompts';
import { archiveFilterKeys } from '../lib/archiveFilters';
export const escape = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const decode = (s: string) => { try {
    return decodeURIComponent(s);
}
catch {
    return '';
} };
const json = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
export const useCaseHref = (slug: string) => `/use-case/${encodeURIComponent(slug)}`;
const promptHref = (p: Prompt) => `/prompts/${encodeURIComponent(p.id)}`;
const breadcrumb = (entries: {
    name: string;
    url: string;
}[]) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: entries.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.name, item: p.url })) });
export async function buildSeo(repo: IPromptRepository, raw: string, origin: string, pageSize = 20, blog?:BlogRepository, homepageChips?:HomepageChip[]) {
    const url = new URL(raw, origin);
    const pathname = url.pathname;
    let title = 'پرامپتی | آرشیو و شخصی‌سازی پرامپت‌های هوش مصنوعی', description = 'پرامپت‌ها، مهارت‌ها و راهنماهای آماده را بر اساس کاربرد پیدا و شخصی‌سازی کنید.', status = 200, noindex = false, content = '', canonical = origin + pathname;
    let image = '', ogType='website';
    let structured: unknown[] = [];
    const fail = () => { status = 404; noindex = true; title = 'محتوا پیدا نشد | پرامپتی'; description = 'این صفحه وجود ندارد یا منتشر نشده است.'; content = '<h1>محتوا پیدا نشد</h1><p>ممکن است این محتوا هنوز منتشر نشده باشد.</p><a href="/">بازگشت به آرشیو</a>'; };
    const trustPage = STATIC_TRUST_PAGES[pathname];
    // Static pages remain available even when archive storage is unavailable.
    const blogRoute = pathname === '/blog' || pathname.startsWith('/blog/');
    const all = trustPage || blogRoute ? [] : (await repo.getAll({ isActive: true })).prompts.filter(p => p.isActive);
    const detail = pathname.match(/^\/prompts\/([^/]+)$/);
    const landing = pathname.match(/^\/(use-case|tool|domain)\/([^/]+)$/);
    if (trustPage) {
        title = trustPage.title;
        description = trustPage.description;
        content = renderToStaticMarkup(createElement(TrustPageContent, {page:trustPage}));
        structured = [breadcrumb([{name:'خانه',url:origin},{name:trustPage.h1,url:canonical}]), {'@context':'https://schema.org','@type':trustPage.schemaType,'@id':canonical+'#webpage',name:trustPage.h1,description,url:canonical,inLanguage:'fa'}];
    }
    else if(blogRoute){
        if(!blog){status=503;noindex=true;title='آموزش موقتاً در دسترس نیست | پرامپتی';content='<h1>آموزش موقتاً در دسترس نیست</h1>';}
        else if(pathname==='/blog'){
            const page=Number(url.searchParams.get('page')||1);
            if(!Number.isSafeInteger(page)||page<1||page>10000)fail();
            else{const result=await blog.list(page);if(page>1&&(page-1)*result.pageSize>=result.total)fail();else{
                title='بلاگ و آموزش پرامپتی'+(page>1?' — صفحهٔ '+page:'');description='راهنماهای کاربردی استفاده از پرامپت‌ها در تصویر محصول و محتوای فروشگاهی.';
                if(page>1)canonical+='?page='+page;
                noindex=[...url.searchParams.keys()].some(key=>key!=='page');
                content=renderToStaticMarkup(createElement(BlogIndexContent,result));
                structured=[breadcrumb([{name:'خانه',url:origin},{name:'بلاگ و آموزش',url:canonical}]),{'@context':'https://schema.org','@type':'CollectionPage',name:title,url:canonical}];
            }}
        }else{
            const match=pathname.match(/^\/blog\/([^/]+)$/);const post=match?await blog.get(decode(match[1])):null;
            if(!post)fail();else{ogType='article';title=post.title+' | پرامپتی';description=post.excerpt;content=renderToStaticMarkup(createElement(BlogArticle,{post}));
                if(post.coverImage)image=new URL(post.coverImage,origin).href;
                structured=[breadcrumb([{name:'خانه',url:origin},{name:'بلاگ و آموزش',url:origin+'/blog'},{name:post.title,url:canonical}]),{'@context':'https://schema.org','@type':'Article',headline:post.title,description:post.excerpt,author:{'@type':post.authorName==='تحریریه پرامپتی'?'Organization':'Person',name:post.authorName},datePublished:post.publishedAt,dateModified:post.updatedAt,inLanguage:'fa',mainEntityOfPage:canonical,...(image?{image}: {})}];
            }
        }
    }
    else if (detail) {
        const p = all.find(p => p.id === decode(detail[1]));
        if (!p)
            fail();
        else {
            title = p.title + ' | پرامپتی';
            description = p.description || p.title;
            try {
                const u = new URL(p.sampleImage || '', origin);
                if (p.sampleImage && ['https:', 'http:'].includes(u.protocol))
                    image = u.href;
            }
            catch { }
            const uc = getUseCase(p.useCase);
            const related = all.filter(x => x.id !== p.id && x.useCase === p.useCase).slice(0, 5);
            content = `<article><h1>${escape(p.title)}</h1><p>${escape(description)}</p>${p.requiresReferenceImage ? '<p>این پرامپت نیازمند تصویر ورودی است.</p>' : ''}${image ? `<figure><img src="${escape(image)}" alt="${escape(promptImageAlt(p))}" width="1600" height="900" style="width:100%;height:auto;aspect-ratio:16/9;object-fit:contain"><figcaption>تصویر نمونهٔ ثبت‌شده</figcaption></figure>` : ''}<h2>متن قالب پرامپت</h2><pre dir="auto">${escape(p.body)}</pre>${p.bodyFa ? `<h2>نسخهٔ فارسی</h2><pre dir="rtl">${escape(p.bodyFa)}</pre>` : ''}<h2>فیلدهای شخصی‌سازی</h2><ul>${(p.fieldsSchema || []).map(f => `<li>${escape(f.label)} <code>{{${escape(f.key)}}}</code>${f.required ? ' (الزامی)' : ''}${f.placeholder ? ': ' + escape(f.placeholder) : ''}</li>`).join('')}</ul>${uc ? `<p><a href="${useCaseHref(uc.slug)}">${escape(uc.title)}</a></p>` : ''}<nav aria-label="منابع مرتبط">${related.map(x => `<p><a href="${promptHref(x)}">${escape(x.title)}</a></p>`).join('')}</nav></article>`;
            if(blog)content+=renderToStaticMarkup(createElement(RelatedArticles,{posts:await blog.forPrompt(p.id)}));
            structured = [breadcrumb([{ name: 'خانه', url: origin }, ...(uc ? [{ name: uc.title, url: origin + useCaseHref(uc.slug) }] : []), { name: p.title, url: canonical }]), { '@context': 'https://schema.org', '@type': 'CreativeWork', name: p.title, description, url: canonical, text: p.body, inLanguage: p.language || undefined, keywords: [...(p.tools || []), ...(p.tags || [])].join(', '), ...(image ? { image } : {}), ...(p.fieldsSchema?.length ? { hasPart: p.fieldsSchema.map(f => ({ '@type': 'CreativeWork', name: f.label, text: f.key })) } : {}) }];
        }
    }
    else if (pathname === '/' || landing) {
        const filters: Record<string, any> = { isActive: true };
        for (const key of archiveFilterKeys) {
            const values = url.searchParams.getAll(key).flatMap(x => x.split(',')).filter(Boolean);
            if (values.length)
                filters[key] = values;
        }
        const query = url.searchParams.get('q');
        if (query)
            filters.q = query;
        const sort = url.searchParams.get('sort');
        if (sort)
            filters.sort = sort;
        if (landing) {
            const slug = decode(landing[2]);
            const key = landing[1] === 'use-case' ? 'useCase' : landing[1];
            filters[key] = slug;
            const uc = key === 'useCase' ? getUseCase(slug) : null;
            const exists = key === 'useCase' ? !!uc : all.some(p => (key === 'tool' ? p.tools : p.domains)?.some(x => x.toLowerCase() === slug.toLowerCase()));
            if (!exists)
                fail();
            else {
                title = `پرامپت‌های ${uc?.title || slug} | پرامپتی`;
                description = uc?.expectedResult || `منابع منتشرشده برای ${slug} را مرور و شخصی‌سازی کنید.`;
            }
        }
        if (status === 200) {
            const rows = filterPrompts(all, filters);
            const rawPage = url.searchParams.get('page');
            const page = rawPage ? Number(rawPage) : 1;
            const extra = [...url.searchParams.keys()].some(k => k !== 'page' && !(landing && k === (landing[1] === 'use-case' ? 'useCase' : landing[1]) && url.searchParams.get(k) === decode(landing[2])));
            noindex = extra;
            if (!Number.isSafeInteger(page) || page < 1 || (page > 1 && (page - 1) * pageSize >= rows.length) || (landing && !rows.length) || (extra && !rows.length)) {
                fail();
            }
            else {
                const start = (page - 1) * pageSize;
                const visible = rows.slice(start, start + pageSize);
                if (page > 1) {
                    canonical += `?page=${page}`;
                    title += ` — صفحهٔ ${page}`;
                }
                const pageLink = (n: number) => { const params = new URLSearchParams(url.searchParams); params.set('page', String(n)); return pathname + '?' + params.toString(); };
                content = `<section><h1>${escape(title.replace(' | پرامپتی', ''))}</h1><p>${escape(description)}</p><ul>${visible.map(p => `<li><a href="${promptHref(p)}">${escape(p.title)}</a><p>${escape(p.description)}</p></li>`).join('')}</ul><nav aria-label="صفحه‌بندی">${page > 1 ? `<a href="${escape(pageLink(page - 1))}">صفحهٔ قبل</a>` : ''} ${start + pageSize < rows.length ? `<a href="${escape(pageLink(page + 1))}">صفحهٔ بعد</a>` : ''}</nav>${!landing ? `<nav aria-label="کاربردهای دارای محتوا">${useCases.filter(u => all.some(p => p.useCase === u.slug)).map(u => `<p><a href="${useCaseHref(u.slug)}">${escape(u.title)}</a></p>`).join('')}</nav>` : ''}</section>`;
                if (landing)
                    structured = [breadcrumb([{ name: 'خانه', url: origin }, { name: title.replace(' | پرامپتی', ''), url: canonical }])];
            }
        }
    }
    else if (/^\/(admin(?:\/.*)?|dashboard)$/.test(pathname)) {
        noindex = true;
        title = 'حساب کاربری | پرامپتی';
    }
    else
        fail();
    if(status===404){
        const chips=normalizeHomepageChips(homepageChips);
        const published=blogRoute?(await repo.getAll({isActive:true})).prompts.filter(p=>p.isActive):all;
        content=renderToStaticMarkup(createElement(NotFoundContent,{chips,counts:homepageChipCounts(published,chips)}));
    }
    const head = `<title>${escape(title)}</title><meta name="description" content="${escape(description)}"><meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow'}"><link rel="canonical" href="${escape(canonical)}"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${escape(canonical)}"><meta property="og:type" content="${ogType}">${image ? `<meta property="og:image" content="${escape(image)}">` : ''}${structured.map(x => `<script type="application/ld+json">${json(x)}</script>`).join('')}`;
    return { head, content, status, noindex };
}
export function injectSeo(html: string, result: Awaited<ReturnType<typeof buildSeo>>) {
    html = html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '').replace(/<meta\b(?=[^>]*(?:name\s*=\s*["'](?:description|robots|twitter:[^"']+)["']|property\s*=\s*["']og:[^"']+["']))[^>]*>/gi, '').replace(/<link\b(?=[^>]*rel\s*=\s*["']canonical["'])[^>]*>/gi, '').replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '');
    return html.replace('</head>', result.head + '\n</head>').replace(/<div id="root"><\/div>/, `<div id="root"><main class="seo-content" dir="rtl">${result.content}</main></div>`);
}
export function sitemap(prompts: Prompt[], origin: string, posts?:BlogSummary[]) {
    const rows = prompts.filter(p => p.isActive);
    const facets = (['tool', 'domain'] as const).flatMap(type => [...new Set(rows.flatMap(p => (type === 'tool' ? p.tools : p.domains) || []).map(x => x.toLowerCase()))].filter(x => /^[a-z0-9-]+$/.test(x)).map(slug => ({ path: `/${type}/${encodeURIComponent(slug)}`, lastmod: '' })));
    const urls = [{ path: '/', lastmod: '' }, ...(posts ? [{path:'/blog',lastmod:''},...posts.filter(p=>!p.deletedAt&&p.status==='PUBLISHED'&&p.publishedAt&&Date.parse(p.publishedAt)<=Date.now()).map(p=>({path:blogHref(p.slug),lastmod:p.updatedAt,images:publicImageUrls({coverImage:p.coverImage} as Prompt,origin)}))] : []), ...TRUST_PAGE_LIST.map(p=>({path:p.path,lastmod:''})), ...facets, ...useCases.filter(u => rows.some(p => p.useCase === u.slug)).map(u => ({ path: useCaseHref(u.slug), lastmod: '' })), ...rows.map(p => ({ path: promptHref(p), lastmod: p.updatedAt, images: publicImageUrls(p,origin) }))];
    return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' + urls.map(u => `<url><loc>${escape(origin + u.path)}</loc>${u.lastmod && !isNaN(Date.parse(u.lastmod)) ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ''}${('images' in u ? u.images as string[] : []).map(image=>`<image:image><image:loc>${escape(image)}</image:loc></image:image>`).join('')}</url>`).join('') + '</urlset>';
}
