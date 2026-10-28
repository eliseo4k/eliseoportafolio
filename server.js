/* server.js — servidor opcional (sin dependencias) para usar el admin con guardado real.
   Uso:   ADMIN_PASSWORD="tu-clave-larga" node server.js
   Abre:  http://localhost:3000   y   http://localhost:3000/admin/
   Si solo quieres un sitio estático, NO necesitas este archivo. */
import http from 'node:http';
import { readFile, writeFile, mkdir, readdir, unlink } from 'node:fs/promises';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './tools/prerender.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const PASSWORD = process.env.ADMIN_PASSWORD || '';
const tokens = new Map(); // token -> expira
const TTL = 1000 * 60 * 60 * 8;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json'
};
const PRIVATE = ['server.js', 'package.json', 'tools', 'templates', 'node_modules', '.git', 'data/backups'];

const send = (res, code, body, headers = {}) => {
  res.writeHead(code, { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', ...headers });
  res.end(body);
};
const json = (res, code, obj) => send(res, code, JSON.stringify(obj), { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });

function readBody(req, limit = 12 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(new Error('Archivo demasiado grande')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch { reject(new Error('JSON inválido')); } });
    req.on('error', reject);
  });
}

const authed = (req) => {
  const t = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const exp = tokens.get(t);
  if (!exp || exp < Date.now()) { tokens.delete(t); return false; }
  return true;
};
const safeEqual = (a, b) => { const A = Buffer.from(a), B = Buffer.from(b); return A.length === B.length && timingSafeEqual(A, B); };

async function api(req, res, pathname) {
  if (pathname === '/api/ping') return json(res, 200, { ok: true });
  if (req.method !== 'POST') return json(res, 405, { error: 'Método no permitido' });
  try {
    if (pathname === '/api/login') {
      const { password = '' } = await readBody(req, 4096);
      if (!PASSWORD) return json(res, 503, { error: 'El servidor no tiene ADMIN_PASSWORD definida' });
      if (!safeEqual(String(password), PASSWORD)) { await new Promise((r) => setTimeout(r, 700)); return json(res, 401, { error: 'Contraseña incorrecta' }); }
      const t = randomBytes(24).toString('hex'); tokens.set(t, Date.now() + TTL);
      return json(res, 200, { token: t });
    }
    if (!authed(req)) return json(res, 401, { error: 'Sesión no válida' });

    if (pathname === '/api/save') {
      const body = await readBody(req);
      if (!body.settings || !Array.isArray(body.projects)) return json(res, 400, { error: 'content.json incompleto' });
      const file = path.join(ROOT, 'data/content.json');
      await mkdir(path.join(ROOT, 'data/backups'), { recursive: true });
      try { await writeFile(path.join(ROOT, `data/backups/content-${Date.now()}.json`), await readFile(file)); } catch {}
      const old = (await readdir(path.join(ROOT, 'data/backups'))).sort();
      for (const f of old.slice(0, Math.max(0, old.length - 20))) await unlink(path.join(ROOT, 'data/backups', f)).catch(() => {});
      await writeFile(file, JSON.stringify(body, null, 2) + '\n');
      await build(ROOT, { quiet: true });
      return json(res, 200, { ok: true });
    }

    if (pathname === '/api/upload') {
      const { name = 'imagen', dataUrl = '' } = await readBody(req);
      const m = /^data:image\/(png|jpeg|webp|gif);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
      if (!m) return json(res, 400, { error: 'Formato de imagen no permitido' });
      const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
      const slug = path.parse(String(name)).name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'imagen';
      const rel = `assets/uploads/${slug}-${Date.now().toString(36)}.${ext}`;
      await mkdir(path.join(ROOT, 'assets/uploads'), { recursive: true });
      await writeFile(path.join(ROOT, rel), Buffer.from(m[2], 'base64'));
      return json(res, 200, { path: rel });
    }
    return json(res, 404, { error: 'No encontrado' });
  } catch (err) {
    return json(res, 400, { error: err.message });
  }
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { return send(res, 400, 'Bad request'); }
  if (pathname.startsWith('/api/')) return api(req, res, pathname);

  if (pathname.endsWith('/')) pathname += 'index.html';
  const rel = path.normalize(pathname).replace(/^([/\\])+/, '');
  const abs = path.join(ROOT, rel);
  if (!abs.startsWith(ROOT + path.sep) || PRIVATE.some((p) => rel === p || rel.startsWith(p + path.sep) || rel.startsWith(p + '/'))) return send(res, 404, 'No encontrado');
  try {
    const buf = await readFile(abs);
    const ext = path.extname(abs).toLowerCase();
    const cache = ext === '.html' || ext === '.json' ? 'no-cache' : 'public, max-age=3600';
    send(res, 200, buf, { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': cache });
  } catch {
    send(res, 404, 'No encontrado', { 'Content-Type': 'text/plain; charset=utf-8' });
  }
}).listen(PORT, HOST, () => {
  console.log(`Sitio:  http://${HOST}:${PORT}/\nAdmin:  http://${HOST}:${PORT}/admin/`);
  if (!PASSWORD) console.warn('⚠ Falta ADMIN_PASSWORD: podrás ver el admin pero no guardar. Ejemplo: ADMIN_PASSWORD="clave-larga" node server.js');
});
