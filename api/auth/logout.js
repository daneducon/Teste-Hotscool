import { clearSessionCookie } from '../auth-utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  clearSessionCookie(res);
  return res.status(200).json({ ok: true });
}
