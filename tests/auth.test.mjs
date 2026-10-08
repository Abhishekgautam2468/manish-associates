// Sign in, sign out, cookies, change password and the email-code password reset. Runs against the test server,
// whose email is off, so reset codes are read from the server log. Leaves the test password as it found it.
import { readFileSync } from 'node:fs'

// `serverLog()` gives the current server's log; `restart()` restarts it, which clears the sign-in rate limit.
export default async function authTests({ api: API, password: PW, serverLog, restart }) {
  const results = []
  const check = (name, ok, detail = '') => results.push({ name, ok: Boolean(ok), detail: ok ? '' : String(detail).slice(0, 200) })

  async function call(path, body, cookie) {
    const r = await fetch(API + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const setCookie = r.headers.get('set-cookie') ?? ''
    let data = null
    try {
      data = await r.json()
    } catch {}
    return { status: r.status, data, cookie: (setCookie.match(/ma_session=[^;]*/) ?? [''])[0], raw: setCookie }
  }
  // Only codes written after these tests started count.
  let log = serverLog()
  let logStart = readFileSync(log, 'utf8').length
  const codeFromLog = () => {
    const all = [...readFileSync(log, 'utf8').slice(logStart).matchAll(/Password reset code for [^:]+: (\d{6})/g)]
    return all.at(-1)?.[1]
  }

  // Sign in
  const me0 = await call('/auth/me')
  check('signed out: /me is 401', me0.status === 401, me0.status)
  const bad = await call('/auth/login', { identifier: 'manish', password: 'not-the-password' })
  check('wrong password is 401', bad.status === 401, bad.status)
  check('wrong password gives a clear message', /incorrect/i.test(bad.data?.error ?? ''), bad.data?.error)
  const unknown = await call('/auth/login', { identifier: 'nobody', password: PW })
  check('unknown user is 401 with the same message', unknown.status === 401 && unknown.data?.error === bad.data?.error, unknown.data?.error)
  const empty = await call('/auth/login', { identifier: '', password: '' })
  check('empty sign-in is rejected', empty.status === 401 || empty.status === 400, empty.status)
  const ok = await call('/auth/login', { identifier: 'manish', password: PW })
  check('sign in by username', ok.status === 200 && ok.cookie, ok.status)
  check('session cookie is httpOnly and SameSite=Strict', /HttpOnly/i.test(ok.raw) && /SameSite=Strict/i.test(ok.raw), ok.raw)
  const byEmail = await call('/auth/login', { identifier: '  ADMIN@EXAMPLE.com ', password: PW })
  check('sign in by email, any case, with spaces', byEmail.status === 200, byEmail.status)
  const me1 = await call('/auth/me', undefined, ok.cookie)
  check('signed in: /me works', me1.status === 200 && me1.data?.username === 'manish', JSON.stringify(me1.data))
  const tampered = await call('/auth/me', undefined, ok.cookie.slice(0, -3) + 'abc')
  check('tampered cookie is rejected', tampered.status === 401, tampered.status)
  const out = await call('/auth/logout', {}, ok.cookie)
  check('sign out', out.status === 204, out.status)
  check('sign out clears the cookie', /ma_session=;|Max-Age=0|Expires=Thu, 01 Jan 1970/i.test(out.raw), out.raw)

  // Change password checks (no change made)
  let session = (await call('/auth/login', { identifier: 'manish', password: PW })).cookie
  const wrongCurrent = await call('/auth/change-password', { currentPassword: 'nope', password: 'abcdefgh123' }, session)
  check(
    'change password: wrong current is 400',
    wrongCurrent.status === 400 && wrongCurrent.data?.field === 'currentPassword',
    JSON.stringify(wrongCurrent.data),
  )
  const short = await call('/auth/change-password', { currentPassword: PW, password: 'short' }, session)
  check('change password: too short is 400', short.status === 400 && short.data?.field === 'password', JSON.stringify(short.data))

  // The server allows 10 sign-in tries per 15 minutes; start the reset half on a fresh server.
  await restart()
  log = serverLog()
  logStart = 0

  // Forgot password with an email code
  const otherEmail = await call('/auth/forgot-password', { email: 'someone@else.com' })
  check(
    'forgot: unknown email gets the same polite reply',
    otherEmail.status === 200 && /if that email/i.test(otherEmail.data?.message ?? ''),
    JSON.stringify(otherEmail.data),
  )
  check('forgot: no code made for unknown email', !codeFromLog(), 'a code was logged')
  const f1 = await call('/auth/forgot-password', { email: 'admin@example.com' })
  check('forgot: code requested', f1.status === 200, f1.status)
  await new Promise((r) => setTimeout(r, 300))
  const code = codeFromLog()
  check('forgot: 6-digit code issued (to the log, not email)', /^\d{6}$/.test(code ?? ''), code)
  await call('/auth/forgot-password', { email: 'admin@example.com' })
  await new Promise((r) => setTimeout(r, 300))
  check('forgot: asking again within 60s keeps the same code', codeFromLog() === code, 'new code issued')
  const wrongCode = await call('/auth/verify-otp', { email: 'admin@example.com', code: code === '000000' ? '111111' : '000000' })
  check('verify: wrong code is 400', wrongCode.status === 400, wrongCode.status)
  const letters = await call('/auth/verify-otp', { email: 'admin@example.com', code: 'abcdef' })
  check('verify: non-digit code is 400', letters.status === 400, letters.status)
  const v = await call('/auth/verify-otp', { email: 'admin@example.com', code: code.slice(0, 3) + ' ' + code.slice(3) })
  check('verify: right code (with a space) gives a reset token', v.status === 200 && v.data?.resetToken, JSON.stringify(v.data))
  const reuse = await call('/auth/verify-otp', { email: 'admin@example.com', code })
  check('verify: code works only once', reuse.status === 400, reuse.status)
  const shortReset = await call('/auth/reset-password', { resetToken: v.data.resetToken, password: 'short' })
  check('reset: too short is 400', shortReset.status === 400, shortReset.status)
  const fakeReset = await call('/auth/reset-password', { resetToken: 'garbage', password: 'abcdefgh1234' })
  check('reset: fake token is 400', fakeReset.status === 400, fakeReset.status)
  const TEMP = PW + '-qa-temp'
  const r = await call('/auth/reset-password', { resetToken: v.data.resetToken, password: TEMP })
  check('reset: new password saved and signed in', r.status === 200 && r.cookie, r.status)
  const reuseToken = await call('/auth/reset-password', { resetToken: v.data.resetToken, password: TEMP + 'x' })
  check('reset: token works only once', reuseToken.status === 400, reuseToken.status)
  const oldSession = await call('/auth/me', undefined, session)
  check('reset signs out other sessions', oldSession.status === 401, oldSession.status)
  const oldPw = await call('/auth/login', { identifier: 'manish', password: PW })
  check('old password no longer works', oldPw.status === 401, oldPw.status)
  const newPw = await call('/auth/login', { identifier: 'manish', password: TEMP })
  check('new password works', newPw.status === 200, newPw.status)

  // Put the password back with Change password (also tests it)
  const back = await call('/auth/change-password', { currentPassword: TEMP, password: PW }, newPw.cookie)
  check('change password back', back.status === 200 && back.cookie, back.status)
  const final = await call('/auth/login', { identifier: 'manish', password: PW })
  check('original password works again', final.status === 200, final.status)
  const failed = results.filter((x) => !x.ok)
  return {
    total: results.length,
    passed: results.length - failed.length,
    failures: failed.map((f) => `${f.name}${f.detail ? ` (${f.detail})` : ''}`),
  }
}
