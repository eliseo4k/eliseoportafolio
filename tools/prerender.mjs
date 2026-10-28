#!/usr/bin/env node
/* ============================================================
   prerender.mjs — genera el HTML estático desde data/content.json
   Uso:  node tools/prerender.mjs
   Crea: index.html (ES), en/index.html (EN), sitemap.xml, robots.txt, site.webmanifest
   Así Google ve todo el contenido sin necesidad de ejecutar JavaScript.
   ============================================================ */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { fileSize } from './imgsize.mjs';
import { renderHeader, renderMain, renderFooter, renderSeo, renderJsonLd, hashText, UI, tr } from '../js/render.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function build(root = ROOT, { quiet = false } = {}) {
  const raw = await readFile(path.join(root, 'data/content.json'), 'utf8');
  const d = JSON.parse(raw);
  // Tamaño real de cada portada: evita saltos de diseño en la cuadrícula tipo Pinterest
  for (const p of d.projects || []) {
    if (p.cover) { const sz = await fileSize(path.join(root, p.cover)); if (sz) p.coverSize = sz; }
  }
  const tpl = await readFile(path.join(root, 'templates/page.html'), 'utf8');
  const hash = hashText(raw);
  const base = d.settings.siteUrl.replace(/\/$/, '');
  const today = new Date().toISOString().slice(0, 10);

  const pages = [{ lang: 'es', out: 'index.html', rootPath: '' }, { lang: 'en', out: 'en/index.html', rootPath: '../' }];
  for (const p of pages) {
    const html = tpl
      .replaceAll('{{lang}}', p.lang)
      .replaceAll('{{root}}', p.rootPath)
      .replaceAll('{{close}}', UI[p.lang].close)
      .replace('{{seo}}', renderSeo(d, p.lang))
      .replace('{{jsonld}}', renderJsonLd(d, p.lang))
      .replace('{{header}}', renderHeader(d, p.lang, p.rootPath))
      .replace('{{main}}', renderMain(d, p.lang, p.rootPath))
      .replace('{{footer}}', renderFooter(d, p.lang))
      .replace('{{hash}}', hash);
    await mkdir(path.dirname(path.join(root, p.out)), { recursive: true });
    await writeFile(path.join(root, p.out), html);
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${base}/</loc>
    <lastmod>${today}</lastmod>
    <xhtml:link rel="alternate" hreflang="es" href="${base}/"/>
    <xhtml:link rel="alternate" hreflang="en" href="${base}/en/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${base}/"/>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${base}/en/</loc>
    <lastmod>${today}</lastmod>
    <xhtml:link rel="alternate" hreflang="es" href="${base}/"/>
    <xhtml:link rel="alternate" hreflang="en" href="${base}/en/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${base}/"/>
    <priority>0.9</priority>
  </url>
</urlset>
`;
  const robots = `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: ${base}/sitemap.xml\n`;
  const manifest = JSON.stringify({
    name: tr(d.seo.title, 'es'), short_name: d.settings.brand, start_url: '/', display: 'standalone',
    background_color: '#07071a', theme_color: '#07071a', lang: 'es',
    icons: [{ src: 'assets/img/icon-192.png', sizes: '192x192', type: 'image/png' }]
  }, null, 2) + '\n';
  await writeFile(path.join(root, 'sitemap.xml'), sitemap);
  await writeFile(path.join(root, 'robots.txt'), robots);
  await writeFile(path.join(root, 'site.webmanifest'), manifest);

  if (!quiet) {
    console.log('✔ index.html, en/index.html, sitemap.xml, robots.txt y site.webmanifest generados');
    if (/tu-dominio\.com/.test(d.settings.siteUrl)) console.warn('⚠ Cambia "siteUrl" en data/content.json (o desde el admin) por tu dominio real y vuelve a ejecutar.');
  }
  return { hash };
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) build();
