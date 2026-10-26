import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import type { Express, RequestHandler } from 'express';
import type multer from 'multer';
import type { IPromptRepository } from './repositories/IPromptRepository';
export async function encodeMedia(buffer: Buffer) {
    const text = buffer.toString('utf8');
    const svg = /<(?:[\w.-]+:)?svg\b/i.test(text);
    if (svg && (/@import|<!DOCTYPE|<!ENTITY|<\?xml-stylesheet|<(?:[\w.-]+:)?(?:script|foreignObject|image|use)\b|\son[\w:-]+\s*=/i.test(text) || /\b(?:href|src)\s*=/i.test(text) || Array.from(text.matchAll(/url\(([^)]*)\)/gi)).some(([, v]) => !v.trim().replace(/^["']|["']$/g, '').startsWith('#'))))
        throw new Error('SVG باید مستقل و بدون اسکریپت یا منابع خارجی باشد.');
    const image = sharp(buffer, { limitInputPixels: 25000000 });
    const m = await image.metadata();
    if (!['png', 'jpeg', 'webp', 'svg'].includes(m.format || '') || !m.width || !m.height || m.width > 8000 || m.height > 8000 || (m.pages || 1) > 1)
        throw new Error('تصویر معتبر PNG، JPEG، WebP یا SVG تا ابعاد ۸۰۰۰ لازم است.');
    return image.resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: m.format !== 'svg' }).webp({ quality: 88 }).toBuffer();
}
export function registerMediaLibrary(app: Express, manager: RequestHandler, upload: ReturnType<typeof multer>, repo: IPromptRepository, settings: () => any, extraReferences:()=>Promise<{url:string;public:boolean;label:string}[]> = async()=>[]) {
    const root = path.join(process.cwd(), 'dl');
    const clean = (url: string) => url.split('?')[0];
    async function inventory() {
        const prompts = (await repo.getAll()).prompts;
        const s = settings();
        const refs = prompts.flatMap(p => [p.coverImage, p.sampleImage, ...(p.mediaGallery || [])].filter((url): url is string => typeof url === 'string' && !!url).map(url => ({ url: clean(url), public: p.isActive, label:p.title })));
        if (typeof s.siteLogo === 'string' && s.siteLogo)
            refs.push({ url: clean(s.siteLogo), public: true, label:'لوگوی سایت' });
        for (const chip of Array.isArray(s.homepageChips) ? s.homepageChips : [])
            if (typeof chip.icon === 'string' && chip.icon)
                refs.push({ url: clean(chip.icon), public: !!chip.enabled, label:chip.title||'سناریوی هوم‌پیج' });
        refs.push(...(await extraReferences()).map(ref=>({...ref,url:clean(ref.url)})));
        const items: {
            url: string;
            name: string;
            bytes: number;
            createdAt: string;
            uses: number;
            public: boolean;
        }[] = [];
        function walk(dir: string) {
            if (!fs.existsSync(dir))
                return;
            for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                const file = path.join(dir, entry.name);
                if (entry.isSymbolicLink())
                    continue;
                if (entry.isDirectory())
                    walk(file);
                else if (entry.isFile() && /\.(?:webp|png|jpe?g)$/i.test(entry.name) && !entry.name.startsWith('thumbnail-')) {
                    const url = '/dl/' + path.relative(root, file).split(path.sep).join('/');
                    if (!/^\/dl\/(?:library\/[a-zA-Z0-9_-]+\.webp|brand\/logo\.webp|prompts\/[a-zA-Z0-9_-]{1,80}\/[a-zA-Z0-9_-]+\.webp)$/.test(url))
                        continue;
                    const stat = fs.statSync(file);
                    const usage = refs.filter(x => x.url === url);
                    items.push({ url, name: usage.map(x=>x.label).filter(Boolean).slice(0,2).join('، ')||entry.name, bytes: stat.size, createdAt: stat.mtime.toISOString(), uses: usage.length, public: usage.some(x => x.public) });
                }
            }
        }
        walk(root);
        return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    async function store(buffer: Buffer) { const dir = path.join(root, 'library'); await fs.promises.mkdir(dir, { recursive: true }); const name = crypto.randomUUID() + '.webp'; await fs.promises.writeFile(path.join(dir, name), buffer); return '/dl/library/' + name; }
    app.get('/api/admin/media', manager, async (_req, res) => { try {
        res.json({ success: true, items: await inventory() });
    }
    catch {
        res.status(503).json({ success: false, message: 'دریافت رسانه‌ها انجام نشد.' });
    } });
    app.get('/api/admin/media/file', manager, async (req, res) => { try {
        const item = (await inventory()).find(x => x.url === String(req.query.url));
        if (!item)
            return res.status(404).end();
        res.set('Cache-Control', 'private, no-store').sendFile(path.join(process.cwd(), item.url.slice(1)));
    }
    catch {
        res.status(503).end();
    } });
    app.post('/api/admin/media', manager, upload.single('file'), async (req, res) => { try {
        if (!req.file)
            return res.status(400).json({ success: false, message: 'یک تصویر انتخاب کنید.' });
        const url = await store(await encodeMedia(req.file.buffer));
        res.json({ success: true, url });
    }
    catch {
        res.status(400).json({ success: false, message: 'تصویر مجاز و مستقل PNG، JPEG، WebP یا SVG لازم است (حداکثر ۵ مگابایت).' });
    } });
    app.post('/api/admin/media/reuse', manager, async (req, res) => { try {
        const item = (await inventory()).find(x => x.url === req.body.url);
        if (!item)
            return res.status(404).json({ success: false, message: 'رسانه پیدا نشد.' });
        const url = item.url.startsWith('/dl/library/') ? item.url : await store(await fs.promises.readFile(path.join(process.cwd(), item.url.slice(1))));
        res.json({ success: true, url });
    }
    catch {
        res.status(503).json({ success: false, message: 'انتخاب رسانه انجام نشد.' });
    } });
    app.delete('/api/admin/media', manager, async (req, res) => { try {
        const item = (await inventory()).find(x => x.url === req.query.url);
        if (!item)
            return res.status(404).json({ success: false });
        if (item.uses || item.url === '/dl/brand/logo.webp')
            return res.status(409).json({ success: false, message: 'این رسانه در محتوای سایت استفاده می‌شود؛ ابتدا آن را از محل‌های استفاده بردارید.' });
        const trash = path.join(process.cwd(), '.private', 'media-trash');
        await fs.promises.mkdir(trash, { recursive: true, mode: 0o700 });
        await fs.promises.rename(path.join(process.cwd(), item.url.slice(1)), path.join(trash, crypto.randomUUID() + '.webp'));
        res.json({ success: true });
    }
    catch {
        res.status(503).json({ success: false, message: 'حذف رسانه انجام نشد.' });
    } });
    return { store, inventory };
}
