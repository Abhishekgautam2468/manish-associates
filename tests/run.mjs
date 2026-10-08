// Runs every test against a separate copy of the app (see tests/README.md).
//
//   npm test                      everything (about 25 minutes)
//   npm test -- api auth          only some parts
//   npm test -- --with-deletes    also run the checks that really delete (test database only)
//
// Parts: api, auth, pages, flows, windows, editing, features, new-pages, public
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import apiTests from './api.test.mjs'
import authTests from './auth.test.mjs'
import * as env from './lib/env.mjs'
import { client, fixtures, resetCommission, seedIfEmpty } from './lib/fixtures.mjs'
import { runCases, setCookie, startBrowser } from './ui/browser.mjs'

const UI = ['pages', 'flows', 'windows', 'editing', 'features', 'new-pages', 'public']
const PARTS = ['api', 'auth', ...UI]

const args = process.argv.slice(2)
const allowDeletes = args.includes('--with-deletes')
const asked = args.filter((a) => !a.startsWith('--'))
const unknown = asked.filter((a) => !PARTS.includes(a))
if (unknown.length) {
  console.error(`Unknown part: ${unknown.join(', ')}. Choose from: ${PARTS.join(', ')}`)
  process.exit(2)
}
const parts = asked.length ? PARTS.filter((p) => asked.includes(p)) : PARTS

const started = Date.now()
const results = [] // { part, total, passed, failures: [text] }
const line = (s = '') => process.stdout.write(s + '\n')
const seconds = () => Math.round((Date.now() - started) / 1000)

async function main() {
  await mkdir(env.DATA, { recursive: true })
  line(`Starting the test copy (MongoDB ${env.PORTS.mongo}, API ${env.PORTS.api}, frontend ${env.PORTS.web})…`)
  await env.startMongo()
  await env.startServer()
  await env.startWeb()
  let cookie = await env.login()
  let call = client(env.API, cookie)
  if (await seedIfEmpty(call)) line('New test database: added the dummy people and six weeks of entries.')

  if (parts.includes('api')) record('api', await apiTests({ api: env.API, cookie, allowDeletes }))
  if (parts.includes('auth')) {
    // A fresh server, so the sign-in tests have the whole rate limit (10 tries in 15 minutes) to themselves.
    await env.restartServer()
    record(
      'auth',
      await authTests({ api: env.API, password: env.ADMIN.password, serverLog: () => env.serverLog, restart: env.restartServer }),
    )
    // The sign-in tests use up the rate limit; a fresh server clears it.
    await env.restartServer()
    cookie = await env.login()
    call = client(env.API, cookie)
  }

  const ui = parts.filter((p) => UI.includes(p))
  if (!ui.length) return
  const tag = `T${Date.now().toString(36)}`
  const fix = await fixtures(call, tag, { entries: ui.includes('editing') })
  const browser = await startBrowser({ port: env.PORTS.chrome, profile: path.join(env.DATA, 'chrome') })
  try {
    for (const part of ui) {
      const { default: cases } = await import(`./ui/${part}.mjs`)
      const runnable = cases.filter((c) => allowDeletes || !c.deletes)
      await resetCommission(call) // each part starts from 1%, no minimum, no slabs
      await setCookie(browser, part === 'public' ? null : cookie)
      process.stdout.write(`${part}: ${runnable.length} screens… `)
      const report = await runCases(browser, { base: env.WEB, cases: runnable, fix, shots: path.join(env.DATA, 'screens', part) })
      const failed = report.filter((r) => r.failed)
      record(part, {
        total: report.length,
        passed: report.length - failed.length,
        failures: failed.map((r) =>
          [
            `${r.name} (${r.w}px${r.dark ? ', dark' : ''})`,
            ...r.errors.map((e) => `    error: ${e}`),
            ...r.issues.map((i) => `    layout: ${i}`),
            ...(r.flow?.notes ?? []).filter((n) => n.startsWith('FAIL')).map((n) => `    ${n.toLowerCase()}`),
          ].join('\n'),
        ),
      })
      await writeFile(path.join(env.DATA, 'screens', part, 'report.json'), JSON.stringify(report, null, 2))
    }
  } finally {
    await resetCommission(call).catch(() => {})
    browser.close()
  }
}

function record(part, r) {
  results.push({ part, ...r })
  line(`${r.failures.length ? '✗' : '✓'} ${part}: ${r.passed} of ${r.total} passed  (${seconds()}s)`)
  for (const f of r.failures) line('    ' + f.replace(/\n/g, '\n    '))
}

function summary() {
  const failed = results.filter((r) => r.failures.length)
  line()
  for (const r of failed) line(`── ${r.part}: ${r.failures.length} failed (details above)`)
  const total = results.reduce((s, r) => s + r.total, 0)
  const passed = results.reduce((s, r) => s + r.passed, 0)
  line()
  line(
    `${failed.length ? 'FAILED' : 'All passed'}: ${passed} of ${total} checks in ${Math.round(seconds() / 60)} min. Screenshots: tests/.data/screens`,
  )
  if (!allowDeletes) line('Delete checks were skipped (add --with-deletes to run them on the test database).')
  return failed.length ? 1 : 0
}

let code = 1
const stop = async () => {
  await env.stopAll()
  process.exit(130)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
try {
  await main()
  code = summary()
} catch (err) {
  line()
  line(`Could not finish: ${err.message}`)
  line(`Logs are in tests/.data (server-*.log, frontend.log, mongod.log).`)
} finally {
  await env.stopAll()
}
process.exit(code)
