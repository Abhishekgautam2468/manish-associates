// Opens pages in headless Chrome, runs each case's checks inside the page and looks for layout problems:
// sideways scrolling, things off screen, spilled text, small tap targets, unnamed buttons, "undefined" or "NaN".
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const HELPERS = await readFile(path.join(import.meta.dirname, 'helpers.js'), 'utf8')

// Runs in the page: finds layout problems.
const AUDIT = `(() => {
  const W = innerWidth, issues = []
  if (document.documentElement.scrollWidth > W + 1) issues.push('page scrolls sideways: ' + document.documentElement.scrollWidth + ' > ' + W)
  const clipped = (el) => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const cs = getComputedStyle(p); if (/(auto|scroll|hidden|clip)/.test(cs.overflowX)) { const r = p.getBoundingClientRect(); if (r.right <= W + 1 && r.left >= -1) return true } } return false }
  const seen = new Set()
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed') continue
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue
    if ((r.right > W + 1 || r.left < -1) && !clipped(el)) { const key = el.tagName + '.' + (el.className?.toString?.() ?? '').split(' ').slice(0, 3).join('.'); if (!seen.has(key)) { seen.add(key); issues.push('off-screen: ' + key + ' (' + Math.round(r.left) + '..' + Math.round(r.right) + ') ' + (el.textContent || '').trim().slice(0, 40)) } }
  }
  // Text overflowing its own box without being cut off on purpose
  for (const el of document.querySelectorAll('button, a, label, h1, h2, h3, p, span, dd, dt, td, th')) {
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.overflow !== 'visible' || el.children.length) continue
    if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0 && cs.whiteSpace === 'nowrap') { const t = el.textContent.trim().slice(0, 40); const key = 'spill:' + t; if (!seen.has(key)) { seen.add(key); issues.push('text spills: "' + t + '"') } }
  }
  // Tap targets on phones
  if (W < 600) for (const el of document.querySelectorAll('button, a[href], select, input:not([type=hidden])')) {
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue
    const small = (b) => b.height < 24 || b.width < 24
    const after = getComputedStyle(el, '::after'); if (after.content !== 'none' && after.position === 'absolute' && !small((el.offsetParent || el).getBoundingClientRect())) continue
    const lab = el.tagName === 'INPUT' && el.closest('label'); if (lab && !small(lab.getBoundingClientRect())) continue
    const r = el.getBoundingClientRect(); if (r.width && r.height && small(r) && !el.closest('[role=listbox]')) { const t = (el.getAttribute('aria-label') || el.textContent || el.placeholder || el.tagName).trim().slice(0, 30); const key = 'tap:' + t; if (!seen.has(key)) { seen.add(key); issues.push('small tap target ' + Math.round(r.width) + 'x' + Math.round(r.height) + ': ' + t) } }
  }
  // Missing accessible names
  for (const el of document.querySelectorAll('button, a[href], input, select, textarea')) {
    const cs = getComputedStyle(el); if (cs.display === 'none' || el.type === 'hidden') continue
    const name = el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent.trim() || (el.id && document.querySelector('label[for="' + el.id + '"]')?.textContent) || el.placeholder || el.closest('label')?.textContent
    if (!name) { const key = 'name:' + el.outerHTML.slice(0, 60); if (!seen.has(key)) { seen.add(key); issues.push('no accessible name: ' + el.outerHTML.slice(0, 90)) } }
  }
  const text = document.body.innerText
  for (const bad of ['undefined', 'NaN', '[object Object]', 'null ', 'Invalid Date', '₹-']) if (text.includes(bad)) issues.push('page shows "' + bad.trim() + '"')
  return issues
})()`

export async function startBrowser({ port, profile }) {
  if (!existsSync(CHROME)) throw new Error(`Chrome not found at ${CHROME}. Install Google Chrome or set CHROME_PATH.`)
  const chrome = spawn(
    CHROME,
    [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      '--disable-gpu',
      '--hide-scrollbars',
      `--user-data-dir=${profile}`,
      'about:blank',
    ],
    {
      stdio: 'ignore',
    },
  )
  let targets
  for (let i = 0; i < 60 && !targets; i++) {
    try {
      targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
    } catch {
      await sleep(250)
    }
  }
  if (!targets) throw new Error('Chrome did not start')
  const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl)
  await new Promise((r) => ws.addEventListener('open', r))
  let id = 0
  const pending = new Map()
  const browser = { errors: [] }
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data)
    if (pending.has(m.id)) {
      pending.get(m.id)(m.result ?? m.error)
      pending.delete(m.id)
    }
    const errs = browser.errors
    if (m.method === 'Runtime.exceptionThrown')
      errs.push('exception: ' + (m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text).split('\n')[0])
    if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type))
      errs.push(
        `console.${m.params.type}: ` +
          m.params.args
            .map((a) => a.value ?? a.description)
            .join(' ')
            .split('\n')[0],
      )
    if (m.method === 'Network.responseReceived' && m.params.response.status >= 500)
      errs.push(`HTTP ${m.params.response.status} ${m.params.response.url}`)
  })
  browser.send = (method, params = {}) =>
    new Promise((r) => {
      const i = ++id
      pending.set(i, r)
      ws.send(JSON.stringify({ id: i, method, params }))
    })
  browser.close = () => {
    ws.close()
    chrome.kill()
  }
  await browser.send('Network.enable')
  await browser.send('Runtime.enable')
  return browser
}

export async function setCookie(browser, cookie) {
  if (!cookie) return browser.send('Network.clearBrowserCookies')
  const [name, value] = cookie.split('=')
  await browser.send('Network.setCookie', { name, value, domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Strict' })
}

// The text sent to the page for one case: helpers, this run's fixtures, then the case's own steps.
function script(run, fix) {
  return `(async()=>{\n${HELPERS}\nconst FIX = ${JSON.stringify(fix)};\ntry { await (${run.toString()})() } catch (e) { fail('exception ' + e.message) }\nreturn { ok, notes } })()`
}

export async function runCases(browser, { base, cases, fix, shots }) {
  await mkdir(shots, { recursive: true })
  const report = []
  for (const c of cases) {
    browser.errors = []
    const w = c.w ?? 1440
    const h = c.h ?? 900
    await browser.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 })
    await browser.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: c.dark ? 'dark' : 'light' }] })
    const where = typeof c.path === 'function' ? c.path(fix) : c.path
    await browser.send('Page.navigate', { url: base + where })
    await sleep(c.wait ?? 2200)
    let flow = null
    if (c.run) {
      const r = await browser.send('Runtime.evaluate', { expression: script(c.run, fix), awaitPromise: true, returnByValue: true })
      flow = r?.result?.value ?? {
        ok: false,
        notes: [
          'FAIL script error: ' + (r?.exceptionDetails?.exception?.description ?? r?.exceptionDetails?.text ?? 'unknown').split('\n')[0],
        ],
      }
      await sleep(700)
    }
    const a = await browser.send('Runtime.evaluate', { expression: AUDIT, returnByValue: true })
    const issues = a?.result?.value ?? ['layout check failed']
    if (c.shot !== false) {
      const { data } = await browser.send('Page.captureScreenshot', { format: 'png' })
      await writeFile(path.join(shots, `${c.name}.png`), Buffer.from(data, 'base64'))
    }
    const errors = [...new Set(browser.errors)]
    const failed = errors.length > 0 || issues.length > 0 || flow?.ok === false
    report.push({ name: c.name, w, dark: Boolean(c.dark), errors, issues, flow, failed })
  }
  return report
}
