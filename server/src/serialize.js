import mongoose from 'mongoose';
import { Contact, Label, Reminder, Transaction } from './db.js';

const str = (oid) => (oid ? String(oid) : null);
const iso = (date) => (date ? new Date(date).toISOString() : null);

/* Aggregation building blocks (see the model notes in db.js) */

const sumIf = (conditions, value) => ({
  $sum: { $cond: [{ $and: conditions }, value, 0] },
});
const is = (type) => ({ $eq: ['$type', type] });
const onAccount = { $ne: ['$account', false] };

// Cash that came in or went out with this entry.
const cashIn = { $switch: { branches: [{ case: is('in'), then: '$amount' }, { case: is('transfer'), then: '$received' }], default: 0 } };
const cashOut = { $switch: { branches: [{ case: is('out'), then: '$amount' }, { case: is('transfer'), then: '$amount' }], default: 0 } };
const commission = { $cond: [is('transfer'), '$commission', 0] };

// How the entry moves its person's balance. Positive: you hold their money. Negative: they owe you.
const balanceEffect = {
  $switch: {
    branches: [
      { case: { $and: [is('in'), onAccount] }, then: '$amount' },
      { case: { $and: [is('out'), onAccount] }, then: { $multiply: ['$amount', -1] } },
      { case: is('transfer'), then: { $subtract: [{ $subtract: ['$received', '$amount'] }, '$commission'] } },
      { case: { $and: [is('adjust'), { $eq: ['$direction', 'you_owe'] }] }, then: '$amount' },
      { case: is('adjust'), then: { $multiply: ['$amount', -1] } },
    ],
    default: 0,
  },
};

// Same rules in plain JS, for one entry.
export function effectOf(t) {
  if (t.type === 'in') return t.account === false ? 0 : t.amount;
  if (t.type === 'out') return t.account === false ? 0 : -t.amount;
  if (t.type === 'transfer') return (t.received ?? 0) - t.amount - (t.commission ?? 0);
  if (t.type === 'adjust') return t.direction === 'you_owe' ? t.amount : -t.amount;
  return 0;
}
export const cashOf = (t) => ({
  in: t.type === 'in' ? t.amount : t.type === 'transfer' ? (t.received ?? 0) : 0,
  out: t.type === 'out' || t.type === 'transfer' ? t.amount : 0,
});

/* People */

// Cash received and paid, commission, running balance, entry count and last date per person.
export async function balancesFor(contactIds) {
  const rows = await Transaction.aggregate([
    { $match: { contact: { $in: contactIds } } },
    {
      $group: {
        _id: '$contact',
        total_in: { $sum: cashIn },
        total_out: { $sum: cashOut },
        commission: { $sum: commission },
        balance: { $sum: balanceEffect },
        tx_count: { $sum: 1 },
        last_date: { $max: '$date' },
        last_added_at: { $max: '$created_at' },
      },
    },
  ]);
  return new Map(rows.map((r) => [String(r._id), r]));
}

export function contactOut(c, b) {
  const balance = b?.balance ?? 0;
  return {
    id: str(c._id),
    name: c.name,
    phone: c.phone,
    note: c.note,
    created_at: iso(c.created_at),
    updated_at: iso(c.updated_at),
    total_in: b?.total_in ?? 0,
    total_out: b?.total_out ?? 0,
    commission: b?.commission ?? 0,
    balance,
    // What they owe you, and what you owe them (money of theirs you hold).
    pending_in: balance < 0 ? -balance : 0,
    pending_out: balance > 0 ? balance : 0,
    tx_count: b?.tx_count ?? 0,
    last_date: b?.last_date ?? null,
    last_added_at: iso(b?.last_added_at),
  };
}

export async function contactsWithBalances(contacts) {
  const balances = await balancesFor(contacts.map((c) => c._id));
  return contacts.map((c) => contactOut(c, balances.get(String(c._id))));
}

/* Entries */

