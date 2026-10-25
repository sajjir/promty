import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import jwt from 'jsonwebtoken';
import sharp from 'sharp';
import { buildSeo, injectSeo, sitemap } from '../src/server/seo';
import { getHomepageChipsError, normalizeHomepageChips } from '../src/lib/homepageChips';
const rows: any[] = [{ id: 'public', title: 'عکس <script>alert(1)</script>', description: 'نمونه & توضیح', body: 'Preserve {{subject}}. Do not change identity.', bodyFa: 'متن فارسی کامل', isActive: true, useCase: 'vis-09', tools: ['gemini'], domains: ['design'], fieldsSchema: [{ key: 'subject', label: 'سوژه', required: true }], tags: [], updatedAt: '2026-10-25T00:00:00Z' }, { id: 'draft', title: 'PRIVATE DRAFT', body: 'SECRET BODY', isActive: false, useCase: 'vis-06', fieldsSchema: [] }];
const repo: any = { getAll: async () => ({ prompts: rows, totalCount: rows.length }) };
test('SEO sends real 404/noindex, one canonical, escaped visible source and factual CreativeWork without ratings', async () => {
    const result = await buildSeo(repo, '/prompts/public', 'https://promty.ir');
    assert.equal(result.status, 200);
    assert.match(result.content, /Preserve \{\{subject\}\}/);
    assert.match(result.content, /متن فارسی کامل/);
    assert.match(result.content, /سوژه/);
    assert.ok(!result.content.includes('<script>'));
    assert.match(result.head, /CreativeWork/);
    assert.ok(!result.head.includes('aggregateRating'));
    const html = injectSeo('<html><head><title>old</title><meta name="description" content="old"><meta property="og:title" content="old"><link rel="canonical" href="https://old.invalid"></head><body><div id="root"></div></body></html>', result);
    assert.equal((html.match(/<title>/g) || []).length, 1);
    assert.equal((html.match(/name="description"/g) || []).length, 1);
    assert.equal((html.match(/property="og:title"/g) || []).length, 1);
    assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
    for (const url of ['/missing', '/prompts/draft', '/prompts/unknown', '/use-case/unknown', '/use-case/vis-06', '/use-case/vis-09?page=9', '/use-case/vis-09?page=0']) {
        const page = await buildSeo(repo, url, 'https://promty.ir');
        assert.equal(page.status, 404, url);
        assert.match(page.head, /noindex/);
        assert.ok(!page.content.includes('SECRET BODY'));
    }
    const landing = await buildSeo(repo, '/use-case/vis-09', 'https://promty.ir');
    assert.equal(landing.status, 200);
    assert.match(landing.content, /href="\/prompts\/public"/);
    const many = { getAll: async () => ({ prompts: Array.from({ length: 25 }, (_, i) => ({ ...rows[0], id: 'item' + String(i).padStart(2, '0') })), totalCount: 25 }) } as any;
    const second = await buildSeo(many, '/use-case/vis-09?page=2', 'https://promty.ir', 20);
    assert.equal(second.status, 200);
    assert.match(second.content, /item20/);
    assert.ok(!second.content.includes('href="/prompts/item00"'));
    assert.match(second.head, /vis-09\?page=2/);
    const filtered = await buildSeo(repo, '/?q=عکس', 'https://promty.ir');
    assert.match(filtered.head, /noindex/);
    const xml = sitemap(rows, 'https://promty.ir');
    assert.match(xml, /\/use-case\/vis-09/);
    assert.match(xml, /\/tool\/gemini/);
    assert.match(xml, /\/domain\/design/);
    assert.match(xml, /\/prompts\/public/);
    assert.ok(!xml.includes('draft'));
    assert.ok(!xml.includes('vis-06'));
});
test('scenario settings reject unsafe icons, unknown use cases, duplicates and excess slots', () => {
    const valid = normalizeHomepageChips();
    assert.ok(valid.length >= 6);
    assert.equal(getHomepageChipsError(valid), null);
    for (const value of [[...valid, ...valid], [{ ...valid[0], icon: 'javascript:alert(1)' }], [{ ...valid[0], useCase: 'invalid' }], [{ ...valid[0], icon: '/dl/library/../../.env' }]])
        assert.ok(getHomepageChipsError(value));
    assert.deepEqual(normalizeHomepageChips([]), []);
});
test('HTTP SEO and shared media: auth, safe SVG, unpublished privacy, reuse, in-use deletion guard and public icon references', async () => {
    const root = path.resolve('.');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'promty-seo-media-'));
    const port = 13991;
    const secret = 'fixture-secret-'.repeat(5);
    fs.mkdirSync(path.join(dir, 'dist'));
    fs.writeFileSync(path.join(dir, 'dist/index.html'), '<html><head><title>old</title><meta name="description" content="old"><meta property="og:title" content="old"></head><body><div id="root"></div></body></html>');
    const fixtureRows=structuredClone(rows);fixtureRows[1].mediaGallery=['/dl/prompts/draft/gallery-example.webp'];
    fs.mkdirSync(path.join(dir,'dl/prompts/draft'),{recursive:true});
    await sharp({create:{width:16,height:16,channels:4,background:'#7766ee'}}).webp().toFile(path.join(dir,'dl/prompts/draft/gallery-example.webp'));
    fs.writeFileSync(path.join(dir, 'db.json'), JSON.stringify({ prompts: fixtureRows, users: [{ id: 'manager', role: 'ADMIN' }, { id: 'manager2', role: 'ADMIN' }], settings: { homepageSections: undefined }, categories: [], taxonomies: [] }));
    const child = spawn(process.execPath, ['--import', path.join(root, 'node_modules/tsx/dist/loader.mjs'), path.join(root, 'server.ts')], { cwd: dir, env: { ...process.env, DATABASE_URL: '', STORAGE_BACKEND: 'json', NODE_ENV: 'production', LOCAL_PREVIEW: '1', HOST: '127.0.0.1', PORT: String(port), JWT_SECRET: secret, ADMIN_EMAIL: 'fixture@test.invalid', ADMIN_PASSWORD: 'fixture-password-123', APP_ORIGIN: 'https://promty.ir' } });
    let output = '';
    child.stdout.on('data', d => output += d);
    child.stderr.on('data', d => output += d);
    const base = `http://127.0.0.1:${port}`;
    const token = jwt.sign({ id: 'manager', role: 'admin' }, secret);
    const token2 = jwt.sign({ id: 'manager2', role: 'admin' }, secret);
    const headers = { Authorization: `Bearer ${token}` };
    const call = (url: string, init: any = {}) => fetch(base + url, init);
    const jsonPost = (url: string, body: any) => call(url, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    try {
        let ready = false;
        for (let i = 0; i < 100; i++) {
            try {
                if ((await call('/api/config')).ok) {
                    ready = true;
                    break;
                }
            }
            catch { }
            await new Promise(r => setTimeout(r, 50));
        }
        assert.ok(ready, output.slice(-500));
        let response = await call('/sitemap.xml');
        assert.equal(response.status, 200);
        assert.match(response.headers.get('content-type')!, /application\/xml/);
        assert.ok(!(await response.text()).includes('/prompts/draft'));
        response = await call('/robots.txt');
        assert.match(response.headers.get('content-type')!, /text\/plain/);
        assert.match(await response.text(), /Sitemap: https:\/\/promty.ir\/sitemap.xml/);
        for (const route of ['/not-found', '/prompts/draft', '/prompts/absent', '/use-case/unknown']) {
            response = await call(route);
            assert.equal(response.status, 404, route);
            assert.match(response.headers.get('content-type')!, /text\/html/);
            assert.match(await response.text(), /noindex/);
        }
        assert.equal((await call('/prompts/draft', { headers })).status, 404);
        response = await call('/prompts/public');
        const html = await response.text();
        assert.equal(response.status, 200);
        assert.match(html, /Preserve/);
        assert.equal((html.match(/name="description"/g) || []).length, 1);
        assert.equal((await call('/use-case/vis-09')).status, 200);
        assert.equal((await call('/missing.js')).status, 404);
        assert.equal((await call('/api/missing')).status, 404);
        assert.equal((await call('/api/admin/media')).status, 403);
        assert.equal((await call('/dl/prompts/draft/gallery-example.webp')).status,404);
        const reuse=await jsonPost('/api/admin/media/reuse',{url:'/dl/prompts/draft/gallery-example.webp'});assert.equal(reuse.status,200);const reusable=(await reuse.json()).url;assert.match(reusable,/^\/dl\/library\//);assert.equal((await call(reusable)).status,404);assert.equal((await call(reusable,{headers})).status,200);
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="12" fill="purple"/></svg>';
        const upload = (source: string) => { const form = new FormData(); form.append('file', new Blob([source], { type: 'image/svg+xml' }), 'icon.svg'); return call('/api/admin/media', { method: 'POST', headers, body: form }); };
        assert.equal((await upload(svg.replace('</svg>', '<script>alert(1)</script></svg>'))).status, 400);
        assert.equal((await upload(svg.replace('</svg>', '<image href="https://attacker.invalid/a.png"/></svg>'))).status, 400);
        response = await upload(svg);
        assert.equal(response.status, 200);
        const url = (await response.json()).url;
        assert.match(url, /^\/dl\/library\/[\w-]+\.webp$/);
        assert.equal((await call(url)).status, 404);
        assert.equal((await call(url, { headers })).status, 200);
        const list = (await (await call('/api/admin/media', { headers: { Authorization: `Bearer ${token2}` } })).json()).items;
        assert.ok(list.some((x: any) => x.url === url));
        response = await call('/api/admin/media/file?url=' + encodeURIComponent(url), { headers });
        assert.equal(response.status, 200);
        assert.equal((await jsonPost('/api/admin/media/reuse', { url: '/../../etc/passwd' })).status, 404);
        const chip = { id: 'cartoon', title: 'عکس کارتونی', useCase: 'vis-09', tool: 'gemini', icon: url, enabled: true };
        response = await jsonPost('/api/settings', { homepageChips: [chip] });
        assert.equal(response.status, 200);
        assert.deepEqual((await (await call('/api/settings/public')).json()).homepageChips, [chip]);
        assert.equal((await (await call('/api/homepage/chips')).json()).counts.cartoon, 1);
        assert.equal((await call(url)).status, 200);
        assert.equal((await call('/api/admin/media?url=' + encodeURIComponent(url), { method: 'DELETE', headers })).status, 409);
        assert.equal((await jsonPost('/api/settings', { homepageChips: [] })).status, 200);
        assert.equal((await call('/api/admin/media?url=' + encodeURIComponent(url), { method: 'DELETE', headers })).status, 200);
        assert.equal((await call(url, { headers })).status, 404);
        assert.equal(fs.readdirSync(path.join(dir, '.private/media-trash')).length, 1);
        assert.equal((await jsonPost('/api/settings', { homepageChips: [chip] })).status, 400);
    }
    finally {
        child.kill('SIGTERM');
        if (child.exitCode === null)
            await new Promise<void>(resolve => child.once('exit', () => resolve()));
        fs.rmSync(dir, { recursive: true, force: true });
    }
});
