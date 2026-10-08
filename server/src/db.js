import mongoose from 'mongoose';

const { Schema, model } = mongoose;
const ObjectId = Schema.Types.ObjectId;

// Case-insensitive matching, so "Ramesh Kumar" and "ramesh kumar" are the same name.
export const NAME_COLLATION = { locale: 'en', strength: 2 };

const options = { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, versionKey: false };

/* Single admin account. Kept as one document with a fixed id. */
const adminSchema = new Schema(
  {
    _id: { type: String, default: 'admin' },
    username: { type: String, required: true },
    email: { type: String, required: true },
    passwordHash: { type: String, required: true },
    sessionVersion: { type: Number, default: 1 },
  },
  options,
);

const contactSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: null },
    note: { type: String, default: '' },
  },
  options,
);
contactSchema.index({ name: 1 }, { unique: true, collation: NAME_COLLATION });
contactSchema.index({ phone: 1 }, { unique: true, partialFilterExpression: { phone: { $type: 'string' } } });

// Amounts are whole paise to avoid rounding errors. Dates are 'YYYY-MM-DD' strings.
//
// Every entry belongs to at most one person's running balance (`contact`):
//   in        money received from the person              balance + amount   (when `account`)
//   out       money paid to the person                    balance − amount   (when `account`)
//   transfer  the person gave `received` and `amount` was paid out — to someone else, or back to the
//             same person (payee 'self', e.g. a cash withdrawal) — with `commission` kept as the fee
//                                                          balance + received − amount − commission
//   adjust    an opening or corrected balance, no cash moves:
//             direction 'owes_you' → balance − amount, 'you_owe' → balance + amount
// A positive balance means you hold the person's money (you owe them); negative means they owe you.
// `account: false` keeps a plain in/out (rent, salary…) out of the person's balance.
const transactionSchema = new Schema(
  {
    contact: { type: ObjectId, ref: 'Contact', default: null },
    type: { type: String, enum: ['in', 'out', 'transfer', 'adjust'], required: true },
    amount: { type: Number, required: true, min: 1 },
    date: { type: String, required: true },
    mode: { type: String, default: 'cash' },
    label: { type: ObjectId, ref: 'Label', default: null },
    note: { type: String, default: '' },
    account: { type: Boolean, default: true },
    direction: { type: String, enum: ['owes_you', 'you_owe', null], default: null },
    received: { type: Number, default: 0, min: 0 },
    commission: { type: Number, default: 0, min: 0 },
    commissionRate: { type: Number, default: null }, // basis points used, e.g. 100 = 1%
    // A transfer's money goes back to the same person ('self', e.g. a cash withdrawal) or to someone else.
    payee: { type: String, enum: ['self', 'other'], default: 'other' },
    paidMode: { type: String, default: null },
    toContact: { type: ObjectId, ref: 'Contact', default: null },
    toName: { type: String, default: '' },
    toAccount: { type: String, default: '' },
  },
  options,
);
transactionSchema.index({ date: -1, _id: -1 });
transactionSchema.index({ contact: 1, date: 1 });
transactionSchema.index({ type: 1, date: -1 });
transactionSchema.index({ toContact: 1, date: 1 });
transactionSchema.index({ label: 1, date: -1 });

// Labels group entries. A label can also be a service with its own rules, used to fill in the form:
//   flow 'withdrawal'  the person pays you (e.g. by UPI) and you hand the money back (e.g. as cash)
//   flow 'transfer'    the person gives you money and you send it on to someone else
// commissionPercent overrides the default commission; receivedMode / paidMode are the usual ways money moves.
// Names are unique regardless of case.
export const LABEL_COLORS = ['#7c3aed', '#0d9488', '#db2777', '#16a34a', '#0284c7', '#4f46e5', '#b45309', '#64748b'];
const labelSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    color: { type: String, enum: LABEL_COLORS, default: LABEL_COLORS[0] },
    flow: { type: String, enum: ['withdrawal', 'transfer', null], default: null },
    commissionPercent: { type: Number, default: null, min: 0, max: 100 },
    receivedMode: { type: String, default: null },
    paidMode: { type: String, default: null },
  },
  options,
);
labelSchema.index({ name: 1 }, { unique: true, collation: NAME_COLLATION });

const reminderSchema = new Schema(
  {
    title: { type: String, required: true },
    contact: { type: ObjectId, ref: 'Contact', default: null },
    transaction: { type: ObjectId, ref: 'Transaction', default: null },
    amount: { type: Number, default: null },
    dueDate: { type: String, required: true },
    note: { type: String, default: '' },
    doneAt: { type: Date, default: null },
  },
  options,
);
reminderSchema.index({ dueDate: 1 });
reminderSchema.index({ transaction: 1 }, { unique: true, partialFilterExpression: { transaction: { $type: 'objectId' } } });

