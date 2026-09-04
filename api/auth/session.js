import { getSession, isAuthConfigured, isEmailAllowed } from '../auth-utils.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  if (!isAuthConfigured()) {
    return res.status(503).json({ error: 'Autenticação ainda não configurada.' });
  }

  res.setHeader('Cache-Control', 'private, no-store');
  const user = await getSession(req);
  if (!user || !isEmailAllowed(user.email)) {
    return res.status(401).json({ authenticated: false });
  }

  return res.status(200).json({ authenticated: true, user });
}
