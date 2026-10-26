import {PrismaClient} from '@prisma/client';
import {spawnSync} from 'node:child_process';import crypto from 'node:crypto';import path from 'node:path';
if(process.env.LOCAL_PREVIEW!=='1')throw Error('Explicit local preview required');
const url=new URL(process.env.DATABASE_URL||'');if(url.hostname!=='127.0.0.1'||url.port!=='55432'||url.pathname!=='/promty_local')throw Error('Refusing any non-local database');
const schema='blog_test_'+crypto.randomBytes(8).toString('hex');const db=new PrismaClient();const bin=process.env.PROMTY_PG_BIN;if(!bin)throw Error('PostgreSQL client directory required');
const run=(cmd,args,options={})=>{const r=spawnSync(cmd,args,{encoding:'utf8',...options});if(r.status!==0)throw Error('Test command failed: '+path.basename(cmd));return r.stdout;};
try{
 await db.$executeRawUnsafe('CREATE SCHEMA "'+schema+'"');
 const ddl=run('node',['node_modules/prisma/build/index.js','migrate','diff','--from-empty','--to-schema-datamodel','prisma/schema.prisma','--script']);
 if(/"public"\./.test(ddl))throw Error('DDL must remain inside the isolated schema');
 const env={...process.env,PGHOST:url.hostname,PGPORT:url.port,PGDATABASE:url.pathname.slice(1),PGUSER:decodeURIComponent(url.username),PGPASSWORD:decodeURIComponent(url.password)};
 run(path.join(bin,'psql'),['-X','-v','ON_ERROR_STOP=1'],{env,input:'SET search_path TO "'+schema+'";\n'+ddl});
 url.searchParams.set('schema',schema);
 const result=spawnSync('node',['--import','tsx','--test','tests/blog-postgres.test.ts'],{env:{...process.env,BLOG_TEST_URL:url.href},stdio:'inherit'});
 if(result.status!==0)process.exitCode=1;
}finally{await db.$executeRawUnsafe('DROP SCHEMA "'+schema+'" CASCADE');await db.$disconnect();}
