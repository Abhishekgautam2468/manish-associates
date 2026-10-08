import { Router } from 'express';
import { Contact, Reminder, Transaction } from '../db.js';
import { aggregates, decorateReminders, decorateTransactions } from '../serialize.js';
import * as v from '../validate.js';

const router = Router();
const { cashIn, cashOut, commission, balanceEffect } = aggregates;
const moves = { type: { $ne: 'adjust' } }; // entries where cash changed hands

const asDate = { $dateFromString: { dateString: '$date', format: '%Y-%m-%d' } };
const PERIOD_KEY = {
  day: '$date',
  week: { $dateToString: { format: '%Y-%m-%d', date: { $dateTrunc: { date: asDate, unit: 'week', startOfWeek: 'monday' } } } },
  month: { $concat: [{ $substrBytes: ['$date', 0, 7] }, '-01'] },
};

const iso = (d) => d.toISOString().slice(0, 10);
const parse = (s) => new Date(`${s}T00:00:00Z`);

function periodStart(dateStr, group) {
  const d = parse(dateStr);
  if (group === 'week') d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  if (group === 'month') d.setUTCDate(1);
  return d;
}

function nextPeriod(d, group) {
  const n = new Date(d);
  if (group === 'day') n.setUTCDate(n.getUTCDate() + 1);
  if (group === 'week') n.setUTCDate(n.getUTCDate() + 7);
  if (group === 'month') n.setUTCMonth(n.getUTCMonth() + 1);
  return n;
}

const inOut = {
  in_amount: { $sum: cashIn },
  out_amount: { $sum: cashOut },
  commission: { $sum: commission },
  count: { $sum: 1 },
};

// Everyone's running balance: what people owe you and what you hold for them.
async function balanceTotals() {
  const rows = await Transaction.aggregate([
    { $match: { contact: { $ne: null } } },
    { $group: { _id: '$contact', balance: { $sum: balanceEffect } } },
    { $match: { balance: { $ne: 0 } } },
  ]);
  const owed = rows.filter((r) => r.balance < 0);
  const held = rows.filter((r) => r.balance > 0);
  return {
    rows,
    in_amount: owed.reduce((s, r) => s - r.balance, 0),
    out_amount: held.reduce((s, r) => s + r.balance, 0),
    in_people: owed.length,
    out_people: held.length,
  };
}

async function cashBetween(from, to) {
  const [row] = await Transaction.aggregate([
    { $match: { ...moves, date: { $gte: from, $lte: to } } },
    { $group: { _id: null, ...inOut } },
  ]);
  return { in_amount: row?.in_amount ?? 0, out_amount: row?.out_amount ?? 0, commission: row?.commission ?? 0, count: row?.count ?? 0 };
}

// In and out per day / week / month, with empty periods filled in.
async function series(group, from, to) {
  const rows = await Transaction.aggregate([
    { $match: { ...moves, date: { $gte: from, $lte: to } } },
    { $group: { _id: PERIOD_KEY[group], ...inOut } },
  ]);
  const byPeriod = new Map(rows.map((r) => [r._id, r]));
  const out = [];
  for (let d = periodStart(from, group); iso(d) <= to && out.length < 1000; d = nextPeriod(d, group)) {
    const r = byPeriod.get(iso(d));
    out.push({
      period: iso(d),
      in_amount: r?.in_amount ?? 0,
      out_amount: r?.out_amount ?? 0,
      commission: r?.commission ?? 0,
      count: r?.count ?? 0,
    });
  }
  return out;
}

