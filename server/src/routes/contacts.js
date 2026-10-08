import mongoose from 'mongoose';
import { Router } from 'express';
import { Contact, NAME_COLLATION, Reminder, Transaction } from '../db.js';
import { contactsWithBalances } from '../serialize.js';
import * as v from '../validate.js';

const router = Router();

const SORTS = {
  name: (a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }),
  // Latest entry date first; on the same date, the one added most recently. People with no entries go last, newest first.
  recent: (a, b) =>
    (b.last_date ?? '').localeCompare(a.last_date ?? '') ||
    (b.last_added_at ?? '').localeCompare(a.last_added_at ?? '') ||
    (b.created_at ?? '').localeCompare(a.created_at ?? '') ||
    SORTS.name(a, b),
  receive: (a, b) => b.pending_in - a.pending_in || SORTS.name(a, b),
  pay: (a, b) => b.pending_out - a.pending_out || SORTS.name(a, b),
};

async function findDuplicate({ name, phone }, exceptId) {
  const notSelf = exceptId ? { _id: { $ne: exceptId } } : {};
  const byName = await Contact.findOne({ name, ...notSelf }).collation(NAME_COLLATION).lean();
  if (byName) {
    return {
      field: 'name',
      id: String(byName._id),
      error: `“${byName.name}” is already saved. Use a different name, or open the existing person.`,
    };
  }
  if (phone) {
    const byPhone = await Contact.findOne({ phone, ...notSelf }).lean();
    if (byPhone) return { field: 'phone', id: String(byPhone._id), error: `This number is already saved for ${byPhone.name}.` };
  }
  return null;
}

function readBody(body) {
  const name = v.text(body?.name, { max: 80 }).replace(/\s+/g, ' ');
  if (!name) throw v.badRequest('Enter a name.', { field: 'name' });
  return { name, phone: v.phone(body?.phone), note: v.text(body?.note, { max: 1000 }) };
}

async function one(contactId) {
  const contact = await Contact.findById(contactId).lean();
  if (!contact) throw v.notFound('Person');
  const [out] = await contactsWithBalances([contact]);
  return out;
}

// The unique indexes are the final guard if two saves race past findDuplicate.
async function saveGuarded(fn) {
  try {
    return await fn();
  } catch (err) {
    if (err?.code === 11000) {
      const field = err.keyPattern?.phone ? 'phone' : 'name';
      throw new v.HttpError(409, field === 'phone' ? 'This number is already saved for someone else.' : 'That name is already saved.', { field });
    }
    throw err;
  }
}

router.get('/', async (req, res) => {
  const q = v.text(req.query.q, { max: 80 });
  const filter = {};
  if (q) {
    const or = [{ name: new RegExp(v.escapeRegex(q), 'i') }];
    const digits = q.replace(/\D/g, '');
    if (digits.length >= 3) or.push({ phone: new RegExp(digits) });
    filter.$or = or;
  }
  const contacts = await Contact.find(filter).lean();
  let rows = await contactsWithBalances(contacts);
  if (req.query.filter === 'receive') rows = rows.filter((r) => r.pending_in > 0);
  if (req.query.filter === 'pay') rows = rows.filter((r) => r.pending_out > 0);
  rows.sort(SORTS[req.query.sort] ?? SORTS.name);
  res.json(rows);
});

// The people this customer usually sends money to, most recent first.
router.get('/:id/receivers', async (req, res) => {
  const contactId = v.id(req.params.id);
  const rows = await Transaction.aggregate([
    { $match: { contact: new mongoose.Types.ObjectId(contactId), type: 'transfer', payee: { $ne: 'self' } } },
    { $sort: { date: -1, _id: -1 } },
    {
      $group: {
        _id: { to: '$toContact', name: { $cond: [{ $ifNull: ['$toContact', false] }, '', '$toName'] } },
        to_account: { $first: '$toAccount' },
        last_date: { $first: '$date' },
        count: { $sum: 1 },
      },
    },
    { $sort: { last_date: -1, count: -1 } },
    { $limit: 6 },
  ]);
  const ids = rows.map((r) => r._id.to).filter(Boolean);
  const names = new Map((await Contact.find({ _id: { $in: ids } }, { name: 1 }).lean()).map((c) => [String(c._id), c.name]));
  res.json(
    rows
      .map((r) => ({
        to_contact_id: r._id.to ? String(r._id.to) : null,
        name: r._id.to ? names.get(String(r._id.to)) : r._id.name,
        to_account: r.to_account || '',
        last_date: r.last_date,
        count: r.count,
      }))
      .filter((r) => r.name),
  );
});

router.get('/:id', async (req, res) => {
  res.json(await one(v.id(req.params.id)));
});

router.post('/', async (req, res) => {
  const data = readBody(req.body);
  const dup = await findDuplicate(data);
  if (dup) throw new v.HttpError(409, dup.error, { field: dup.field, id: dup.id });
  const created = await saveGuarded(() => Contact.create(data));
  res.status(201).json(await one(created._id));
});

router.put('/:id', async (req, res) => {
  const contactId = v.id(req.params.id);
  const data = readBody(req.body);
  const dup = await findDuplicate(data, contactId);
  if (dup) throw new v.HttpError(409, dup.error, { field: dup.field, id: dup.id });
  const updated = await saveGuarded(() => Contact.findByIdAndUpdate(contactId, data, { new: true }));
  if (!updated) throw v.notFound('Person');
  res.json(await one(contactId));
});

router.delete('/:id', async (req, res) => {
  const contactId = v.id(req.params.id);
  const n = await Transaction.countDocuments({ $or: [{ contact: contactId }, { toContact: contactId }] });
  if (n > 0) {
    throw new v.HttpError(409, `This person has ${n} ${n === 1 ? 'entry' : 'entries'}. Delete or move those entries first.`);
  }
  const deleted = await Contact.findByIdAndDelete(contactId);
  if (!deleted) throw v.notFound('Person');
  await Reminder.updateMany({ contact: contactId }, { contact: null });
  res.status(204).end();
});

export default router;
