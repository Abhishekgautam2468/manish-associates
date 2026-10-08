import { createHmac, randomInt } from 'node:crypto';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { MIN_PASSWORD_LENGTH, getAdmin, setPassword, verifyPassword } from './admin.js';
import { sendOtpEmail } from './mailer.js';
import {
  clearSessionCookie,
  randomId,
  readToken,
  requireAuth,
  safeEqual,
  setSessionCookie,
  signToken,
} from './session.js';

const OTP_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_SECONDS = 60;
const RESET_MINUTES = 10;
const MAX_PASSWORD_LENGTH = 128;

// Only one account, so a single pending code and reset are enough. Kept in
// memory on purpose: a server restart cancels any reset in progress.
let pendingOtp = null;
let pendingReset = null;

const limiter = (limit, minutes, error) =>
  rateLimit({
    windowMs: minutes * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error },
  });

const loginLimiter = limiter(10, 15, 'Too many sign-in attempts. Try again in 15 minutes.');
const forgotLimiter = limiter(5, 60, 'Too many code requests. Try again in an hour.');
const verifyLimiter = limiter(15, 15, 'Too many attempts. Try again in 15 minutes.');

const normalise = (value) => String(value ?? '').trim().toLowerCase();
const hashCode = (code) =>
  createHmac('sha256', process.env.SESSION_SECRET).update(`otp:${code}`).digest('base64url');

export const authRouter = Router();

authRouter.post('/login', loginLimiter, async (req, res) => {
  const admin = getAdmin();
  const identifier = normalise(req.body?.identifier);
  const password = String(req.body?.password ?? '');

  const knownUser = identifier === admin.username || identifier === admin.email;
  // Always check the hash so a wrong username takes as long as a wrong password.
  const passwordOk = await verifyPassword(password, admin.passwordHash);

  if (!knownUser || !passwordOk) {
    return res.status(401).json({ error: 'Username or password is incorrect.' });
  }

  setSessionCookie(res, admin);
  res.json({ username: admin.username, email: admin.email });
});

authRouter.post('/logout', (req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ username: req.admin.username, email: req.admin.email });
});

authRouter.post('/change-password', requireAuth, loginLimiter, async (req, res) => {
  const current = String(req.body?.currentPassword ?? '');
  const password = String(req.body?.password ?? '');
  if (!(await verifyPassword(current, req.admin.passwordHash))) {
    return res.status(400).json({ error: 'Your current password is incorrect.', field: 'currentPassword' });
  }
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return res
      .status(400)
      .json({ error: `Use between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`, field: 'password' });
  }
  await setPassword(password);
  setSessionCookie(res, getAdmin());
  res.json({ message: 'Password changed' });
});

authRouter.post('/forgot-password', forgotLimiter, async (req, res, next) => {
  const admin = getAdmin();
  const email = normalise(req.body?.email);
  // Same reply whether or not the email matches, so the account email can't be guessed.
  const reply = () =>
    res.json({
      message: 'If that email belongs to the account, a code is on its way.',
      expiresInMinutes: OTP_MINUTES,
      resendAfterSeconds: OTP_RESEND_SECONDS,
    });

  if (email !== admin.email) return reply();
  if (pendingOtp && Date.now() - pendingOtp.sentAt < OTP_RESEND_SECONDS * 1000) return reply();

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  try {
    await sendOtpEmail(admin.email, code, OTP_MINUTES);
  } catch (err) {
    return next(err);
  }

  pendingOtp = {
    hash: hashCode(code),
    expiresAt: Date.now() + OTP_MINUTES * 60 * 1000,
    sentAt: Date.now(),
    attempts: 0,
  };
  pendingReset = null;
  reply();
});

authRouter.post('/verify-otp', verifyLimiter, (req, res) => {
  const admin = getAdmin();
  const email = normalise(req.body?.email);
  const code = String(req.body?.code ?? '').replace(/\s/g, '');
  const invalid = () =>
    res.status(400).json({ error: 'That code is wrong or has expired. Check the email or request a new code.' });

  if (!pendingOtp || email !== admin.email || Date.now() > pendingOtp.expiresAt) {
    pendingOtp = pendingOtp && Date.now() > pendingOtp.expiresAt ? null : pendingOtp;
    return invalid();
  }

  if (!/^\d{6}$/.test(code) || !safeEqual(hashCode(code), pendingOtp.hash)) {
    pendingOtp.attempts += 1;
    if (pendingOtp.attempts >= OTP_MAX_ATTEMPTS) {
      pendingOtp = null;
      return res
        .status(400)
        .json({ error: 'Too many wrong codes. Request a new code to try again.', codeCancelled: true });
    }
    return invalid();
  }

  pendingOtp = null;
  pendingReset = { nonce: randomId(), expiresAt: Date.now() + RESET_MINUTES * 60 * 1000 };
  const resetToken = signToken({ typ: 'reset', n: pendingReset.nonce, exp: pendingReset.expiresAt });
  res.json({ resetToken });
});

authRouter.post('/reset-password', verifyLimiter, async (req, res) => {
  const token = readToken(req.body?.resetToken);
  const password = String(req.body?.password ?? '');

  const valid =
    token?.typ === 'reset' &&
    pendingReset &&
    Date.now() < pendingReset.expiresAt &&
    safeEqual(token.n, pendingReset.nonce);

  if (!valid) {
    return res.status(400).json({ error: 'This reset has expired. Start again to get a new code.', restart: true });
  }
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return res
      .status(400)
      .json({ error: `Use between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.` });
  }

  pendingReset = null;
  await setPassword(password);
  const admin = getAdmin();
  setSessionCookie(res, admin);
  res.json({ username: admin.username, email: admin.email });
});
