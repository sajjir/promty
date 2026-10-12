import fs from 'node:fs';
import path from 'node:path';
import { demoPrompts } from './archive-demo-data';
import { normalizeArchivePrompt } from '../src/lib/archiveCatalog';

const dbPath = process.argv[2];
if (process.env.LOCAL_PREVIEW !== '1' || !dbPath || !path.isAbsolute(dbPath) || path.basename(dbPath) !== 'db.json') {
  throw new Error('Only explicit local preview import: LOCAL_PREVIEW=1 tsx scripts/import-local-archive.ts /absolute/local/path/db.json');
}
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
if (!Array.isArray(db.prompts)) throw new Error('Expected existing local JSON prompt database');
const backupDir = path.join(path.dirname(dbPath), '.private', 'archive-backups');
fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
const backup = path.join(backupDir, `before-use-cases-${Date.now()}.json`);
fs.copyFileSync(dbPath, backup); fs.chmodSync(backup, 0o600);
const mapping: Record<string, string> = {
  svmtsa2bj: 'product-image', v3y6myxnu: 'learning-plan', jug7c7nf5: 'product-script',
  oxvnvtc7f: 'content-calendar', '7hhsjazg1': 'reference-portrait',
};
let reclassified = 0;
db.prompts = db.prompts.map((item: any) => {
  const useCase = item.useCase || mapping[item.id];
  if (!item.useCase && useCase) reclassified++;
  return normalizeArchivePrompt({ ...item, ...(useCase ? { useCase } : {}), resourceType: item.resourceType || 'prompt' });
});
let added = 0;
for (const prompt of demoPrompts) {
  if (!db.prompts.some((item: any) => item.id === prompt.id)) { db.prompts.push(prompt); added++; }
}
db.taxonomies ||= [];
for (const [type, slug, titleFa, titleEn] of [
  ['tool','codex','Codex','Codex'], ['tool','deepseek','دیپ‌سیک (DeepSeek)','DeepSeek'], ['domain','jewelry','جواهرات','Jewelry'], ['domain','design','طراحی رابط و گرافیک','Design'],
  ['outputFormat','code','کد و پروژه','Code'], ['outputFormat','report','گزارش','Report'], ['outputFormat','chart','نمودار','Chart'],
]) {
  if (!db.taxonomies.some((item: any) => item.type === type && item.slug === slug)) db.taxonomies.push({ id: `local-${type}-${slug}`, type, slug, titleFa, titleEn, aliases: [], synonyms: [], status: 'active', popularity: 0.5, usageCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
}
const temp = dbPath + '.archive-import.tmp';
fs.writeFileSync(temp, JSON.stringify(db, null, 2), { mode: 0o600 }); fs.renameSync(temp, dbPath);
console.log(JSON.stringify({ added, reclassified, total: db.prompts.length, backup }));
