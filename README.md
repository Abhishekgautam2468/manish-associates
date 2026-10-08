# Manish Associates

Full-stack app: **React + Vite** frontend (`client/`), **Node + Express** backend (`server/`)
and **MongoDB** (via Mongoose). Requires Node 20.6 or newer and, for local development, MongoDB
installed (`brew install mongodb-community`).

| Page | What it is |
| --- | --- |
| `/` | Coming soon page with an "email me when it's live" form |
| `/login`, `/forgot-password` | Admin sign in, and password reset with a 6-digit email code |
| `/dashboard` | Overview: today and this month, money to receive and pay, 30-day cash flow, reminders due, recent entries |
| `/dashboard/entries` | Day book of every entry, with search, filters, totals and CSV export |
| `/dashboard/pending` | Money still to receive or pay, with full or part payments |
| `/dashboard/people` | People (unique names, optional unique phone) with balances; each has a statement with running balance |
| `/dashboard/reminders` | Payment and other reminders: overdue, today, upcoming, with a calendar, snooze and WhatsApp messages |
| `/dashboard/reports` | Daily, weekly, monthly and person-wise totals with charts and CSV export |
| `/dashboard/settings` | Change password, theme, full backup download |

Shortcuts in the dashboard: **N** new entry, **/** or **Ctrl/⌘ K** search.

## Setup
```bash
npm run install:all
cp server/.env.example server/.env   # then fill in the values
```

## Development
```bash
npm run dev
```
This starts three things together:
- **Database:** a MongoDB just for this project on port 27018, with data in `server/data/mongo`.
  It starts only when `MONGODB_URI` in `server/.env` points at this machine; it is separate from
  any other MongoDB you run.
- **Backend:** http://localhost:4000. `GET /api/health` reports whether the database is connected.
- **Frontend:** http://localhost:5173 (Vite uses the next free port if 5173 is taken). It proxies `/api/*` to the backend.

## Database
Set `MONGODB_URI` in `server/.env`:
- Local (default): `mongodb://127.0.0.1:27018/manish_associates`
- Atlas: `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/manish_associates?retryWrites=true&w=majority`.
  Give this app **its own database name** in the URI rather than one another app uses.
  Also allow your server's IP under Atlas → Network Access.

Collections: `admins`, `contacts`, `transactions`, `reminders`, `subscribers`. Indexes are created
on startup (existing indexes are never dropped). Person names are unique regardless of case,
and phone numbers are unique when present.

## How the ledger works
- Amounts are stored in paise (whole numbers), so there are no rounding errors.
- An entry is **money in** or **money out**, and either **done** (money moved) or **pending** (still owed).
- Recording a payment against a pending entry creates a normal done entry linked to it, and adds
  to the pending entry's `paid` total. The amount is reserved atomically, so double-clicking can't
  overpay. When nothing is left, the pending entry becomes **settled**. Cash totals only count done entries.
- **Part received / Part paid:** when someone pays only part of a bill, enter the total and the
  amount paid now in one go. The total is saved as pending, the part payment is recorded against it,
  and the rest stays pending.
- A pending entry can carry a reminder date. Standalone reminders work too.

## Admin account
There is one admin account, stored in the `admins` collection with the password as a scrypt hash.
On first start against an empty database it is created from `ADMIN_USERNAME`, `ADMIN_EMAIL` and
`ADMIN_PASSWORD` in `server/.env`. After that the database is the source of truth, so change the
password in Settings. To start over, delete the document in `admins` and restart.

### Password reset emails
Fill in `SMTP_*` in `server/.env`. For Gmail, use `smtp.gmail.com`, port `465`, and an
[app password](https://myaccount.google.com/apppasswords). In development, if `SMTP_HOST`
is empty, the code is printed in the server terminal instead.

## Backups
Settings → Download backup saves everything as JSON. For a full database dump use
`mongodump --uri "$MONGODB_URI"`. Atlas also offers scheduled backups.

## Production
```bash
npm run build   # builds client to client/dist
npm start       # starts the backend (does not start a local MongoDB)
```
Set `MONGODB_URI` to your Atlas connection string, `NODE_ENV=production` (secure cookies, SMTP
required), `CLIENT_ORIGIN`, and `TRUST_PROXY=1` if behind a reverse proxy.

## Structure
```
client/src/
  pages/              Home, Login, ForgotPassword
  pages/dashboard/    Overview, Entries, Pending, People, Person, Reminders, Reports, Signups, Settings
  dashboard/          app shell, forms, modals, chart, search palette, shared bits
  lib/                formatting (₹, dates, WhatsApp links) and data hooks
server/src/
  index.js            Express entry (connects to MongoDB before listening)
  db.js               Mongoose connection and models
  serialize.js        turns documents into the JSON the frontend uses
  auth/               admin account, sessions, mailer, auth routes
  routes/             contacts, transactions, reminders, reports, settings, subscribe
scripts/mongo.mjs     starts the project's local MongoDB for npm run dev
server/data/mongo/    local MongoDB data (git-ignored)
```
