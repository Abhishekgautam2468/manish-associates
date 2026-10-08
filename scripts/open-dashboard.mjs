// Opens the dashboard in Chrome with Playwright, signed in as the admin.
// usage: npm run open:dashboard [-- http://localhost:5173]
// Needs the app running (npm run dev). Uses ADMIN_USERNAME / ADMIN_PASSWORD from server/.env,
// or DASHBOARD_USER / DASHBOARD_PASSWORD if set.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve(import.meta.dirname, '..');
const base = (process.argv[2] || 'http://localhost:5173').replace(/\/$/, '');

function envValue(key) {
  const file = path.join(root, 'server/.env');
  if (!existsSync(file)) return '';
  const line = readFileSync(file, 'utf8').split('\n').find((l) => l.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1).trim().replace(/^["']|["']$/g, '') : '';
}

const username = process.env.DASHBOARD_USER || envValue('ADMIN_USERNAME');
const password = process.env.DASHBOARD_PASSWORD || envValue('ADMIN_PASSWORD');

// Wait for the frontend and API to be up.
for (let i = 0; ; i++) {
  try {
    const res = await fetch(`${base}/api/health`);
    if (res.ok) break;
    if (i === 0) console.log(`Waiting for the API (${(await res.json()).database ?? res.status})…`);
  } catch {
    if (i === 0) console.log(`Waiting for ${base}… (is "npm run dev" running?)`);
  }
  if (i > 60) throw new Error(`${base} did not respond. Start the app with "npm run dev" first.`);
  await new Promise((r) => setTimeout(r, 1000));
}

const browser = await chromium.launch({ channel: 'chrome', headless: false });
const context = await browser.newContext({ viewport: null });
const page = await context.newPage();

await page.goto(`${base}/login`);
if (page.url().endsWith('/login') && username && password) {
  await page.getByLabel('Username or email').fill(username);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  try {
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log(`Signed in as ${username}. Dashboard is open; close the window to finish.`);
  } catch {
    console.log('Automatic sign-in did not work (password changed?). Sign in in the window that opened.');
  }
}

await new Promise((resolve) => browser.on('disconnected', resolve));
