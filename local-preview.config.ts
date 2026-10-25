import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';
import { injectSeo } from './src/server/seo';

export default defineConfig({
  cacheDir: 'node_modules/.vite-local-preview',
  plugins: [react(), tailwindcss(), {
    name: 'local-server-html',
    configureServer(server) {
      // Keep HMR while using the same published-content renderer as production.
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '/';
        const pathname = url.split('?')[0];
        if (!['GET','HEAD'].includes(req.method || '') || pathname.includes('.') || /^\/(?:@|src(?:\/|$)|node_modules(?:\/|$)|api(?:\/|$)|dl(?:\/|$)|assets(?:\/|$))/.test(pathname)) return next();
        try {
          const response = await fetch('http://127.0.0.1:3005/api/seo?path=' + encodeURIComponent(url));
          if (!response.ok) throw new Error('Local renderer unavailable');
          const page = await response.json();
          const template = fs.readFileSync(path.join(server.config.root, 'index.html'), 'utf8');
          const html = await server.transformIndexHtml(url, injectSeo(template, page));
          res.statusCode = page.status;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.end(html);
        } catch { res.statusCode = 503; res.end('Local preview is starting. Please reload.'); }
      });
    },
  }],
  server: { host: '127.0.0.1', port: 5173, strictPort: true, proxy: {
    '/sitemap.xml': 'http://127.0.0.1:3005', '/robots.txt': 'http://127.0.0.1:3005',
    '/api': 'http://127.0.0.1:3005', '/dl': 'http://127.0.0.1:3005',
  } },
});
