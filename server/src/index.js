import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { connectDb } from './db.js';
import healthRouter from './routes/health.js';
import subscribeRouter, { importLegacySubscribers } from './routes/subscribe.js';
import contactsRouter from './routes/contacts.js';
import transactionsRouter from './routes/transactions.js';
import labelsRouter from './routes/labels.js';
import remindersRouter from './routes/reminders.js';
import reportsRouter from './routes/reports.js';
import settingsRouter from './routes/settings.js';
import daybookRouter from './routes/daybook.js';
import { authRouter } from './auth/routes.js';
import { loadAdmin } from './auth/admin.js';
import { requireAuth } from './auth/session.js';

const app = express();
const PORT = process.env.PORT || 4000;

if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY));

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(',') ?? false, credentials: true }));
app.use(express.json({ limit: '10kb' }));

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/subscribe', subscribeRouter);
app.use('/api/contacts', requireAuth, contactsRouter);
app.use('/api/transactions', requireAuth, transactionsRouter);
app.use('/api/labels', requireAuth, labelsRouter);
app.use('/api/reminders', requireAuth, remindersRouter);
app.use('/api/reports', requireAuth, reportsRouter);
app.use('/api/settings', requireAuth, settingsRouter);
app.use('/api/daybook', requireAuth, daybookRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ error: err.message, ...err.details });
  }
  if (err.name === 'CastError' || err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Some of the details are not valid. Check the form and try again.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server. Try again in a moment.' });
});

try {
  await connectDb();
  await loadAdmin();
  await importLegacySubscribers();
} catch (err) {
  console.error(`Could not start: ${err.message}`);
  if (err.name === 'MongooseServerSelectionError') {
    console.error(`Is MongoDB running at ${process.env.MONGODB_URI}? For the local database, run "npm run dev" from the project root.`);
  }
  process.exit(1);
}

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  console.error(`Failed to start server on port ${PORT}:`, err.message);
  process.exit(1);
});

async function shutdown() {
  server.close();
  await mongoose.disconnect();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
