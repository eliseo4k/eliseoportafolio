/* _lib.js — utilidades compartidas de las funciones de Vercel (el guion bajo evita que sea una ruta pública).
   Variables de entorno necesarias en Vercel:
     ADMIN_PASSWORD  contraseña del admin
     GITHUB_TOKEN    token de GitHub con permiso "Contents: Read and write" SOLO para este repositorio
     GITHUB_REPO     usuario/repositorio, por ejemplo eliseo4k/eliseoportafolio
     GITHUB_BRANCH   (opcional) rama, por defecto main */
import { createHmac, createHash, timingSafeEqual } from 'node:crypto';

const TTL = 1000 * 60 * 60 * 8;
const secret = () => `ejrm|${process.env.ADMIN_PASSWORD || ''}|${process.env.GITHUB_TOKEN || ''}`;
const sha = (s) => createHash('sha256').update(String(s)).digest();

export const passwordOk = (given) => !!process.env.ADMIN_PASSWORD && timingSafeEqual(sha(given), sha(process.env.ADMIN_PASSWORD));

export function sign() {
  const p = Buffer.from(JSON.stringify({ exp: Date.now() + TTL })).toString('base64url');
  return `${p}.${createHmac('sha256', secret()).update(p).digest('base64url')}`;
}
export function verify(token = '') {
  const [p, s] = String(token).split('.');
  if (!p || !s || !process.env.ADMIN_PASSWORD) return false;
  const good = createHmac('sha256', secret()).update(p).digest('base64url');
  if (s.length !== good.length || !timingSafeEqual(Buffer.from(s), Buffer.from(good))) return false;
  try { return JSON.parse(Buffer.from(p, 'base64url').toString()).exp > Date.now(); } catch { return false; }
}
export const authed = (req) => verify((req.headers.authorization || '').replace(/^Bearer\s+/i, ''));

export const json = (res, code, obj) => { res.setHeader('Cache-Control', 'no-store'); res.status(code).json(obj); };
export const readBody = (req) => (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {});

/** Crea o actualiza un archivo del repositorio (esto dispara el despliegue de Vercel). */
export async function putFile(filePath, buffer, message) {
  const token = process.env.GITHUB_TOKEN, repo = process.env.GITHUB_REPO, branch = process.env.GITHUB_BRANCH || 'main';
  if (!token || !repo) throw new Error('Faltan GITHUB_TOKEN o GITHUB_REPO en las variables de entorno de Vercel');
  const url = `https://api.github.com/repos/${repo}/contents/${filePath.split('/').map(encodeURIComponent).join('/')}`;
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'portafolio-admin' };
  let sha;
  const cur = await fetch(`${url}?ref=${encodeURIComponent(branch)}`, { headers });
  if (cur.ok) sha = (await cur.json()).sha;
  else if (cur.status !== 404) throw new Error(`GitHub respondió ${cur.status} al leer el archivo (revisa el token y el nombre del repositorio)`);
  const put = await fetch(url, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: buffer.toString('base64'), branch, ...(sha ? { sha } : {}) }) });
  if (!put.ok) throw new Error(`GitHub respondió ${put.status} al guardar (el token necesita permiso Contents: Read and write)`);
}
