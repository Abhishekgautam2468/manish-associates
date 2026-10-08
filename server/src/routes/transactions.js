import { Router } from 'express';
import mongoose from 'mongoose';
import { Contact, Label, Reminder, Revision, Transaction, appSettings, commissionFor } from '../db.js';
import { aggregates, decorateTransactions, transactionOut } from '../serialize.js';
import * as v from '../validate.js';

const router = Router();
const { cashIn, cashOut, commission } = aggregates;
const oid = (id) => new mongoose.Types.ObjectId(id);
const TYPES = ['in', 'out', 'transfer', 'adjust'];

async function buildFilter(query) {
  const and = [];
  const q = v.text(query.q, { max: 80 });
  if (q) {
    const pattern = new RegExp(v.escapeRegex(q), 'i');
    const [contactIds, labelIds] = await Promise.all([
      Contact.find({ name: pattern }).distinct('_id'),
      Label.find({ name: pattern }).distinct('_id'),
    ]);
    and.push({
      $or: [
        { contact: { $in: contactIds } },
        { toContact: { $in: contactIds } },
        { label: { $in: labelIds } },
        { note: pattern },
        { toName: pattern },
        { toAccount: pattern },
      ],
    });
  }
  if (query.type) and.push({ type: v.oneOf(query.type, TYPES, 'Type') });
  // A person's entries include transfers sent to them on someone else's behalf.
  if (query.contact_id) {
    const id = oid(v.id(query.contact_id, 'person'));
    and.push({ $or: [{ contact: id }, { toContact: id }] });
  }
  if (query.from || query.to) {
    const date = {};
    if (query.from) date.$gte = v.date(query.from, 'From date');
    if (query.to) date.$lte = v.date(query.to, 'To date');
    and.push({ date });
  }
  if (query.mode) and.push({ mode: v.oneOf(query.mode, v.MODES, 'Payment mode') });
  if (query.label_id === 'none') and.push({ label: null });
  else if (query.label_id) and.push({ label: oid(v.id(query.label_id, 'label')) });
  return and.length ? { $and: and } : {};
}

async function personOrNull(value, field, label = 'Person') {
  if (!value) return null;
  const id = v.id(value, field);
  if (!(await Contact.exists({ _id: id }))) throw v.notFound(label);
  return id;
}

// Commission in paise from a rate in basis points (100 = 1%), rounded to the rupee.

