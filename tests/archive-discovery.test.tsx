import React from 'react';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import ArchiveDiscovery from '../src/components/ArchiveDiscovery';
import { researchedUseCases, legacyUseCases } from '../src/lib/archiveUseCaseDefinitions';
import { useCases, useCaseGroups, getUseCase, groupAncestors } from '../src/lib/archiveCatalog';
import { demoPrompts } from '../scripts/archive-demo-data';
import { buildArchiveFacets, filterPrompts } from '../src/server/repositories/filterPrompts';

const render = (query: string) => {
  const params = new URLSearchParams(query);
  return renderToStaticMarkup(<ArchiveDiscovery params={params} counts={buildArchiveFacets(demoPrompts, {group:params.getAll('group'),useCase:params.getAll('useCase')}).archiveFacets} onChange={() => {}} />);
};

test('local taxonomy matches all 170 editorial rows, has nine roots, and preserves all existing identifiers', () => {
  const document = fs.readFileSync('docs/لیست کاربردی‌ها.md', 'utf8');
  const section = document.split('\n## ۴.', 2)[1].split('## ۵.', 1)[0];
  const rows = [...section.matchAll(/^\| ((?:BUS|SOC|WRT|VIS|UX|DEV|DAT|EDU|LIF)-\d{2}) \| [^|]+ \| ([^|]+) \|/gm)];
  assert.equal(rows.length,170);
  assert.equal(researchedUseCases.length,170);
  assert.equal(useCaseGroups.filter(group => !group.parent).length,9);
  assert.equal(new Set(useCases.map(item => item.slug)).size,useCases.length);
  for (const [,reference,title] of rows) {
    const item = researchedUseCases.find(item => item.referenceId === reference);
    assert.ok(item,reference);assert.equal(item.title,title.trim());assert.ok(item.expectedResult);
    assert.ok(useCaseGroups.some(group => group.slug === item.group));
  }
  const mapping = document.split('\n## ۶.',2)[1].split('## ۷.',1)[0];
  const oldSlugs = [...mapping.matchAll(/^\| `([^`]+)` \|/gm)].map(match => match[1]);
  assert.equal(oldSlugs.length,23);
  for (const slug of oldSlugs) assert.ok(getUseCase(slug),slug);
  assert.equal(legacyUseCases.length,6);
  assert.ok(legacyUseCases.every(item => item.legacy && (item.referenceIds?.length || 0)>1));
  assert.deepEqual(groupAncestors(getUseCase('product-image')?.group),['product','business']);
});

test('progressive homepage hides the global use-case menu and displays only populated contextual choices', () => {
  const initial = render('');
  assert.ok(!initial.includes('aria-label="کاربرد مشخص"'));
  assert.ok(!initial.includes('aria-label="کاربردهای دسته‌های انتخاب‌شده"'));
  const business = render('group=business');
  assert.ok(business.includes('aria-label="کاربردهای کسب‌وکار و مدیریت"'));
  assert.ok(business.includes('ساخت تصویر محصول'));
  assert.ok(!business.includes('title="شواهد بازار، مسئله‌ها و پرسش‌های باز"')); // No content for BUS-02.
  const both = render('group=business&group=social');
  assert.ok(!both.includes('aria-label="کاربردهای کسب‌وکار و مدیریت"'));
  assert.ok(both.includes('aria-label="کاربردهای سوشال مدیا و جامعه‌سازی"'));
  assert.ok(both.includes('نمایش همه کاربردهای این دسته'));
  assert.ok(both.includes('aria-label="نمایش کاربردهای یک دسته منتخب"'));
  const selected = render('group=data&group=education&group=ux&useCase=ui-review&useCase=ui-building');
  assert.ok(selected.includes('role="radiogroup"'));
  assert.equal((selected.match(/type="radio"/g) || []).length,3);
  assert.equal((selected.match(/class="notification /g) || []).length,1);
  assert.ok(selected.includes('۲ کاربرد انتخاب‌شده'));
  const reversed = render('group=social&group=business');
  assert.ok(reversed.includes('aria-label="کاربردهای کسب‌وکار و مدیریت"'));
  assert.ok(!reversed.includes('aria-label="کاربردهای سوشال مدیا و جامعه‌سازی"'));
  const childLink = render('useCase=product-image');
  assert.ok(childLink.includes('aria-label="کاربردهای کسب‌وکار و مدیریت"'));
  const subgroupLink = render('group=social&group=product');
  assert.ok(subgroupLink.includes('aria-label="کاربردهای کسب‌وکار و مدیریت"'));
  assert.ok(!subgroupLink.includes('aria-label="کاربردهای سوشال مدیا و جامعه‌سازی"'));
  const sourceTypes = ['پرامپت · Prompt','مهارت · Skill','راهنمای ایجنت · Agent Guide'];
  for (const label of sourceTypes) assert.ok(initial.includes(label));
  for (const icon of ['lucide-file-text','lucide-wand-sparkles','lucide-bot']) assert.ok(initial.includes(icon));
});

test('new parents split education and UI from personal growth and media, while legacy filter links remain useful', () => {
  const samples = [...demoPrompts, {...demoPrompts[0],id:'education-fixture',useCase:'learning-plan'}, {...demoPrompts[0],id:'media-fixture',useCase:'reference-portrait'}];
  const ids = (group: string) => filterPrompts(samples,{group}).map(prompt => prompt.id);
  assert.ok(ids('education').includes('education-fixture'));
  assert.ok(!ids('personal').includes('education-fixture'));
  assert.ok(ids('ux').includes('demo-accessibility-skill'));
  assert.ok(!ids('visual').includes('demo-accessibility-skill'));
  assert.deepEqual(new Set(ids('design')),new Set([...ids('ux'),...ids('visual')]));
  assert.deepEqual(ids('content'),ids('publishing'));
});
