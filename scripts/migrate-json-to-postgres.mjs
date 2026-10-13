import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { PrismaClient, Prisma } from '@prisma/client';
const arg = name => { const i=process.argv.indexOf(name);return i<0?undefined:process.argv[i+1]; };
const source=arg('--source');
if(!source || !path.isAbsolute(source)) throw new Error('Use --source /absolute/path/db.json; default is read-only plan.');
const bytes=fs.readFileSync(source);const data=JSON.parse(bytes);
const rows={User:data.users||[],Category:data.categories||[],Taxonomy:data.taxonomies||[],Prompt:data.prompts||[],SavedPrompt:data.savedPrompts||[],PromptPreset:data.presets||[]};
for(const [model,items] of Object.entries(rows)) {
 if(!Array.isArray(items))throw new Error(`${model}: expected array`);
 const ids=items.map(x=>x.id);if(ids.some(x=>typeof x!=='string'||!x)||new Set(ids).size!==ids.length)throw new Error(`${model}: missing/duplicate IDs`);
}
const users=new Set(rows.User.map(x=>x.id)),prompts=new Set(rows.Prompt.map(x=>x.id));
for(const x of [...rows.SavedPrompt,...rows.PromptPreset])if(!users.has(x.userId)||!prompts.has(x.promptId))throw new Error('Source has unresolved saved/preset references; repair explicitly before import.');
for(const x of rows.Prompt)for(const key of ['parentId','forkedFromId'])if(x[key]&&!prompts.has(x[key]))throw new Error('Source has unresolved prompt parent/fork; no data imported.');
for(const x of rows.User)if(!['USER','ADMIN','SUPER_ADMIN'].includes(String(x.role||'USER').toUpperCase()))throw new Error('Unknown source role; no automatic promotion/repair.');
for(const model of ['Taxonomy','Category'])if(new Set(rows[model].map(x=>x.slug)).size!==rows[model].length)throw new Error(`${model}: duplicate slugs incompatible with current PostgreSQL schema`);
console.log(JSON.stringify({mode:process.argv.includes('--apply')?'apply-requested':'read-only-plan',counts:Object.fromEntries(Object.entries(rows).map(([k,v])=>[k,v.length])),retainedOutsidePostgres:['settings','relationships','media','otp/security files']},null,2));
if(!process.argv.includes('--apply'))process.exit(0);
if(!process.argv.includes('--confirm-empty-target'))throw new Error('Apply requires --confirm-empty-target and an owner-approved maintenance window.');
const backup=arg('--backup');if(!backup||!path.isAbsolute(backup)||path.resolve(backup)===path.resolve(source))throw new Error('Apply requires a separate absolute --backup path.');
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
if(digest(fs.readFileSync(backup))!==digest(bytes))throw new Error('Backup does not match source; no data imported.');
if(!process.env.DATABASE_URL?.trim())throw new Error('PostgreSQL DATABASE_URL is required.');
const client=new PrismaClient();
const delegate=model=>model[0].toLowerCase()+model.slice(1);
const clean=(model,row)=>{
 const fields=Prisma.dmmf.datamodel.models.find(m=>m.name===model).fields.filter(f=>f.kind!=='object');const out={};
 for(const f of fields)if(row[f.name]!==undefined){let value=row[f.name];if(f.type==='DateTime'&&value!==null)value=new Date(value);out[f.name]=value;}
 if(model==='User')out.role=String(row.role||'USER').toUpperCase();
 if(model==='Prompt'){for(const key of ['tags','intents','domains','tools','outputFormats'])out[key]=row[key]||[];out.description=row.description||'';out.category=row.category||'عمومی';out.fieldsSchema=row.fieldsSchema||[];out.resourceType=row.resourceType||'prompt';out.isDemo=!!row.isDemo;out.usageCount=row.usageCount||0;}
 if(model==='Taxonomy'){out.aliases=row.aliases||[];out.synonyms=row.synonyms||[];}
 return out;
};
try {
 await client.$connect();
 await client.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(7418303005::bigint)`;
  for(const model of Prisma.dmmf.datamodel.models)if(await tx[delegate(model.name)].count())throw new Error('Target must be empty; merging or overwriting an existing database is forbidden.');
  for(const model of ['User','Category','Taxonomy','Prompt'])for(const row of rows[model]){const values=clean(model,row);if(model==='Prompt'){delete values.parentId;delete values.forkedFromId;}await tx[delegate(model)].create({data:values});}
  for(const row of rows.Prompt)if(row.parentId||row.forkedFromId)await tx.prompt.update({where:{id:row.id},data:{parentId:row.parentId||null,forkedFromId:row.forkedFromId||null}});
  for(const model of ['SavedPrompt','PromptPreset'])for(const row of rows[model])await tx[delegate(model)].create({data:clean(model,row)});
  for(const [model,items]of Object.entries(rows))if(await tx[delegate(model)].count()!==items.length)throw new Error('Count mismatch; transaction rolled back.');
 },{timeout:120000});
 console.log('PASS: import transaction committed; verify bodies, roles and application before cutover. Original JSON unchanged.');
} catch(error){console.error('Migration aborted; no automatic fallback. Details:',error.code||error.message);process.exitCode=1;}
finally{await client.$disconnect();}