async function readBody(body) {
  const type = v.oneOf(body?.type, TYPES, 'Type');
  const labelId = body?.label_id ? v.id(body.label_id, 'label') : null;
  if (labelId && !(await Label.exists({ _id: labelId }))) throw v.notFound('Label');
  const base = {
    type,
    date: v.date(body?.date),
    mode: v.oneOf(body?.mode || 'cash', v.MODES, 'Payment mode'),
    label: labelId,
    note: v.text(body?.note, { max: 1000 }),
    contact: await personOrNull(body?.contact_id, 'person'),
    account: true,
    direction: null,
    received: 0,
    commission: 0,
    commissionRate: null,
    payee: 'other',
    paidMode: null,
    toContact: null,
    toName: '',
    toAccount: '',
  };

  if (type === 'in' || type === 'out') {
    return { ...base, amount: v.amount(body?.amount), account: body?.account !== false };
  }

  if (type === 'adjust') {
    if (!base.contact) throw v.badRequest('Choose whose balance this is.', { field: 'contact_id' });
    return {
      ...base,
      amount: v.amount(body?.amount),
      direction: v.oneOf(body?.direction, ['owes_you', 'you_owe'], 'Direction'),
      mode: 'other',
    };
  }

  // Transfer: money from one person (received, may be nothing yet) sent on to someone else.
  const sent = v.amount(body?.amount, 'Amount to send');
  const received = body?.received ? v.amount(body.received, 'Amount received') : 0;
  const payee = body?.payee === 'self' ? 'self' : 'other';
  const toContact = payee === 'self' ? null : await personOrNull(body?.to_contact_id, 'receiver', 'Receiver');
  const toName = payee === 'self' ? '' : v.text(body?.to_name, { max: 120 });
  if (payee === 'other' && !toContact && !toName) throw v.badRequest('Choose or type who the money goes to.', { field: 'to' });
  if (toContact && String(toContact) === String(base.contact)) {
    throw v.badRequest('The money can’t be sent to the same person it came from.', { field: 'to' });
  }
  // Commission rate: as sent, else the label's own rate, else the default from Settings.
  const settings = await appSettings();
  const label = labelId ? await Label.findById(labelId, { commissionPercent: 1 }).lean() : null;
  // A fixed rate (sent with the entry, or the label's own); without one, the Settings slabs decide.
  const fixedRate =
    body?.commission_rate != null && body.commission_rate !== ''
      ? Math.round(Number(body.commission_rate) * 100)
      : label?.commissionPercent != null
        ? Math.round(label.commissionPercent * 100)
        : null;
  if (fixedRate != null && (!Number.isFinite(fixedRate) || fixedRate < 0 || fixedRate > 10000)) {
    throw v.badRequest('Commission must be between 0% and 100%.', { field: 'commission' });
  }
  const base_ = payee === 'self' && received ? received : sent;
  const slab = fixedRate == null ? (settings.slabs ?? []).find((x) => x.upTo == null || base_ <= x.upTo) : null;
  const rate = fixedRate ?? slab?.rate ?? settings.commissionRate;
  let fee;
  if (body?.commission != null && body.commission !== '') {
    const rupees = Number(String(body.commission).replace(/[,₹\s]/g, ''));
    if (!Number.isFinite(rupees) || rupees < 0) throw v.badRequest('Commission can’t be negative.', { field: 'commission' });
    fee = Math.round(rupees * 100);
  } else {
    // A withdrawal is charged on what the person paid in; a transfer on what is sent.
    fee = commissionFor(base_, settings, fixedRate);
  }
  // A walk-in customer needs no name, unless the amounts leave something owed either way.
  if (!base.contact && received - sent - fee !== 0) {
    throw v.badRequest('Choose the customer, so the difference goes to their balance.', { field: 'contact_id' });
  }
  return {
    ...base,
    amount: sent,
    received,
    commission: fee,
    commissionRate: rate,
    payee,
    paidMode: body?.paid_mode ? v.oneOf(body.paid_mode, v.MODES, 'Paid by') : base.mode,
    toContact,
    toName: toContact ? '' : toName,
    toAccount: payee === 'self' ? '' : v.text(body?.to_account, { max: 200 }),
  };
}

const totalsStage = {
  $group: {
    _id: null,
    count: { $sum: 1 },
    done_in: { $sum: cashIn },
    done_out: { $sum: cashOut },
    commission: { $sum: commission },
    transfers: { $sum: { $cond: [{ $eq: ['$type', 'transfer'] }, 1, 0] } },
  },
};

router.get('/', async (req, res) => {
  const filter = await buildFilter(req.query);
  const limit = Math.min(Number(req.query.limit) || 50, 5000);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const [docs, [totals]] = await Promise.all([
    Transaction.find(filter).sort({ date: -1, _id: -1 }).skip(offset).limit(limit).lean(),
    Transaction.aggregate([{ $match: filter }, totalsStage]),
  ]);
  const { _id, ...rest } = totals ?? {};
  res.json({
    items: await decorateTransactions(docs),
    totals: { count: 0, done_in: 0, done_out: 0, commission: 0, transfers: 0, ...rest },
    limit,
    offset,
  });
});

const TYPE_NAMES = { in: 'Money in', out: 'Money out', transfer: 'Transfer', adjust: 'Balance adjustment' };

