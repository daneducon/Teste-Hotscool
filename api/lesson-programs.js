import { requirePermission } from './auth-utils.js';
import { applyRateLimit } from './security.js';

const CATALOG_URL = 'https://raw.githubusercontent.com/daneducon/gerador-plano-aula/bbff949d04aee885b589722fb4d26d5e17bbfd73/src/data/cod_programas.json';
let cachedPrograms;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  const user = await requirePermission(req, res, 'courses:read');
  if (!user) return;
  if (!applyRateLimit(req, res, {
    name: 'lesson-programs', identity: user.id, max: 10, windowMs: 60 * 60 * 1000,
  })) return;

  try {
    if (!cachedPrograms) {
      const response = await fetch(CATALOG_URL, { signal: AbortSignal.timeout(15_000) });
      if (!response.ok) throw new Error('catalog unavailable');
      const catalog = await response.json();
      if (!Array.isArray(catalog) || catalog.length > 50_000) throw new Error('invalid catalog');
      cachedPrograms = catalog.flatMap((program) => {
        const code = typeof program.Código === 'string' ? program.Código.trim() : '';
        const name = typeof program.Nome === 'string' ? program.Nome.trim() : '';
        return code && name ? [{ code, name }] : [];
      });
    }
    res.setHeader('Cache-Control', 'private, max-age=3600');
    return res.status(200).json({ programs: cachedPrograms });
  } catch {
    return res.status(502).json({ error: 'Catálogo de programas temporariamente indisponível.' });
  }
}
