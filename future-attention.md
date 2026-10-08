# Future attention

Things to come back to. Newest items at the top of each section.

## Security

- **Rotate the MongoDB Atlas password.** The connection string in `server/.env` was handled during setup; change the database user's password in Atlas and update `MONGODB_URI`.
- **Change the admin password.** `ADMIN_PASSWORD` in `server/.env` is only for creating the first account. Change it from Settings → Password, then remove it from `.env`.
- **Leftover data in the old `notes` database on Atlas.** Collections and indexes from this app were created there before the URI was switched to `manish_associates`. Drop them when convenient.
- `.env` is in `.gitignore`. Keep it that way before the project goes into git.

## Design

- **Call and WhatsApp buttons in the entry details window.** When an entry has a person with a phone number, the details window shows a Call button and a WhatsApp message button (`client/src/dashboard/ui.jsx`, around line 303). Decide later whether to keep, move or remove them.
- **Give each page its own header.** People, Reminders, Reports and Labels still share the same plain `PageHeader`. Design each one around what that page is for, as was done for Overview and Entries.
- **Finish the Tailwind migration.** Overview and Entries are on Tailwind. The other pages still use the legacy classes in `client/src/dashboard.css`.
- **Pending page on tablets.** Between about 640px and 900px it shows the phone card layout. A table would read better there.
- **Reports by day on phones.** Each day is a tall card with dashes for empty values. Hide days with no entries, or use a compact list.
- **Modals and forms.** These have not had the latest design pass yet.

## Ideas for later

- **Hindi language option (idea #12).** Not started. Decide the scope first: every screen, or only the main ones (new entry, balances, receipts and reminder messages). Noted on 2026-10-08.
- **Install as a phone app (PWA, idea #13).** Add the dashboard to the phone's home screen, opening full screen like an app, with a quick-add shortcut. Asked to keep for later on 2026-10-08.

## Technical, left for later

From the 2026-10-08 test pass.

- **Git (#15).** Done on 2026-10-09: the project is on GitHub at https://github.com/Abhishekgautam2468/manish-associates (branch `main`). Commit before bigger changes, so work can be rolled back.
- **Automatic backups (#16).** A daily backup, with a way to restore it.

## Code clean-up

Done on 2026-10-08 (#18): dashboard pages load one at a time (largest file 237 kB, was 585 kB), 425 unused CSS rules removed (`dashboard.css` 4,582 → 2,365 lines), unused components and imports removed, and `client/.prettierrc` added.

- **Lint hints left on purpose.** `npm run lint` in `client/` shows about 15 React style hints (setState in effects, `Date.now()` during render). They work correctly; tidy them when touching those files.
- `dashboard.css` still holds the styles for pages not yet on Tailwind. Shrink it further as pages move over.

## Behaviour

- **Entries now opens on "Last 30 days".** The Overview chip "N entries this month" links to `?range=month` on purpose so its count matches. Keep this in mind if defaults change again.

## Testing

- **`npm test`** (done 2026-10-09, #17) runs every check against its own copy of the app: MongoDB on 27019 with data in `tests/.data`, API on 4100 without `server/.env`, frontend on 5190. See `tests/README.md`.
- **Delete checks are off by default.** `npm test -- --with-deletes` runs them, on the test database only.
- **The old review copy** (MongoDB 27018, API 4001, frontend 5180, and the QA copy on 4002 / 5181) was started from scripts in the Claude session folder. They go away with that session; `npm test` replaces them.
- Never point tests at Atlas.
