import type {Express,RequestHandler} from 'express';
import {PrismaBlogRepository,BlogError} from './blogRepository';
export function registerBlogRoutes(app:Express,repo:PrismaBlogRepository|null,manager:RequestHandler){
 const handle=(fn:any)=>async(req:any,res:any)=>{if(!repo)return res.status(503).json({success:false,message:'بلاگ فقط با PostgreSQL فعال است.'});try{await fn(req,res);}catch(error:any){const status=error instanceof BlogError?error.status:error?.code==='P2002'?409:503;res.status(status).json({success:false,message:error instanceof BlogError?error.message:status===409?'این نشانی قبلاً ثبت شده است.':'دریافت یا ذخیرهٔ مقاله انجام نشد.'});}};
 const pageOf=(value:any)=>{const n=Number(value||1);if(!Number.isSafeInteger(n)||n<1||n>10000)throw new BlogError('شمارهٔ صفحه معتبر نیست.',400);return n;};
 app.get('/api/blog',handle(async(req:any,res:any)=>{const result=await repo!.list(pageOf(req.query.page));if(result.page>1&&(result.page-1)*result.pageSize>=result.total)return res.status(404).json({success:false});res.json({success:true,...result});}));
 app.get('/api/blog/:slug',handle(async(req:any,res:any)=>{const post=await repo!.get(req.params.slug);if(!post)return res.status(404).json({success:false});res.json({success:true,post});}));
 app.get('/api/blog-related/:promptId',handle(async(req:any,res:any)=>res.json({success:true,data:await repo!.forPrompt(req.params.promptId)})));
 app.get('/api/admin/blog',manager,handle(async(req:any,res:any)=>res.json({success:true,...await repo!.list(pageOf(req.query.page),true,req.query.trash==='1')})));
 app.delete('/api/admin/blog',manager,handle(async(req:any,res:any)=>res.json({success:true,...await repo!.trash(req.body)})));
 app.post('/api/admin/blog/restore',manager,handle(async(req:any,res:any)=>res.json({success:true,...await repo!.trash(req.body,true)})));
 app.get('/api/admin/blog/:slug',manager,handle(async(req:any,res:any)=>{const post=await repo!.get(req.params.slug,true);if(!post)return res.status(404).json({success:false});res.json({success:true,post});}));
 app.post('/api/admin/blog',manager,handle(async(req:any,res:any)=>{const saved=await repo!.save(req.body);res.status(201).json({success:true,post:await repo!.get(saved.slug,true)});}));
 app.put('/api/admin/blog/:id',manager,handle(async(req:any,res:any)=>{const saved=await repo!.save(req.body,req.params.id);res.json({success:true,post:await repo!.get(saved.slug,true)});}));
}
