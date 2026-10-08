// One-off: moves old "pending / part payment" entries to the running-balance model.
//   pending or settled money in  → balance adjustment "owes you" for the full amount
//   pending or settled money out → balance adjustment "you owe" for the full amount
//   payments against them stay as plain money in / out, so the balance works out the same.
// Safe to run more than once. Run with: npm run migrate:balances (uses MONGODB_URI from .env)
import mongoose from 'mongoose';
import { STARTER_SERVICES } from '../src/db.js';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not set.');
  process.exit(1);
}
await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
const { host, port, name } = mongoose.connection;
console.log(`Connected to ${host}:${port}/${name}`);
const tx = mongoose.connection.collection('transactions');

const owed = await tx.updateMany(
  { type: 'in', status: { $in: ['pending', 'settled'] } },
  { $set: { type: 'adjust', direction: 'owes_you', mode: 'other', account: true }, $unset: { status: '', paid: '', settledFrom: '' } },
);
const owe = await tx.updateMany(
  { type: 'out', status: { $in: ['pending', 'settled'] } },
  { $set: { type: 'adjust', direction: 'you_owe', mode: 'other', account: true }, $unset: { status: '', paid: '', settledFrom: '' } },
);
const rest = await tx.updateMany(
  { $or: [{ status: { $exists: true } }, { paid: { $exists: true } }, { settledFrom: { $exists: true } }] },
  { $unset: { status: '', paid: '', settledFrom: '' } },
);
const account = await tx.updateMany({ type: { $in: ['in', 'out'] }, account: { $exists: false } }, { $set: { account: true } });

// Starter service labels, if they don't exist yet.
const labels = mongoose.connection.collection('labels');
for (const l of STARTER_SERVICES) {
  const found = await labels.findOne({ name: l.name }, { collation: { locale: 'en', strength: 2 } });
  if (found) await labels.updateOne({ _id: found._id }, { $set: { flow: l.flow, commissionPercent: found.commissionPercent ?? l.commissionPercent, receivedMode: found.receivedMode ?? l.receivedMode, paidMode: found.paidMode ?? l.paidMode } });
  else await labels.insertOne({ ...l, created_at: new Date(), updated_at: new Date() });
  console.log(`Service label ready: ${l.name}`);
}

console.log(`Owed to you → balance: ${owed.modifiedCount}`);
console.log(`You owed → balance:    ${owe.modifiedCount}`);
console.log(`Old fields cleaned:    ${rest.modifiedCount}`);
console.log(`Marked on account:     ${account.modifiedCount}`);
await mongoose.disconnect();
