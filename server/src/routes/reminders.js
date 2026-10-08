import { Router } from 'express';
import { Contact, Reminder } from '../db.js';
import { decorateReminders, reminderOut } from '../serialize.js';
import * as v from '../validate.js';

const router = Router();

async function readBody(body, existing) {
  const dueDate = v.date(body?.due_date, 'Reminder date');
  const note = v.text(body?.note, { max: 1000 });
  // A reminder that belongs to a pending entry only changes its date and note here.
  if (existing?.transaction) return { dueDate, note };

  const contactId = body?.contact_id ? v.id(body.contact_id, 'person') : null;
  if (contactId && !(await Contact.exists({ _id: contactId }))) throw v.notFound('Person');
  const title = v.text(body?.title, { max: 120 });
  if (!title) throw v.badRequest('Say what this reminder is for.', { field: 'title' });
  return {
    title,
    contact: contactId,
    amount: body?.amount ? v.amount(body.amount) : null,
    dueDate,
    note,
  };
}

async function found(remId) {
  const out = await reminderOut(remId);
  if (!out) throw v.notFound('Reminder');
  return out;
}

router.get('/', async (req, res) => {
  const filter = {};
  const status = req.query.status ?? 'open';
  if (status === 'open') filter.doneAt = null;
  if (status === 'done') filter.doneAt = { $ne: null };
  if (req.query.contact_id) filter.contact = v.id(req.query.contact_id, 'person');
  if (req.query.to) filter.dueDate = { $lte: v.date(req.query.to, 'To date') };
  const sort = status === 'done' ? { doneAt: -1 } : { dueDate: 1, _id: 1 };
  const rows = await Reminder.find(filter).sort(sort).limit(500).lean();
  res.json(await decorateReminders(rows));
});

router.post('/', async (req, res) => {
  const created = await Reminder.create(await readBody(req.body));
  res.status(201).json(await found(created._id));
});

router.put('/:id', async (req, res) => {
  const remId = v.id(req.params.id);
  const existing = await Reminder.findById(remId).lean();
  if (!existing) throw v.notFound('Reminder');
  await Reminder.updateOne({ _id: remId }, await readBody(req.body, existing));
  res.json(await found(remId));
});

router.post('/:id/done', async (req, res) => {
  const remId = v.id(req.params.id);
  const { matchedCount } = await Reminder.updateOne({ _id: remId }, { doneAt: new Date() });
  if (!matchedCount) throw v.notFound('Reminder');
  res.json(await found(remId));
});

router.post('/:id/reopen', async (req, res) => {
  const remId = v.id(req.params.id);
  const { matchedCount } = await Reminder.updateOne({ _id: remId }, { doneAt: null });
  if (!matchedCount) throw v.notFound('Reminder');
  res.json(await found(remId));
});

// Push a reminder forward by n days from today (or from its date, if that's later).
router.post('/:id/snooze', async (req, res) => {
  const remId = v.id(req.params.id);
  const days = Math.min(Math.max(Number(req.body?.days) || 1, 1), 365);
  const rem = await Reminder.findById(remId).lean();
  if (!rem) throw v.notFound('Reminder');
  const today = v.today();
  const base = rem.dueDate > today ? rem.dueDate : today;
  await Reminder.updateOne({ _id: remId }, { dueDate: v.shiftDays(base, days), doneAt: null });
  res.json(await found(remId));
});

router.delete('/:id', async (req, res) => {
  const { deletedCount } = await Reminder.deleteOne({ _id: v.id(req.params.id) });
  if (!deletedCount) throw v.notFound('Reminder');
  res.status(204).end();
});

export default router;
