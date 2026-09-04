import { parse, serialize } from 'cookie';
import { jwtVerify, SignJWT } from 'jose';

const COOKIE_NAME = 'hotscool_session';
const SESSION_DURATION_SECONDS = 8 * 60 * 60;

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) return null;
  return new TextEncoder().encode(secret);
}

export function isAuthConfigured() {
  const hasAccessPolicy = Boolean(
    process.env.ALLOWED_EMAIL_DOMAIN?.trim() || process.env.ALLOWED_EMAILS?.trim()
  );
  return Boolean(process.env.GOOGLE_CLIENT_ID && getSecret() && hasAccessPolicy);
}

export function isEmailAllowed(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const allowedEmails = (process.env.ALLOWED_EMAILS || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const allowedDomain = (process.env.ALLOWED_EMAIL_DOMAIN || '').trim().toLowerCase();

  return allowedEmails.includes(normalizedEmail) || (
    allowedDomain && normalizedEmail.endsWith(`@${allowedDomain}`)
  );
}

export async function createSessionToken(user) {
  const secret = getSecret();
  if (!secret) throw new Error('AUTH_SECRET inválido.');

  return new SignJWT({
    email: user.email,
    name: user.name,
    picture: user.picture || null,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.sub)
    .setIssuer('consistem-lms')
    .setAudience('consistem-lms')
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secret);
}

export function setSessionCookie(res, token) {
  res.setHeader('Set-Cookie', serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: Boolean(process.env.VERCEL || process.env.NODE_ENV === 'production'),
    sameSite: 'lax',
    maxAge: SESSION_DURATION_SECONDS,
    path: '/',
  }));
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', serialize(COOKIE_NAME, '', {
    httpOnly: true,
    secure: Boolean(process.env.VERCEL || process.env.NODE_ENV === 'production'),
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  }));
}

export async function getSession(req) {
  const secret = getSecret();
  if (!secret) return null;

  const cookies = parse(req.headers.cookie || '');
  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'consistem-lms',
      audience: 'consistem-lms',
    });
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(req, res) {
  if (!isAuthConfigured()) {
    res.status(503).json({ error: 'Autenticação ainda não configurada.' });
    return null;
  }

  const user = await getSession(req);
  if (!user || !isEmailAllowed(user.email)) {
    clearSessionCookie(res);
    res.status(401).json({ error: 'Sessão inválida ou expirada.' });
    return null;
  }

  return user;
}
