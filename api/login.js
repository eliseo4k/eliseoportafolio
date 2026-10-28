import { json, readBody, passwordOk, sign } from './_lib.js';
export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método no permitido' });
  if (!process.env.ADMIN_PASSWORD) return json(res, 503, { error: 'Falta ADMIN_PASSWORD en las variables de entorno de Vercel' });
  let password = '';
  try { password = String(readBody(req).password || ''); } catch { /* vacío */ }
  if (!passwordOk(password)) { await new Promise((r) => setTimeout(r, 700)); return json(res, 401, { error: 'Contraseña incorrecta' }); }
  json(res, 200, { token: sign() });
}
