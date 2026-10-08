import { Router } from 'express';
import { Contact, Label, Reminder, Settings, Transaction, appSettings } from '../db.js';
import * as v from '../validate.js';

const { today } = v;

const router = Router();

const settingsOut = (s) => ({
  commission_percent: s.commissionRate / 100,
  min_commission: (s.minCommission ?? 0) / 100,
  slabs: (s.slabs ?? []).map((x) => ({ up_to: x.upTo == null ? null : x.upTo / 100, percent: x.rate / 100 })),
});

const percentOf = (raw, field) => {
  const text = String(raw ?? '').replace('%', '').trim();
  const n = Number(text);
  if (!text || !Number.isFinite(n) || n < 0 || n > 100) throw v.badRequest('Commission must be a number from 0 to 100.', { field });
  return Math.round(n * 100);
};

router.get('/', async (req, res) => {
  res.json(settingsOut(await appSettings()));
});

// Any of: commission_percent, min_commission (rupees), slabs [{ up_to (rupees or null), percent }].
router.put('/', async (req, res) => {
  const body = req.body ?? {};
  const update = {};
  if ('commission_percent' in body) update.commissionRate = percentOf(body.commission_percent, 'commission_percent');
  if ('min_commission' in body) {
    const raw = String(body.min_commission ?? '').replace(/[,₹\s]/g, '');
    const n = raw === '' ? 0 : Number(raw);
    if (!Number.isFinite(n) || n < 0) throw v.badRequest('Minimum commission can’t be negative.', { field: 'min_commission' });
    update.minCommission = Math.round(n * 100);
  }
  if ('slabs' in body) {
    if (!Array.isArray(body.slabs) || body.slabs.length > 10) throw v.badRequest('Use up to 10 slabs.', { field: 'slabs' });
    let last = 0;
    update.slabs = body.slabs.map((x, i) => {
      const isLast = i === body.slabs.length - 1;
      const raw = x?.up_to == null || x.up_to === '' ? null : Number(String(x.up_to).replace(/[,₹\s]/g, ''));
      if (raw == null && !isLast) throw v.badRequest('Only the last slab can be “and above”.', { field: 'slabs' });
      if (raw != null && (!Number.isFinite(raw) || raw <= 0)) throw v.badRequest('Each slab needs an amount above ₹0.', { field: 'slabs' });
      const upTo = raw == null ? null : Math.round(raw * 100);
      if (upTo != null && upTo <= last) throw v.badRequest('Slab amounts must go up, each higher than the one before.', { field: 'slabs' });
      last = upTo ?? last;
      return { upTo, rate: percentOf(x?.percent, 'slabs') };
    });
  }
  const saved = await Settings.findByIdAndUpdate('app', update, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
  res.json(settingsOut(saved));
});

router.get('/backup', async (req, res) => {
  const [contacts, labels, transactions, reminders, settings] = await Promise.all([
    Contact.find().sort({ _id: 1 }).lean(),
    Label.find().sort({ _id: 1 }).lean(),
    Transaction.find().sort({ _id: 1 }).lean(),
    Reminder.find().sort({ _id: 1 }).lean(),
    appSettings(),
  ]);
  res.setHeader('Content-Disposition', `attachment; filename="manish-associates-backup-${today()}.json"`);
  res.json({ app: 'manish-associates', exportedAt: new Date().toISOString(), contacts, labels, transactions, reminders, settings });
});

export default router;
