# Tests

```sh
npm test                      # everything, about 25 minutes
npm test -- api auth          # only some parts
npm test -- --with-deletes    # also run the checks that really delete something
```

Parts: `api`, `auth`, `pages`, `flows`, `windows`, `editing`, `features`, `new-pages`, `public`.

The result is printed at the end: each part with how many checks passed, and the details of anything that failed. Screenshots of every screen are saved in `tests/.data/screens/<part>/`.

## What it runs against

Each run starts its own copy of the app and stops it afterwards:

| | Port | |
|---|---|---|
| MongoDB | 27019 | data in `tests/.data/mongo`, database `manish_associates_test` |
| API server | 4100 | started **without** `server/.env`: no Atlas, no email, its own admin password |
| Frontend | 5190 | Vite, pointing at the test API |
| Chrome | 9340 | headless, for the screen checks |

Your real data and your normal `npm run dev` setup are never touched. A port already in use stops the run with a message, so a test can't talk to the wrong server.

Nothing is deleted. The first run fills the empty test database with dummy people and six weeks of entries; later runs reuse it and add their own entries. The checks that delete (an entry made a moment earlier, a person with no entries) are skipped unless you pass `--with-deletes`.

## What it checks

- **api**: people, labels, every kind of entry, commission maths, balances, filters, CSV export, reminders, reports, settings, access control.
- **auth**: sign in and out, cookies, change password, the reset code flow. Codes come from the test server's log, not email.
- **pages**, **new-pages**, **public**: every screen at phone, tablet and desktop widths, light and dark, for sideways scrolling, things off screen, cut-off text, small tap targets, unnamed buttons, and "undefined" or "NaN" on screen.
- **flows**, **windows**, **features**, **editing**: clicks through the app: every kind of entry, search, menus, filters, pop-up windows, commission slabs, duplicate warning, undo, receipts, the day book, bulk reminders, and opening and re-saving each kind of entry to check nothing changes.

## Needs

Node 22, MongoDB (`brew install mongodb-community`, or set `MONGOD_BIN`), Google Chrome (or set `CHROME_PATH`), and the packages from `npm run install:all`.

## Files

- `run.mjs`: starts everything, runs the parts, prints the result.
- `lib/env.mjs`: the test copy of the app. `lib/fixtures.mjs`: dummy data and the entries the editing part opens.
- `api.test.mjs`, `auth.test.mjs`: server checks.
- `ui/*.mjs`: one file per screen part. Each case is a page, a width and optional steps (`run`), which use the helpers in `ui/helpers.js`. `ui/browser.mjs` drives Chrome and does the layout checks.