// App-wide settings, one document.
const settingsSchema = new Schema(
  {
    _id: { type: String, default: 'app' },
    commissionRate: { type: Number, default: 100, min: 0, max: 10000 }, // basis points: 100 = 1%
    // Lowest commission charged on a service, in paise (0 = none).
    minCommission: { type: Number, default: 0, min: 0 },
    // Optional slabs, lowest first: amounts up to `upTo` paise use `rate` basis points; upTo null = everything above.
    slabs: { type: [{ _id: false, upTo: { type: Number, default: null }, rate: { type: Number, required: true } }], default: [] },
  },
  options,
);

// What changed when an entry was edited: one document per save.
const revisionSchema = new Schema(
  {
    transaction: { type: ObjectId, ref: 'Transaction', required: true },
    changes: [{ _id: false, field: String, from: Schema.Types.Mixed, to: Schema.Types.Mixed }],
  },
  options,
);
revisionSchema.index({ transaction: 1, created_at: -1 });

// End-of-day cash count: what was in the drawer at the start and what was counted at the end.
const dayCloseSchema = new Schema(
  {
    _id: { type: String }, // 'YYYY-MM-DD'
    openingCash: { type: Number, default: 0 },
    countedCash: { type: Number, default: null },
    note: { type: String, default: '' },
  },
  options,
);

const subscriberSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    subscribedAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

export const Admin = model('Admin', adminSchema);
export const Contact = model('Contact', contactSchema);
export const Transaction = model('Transaction', transactionSchema);
export const Label = model('Label', labelSchema);
export const Reminder = model('Reminder', reminderSchema);
export const Subscriber = model('Subscriber', subscriberSchema);
export const Settings = model('Settings', settingsSchema);
export const Revision = model('Revision', revisionSchema);
export const DayClose = model('DayClose', dayCloseSchema);

export async function appSettings() {
  return (await Settings.findById('app').lean()) ?? { _id: 'app', commissionRate: 100, minCommission: 0, slabs: [] };
}

// The two everyday services. No commissionPercent, so they follow the commission in Settings (rate, minimum, slabs).
export const STARTER_SERVICES = [
  { name: 'Cash withdrawal', color: '#0d9488', flow: 'withdrawal', commissionPercent: null, receivedMode: 'upi', paidMode: 'cash' },
  { name: 'Money transfer', color: '#4f46e5', flow: 'transfer', commissionPercent: null, receivedMode: 'cash', paidMode: 'bank' },
];

// A brand-new database (no labels and no entries) starts with the two services. Anything else is left alone,
// so services you rename or remove later don't come back.
async function addStarterServices() {
  const [labels, entries] = await Promise.all([Label.estimatedDocumentCount(), Transaction.estimatedDocumentCount()]);
  if (labels || entries) return;
  await Label.insertMany(STARTER_SERVICES);
  console.log('New database: added the Cash withdrawal and Money transfer services');
}

export async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set in server/.env');
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  // Only adds missing indexes; never drops any, so it is safe on a database shared with other apps.
  await Promise.all([Admin, Contact, Transaction, Label, Reminder, Subscriber, Settings, Revision, DayClose].map((m) => m.createIndexes()));
  const { host, port, name } = mongoose.connection;
  console.log(`Connected to MongoDB ${host}:${port}/${name}`);
  await migrateCategoriesToLabels();
  await addStarterServices();
}

// One-time move from the old free-text `category` field to labels. Safe to run on every start.
async function migrateCategoriesToLabels() {
  const raw = Transaction.collection;
  const names = await raw.distinct('category', { category: { $type: 'string', $ne: '' } });
  let moved = 0;
  for (const name of names) {
    let label = await Label.findOne({ name: name.trim() }).collation(NAME_COLLATION);
    if (!label) {
      const count = await Label.countDocuments();
      label = await Label.create({ name: name.trim(), color: LABEL_COLORS[count % LABEL_COLORS.length] });
    }
    const { modifiedCount } = await raw.updateMany({ category: name }, { $set: { label: label._id }, $unset: { category: '' } });
    moved += modifiedCount;
  }
  await raw.updateMany({ category: { $exists: true } }, { $unset: { category: '' } });
  if (moved) console.log(`Moved ${moved} entries from categories to labels`);
}

// Commission in paise for an amount, rounded to the rupee.
// A fixed rate (basis points) wins; otherwise the slab for the amount, else the default rate. Then the minimum applies.
export function commissionFor(amount, settings, fixedRate = null) {
  if (!amount) return 0;
  let rate = fixedRate;
  if (rate == null) {
    const slab = (settings.slabs ?? []).find((s) => s.upTo == null || amount <= s.upTo);
    rate = slab ? slab.rate : settings.commissionRate;
  }
  const fee = Math.round((amount * rate) / 10000 / 100) * 100;
  return Math.max(fee, settings.minCommission ?? 0);
}

export function dbStatus() {
  return ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] ?? 'unknown';
}

export const isObjectId = (value) => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
