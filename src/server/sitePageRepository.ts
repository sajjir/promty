import type {PrismaClient} from '@prisma/client';
import {defaultPage,DEFAULT_SITE_PAGES,type SitePage} from '../lib/sitePages';
import {cleanRichHtml,parseArticleContent} from '../lib/richContent';
import {BlogError} from './blogRepository';
export interface PageRepository{get(slug:string,admin?:boolean):Promise<SitePage|null>;list():Promise<SitePage[]>;sitemapPages():Promise<SitePage[]>;}
const serialize=(v:any)=>JSON.parse(JSON.stringify(v));
export class PrismaPageRepository implements PageRepository{
 constructor(private db:PrismaClient){}
 async list(){const rows=await this.db.sitePage.findMany({orderBy:{createdAt:'asc'}});return serialize([...DEFAULT_SITE_PAGES.map(p=>rows.find(r=>r.slug===p.slug)||p),...rows.filter(p=>!defaultPage(p.slug))]);}
 async get(slug:string,admin=false){const row=await this.db.sitePage.findUnique({where:{slug}});return serialize(row&&(admin||row.status==='PUBLISHED')?row:defaultPage(slug));}
 async save(raw:any){
 const text=(k:string,max:number)=>{if(typeof raw?.[k]!=='string'||!raw[k].trim()||raw[k].length>max)throw new BlogError('عنوان، نشانی و خلاصهٔ برگه را بررسی کنید.');return raw[k].trim();};
 const slug=text('slug',100),title=text('title',180),excerpt=text('excerpt',500);
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||['new','admin','api','prompts'].includes(slug))throw new BlogError('نشانی انگلیسی معتبر وارد کنید.');
 if(!['DRAFT','PUBLISHED'].includes(raw.status)||typeof raw.contentHtml!=='string'||raw.contentHtml.length>80000)throw new BlogError('متن یا وضعیت برگه معتبر نیست.');
 const data={slug,title,excerpt,contentHtml:cleanRichHtml(raw.contentHtml),status:raw.status};
 return this.db.$transaction(async tx=>{const old=await tx.sitePage.findUnique({where:{slug}});
 if(old){if(raw.updatedAt!==old.updatedAt.toISOString())throw new BlogError('این برگه تغییر کرده است؛ نسخهٔ تازه را باز کنید.',409);const changed=await tx.sitePage.updateMany({where:{slug,updatedAt:old.updatedAt},data:{...data,updatedAt:new Date(Math.max(Date.now(),old.updatedAt.getTime()+1))}});if(changed.count!==1)throw new BlogError('نسخهٔ برگه تغییر کرد.',409);}
 else{if(raw.updatedAt)throw new BlogError('نسخهٔ برگه پیدا نشد.',409);await tx.sitePage.create({data});}
 return serialize(await tx.sitePage.findUniqueOrThrow({where:{slug}}));});
 }
 async sitemapPages(){return serialize(await this.db.sitePage.findMany({where:{status:'PUBLISHED'}}));}
 async mediaReferences(){return (await this.db.sitePage.findMany()).flatMap(p=>parseArticleContent(p.contentHtml,'html').imageUrls.map(url=>({url,public:p.status==='PUBLISHED',label:p.title})));}
}
