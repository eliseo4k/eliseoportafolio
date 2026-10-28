import { json } from './_lib.js';
export default function handler(req, res) { json(res, 200, { ok: true, host: 'vercel' }); }