router.get('/export.csv', async (req, res) => {
  const filter = await buildFilter(req.query);
  const docs = await Transaction.find(filter).sort({ date: -1, _id: -1 }).lean();
  const rows = await decorateTransactions(docs);
  const header = ['Date', 'Type', 'Person', 'Phone', 'Sent to', 'Received', 'Paid or sent', 'Commission', 'Balance change', 'Mode', 'Label', 'Note'];
  const cell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const rupee = (p) => (p ? (p / 100).toFixed(2) : '');
  const lines = rows.map((r) =>
    [
      r.date,
      TYPE_NAMES[r.type],
      r.contact_name,
      r.contact_phone,
      r.type === 'transfer' ? [r.to_name, r.to_account].filter(Boolean).join(' · ') : '',
      rupee(r.cash_in),
      rupee(r.cash_out),
      rupee(r.commission),
      r.effect ? (r.effect / 100).toFixed(2) : '',
      r.mode,
      r.label_name,
      r.note,
    ]
      .map(cell)
      .join(','),
  );
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="entries-${v.today()}.csv"`);
  res.send(`﻿${[header.map(cell).join(','), ...lines].join('\n')}`);
});

// Fields worth showing in the edit history, with their stored names.
const TRACKED = ['type', 'amount', 'received', 'commission', 'date', 'mode', 'paidMode', 'contact', 'toContact', 'toName', 'toAccount', 'label', 'note', 'account', 'direction', 'payee'];
const plain = (v) => (v == null ? null : typeof v === 'object' && v.toString ? String(v) : v);

async function historyOf(txId) {
  const revs = await Revision.find({ transaction: txId }).sort({ created_at: -1 }).limit(50).lean();
  const ids = new Set();
  for (const r of revs) for (const c of r.changes) if (['contact', 'toContact', 'label'].includes(c.field)) [c.from, c.to].forEach((x) => x && ids.add(String(x)));
  const [contacts, labels] = await Promise.all([
    Contact.find({ _id: { $in: [...ids] } }, { name: 1 }).lean(),
    Label.find({ _id: { $in: [...ids] } }, { name: 1 }).lean(),
  ]);
  const names = new Map([...contacts, ...labels].map((x) => [String(x._id), x.name]));
  return revs.map((r) => ({
    at: r.created_at,
    changes: r.changes.map((c) => ({ field: c.field, from: names.get(String(c.from)) ?? c.from, to: names.get(String(c.to)) ?? c.to })),
  }));
}

router.get('/:id', async (req, res) => {
  const txId = v.id(req.params.id);
  const tx = await transactionOut(txId);
  if (!tx) throw v.notFound('Entry');
  res.json({ ...tx, history: await historyOf(txId) });
});

router.post('/', async (req, res) => {
  const created = await Transaction.create(await readBody(req.body));
  res.status(201).json(await transactionOut(created._id));
});

router.put('/:id', async (req, res) => {
  const txId = v.id(req.params.id);
  const before = await Transaction.findById(txId).lean();
  if (!before) throw v.notFound('Entry');
  const data = await readBody(req.body);
  await Transaction.findByIdAndUpdate(txId, data, { runValidators: true });
  const changes = TRACKED.filter((f) => f in data && JSON.stringify(plain(before[f]) ?? null) !== JSON.stringify(plain(data[f]) ?? null)).map((f) => ({
    field: f,
    from: plain(before[f]) ?? null,
    to: plain(data[f]) ?? null,
  }));
  if (changes.length) await Revision.create({ transaction: txId, changes });
  res.json(await transactionOut(txId));
});

router.delete('/:id', async (req, res) => {
  const txId = v.id(req.params.id);
  const { deletedCount } = await Transaction.deleteOne({ _id: txId });
  if (!deletedCount) throw v.notFound('Entry');
  // A reminder that was tied to this entry stays, still linked to the person.
  await Reminder.updateMany({ transaction: txId }, { $set: { transaction: null } });
  res.status(204).end();
});

export default router;
