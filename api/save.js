import { json, readBody, authed, putFile } from './_lib.js';
export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método no permitido' });
  if (!authed(req)) return json(res, 401, { error: 'Sesión no válida' });
  try {
    const body = readBody(req);
    if (!body.settings || !Array.isArray(body.projects)) return json(res, 400, { error: 'content.json incompleto' });
    await putFile('data/content.json', Buffer.from(JSON.stringify(body, null, 2) + '\n'), 'Actualizar contenido desde el admin');
    json(res, 200, { ok: true, deploying: true });
  } catch (err) { json(res, 500, { error: err.message }); }
}
