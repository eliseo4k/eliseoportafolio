import path from 'node:path';
import { json, readBody, authed, putFile } from './_lib.js';
export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método no permitido' });
  if (!authed(req)) return json(res, 401, { error: 'Sesión no válida' });
  try {
    const { name = 'imagen', dataUrl = '' } = readBody(req);
    const m = /^data:image\/(png|jpeg|webp|gif);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
    if (!m) return json(res, 400, { error: 'Formato de imagen no permitido' });
    const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
    const slug = path.parse(String(name)).name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'imagen';
    const rel = `assets/uploads/${slug}-${Date.now().toString(36)}.${ext}`;
    await putFile(rel, Buffer.from(m[2], 'base64'), 'Subir imagen desde el admin');
    json(res, 200, { path: rel, deploying: true });
  } catch (err) { json(res, 500, { error: err.message }); }
}
