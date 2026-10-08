import { Router } from 'express';
import { DayClose, Transaction } from '../db.js';
import * as v from '../validate.js';

// The day book: money in and out by payment mode for a day, and the cash count for the drawer.
const router = Router();

// In and out per payment mode. A service counts its money in under `mode` and its money out under `paidMode`.
async function byMode(from, to) {
  const rows = await Transaction.aggregate([
    { $match: { type: { $ne: 'adjust' }, date: { $gte: from, $lte: to } } },
    {
      $project: {
        moves: {
          $switch: {
            branches: [
              { case: { $eq: ['$type', 'in'] }, then: [{ mode: '$mode', in: '$amount', out: 0 }] },
              { case: { $eq: ['$type', 'out'] }, then: [{ mode: '$mode', in: 0, out: '$amount' }] },
            ],
            default: [
              { mode: '$mode', in: '$received', out: 0 },
              { mode: { $ifNull: ['$paidMode', '$mode'] }, in: 0, out: '$amount' },
            ],
          },
        },
        commission: { $cond: [{ $eq: ['$type', 'transfer'] }, '$commission', 0] },
      },
    },
    {
      $facet: {
        modes: [
          { $unwind: '$moves' },
          { $match: { $or: [{ 'moves.in': { $gt: 0 } }, { 'moves.out': { $gt: 0 } }] } },
          { $group: { _id: '$moves.mode', in: { $sum: '$moves.in' }, out: { $sum: '$moves.out' }, count: { $sum: 1 } } },
        ],
        totals: [{ $group: { _id: null, commission: { $sum: '$commission' }, count: { $sum: 1 } } }],
      },
    },
  ]);
  const [r] = rows;
  return {
    modes: r.modes.map((m) => ({ mode: m._id ?? 'cash', in_amount: m.in, out_amount: m.out, count: m.count })).sort((a, b) => b.in_amount + b.out_amount - (a.in_amount + a.out_amount)),
    commission: r.totals[0]?.commission ?? 0,
    count: r.totals[0]?.count ?? 0,
  };
}

const closeOut = (c) =>
  c ? { date: c._id, opening_cash: c.openingCash, counted_cash: c.countedCash, note: c.note, updated_at: c.updated_at } : null;

router.get('/', async (req, res) => {
  const date = req.query.date ? v.date(req.query.date) : v.today();
  const to = req.query.to ? v.date(req.query.to, 'To date') : date;
  if (to < date) throw v.badRequest('The end date must be after the start date.');
  const [summary, close, previous, recent] = await Promise.all([
    byMode(date, to),
    DayClose.findById(date).lean(),
    DayClose.findOne({ _id: { $lt: date }, countedCash: { $ne: null } }).sort({ _id: -1 }).lean(),
    DayClose.find({ countedCash: { $ne: null } }).sort({ _id: -1 }).limit(14).lean(),
  ]);
  // Cash expected per closed day, for the history list.
  const history = await Promise.all(
    recent.map(async (c) => {
      const s = await byMode(c._id, c._id);
      const cash = s.modes.find((m) => m.mode === 'cash');
      const expected = c.openingCash + (cash?.in_amount ?? 0) - (cash?.out_amount ?? 0);
      return { ...closeOut(c), expected_cash: expected, difference: c.countedCash - expected };
    }),
  );
  res.json({
    date,
    to,
    ...summary,
    close: closeOut(close),
    // Opening cash defaults to the last counted closing.
    suggested_opening: previous ? previous.countedCash : 0,
    previous_date: previous?._id ?? null,
    history,
  });
});

router.put('/:date', async (req, res) => {
  const date = v.date(req.params.date);
  const money = (raw, field, allowEmpty) => {
    const text = String(raw ?? '').replace(/[,₹\s]/g, '');
    if (text === '' && allowEmpty) return null;
    const n = Number(text || 0);
    if (!Number.isFinite(n) || n < 0) throw v.badRequest('Enter an amount of ₹0 or more.', { field });
    return Math.round(n * 100);
  };
  const saved = await DayClose.findByIdAndUpdate(
    date,
    {
      openingCash: money(req.body?.opening_cash, 'opening_cash', false),
      countedCash: money(req.body?.counted_cash, 'counted_cash', true),
      note: v.text(req.body?.note, { max: 500 }),
    },
    { upsert: true, new: true },
  ).lean();
  res.json(closeOut(saved));
});

export default router;
