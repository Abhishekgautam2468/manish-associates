import { Router } from 'express';
import { LABEL_COLORS, Label, NAME_COLLATION, Transaction } from '../db.js';
import { aggregates } from '../serialize.js';
import * as v from '../validate.js';

const router = Router();
const { cashIn, cashOut } = aggregates;

function labelOut(label, stats) {
  return {
    id: String(label._id),
    name: label.name,
    color: label.color,
    flow: label.flow ?? null,
    commission_percent: label.commissionPercent ?? null,
    received_mode: label.receivedMode ?? null,
    paid_mode: label.paidMode ?? null,
    count: stats?.count ?? 0,
    in_amount: stats?.in_amount ?? 0,
    out_amount: stats?.out_amount ?? 0,
    last_date: stats?.last_date ?? null,
  };
}

async function statsFor(labelIds) {
  const rows = await Transaction.aggregate([
    { $match: { label: { $in: labelIds } } },
    {
      $group: {
        _id: '$label',
        count: { $sum: 1 },
        in_amount: { $sum: cashIn },
        out_amount: { $sum: cashOut },
        last_date: { $max: '$date' },
      },
    },
  ]);
  return new Map(rows.map((r) => [String(r._id), r]));
}

async function one(labelId) {
  const label = await Label.findById(labelId).lean();
  if (!label) throw v.notFound('Label');
  const stats = await statsFor([label._id]);
  return labelOut(label, stats.get(String(label._id)));
}

function readName(body) {
  const name = v.text(body?.name, { max: 40 }).replace(/\s+/g, ' ');
  if (!name) throw v.badRequest('Enter a label name.', { field: 'name' });
  return name;
}

// The service rules a label can carry. Blank values clear them.
function readRules(body) {
  const flow = body?.flow ? v.oneOf(body.flow, ['withdrawal', 'transfer'], 'Service type') : null;
  let commissionPercent = null;
  if (body?.commission_percent != null && String(body.commission_percent).trim() !== '') {
    commissionPercent = Number(String(body.commission_percent).replace('%', ''));
    if (!Number.isFinite(commissionPercent) || commissionPercent < 0 || commissionPercent > 100) {
      throw v.badRequest('Commission must be a number from 0 to 100.', { field: 'commission_percent' });
    }
  }
  const mode = (value, field) => (value ? v.oneOf(value, v.MODES, field) : null);
  return {
    flow,
    commissionPercent,
    receivedMode: mode(body?.received_mode, 'Received by'),
    paidMode: mode(body?.paid_mode, 'Paid by'),
  };
}

async function assertUnique(name, exceptId) {
  const existing = await Label.findOne({ name, ...(exceptId ? { _id: { $ne: exceptId } } : {}) })
    .collation(NAME_COLLATION)
    .lean();
  if (existing) {
    throw new v.HttpError(409, `There's already a label called “${existing.name}”.`, { field: 'name', id: String(existing._id) });
  }
}

async function saveGuarded(fn) {
  try {
    return await fn();
  } catch (err) {
    if (err?.code === 11000) throw new v.HttpError(409, 'That label already exists.', { field: 'name' });
    throw err;
  }
}

router.get('/', async (req, res) => {
  const q = v.text(req.query.q, { max: 40 });
  const labels = await Label.find(q ? { name: new RegExp(v.escapeRegex(q), 'i') } : {})
    .collation(NAME_COLLATION)
    .sort({ name: 1 })
    .lean();
  const stats = await statsFor(labels.map((l) => l._id));
  res.json(labels.map((l) => labelOut(l, stats.get(String(l._id)))));
});

router.post('/', async (req, res) => {
  const name = readName(req.body);
  await assertUnique(name);
  // New labels take the next colour in turn unless one is chosen.
  const color = LABEL_COLORS.includes(req.body?.color)
    ? req.body.color
    : LABEL_COLORS[(await Label.countDocuments()) % LABEL_COLORS.length];
  const created = await saveGuarded(() => Label.create({ name, color, ...readRules(req.body) }));
  res.status(201).json(await one(created._id));
});

router.put('/:id', async (req, res) => {
  const labelId = v.id(req.params.id);
  const name = readName(req.body);
  await assertUnique(name, labelId);
  const update = { name, ...readRules(req.body) };
  if (req.body?.color) update.color = v.oneOf(req.body.color, LABEL_COLORS, 'Colour');
  const updated = await saveGuarded(() => Label.findByIdAndUpdate(labelId, update));
  if (!updated) throw v.notFound('Label');
  res.json(await one(labelId));
});

// Deleting a label keeps its entries; they just lose the label.
router.delete('/:id', async (req, res) => {
  const labelId = v.id(req.params.id);
  const deleted = await Label.findByIdAndDelete(labelId);
  if (!deleted) throw v.notFound('Label');
  const { modifiedCount } = await Transaction.updateMany({ label: labelId }, { label: null });
  res.json({ unlabelled: modifiedCount });
});

export { LABEL_COLORS };
export default router;