// Adds person, receiver, label and reminder details to plain transaction documents.
export async function decorateTransactions(txs) {
  if (txs.length === 0) return [];
  const ids = txs.map((t) => t._id);
  const contactIds = [...new Set(txs.flatMap((t) => [str(t.contact), str(t.toContact)]).filter(Boolean))];
  const labelIds = [...new Set(txs.map((t) => str(t.label)).filter(Boolean))];

  const [contacts, reminders, labels] = await Promise.all([
    Contact.find({ _id: { $in: contactIds } }, { name: 1, phone: 1 }).lean(),
    Reminder.find({ transaction: { $in: ids } }, { transaction: 1, dueDate: 1, doneAt: 1 }).lean(),
    Label.find({ _id: { $in: labelIds } }, { name: 1, color: 1 }).lean(),
  ]);
  const labelMap = new Map(labels.map((l) => [String(l._id), l]));
  const contactMap = new Map(contacts.map((c) => [String(c._id), c]));
  const reminderMap = new Map(reminders.map((r) => [String(r.transaction), r]));

  return txs.map((t) => {
    const contact = contactMap.get(str(t.contact));
    const to = contactMap.get(str(t.toContact));
    const reminder = reminderMap.get(String(t._id));
    const label = labelMap.get(str(t.label));
    const cash = cashOf(t);
    return {
      id: String(t._id),
      contact_id: str(t.contact),
      type: t.type,
      amount: t.amount,
      date: t.date,
      mode: t.mode,
      account: t.account !== false,
      direction: t.direction ?? null,
      received: t.received ?? 0,
      commission: t.commission ?? 0,
      commission_rate: t.commissionRate ?? null,
      payee: t.payee ?? 'other',
      paid_mode: t.paidMode ?? null,
      to_contact_id: str(t.toContact),
      to_name: t.payee === 'self' ? (contact?.name ?? null) : (to?.name ?? (t.toName || null)),
      to_account: t.toAccount || null,
      cash_in: cash.in,
      cash_out: cash.out,
      effect: t.contact ? effectOf(t) : 0,
      label_id: label ? String(label._id) : null,
      label_name: label?.name ?? null,
      label_color: label?.color ?? null,
      note: t.note,
      created_at: iso(t.created_at),
      updated_at: iso(t.updated_at),
      contact_name: contact?.name ?? null,
      contact_phone: contact?.phone ?? null,
      reminder_id: reminder ? String(reminder._id) : null,
      remind_on: reminder?.dueDate ?? null,
      reminder_done_at: iso(reminder?.doneAt),
    };
  });
}

export async function transactionOut(id) {
  const tx = await Transaction.findById(id).lean();
  if (!tx) return null;
  const [out] = await decorateTransactions([tx]);
  return out;
}

/* Reminders */

export async function decorateReminders(reminders) {
  if (reminders.length === 0) return [];
  const contactIds = [...new Set(reminders.map((r) => str(r.contact)).filter(Boolean))];
  const [contacts, balances] = await Promise.all([
    Contact.find({ _id: { $in: contactIds } }, { name: 1, phone: 1 }).lean(),
    balancesFor(contactIds.map((id) => new mongoose.Types.ObjectId(id))),
  ]);
  const contactMap = new Map(contacts.map((c) => [String(c._id), c]));

  return reminders.map((r) => {
    const contact = contactMap.get(str(r.contact));
    const balance = balances.get(str(r.contact))?.balance ?? 0;
    return {
      id: String(r._id),
      title: r.title,
      contact_id: str(r.contact),
      transaction_id: str(r.transaction),
      amount: r.amount,
      due_date: r.dueDate,
      note: r.note,
      done_at: iso(r.doneAt),
      created_at: iso(r.created_at),
      contact_name: contact?.name ?? null,
      contact_phone: contact?.phone ?? null,
      // The person's balance now: 'in' when they owe you, 'out' when you owe them.
      tx_type: balance < 0 ? 'in' : balance > 0 ? 'out' : null,
      tx_remaining: balance ? Math.abs(balance) : null,
    };
  });
}

export async function reminderOut(id) {
  const r = await Reminder.findById(id).lean();
  if (!r) return null;
  const [out] = await decorateReminders([r]);
  return out;
}

export const aggregates = { sumIf, is, cashIn, cashOut, commission, balanceEffect, onAccount };
