import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { readFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { Admin } from '../db.js';

const scrypt = promisify(scryptCb);
// Where the account lived before MongoDB; imported once, then renamed.
const LEGACY_FILE = path.resolve(import.meta.dirname, '../../data/admin.json');
export const MIN_PASSWORD_LENGTH = 8;

// Cached copy, so every request doesn't need a database read to check the session.
let admin = null;

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export async function verifyPassword(password, stored) {
  const [, salt, hash] = stored.split('$');
  const expected = Buffer.from(hash, 'base64');
  const actual = await scrypt(String(password), Buffer.from(salt, 'base64'), expected.length);
  return timingSafeEqual(actual, expected);
}

async function importLegacyFile() {
  try {
    const legacy = JSON.parse(await readFile(LEGACY_FILE, 'utf8'));
    await Admin.create({
      username: legacy.username,
      email: legacy.email,
      passwordHash: legacy.passwordHash,
      sessionVersion: legacy.sessionVersion ?? 1,
    });
    await rename(LEGACY_FILE, `${LEGACY_FILE}.imported`);
    console.log(`Moved admin account "${legacy.username}" from data/admin.json into MongoDB`);
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') return false;
    throw err;
  }
}

// Loads the admin account. On first run it comes from the old admin.json, or from .env.
export async function loadAdmin() {
  admin = await Admin.findById('admin').lean();
  if (admin) return;

  if (await importLegacyFile()) {
    admin = await Admin.findById('admin').lean();
    return;
  }

  const { ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_USERNAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('Set ADMIN_USERNAME, ADMIN_EMAIL and ADMIN_PASSWORD in server/.env to create the admin account.');
  }
  if (ADMIN_PASSWORD.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  await Admin.create({
    username: ADMIN_USERNAME.trim().toLowerCase(),
    email: ADMIN_EMAIL.trim().toLowerCase(),
    passwordHash: await hashPassword(ADMIN_PASSWORD),
  });
  admin = await Admin.findById('admin').lean();
  console.log(`Created admin account "${admin.username}" in MongoDB`);
}

export function getAdmin() {
  return admin;
}

export async function setPassword(password) {
  admin = await Admin.findByIdAndUpdate(
    'admin',
    { passwordHash: await hashPassword(password), $inc: { sessionVersion: 1 } }, // signs out every existing session
    { returnDocument: 'after', lean: true },
  );
}
