import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';

import {
  createSessionToken,
  filterAuthorizedSchools,
  getAuthorization,
  isAuthConfigured,
  requirePermission,
} from '../api/auth-utils.js';
import { applyRateLimit, requireTrustedJsonRequest } from '../api/security.js';

const createValidSecret = () => randomBytes(32).toString('hex');

function responseMock() {
  return {
    headers: {},
    statusCode: null,
    body: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('authorization policy is default-deny and scopes schools', () => {
  process.env.AUTHORIZATION_POLICY = JSON.stringify({
    'viewer@example.com': { role: 'viewer', schools: [0, 2] },
  });

  assert.equal(getAuthorization('unknown@example.com'), null);
  assert.deepEqual(getAuthorization('VIEWER@example.com').permissions, ['courses:read', 'students:read']);
  process.env.AUTHORIZATION_POLICY = JSON.stringify({
    'operator@example.com': { role: 'operator', schools: [0] },
  });
  assert.equal(getAuthorization('operator@example.com').permissions.includes('plans:generate'), true);
  process.env.AUTHORIZATION_POLICY = JSON.stringify({
    'viewer@example.com': { role: 'viewer', schools: [0, 2] },
  });
  assert.deepEqual(
    filterAuthorizedSchools([{ id: 0 }, { id: 1 }, { id: 2 }], {
      authorization: getAuthorization('viewer@example.com'),
    }),
    [{ id: 0 }, { id: 2 }],
  );
});

test('viewer sessions cannot obtain write permission', async () => {
  process.env.AUTH_SECRET = createValidSecret();
  process.env.GOOGLE_CLIENT_ID = 'client.apps.googleusercontent.com';
  process.env.AUTHORIZATION_POLICY = JSON.stringify({
    'viewer@example.com': { role: 'viewer', schools: [0] },
  });
  const token = await createSessionToken({
    sub: 'google-user-1', email: 'viewer@example.com', name: 'Viewer', picture: null,
  });
  const res = responseMock();
  const user = await requirePermission({ headers: { cookie: `hotscool_session=${token}` } }, res, 'students:write');

  assert.equal(user, null);
  assert.equal(res.statusCode, 403);
});

test('auth configuration rejects missing and documented secrets', () => {
  process.env.GOOGLE_CLIENT_ID = 'client.apps.googleusercontent.com';
  process.env.AUTHORIZATION_POLICY = JSON.stringify({
    'admin@example.com': { role: 'admin', schools: ['*'] },
  });
  process.env.AUTH_SECRET = 'gere-uma-chave-aleatoria-com-pelo-menos-32-caracteres';
  assert.equal(isAuthConfigured(), false);
  process.env.AUTH_SECRET = '';
  assert.equal(isAuthConfigured(), false);
  process.env.AUTH_SECRET = 'abcd'.repeat(8);
  assert.equal(isAuthConfigured(), false);
  process.env.AUTH_SECRET = createValidSecret();
  assert.equal(isAuthConfigured(), true);
});

test('state-changing requests require trusted JSON origins', () => {
  process.env.ALLOWED_ORIGINS = 'https://lms.example.com';
  const accepted = responseMock();
  assert.equal(requireTrustedJsonRequest({ headers: {
    origin: 'https://lms.example.com',
    'content-type': 'application/json; charset=utf-8',
  } }, accepted), true);

  const rejected = responseMock();
  assert.equal(requireTrustedJsonRequest({ headers: {
    origin: 'https://evil.example.com',
    'content-type': 'application/json',
  } }, rejected), false);
  assert.equal(rejected.statusCode, 403);
});

test('rate limiter rejects requests above the configured window limit', () => {
  const req = { headers: {}, socket: { remoteAddress: '127.0.0.1' } };
  assert.equal(applyRateLimit(req, responseMock(), {
    name: 'test-limit', identity: 'user-1', max: 1, windowMs: 60_000,
  }), true);
  const rejected = responseMock();
  assert.equal(applyRateLimit(req, rejected, {
    name: 'test-limit', identity: 'user-1', max: 1, windowMs: 60_000,
  }), false);
  assert.equal(rejected.statusCode, 429);
});