router.get('/overview', async (req, res) => {
  const today = v.today();
  const weekStart = iso(periodStart(today, 'week'));
  const monthStart = iso(periodStart(today, 'month'));
  const prevMonthStart = (() => {
    const d = parse(monthStart);
    d.setUTCMonth(d.getUTCMonth() - 1);
    return iso(d);
  })();
  const prevMonthSameDay = (() => {
    const d = parse(today);
    d.setUTCMonth(d.getUTCMonth() - 1);
    return iso(d) < monthStart ? iso(d) : v.shiftDays(monthStart, -1);
  })();
  const weekAhead = v.shiftDays(today, 7);

  const [todayCash, week, month, prevMonth, [allTime], balances, reminderDocs, [reminderCounts], recentDocs, last30] =
    await Promise.all([
      cashBetween(today, today),
      cashBetween(weekStart, today),
      cashBetween(monthStart, today),
      cashBetween(prevMonthStart, prevMonthSameDay),
      Transaction.aggregate([{ $match: moves }, { $group: { _id: null, ...inOut } }]),
      balanceTotals(),
      Reminder.find({ doneAt: null, dueDate: { $lte: weekAhead } }).sort({ dueDate: 1, _id: 1 }).limit(8).lean(),
      Reminder.aggregate([
        { $match: { doneAt: null } },
        {
          $group: {
            _id: null,
            overdue: { $sum: { $cond: [{ $lt: ['$dueDate', today] }, 1, 0] } },
            today: { $sum: { $cond: [{ $eq: ['$dueDate', today] }, 1, 0] } },
            upcoming: { $sum: { $cond: [{ $and: [{ $gt: ['$dueDate', today] }, { $lte: ['$dueDate', weekAhead] }] }, 1, 0] } },
          },
        },
      ]),
      Transaction.find().sort({ date: -1, _id: -1 }).limit(8).lean(),
      series('day', v.shiftDays(today, -29), today),
    ]);

  const top = [...balances.rows].sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)).slice(0, 5);
  const topContacts = await Contact.find({ _id: { $in: top.map((t) => t._id) } }, { name: 1, phone: 1 }).lean();
  const contactById = new Map(topContacts.map((c) => [String(c._id), c]));
  const totalIn = allTime?.in_amount ?? 0;
  const totalOut = allTime?.out_amount ?? 0;

  res.json({
    today: { date: today, ...todayCash },
    week: { from: weekStart, ...week },
    month: { from: monthStart, ...month },
    previousMonthToDate: { from: prevMonthStart, to: prevMonthSameDay, ...prevMonth },
    allTime: { in_amount: totalIn, out_amount: totalOut, net: totalIn - totalOut },
    // Balances: what people owe you (in) and what you hold for people (out).
    pending: {
      in_amount: balances.in_amount,
      out_amount: balances.out_amount,
      in_people: balances.in_people,
      out_people: balances.out_people,
    },
    reminders: {
      overdue: reminderCounts?.overdue ?? 0,
      today: reminderCounts?.today ?? 0,
      upcoming: reminderCounts?.upcoming ?? 0,
      items: await decorateReminders(reminderDocs),
    },
    recent: await decorateTransactions(recentDocs),
    topOwed: top
      .filter((t) => contactById.has(String(t._id)))
      .map((t) => ({
        id: String(t._id),
        name: contactById.get(String(t._id)).name,
        phone: contactById.get(String(t._id)).phone,
        pending_in: t.balance < 0 ? -t.balance : 0,
        pending_out: t.balance > 0 ? t.balance : 0,
      })),
    last30,
  });
});

router.get('/series', async (req, res) => {
  const group = v.oneOf(req.query.group ?? 'day', ['day', 'week', 'month'], 'Group');
  const to = req.query.to ? v.date(req.query.to, 'To date') : v.today();
  let from = req.query.from ? v.date(req.query.from, 'From date') : null;
  if (!from) {
    // "All time" starts at the first entry.
    const first = await Transaction.findOne(moves).sort({ date: 1 }).lean();
    from = first && first.date <= to ? first.date : v.shiftDays(to, -29);
  }
  if (from > to) throw v.badRequest('The start date must be before the end date.');
  res.json({ group, from, to, rows: await series(group, from, to) });
});

router.get('/people', async (req, res) => {
  const to = req.query.to ? v.date(req.query.to, 'To date') : v.today();
  const from = req.query.from ? v.date(req.query.from, 'From date') : '0000-01-01';
  const inRange = { $and: [{ $gte: ['$date', from] }, { $lte: ['$date', to] }] };

  const within = (value) => ({ $sum: { $cond: [inRange, value, 0] } });
  const rows = await Transaction.aggregate([
    { $match: { contact: { $ne: null } } },
    {
      $group: {
        _id: '$contact',
        in_amount: within(cashIn),
        out_amount: within(cashOut),
        commission: within(commission),
        balance: { $sum: balanceEffect },
        count: within(1),
        last_date: { $max: '$date' },
      },
    },
    { $addFields: { pending_in: { $cond: [{ $lt: ['$balance', 0] }, { $multiply: ['$balance', -1] }, 0] }, pending_out: { $max: ['$balance', 0] } } },
    { $match: { $or: [{ count: { $gt: 0 } }, { balance: { $ne: 0 } }] } },
  ]);
  const contacts = await Contact.find({ _id: { $in: rows.map((r) => r._id) } }, { name: 1, phone: 1 }).lean();
  const byId = new Map(contacts.map((c) => [String(c._id), c]));
  const out = rows
    .map(({ _id, ...r }) => ({ id: String(_id), name: byId.get(String(_id))?.name ?? '', phone: byId.get(String(_id))?.phone ?? null, ...r }))
    .sort((a, b) => b.in_amount + b.out_amount - (a.in_amount + a.out_amount) || a.name.localeCompare(b.name));
  res.json({ from, to, rows: out });
});

export default router;
