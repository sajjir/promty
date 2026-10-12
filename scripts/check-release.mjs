import 'dotenv/config';
import fs from 'node:fs';
import { PrismaClient, Prisma } from '@prisma/client';

// Read-only checks: never creates, migrates or resets data and never prints secrets.
const beforeUpgrade = process.argv.includes('--before-upgrade');
const required = ['JWT_SECRET','ADMIN_EMAIL','ADMIN_PASSWORD','APP_ORIGIN','MELIPAYAMAK_USERNAME','MELIPAYAMAK_PASSWORD','MELIPAYAMAK_OTP_BODY_ID'];
const problems = required.filter(key => !process.env[key]).map(key => `Missing: ${key}`);
if (process.env.NODE_ENV !== 'production') problems.push('NODE_ENV must be production');
if (process.env.LOCAL_PREVIEW === '1') problems.push('LOCAL_PREVIEW must not be enabled on a public server');
if ((process.env.JWT_SECRET || '').length < 32) problems.push('JWT_SECRET must contain at least 32 characters');
if ((process.env.ADMIN_PASSWORD || '').length < 12 || process.env.ADMIN_PASSWORD === 'admin123') problems.push('ADMIN_PASSWORD must contain at least 12 characters and not use the old default');
try { if (new URL(process.env.APP_ORIGIN).protocol !== 'https:') problems.push('APP_ORIGIN must use HTTPS'); } catch { problems.push('APP_ORIGIN must be a valid HTTPS URL'); }
if (!/^\d+$/.test(process.env.MELIPAYAMAK_OTP_BODY_ID || '') || Number(process.env.MELIPAYAMAK_OTP_BODY_ID) <= 0) problems.push('MELIPAYAMAK_OTP_BODY_ID must be a positive number');
if (Number(process.env.PORT || 3005) !== 3005) problems.push('PORT must be 3005 for this release guide');
if (fs.existsSync('db.json')) {
 try { const state=JSON.parse(fs.readFileSync('db.json','utf8')); if (!Array.isArray(state.prompts)) problems.push('Existing db.json must contain a prompts array'); }
 catch { problems.push('Existing db.json is unreadable; repair or restore it, never overwrite it with the release'); }
}
if (problems.length) { problems.forEach(problem=>console.error(problem)); process.exit(1); }
if (process.env.DATABASE_URL) {
 const prisma=new PrismaClient();
 try {
  await prisma.$connect();
  const columns=await prisma.$queryRaw`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = current_schema()`;
  const available=new Set(columns.map(row=>`${row.table_name}.${row.column_name}`));
  const archiveColumns=new Set(['Prompt.useCase','Prompt.resourceType','Prompt.isDemo']);
  const missing=[];
  for (const model of Prisma.dmmf.datamodel.models) for (const field of model.fields.filter(field=>field.kind!=='object')) {
   const column=`${model.dbName || model.name}.${field.dbName || field.name}`;
   if (!available.has(column) && !(beforeUpgrade && archiveColumns.has(column))) missing.push(column);
  }
  if (missing.length) { console.error('Schema mismatch; do not restart the application or apply unrelated reset/seed commands. Missing columns:',missing.join(', '));process.exitCode=1; }
  else console.log(beforeUpgrade ? 'PASS: configuration and previous PostgreSQL schema; apply archive SQL, then rerun without --before-upgrade.' : 'PASS: configuration and required PostgreSQL columns.');
 } catch (error) { console.error('Database verification failed. Check connectivity/schema without sharing credentials.',error.code || '');process.exitCode=1; }
 finally { await prisma.$disconnect(); }
} else {
 console.log('PASS: configuration; JSON backend selected. Preserve db.json and keep the working directory fixed. No SQL upgrade applies.');
}
console.log('This check does not validate SMS delivery, HTTPS/proxy configuration or the browser publishing flow.');
