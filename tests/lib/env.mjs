// Starts a separate copy of the app for the tests: its own MongoDB, API server and frontend.
// The API server never reads server/.env, so the tests can't reach Atlas, use your password or send email.
// Nothing is ever deleted: the test database lives in tests/.data and is reused between runs.
import { spawn } from 'node:child_process'
import { createWriteStream, existsSync, mkdirSync, readFileSync } from 'node:fs'
import net from 'node:net'
import path from 'node:path'

export const ROOT = path.resolve(import.meta.dirname, '../..')
export const DATA = path.join(ROOT, 'tests/.data')

export const PORTS = { mongo: 27019, api: 4100, web: 5190, chrome: 9340 }
export const MONGODB_URI = `mongodb://127.0.0.1:${PORTS.mongo}/manish_associates_test`
export const API = `http://localhost:${PORTS.api}/api`
export const WEB = `http://localhost:${PORTS.web}`

// The test admin. Only exists in the test database.
export const ADMIN = { username: 'manish', email: 'admin@example.com', password: 'test-password-123' }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Something listens on the port, over IPv4 or IPv6 (Vite uses whichever "localhost" means on this machine).
export async function portOpen(port) {
  const tryHost = (host) =>
    new Promise((resolve) => {
      const socket = net.connect(port, host)
      socket.once('connect', () => (socket.end(), resolve(true)))
      socket.once('error', () => resolve(false))
    })
  return (await tryHost('127.0.0.1')) || (await tryHost('::1'))
}

async function waitFor(check, what, seconds = 40) {
  for (let i = 0; i < seconds * 4; i++) {
    if (await check()) return
    await sleep(250)
  }
  throw new Error(`${what} did not start in ${seconds}s`)
}

const children = []

function start(name, cmd, args, { cwd, env, logFile }) {
  const log = createWriteStream(logFile, { flags: 'w' })
  const child = spawn(cmd, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] })
  child.stdout.pipe(log)
  child.stderr.pipe(log)
  child.name = name
  children.push(child)
  return child
}

// A port must be free before we start something on it, so a test run never talks to an unrelated server.
async function needFree(port, what) {
  if (await portOpen(port))
    throw new Error(`Port ${port} (${what}) is already in use. Stop whatever runs there, or wait for an earlier test run to finish.`)
}

export async function startMongo() {
  mkdirSync(path.join(DATA, 'mongo'), { recursive: true })
  if (await portOpen(PORTS.mongo)) return // an earlier run's MongoDB is still up: reuse it
  const bin = process.env.MONGOD_BIN || 'mongod'
  const child = start('mongodb', bin, ['--dbpath', path.join(DATA, 'mongo'), '--port', String(PORTS.mongo), '--bind_ip', '127.0.0.1'], {
    env: process.env,
    logFile: path.join(DATA, 'mongod.log'),
  })
  child.on('error', (err) => {
    console.error(
      err.code === 'ENOENT' ? `Could not find "${bin}". Install MongoDB (brew install mongodb-community) or set MONGOD_BIN.` : err.message,
    )
    process.exit(1)
  })
  await waitFor(() => portOpen(PORTS.mongo), 'MongoDB')
}

let serverRuns = 0
export let serverLog = ''

// Only the variables the server needs. SMTP is left out on purpose: reset codes go to the log instead of email.
function serverEnv() {
  const keep = ['PATH', 'HOME', 'TMPDIR', 'LANG']
  const env = Object.fromEntries(keep.filter((k) => process.env[k]).map((k) => [k, process.env[k]]))
  return {
    ...env,
    PORT: String(PORTS.api),
    CLIENT_ORIGIN: WEB,
    MONGODB_URI,
    ADMIN_USERNAME: ADMIN.username,
    ADMIN_EMAIL: ADMIN.email,
    ADMIN_PASSWORD: ADMIN.password,
    SESSION_SECRET: 'test-only-session-secret-not-used-anywhere-else',
  }
}

let server = null
export async function startServer() {
  await needFree(PORTS.api, 'test API server')
  serverLog = path.join(DATA, `server-${++serverRuns}.log`)
  server = start('server', process.execPath, ['src/index.js'], { cwd: path.join(ROOT, 'server'), env: serverEnv(), logFile: serverLog })
  await waitFor(() => portOpen(PORTS.api), 'API server')
}

// Restarting clears the sign-in rate limit, which the login tests use up.
export async function restartServer() {
  if (server) {
    server.kill()
    await new Promise((r) => server.once('exit', r))
    await waitFor(async () => !(await portOpen(PORTS.api)), 'API server stop', 10)
  }
  await startServer()
}

export async function startWeb() {
  await needFree(PORTS.web, 'test frontend')
  const vite = path.join(ROOT, 'client/node_modules/vite/bin/vite.js')
  if (!existsSync(vite)) throw new Error('Client packages are missing. Run: npm run install:all')
  start('frontend', process.execPath, [vite, '--port', String(PORTS.web), '--strictPort'], {
    cwd: path.join(ROOT, 'client'),
    env: { ...process.env, API_URL: `http://localhost:${PORTS.api}` },
    logFile: path.join(DATA, 'frontend.log'),
  })
  await waitFor(() => portOpen(PORTS.web), 'frontend')
}

async function post(path, body) {
  return fetch(`${API}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}

// Signs in as the test admin. If an interrupted run left the test password changed, puts it back first,
// using the app's own reset-by-code flow (the code is read from the test server's log).
export async function login() {
  let r = await post('/auth/login', { identifier: ADMIN.username, password: ADMIN.password })
  if (r.status === 401) {
    await post('/auth/forgot-password', { email: ADMIN.email })
    await sleep(300)
    const code = [...readFileSync(serverLog, 'utf8').matchAll(/Password reset code for [^:]+: (\d{6})/g)].at(-1)?.[1]
    const verified = code && (await (await post('/auth/verify-otp', { email: ADMIN.email, code })).json())
    if (verified?.resetToken) await post('/auth/reset-password', { resetToken: verified.resetToken, password: ADMIN.password })
    r = await post('/auth/login', { identifier: ADMIN.username, password: ADMIN.password })
  }
  if (!r.ok) throw new Error(`Test sign-in failed: ${r.status} ${await r.text()}`)
  return r.headers.get('set-cookie').match(/ma_session=[^;]*/)[0]
}

// Stops everything this run started. MongoDB keeps running only if an earlier run had started it.
export async function stopAll() {
  for (const child of children.reverse()) {
    if (child.exitCode != null) continue
    child.kill('SIGTERM')
    await Promise.race([new Promise((r) => child.once('exit', r)), sleep(5000)])
  }
}
