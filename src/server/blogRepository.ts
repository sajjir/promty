import {PrismaClient} from '@prisma/client';
import type {BlogPost,BlogSummary,BlogRepository} from '../lib/blogTypes';
import {safeContentUrl} from '../lib/safeMarkdown';
import {parseArticleContent,cleanRichHtml} from '../lib/richContent';
export class BlogError extends Error{constructor(message:string,public status=400){super(message);}}
const publicWhere=()=>({deletedAt:null,status:'PUBLISHED' as const,publishedAt:{lte:new Date()}});
const summarySelect={deletedAt:true,id:true,slug:true,title:true,excerpt:true,authorName:true,category:true,coverImage:true,coverImageAlt:true,status:true,publishedAt:true,createdAt:true,updatedAt:true};
const serialize=(value:any):any=>JSON.parse(JSON.stringify(value));
export function validateBlogInput(raw:any){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new BlogError('اطلاعات مقاله معتبر نیست.');
 const labels:Record<string,string>={slug:'نشانی مقاله',title:'عنوان مقاله',excerpt:'خلاصه',contentMd:'متن مقاله',authorName:'نام نویسنده',category:'دستهٔ آموزشی'};
 const text=(key:string,max:number,required=true)=>{if(typeof raw[key]!=='string'||raw[key].trim().length>max||required&&!raw[key].trim())throw new BlogError('مقدار '+(labels[key]||key)+' معتبر نیست.');return raw[key].trim();};
 const slug=text('slug',120);if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))throw new BlogError('نشانی مقاله باید انگلیسی، کوچک و با خط تیره باشد.');
 const title=text('title',180),excerpt=text('excerpt',500),contentMd=text('contentMd',80000),authorName=text('authorName',100),category=text('category',80);
 if(!['DRAFT','PUBLISHED'].includes(raw.status))throw new BlogError('وضعیت انتشار معتبر نیست.');
 const coverImage=typeof raw.coverImage==='string'?raw.coverImage.trim():'';
 if(coverImage&&(!safeContentUrl(coverImage,true)||coverImage.startsWith('/')&&!/^\/dl\/library\/[a-zA-Z0-9_-]+\.webp$/.test(coverImage)))throw new BlogError('تصویر را از کتابخانه انتخاب کنید یا آدرس HTTP(S) معتبر وارد کنید.');
 const coverImageAlt=typeof raw.coverImageAlt==='string'?raw.coverImageAlt.trim():'';
 if(coverImageAlt.length>300||coverImage&&!coverImageAlt)throw new BlogError('برای تصویر، متن جایگزین توصیفی وارد کنید.');
 if(!Array.isArray(raw.relatedPromptIds)||raw.relatedPromptIds.length>30||raw.relatedPromptIds.some((x:any)=>typeof x!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(x)))throw new BlogError('پرامپت‌های مرتبط معتبر نیستند.');
 const contentFormat=raw.contentFormat===undefined?'markdown':raw.contentFormat;if(!['markdown','html'].includes(contentFormat))throw new BlogError('قالب محتوا معتبر نیست.');
 const storedContent=contentFormat==='html'?cleanRichHtml(contentMd):contentMd;
 const parsed=parseArticleContent(storedContent,contentFormat);if(parsed.promptIds.length>20)throw new BlogError('حداکثر ۲۰ کارت در متن مجاز است.');
 const relatedPromptIds=[...new Set<string>([...raw.relatedPromptIds,...parsed.promptIds])];
 if(relatedPromptIds.length>30)throw new BlogError('حداکثر ۳۰ پرامپت مرتبط مجاز است.');
 return {slug,title,excerpt,contentMd:storedContent,contentFormat,authorName,category,coverImage:coverImage||null,coverImageAlt:coverImageAlt||null,status:raw.status as 'DRAFT'|'PUBLISHED',relatedPromptIds};
}
export class PrismaBlogRepository implements BlogRepository {
 constructor(private db:PrismaClient){}
 async list(page=1,admin=false,trash=false){const where=admin?{deletedAt:trash?{not:null}:null}:publicWhere();const size=12;const [data,total]=await this.db.$transaction([this.db.blogPost.findMany({where,select:summarySelect,orderBy:[{publishedAt:'desc'},{createdAt:'desc'},{id:'asc'}],skip:(page-1)*size,take:size}),this.db.blogPost.count({where})]);return serialize({data,total,page,pageSize:size});}
 async get(slug:string,admin=false):Promise<BlogPost|null>{
  const row=await this.db.blogPost.findFirst({where:{slug,...(!admin?publicWhere():{deletedAt:null})},include:{promptLinks:{orderBy:{sortOrder:'asc'},include:{prompt:{select:{id:true,title:true,description:true,useCase:true,resourceType:true,isActive:true}}}}}});
  if(!row)return null;const {promptLinks,...post}=row;const prompts=promptLinks.map(x=>x.prompt).filter(x=>admin||x.isActive);
  const visible=new Set(prompts.map(p=>p.id));const contentMd=admin?post.contentMd:post.contentMd.replace(/^\[prompt:([a-zA-Z0-9_-]{1,100})\]\s*$/gm,(all,id)=>visible.has(id)?all:'');
  return serialize({...post,contentMd,prompts});
 }
 async forPrompt(id:string):Promise<BlogSummary[]>{return serialize(await this.db.blogPost.findMany({where:{...publicWhere(),promptLinks:{some:{promptId:id,prompt:{isActive:true}}}},select:summarySelect,orderBy:[{publishedAt:'desc'},{id:'asc'}],take:5}));}
 async save(raw:any,id?:string){
  const {relatedPromptIds,...input}=validateBlogInput(raw);
  const found=await this.db.prompt.count({where:{id:{in:relatedPromptIds}}});if(found!==relatedPromptIds.length)throw new BlogError('یکی از پرامپت‌های مرتبط پیدا نشد.');
  return this.db.$transaction(async tx=>{
   const old=id?await tx.blogPost.findUnique({where:{id}}):null;
   if(id&&(!old||old.deletedAt))throw new BlogError('مقاله پیدا نشد.',404);
   if(old&&raw.updatedAt!==old.updatedAt.toISOString())throw new BlogError('مقاله توسط مدیر دیگری تغییر کرده؛ نسخهٔ تازه را باز کنید.',409);
   if(old?.publishedAt&&old.slug!==input.slug)throw new BlogError('نشانی مقاله پس از نخستین انتشار ثابت است.');
   const publishedAt=input.status==='PUBLISHED'?(old?.publishedAt||new Date()):old?.publishedAt||null;
   // Optimistic locking is enforced in the write, not only in the preceding read.
   if(old){const changed=await tx.blogPost.updateMany({where:{id,updatedAt:old.updatedAt},data:{...input,publishedAt,updatedAt:new Date(Math.max(Date.now(),old.updatedAt.getTime()+1))}});if(changed.count!==1)throw new BlogError('نسخهٔ مقاله تغییر کرده است.',409);await tx.blogPostPrompt.deleteMany({where:{postId:id}});}
   const post=old?await tx.blogPost.findUniqueOrThrow({where:{id}}):await tx.blogPost.create({data:{...input,publishedAt}});
   if(relatedPromptIds.length)await tx.blogPostPrompt.createMany({data:relatedPromptIds.map((promptId,sortOrder)=>({postId:post.id,promptId,sortOrder}))});
   return {id:post.id,slug:post.slug};
  });
 }
 async trash(raw:any,restore=false){
  if(!Array.isArray(raw?.ids)||!raw.ids.length||raw.ids.length>100||raw.ids.some((x:any)=>typeof x!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(x)))throw new BlogError('یک تا صد مقاله را انتخاب کنید.');
  const ids=[...new Set<string>(raw.ids)];
  if(!raw.revisions||typeof raw.revisions!=='object'||ids.some(id=>typeof raw.revisions[id]!=='string'))throw new BlogError('نسخهٔ مقاله‌ها مشخص نیست؛ فهرست را تازه کنید.');
  return this.db.$transaction(async tx=>{
   const rows=await tx.blogPost.findMany({where:{id:{in:ids},deletedAt:restore?{not:null}:null},select:{id:true,updatedAt:true}});
   if(rows.length!==ids.length||rows.some(p=>raw.revisions[p.id]!==p.updatedAt.toISOString()))throw new BlogError('یکی از مقاله‌ها تغییر کرده است؛ فهرست را تازه و دوباره انتخاب کنید.',409);
   const now=new Date(Math.max(Date.now(),...rows.map(p=>p.updatedAt.getTime()+1)));
   const result=await tx.blogPost.updateMany({where:{OR:rows.map(p=>({id:p.id,updatedAt:p.updatedAt}))},data:{deletedAt:restore?null:now,status:'DRAFT',updatedAt:now}});
   if(result.count!==ids.length)throw new BlogError('نسخهٔ مقاله‌ها تغییر کرد؛ هیچ موردی تغییر نکرد.',409);
   return {count:result.count};
  });
 }
 async mediaReferences(){const rows=await this.db.blogPost.findMany({select:{deletedAt:true,title:true,coverImage:true,contentMd:true,contentFormat:true,status:true,publishedAt:true}});return rows.flatMap(p=>[p.coverImage,...parseArticleContent(p.contentMd,p.contentFormat as any).imageUrls].filter((url):url is string=>!!url).map(url=>({url,public:!p.deletedAt&&p.status==='PUBLISHED'&&!!p.publishedAt&&p.publishedAt<=new Date(),label:p.title})));}
 async sitemapPosts(){return serialize(await this.db.blogPost.findMany({where:publicWhere(),select:summarySelect,orderBy:{id:'asc'}}));}
}
