import { Router } from 'express';
import { readFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { requireAuth } from '../auth/session.js';
import { Subscriber } from '../db.js';

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Where sign-ups lived before MongoDB; imported once, then renamed.
const LEGACY_FILE = path.resolve(import.meta.dirname, '../../data/subscribers.json');

export async function importLegacySubscribers() {
  let rows;
  try {
    rows = JSON.parse(await readFile(LEGACY_FILE, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return;
    throw err;
  }
  for (const row of rows) {
    await Subscriber.updateOne(
      { email: row.email },
      { $setOnInsert: { email: row.email, subscribedAt: new Date(row.subscribedAt) } },
      { upsert: true },
    );
  }
  await rename(LEGACY_FILE, `${LEGACY_FILE}.imported`);
  console.log(`Moved ${rows.length} website sign-ups from data/subscribers.json into MongoDB`);
}

router.get('/', requireAuth, async (req, res) => {
  const rows = await Subscriber.find().sort({ subscribedAt: -1 }).lean();
  res.json(rows.map((s) => ({ email: s.email, subscribedAt: s.subscribedAt.toISOString() })));
});

router.post('/', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return res.status(400).json({ error: 'Enter an email address like name@example.com.' });
  }

  // Signing up twice is fine; the first date is kept.
  await Subscriber.updateOne({ email }, { $setOnInsert: { email, subscribedAt: new Date() } }, { upsert: true });
  res.status(201).json({ message: 'Saved' });
});

export default router;
