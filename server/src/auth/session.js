import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { getAdmin } from './admin.js';

export const SESSION_COOKIE = 'ma_session';
export const SESSION_DAYS = 7;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error('SESSION_SECRET in server/.env must be at least 32 characters.');
  }
  return value;
}

export function safeEqual(a, b) {
  const bufA = Buffer.from(String(a ?? ''));
  const bufB = Buffer.from(String(b ?? ''));
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export function signToken(data) {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function readToken(token) {
  const [payload, signature] = String(token ?? '').split('.');
  if (!payload || !signature) return null;
  const expected = createHmac('sha256', secret()).update(payload).digest('base64url');
  if (!safeEqual(signature, expected)) return null;
  const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
  return data.exp > Date.now() ? data : null;
}

export function randomId() {
  return randomBytes(16).toString('base64url');
}

function getCookie(req, name) {
  const match = (req.headers.cookie ?? '')
    .split(';')
    .map((part) => part.trim().split('='))
    .find(([key]) => key === name);
  return match ? decodeURIComponent(match.slice(1).join('=')) : undefined;
}

export function setSessionCookie(res, admin) {
  const token = signToken({
    typ: 'session',
    sub: admin.username,
    v: admin.sessionVersion,
    exp: Date.now() + SESSION_DAYS * 864e5,
  });
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_DAYS * 864e5,
    path: '/',
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

export function requireAuth(req, res, next) {
  const session = readToken(getCookie(req, SESSION_COOKIE));
  const admin = getAdmin();
  if (!session || session.typ !== 'session' || session.v !== admin.sessionVersion) {
    return res.status(401).json({ error: 'Sign in to continue.' });
  }
  req.admin = admin;
  next();
}
