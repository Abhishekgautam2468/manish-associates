// Test data. The dummy people and entries are added only when the test database is empty;
// nothing is ever deleted, so each run adds to what earlier runs left.

export function client(api, cookie) {
  return async function call(path, body, method = body === undefined ? 'GET' : 'POST') {
    const r = await fetch(api + path, {
      method,
      headers: { 'Content-Type': 'application/json', cookie },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const data = await r.json().catch(() => null)
    if (!r.ok) throw new Error(`${method} ${path}: ${r.status} ${JSON.stringify(data)}`)
    return data
  }
}

export const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)
const day = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

// Same numbers on every run and every machine.
let seed = 11
const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647
const between = (a, b) => Math.round((a + random() * (b - a)) / 100) * 100
const pick = (list) => list[Math.floor(random() * list.length)]

const PEOPLE = [
  ['Ramesh Kumar', '9876543210'],
  ['Priya Sharma', '9811122233'],
  ['Anil Verma', '9958811122'],
  ['Sunita Devi', ''],
  ['Mohd. Salim', '9810012345'],
  ['Kavita Joshi', '9899011223'],
  ['Deepak Yadav', '9717112233'],
  ['Neha Gupta', '9999888877'],
  ['Rahul Singh', '9873300099'],
  ['Pooja Mehta', '9812345670'],
]
const RECEIVERS = [
  ['Suresh Traders', 'SBI 3021 4455 0091'],
  ['Lalita (sister)', 'lalita@okaxis'],
  ['Gupta Medical', 'HDFC 5010 0234 8812'],
  ['Mukesh (Jaipur)', '9414012345@ybl'],
  ['Om Electricals', 'ICICI 0021 7788 1100'],
]

async function labelByName(call, name, create) {
  const found = (await call('/labels')).find((l) => l.name.toLowerCase() === name.toLowerCase())
  return found ?? (await call('/labels', { name, ...create }))
}

async function personByName(call, name, phone = '') {
  const found = (await call(`/contacts?q=${encodeURIComponent(name)}`)).find((p) => p.name === name)
  return found ?? (await call('/contacts', { name, phone }))
}

// Six weeks of withdrawals, transfers, repayments and rent, plus an old balance and three reminders.
export async function seedIfEmpty(call) {
  if ((await call('/contacts')).length) return false
  // A new database already has these two services (the server adds them).
  const wd = await labelByName(call, 'Cash withdrawal', { flow: 'withdrawal', received_mode: 'upi', paid_mode: 'cash', color: '#0d9488' })
  const tr = await labelByName(call, 'Money transfer', { flow: 'transfer', received_mode: 'cash', paid_mode: 'bank', color: '#4f46e5' })
  const P = {}
  for (const [name, phone] of PEOPLE) P[name] = (await call('/contacts', { name, phone })).id
  const names = Object.keys(P)

  for (let d = 45; d >= 0; d--) {
    const perDay = 1 + Math.floor(random() * 3)
    for (let k = 0; k < perDay; k++) {
      const who = pick(names)
      if (random() < 0.5) {
        const amt = between(1000, 25000)
        await call('/transactions', {
          type: 'transfer',
          label_id: wd.id,
          contact_id: P[who],
          payee: 'self',
          received: amt,
          amount: amt - Math.round(amt / 100),
          mode: 'upi',
          paid_mode: 'cash',
          date: day(d),
        })
      } else {
        // Money transfer; sometimes the customer pays short (owes the rest) or extra (you hold it).
        const send = between(5000, 50000)
        const fee = Math.round(send / 100)
        const r = random()
        const got = r < 0.15 ? Math.round(send / 2 / 100) * 100 : r < 0.22 ? send + fee + between(2000, 10000) : send + fee
        const [rname, account] = pick(RECEIVERS)
        const toSaved = random() < 0.25 ? names.find((p) => p !== who) : null
        await call('/transactions', {
          type: 'transfer',
          label_id: tr.id,
          contact_id: P[who],
          received: got,
          amount: send,
          commission: fee,
          mode: 'cash',
          paid_mode: random() < 0.5 ? 'bank' : 'upi',
          date: day(d),
          ...(toSaved ? { to_contact_id: P[toSaved] } : { to_name: rname, to_account: account }),
        })
      }
    }
    if (d % 9 === 3)
      await call('/transactions', { type: 'out', amount: 15000, account: false, note: 'Shop rent', mode: 'bank', date: day(d) })
    if (d % 6 === 2) {
      await call('/transactions', {
        type: 'in',
        contact_id: P[names[d % names.length]],
        amount: between(2000, 8000),
        mode: 'upi',
        note: 'Paid back',
        date: day(d),
      })
    }
  }
  await call('/transactions', {
    type: 'adjust',
    contact_id: P['Sunita Devi'],
    direction: 'owes_you',
    amount: 12000,
    note: 'Old balance from register',
    date: day(50),
  })
  await call('/reminders', { title: 'Collect from Ramesh Kumar', contact_id: P['Ramesh Kumar'], due_date: day(2) })
  await call('/reminders', { title: 'Call Sunita Devi about old balance', contact_id: P['Sunita Devi'], due_date: day(-1) })
  await call('/reminders', { title: 'Return extra cash to Priya', contact_id: P['Priya Sharma'], due_date: day(-3) })
  return true
}

// One entry of each kind for the editing test, created fresh each run and tagged in the note,
// so the test opens this run's entry and not an identical one from an earlier run.
export async function editFixtures(call, tag) {
  const alpha = await personByName(call, 'Test Alpha')
  const beta = await personByName(call, 'Test Beta')
  const anil = await personByName(call, 'Anil Verma')
  const priya = await personByName(call, 'Priya Sharma')
  const salim = await personByName(call, 'Mohd. Salim')
  const ramesh = await personByName(call, 'Ramesh Kumar')
  const wd = await labelByName(call, 'Cash withdrawal', { flow: 'withdrawal', received_mode: 'upi', paid_mode: 'cash' })
  const tr = await labelByName(call, 'Money transfer', { flow: 'transfer', received_mode: 'cash', paid_mode: 'bank' })
  const wd2 = await labelByName(call, 'Test Withdraw2', {
    flow: 'withdrawal',
    commission_percent: 2,
    received_mode: 'upi',
    paid_mode: 'cash',
  })
  const send = await labelByName(call, 'Test Send', { flow: 'transfer', received_mode: 'cash', paid_mode: 'bank' })
  const rent = await labelByName(call, 'Test Rent', {})
  const date = today()
  const note = tag
  // Amounts in rupees, as the entry form sends them.
  const bodies = {
    'in-nobody': { type: 'in', amount: 55, mode: 'cash' },
    held: {
      type: 'transfer',
      label_id: wd.id,
      contact_id: anil.id,
      payee: 'self',
      received: 0,
      amount: 100,
      commission: 0,
      commission_rate: 1,
      mode: 'upi',
      paid_mode: 'cash',
    },
    wd: {
      type: 'transfer',
      label_id: wd.id,
      contact_id: priya.id,
      payee: 'self',
      received: 1000,
      amount: 990,
      commission: 10,
      commission_rate: 1,
      mode: 'upi',
      paid_mode: 'cash',
    },
    'wd-diff': {
      type: 'transfer',
      label_id: wd2.id,
      contact_id: alpha.id,
      payee: 'self',
      received: 100,
      amount: 50,
      commission: 1,
      commission_rate: 2,
      mode: 'cash',
      paid_mode: 'cash',
    },
    'tr-diff': {
      type: 'transfer',
      label_id: send.id,
      contact_id: alpha.id,
      to_contact_id: beta.id,
      received: 15000,
      amount: 20000,
      commission: 200,
      commission_rate: 1,
      mode: 'cash',
      paid_mode: 'cash',
    },
    tr: {
      type: 'transfer',
      label_id: send.id,
      contact_id: alpha.id,
      to_name: 'Someone',
      received: 10300,
      amount: 10000,
      commission: 300,
      commission_rate: 3,
      mode: 'cash',
      paid_mode: 'cash',
    },
    adjust: { type: 'adjust', contact_id: alpha.id, direction: 'you_owe', amount: 200 },
    'out-noacc': { type: 'out', contact_id: alpha.id, label_id: rent.id, amount: 9999, account: false, mode: 'cash' },
    out: { type: 'out', contact_id: alpha.id, amount: 1500, mode: 'cash' },
    in: { type: 'in', contact_id: alpha.id, amount: 1100, mode: 'cash' },
    'tr-saved': {
      type: 'transfer',
      label_id: tr.id,
      contact_id: salim.id,
      to_contact_id: ramesh.id,
      received: 42016,
      amount: 41600,
      commission: 416,
      commission_rate: 1,
      mode: 'cash',
      paid_mode: 'bank',
    },
  }
  const entries = {}
  for (const [key, body] of Object.entries(bodies)) entries[key] = (await call('/transactions', { ...body, date, note })).id
  return entries
}

// What the UI cases need: this run's tag, today's date, the person whose page and statement are checked,
// and (for the editing part) the entries to open.
export async function fixtures(call, tag, { entries = true } = {}) {
  const sunita = await personByName(call, 'Sunita Devi')
  return { tag, today: today(), person: sunita.id, entries: entries ? await editFixtures(call, tag) : {} }
}

// The commission settings the UI tests expect: 1%, no minimum, no slabs.
export const resetCommission = (call) => call('/settings', { commission_percent: '1', min_commission: '', slabs: [] }, 'PUT')
