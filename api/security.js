const rateLimitBuckets = new Map();

function clientAddress(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.socket?.remoteAddress || 'unknown';
}

export function applyRateLimit(req, res, { name, identity, max, windowMs }) {
  const now = Date.now();
  if (rateLimitBuckets.size > 10_000) {
    for (const [bucketKey, bucketValue] of rateLimitBuckets) {
      if (bucketValue.resetAt <= now) rateLimitBuckets.delete(bucketKey);
    }
  }
  const key = `${name}:${identity || clientAddress(req)}`;
  const current = rateLimitBuckets.get(key);
  const bucket = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + windowMs }
    : current;

  bucket.count += 1;
  rateLimitBuckets.set(key, bucket);
  res.setHeader('X-RateLimit-Limit', String(max));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - bucket.count)));

  if (bucket.count > max) {
    res.setHeader('Retry-After', String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
    res.status(429).json({ error: 'Muitas requisições. Tente novamente mais tarde.' });
    return false;
  }
  return true;
}

export function requireTrustedJsonRequest(req, res) {
  if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
    res.status(415).json({ error: 'Use Content-Type application/json.' });
    return false;
  }

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const origin = req.headers.origin;

  if (allowedOrigins.length === 0) {
    res.status(503).json({ error: 'Origens confiáveis não configuradas.' });
    return false;
  }
  if (!origin || !allowedOrigins.includes(origin)) {
    res.status(403).json({ error: 'Origem não autorizada.' });
    return false;
  }
  return true;
}
