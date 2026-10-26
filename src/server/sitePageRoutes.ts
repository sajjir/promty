import type {Express,RequestHandler} from 'express';
import type {PrismaPageRepository} from './sitePageRepository';
import {BlogError} from './blogRepository';
export function registerPageRoutes(app:Express,repo:PrismaPageRepository|null,manager:RequestHandler){
 const handle=(fn:any)=>async(req:any,res:any)=>{if(!repo)return res.status(503).json({success:false,message:'برگه‌ها فقط با PostgreSQL فعال‌اند.'});try{await fn(req,res);}catch(e:any){res.status(e instanceof BlogError?e.status:e.code==='P2002'?409:503).json({success:false,message:e instanceof BlogError?e.message:'ذخیره یا دریافت برگه انجام نشد.'});}};
 app.get('/api/pages/:slug',handle(async(req:any,res:any)=>{const page=await repo!.get(req.params.slug);if(!page)return res.status(404).json({success:false});res.json({success:true,page});}));
 app.get('/api/admin/pages',manager,handle(async(_req:any,res:any)=>res.json({success:true,data:await repo!.list()})));
 app.get('/api/admin/pages/:slug',manager,handle(async(req:any,res:any)=>{const page=await repo!.get(req.params.slug,true);if(!page)return res.status(404).json({success:false});res.json({success:true,page});}));
 app.put('/api/admin/pages/:slug',manager,handle(async(req:any,res:any)=>{if(req.params.slug!==req.body.slug)throw new BlogError('نشانی برگه تغییر کرده است.');res.json({success:true,page:await repo!.save(req.body)});}));
}
