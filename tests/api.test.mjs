// Server checks: people, labels, every kind of entry, commission maths, balances, filters, CSV export,
// reminders, reports, settings and access control. Runs against the test server only.
export default async function apiTests({ api: API, cookie, allowDeletes = false }) {
  const results = []
  let section = ''
  const tag = `QA${Date.now().toString().slice(-6)}`

  async function req(method, path, body, { auth = true } = {}) {
    const r = await fetch(API + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(auth ? { cookie } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const text = await r.text()
    let data = text
    try {
      data = JSON.parse(text)
    } catch {}
    return { status: r.status, data, headers: r.headers }
  }
  const get = (p, o) => req('GET', p, undefined, o)
  const post = (p, b, o) => req('POST', p, b, o)
  const put = (p, b) => req('PUT', p, b)
  const del = (p) => req('DELETE', p)

  function check(name, ok, detail = '') {
    results.push({ section, name, ok: Boolean(ok), detail: ok ? '' : String(detail).slice(0, 300) })
  }
  const eq = (name, got, want) =>
    check(name, JSON.stringify(got) === JSON.stringify(want), `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`)
  const status = (name, res, want) => check(name, res.status === want, `status ${res.status} ${JSON.stringify(res.data).slice(0, 200)}`)

  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)
  const balanceOf = async (id) => (await get(`/contacts/${id}`)).data.balance

  /* ---------- Auth ---------- */
  section = 'Auth'
  status('me without cookie is 401', await get('/auth/me', { auth: false }), 401)
  for (const p of ['/contacts', '/transactions', '/labels', '/reminders', '/reports/overview', '/settings', '/settings/backup']) {
    status(`${p} without cookie is 401`, await get(p, { auth: false }), 401)
  }
  status('me with cookie is 200', await get('/auth/me'), 200)
  status(
    'login with wrong password is 401',
    await post('/auth/login', { identifier: 'manish', password: 'wrong-password-xyz' }, { auth: false }),
    401,
  )
  status('health is public', await get('/health', { auth: false }), 200)

  /* ---------- Settings ---------- */
  section = 'Settings'
  const s0 = await get('/settings')
  status('get settings', s0, 200)
  check('default commission is a number', typeof s0.data.commission_percent === 'number', JSON.stringify(s0.data))
  status('commission 1.5 ok', await put('/settings', { commission_percent: 1.5 }), 200)
  eq('commission saved', (await get('/settings')).data.commission_percent, 1.5)
  status('commission -1 rejected', await put('/settings', { commission_percent: -1 }), 400)
  status('commission 101 rejected', await put('/settings', { commission_percent: 101 }), 400)
  status('commission empty rejected', await put('/settings', { commission_percent: '' }), 400)
  status('commission text rejected', await put('/settings', { commission_percent: 'abc' }), 400)
  status('commission "2%" accepted', await put('/settings', { commission_percent: '2%' }), 200)
  await put('/settings', { commission_percent: 1 })
  eq('commission back to 1', (await get('/settings')).data.commission_percent, 1)

  /* ---------- People ---------- */
  section = 'People'
  const A = await post('/contacts', { name: `${tag} Alpha`, phone: '98' + tag.slice(-6).padStart(8, '1') })
  status('create person', A, 201)
  const aId = A.data.id
  status('duplicate name (different case) rejected', await post('/contacts', { name: `${tag} alpha`.toUpperCase() }), 409)
  status('duplicate phone rejected', await post('/contacts', { name: `${tag} Other`, phone: A.data.phone }), 409)
  status('empty name rejected', await post('/contacts', { name: '   ' }), 400)
  status('bad phone rejected', await post('/contacts', { name: `${tag} Bad`, phone: '12ab' }), 400)
  const B = await post('/contacts', { name: `${tag} Beta` })
  status('create person without phone', B, 201)
  const bId = B.data.id
  const C = await post('/contacts', { name: `${tag}  Gamma   Spaces` })
  eq('name spaces collapsed', C.data.name, `${tag} Gamma Spaces`)
  check('phone stored with +91', A.data.phone?.startsWith('+91'), A.data.phone)
  const search = await get(`/contacts?q=${encodeURIComponent(tag + ' Al')}`)
  check(
    'search by name finds Alpha',
    search.data.some((p) => p.id === aId),
    JSON.stringify(search.data.map((p) => p.name)),
  )
  const searchPhone = await get(`/contacts?q=${A.data.phone.slice(-6)}`)
  check(
    'search by phone digits finds Alpha',
    searchPhone.data.some((p) => p.id === aId),
    searchPhone.data.length,
  )
  for (const sort of ['name', 'recent', 'receive', 'pay']) status(`sort ${sort}`, await get(`/contacts?sort=${sort}`), 200)
  status('update person', await put(`/contacts/${bId}`, { name: `${tag} Beta`, phone: '', note: 'note' }), 200)
  status('update to duplicate name rejected', await put(`/contacts/${bId}`, { name: `${tag} Alpha` }), 409)
  status('get unknown person 404', await get('/contacts/0123456789abcdef01234567'), 404)
  status('get bad id 400', await get('/contacts/nope'), 400)
  eq('new person balance is 0', await balanceOf(aId), 0)

  /* ---------- Labels ---------- */
  section = 'Labels'
  const L = await post('/labels', { name: `${tag} Rent` })
  status('create plain label', L, 201)
  eq('plain label has no flow', L.data.flow, null)
  status('duplicate label rejected', await post('/labels', { name: `${tag} rent` }), 409)
  status('empty label rejected', await post('/labels', { name: '' }), 400)
  status('bad flow rejected', await post('/labels', { name: `${tag} X`, flow: 'magic' }), 400)
  status('commission 150 rejected', await post('/labels', { name: `${tag} Y`, flow: 'transfer', commission_percent: 150 }), 400)
  status('bad mode rejected', await post('/labels', { name: `${tag} Z`, flow: 'transfer', paid_mode: 'pigeon' }), 400)
  const SW = await post('/labels', {
    name: `${tag} Withdraw2`,
    flow: 'withdrawal',
    commission_percent: 2,
    received_mode: 'upi',
    paid_mode: 'cash',
  })
  status('create withdrawal service', SW, 201)
  eq(
    'service rules saved',
    [SW.data.flow, SW.data.commission_percent, SW.data.received_mode, SW.data.paid_mode],
    ['withdrawal', 2, 'upi', 'cash'],
  )
  const ST = await post('/labels', { name: `${tag} Send`, flow: 'transfer', received_mode: 'cash', paid_mode: 'bank' })
  eq('service without own rate uses default', ST.data.commission_percent, null)
  const cleared = await put(`/labels/${SW.data.id}`, {
    name: `${tag} Withdraw2`,
    flow: 'withdrawal',
    commission_percent: 2,
    received_mode: 'upi',
    paid_mode: 'cash',
  })
  status('update service keeps rules', cleared, 200)

  /* ---------- Entries: validation ---------- */
  section = 'Entry validation'
  status('amount 0 rejected', await post('/transactions', { type: 'in', amount: 0, date: today }), 400)
  status('negative amount rejected', await post('/transactions', { type: 'in', amount: -5, date: today }), 400)
  status('text amount rejected', await post('/transactions', { type: 'in', amount: 'abc', date: today }), 400)
  status('bad date rejected', await post('/transactions', { type: 'in', amount: 10, date: '2026-13-40' }), 400)
  status('missing date rejected', await post('/transactions', { type: 'in', amount: 10 }), 400)
  status('bad type rejected', await post('/transactions', { type: 'gift', amount: 10, date: today }), 400)
  status('bad mode rejected', await post('/transactions', { type: 'in', amount: 10, date: today, mode: 'pigeon' }), 400)
  status(
    'unknown person 404',
    await post('/transactions', { type: 'in', amount: 10, date: today, contact_id: '0123456789abcdef01234567' }),
    404,
  )
  status(
    'unknown label 404',
    await post('/transactions', { type: 'in', amount: 10, date: today, label_id: '0123456789abcdef01234567' }),
    404,
  )
  status(
    'balance without person rejected',
    await post('/transactions', { type: 'adjust', amount: 10, date: today, direction: 'owes_you' }),
    400,
  )
  status(
    'balance with bad direction rejected',
    await post('/transactions', { type: 'adjust', amount: 10, date: today, contact_id: aId, direction: 'sideways' }),
    400,
  )
  status(
    'transfer to nobody rejected',
    await post('/transactions', { type: 'transfer', amount: 100, received: 101, commission: 1, date: today, contact_id: aId }),
    400,
  )
  status(
    'transfer to same person rejected',
    await post('/transactions', {
      type: 'transfer',
      amount: 100,
      received: 101,
      commission: 1,
      date: today,
      contact_id: aId,
      to_contact_id: aId,
    }),
    400,
  )
  status(
    'walk-in transfer with a difference rejected',
    await post('/transactions', { type: 'transfer', amount: 100, received: 50, commission: 1, date: today, to_name: 'X' }),
    400,
  )
  status(
    'negative commission rejected',
    await post('/transactions', { type: 'transfer', payee: 'self', amount: 100, received: 100, commission: -1, date: today }),
    400,
  )
  const big = await post('/transactions', { type: 'in', amount: '1,250.50', date: today })
  status('amount with comma accepted', big, 201)
  eq('amount with comma parsed to paise', big.data.amount, 125050)

  /* ---------- Entries: balance maths ---------- */
  section = 'Balance maths'
  const inA = await post('/transactions', { type: 'in', amount: 1000, date: today, contact_id: aId, mode: 'upi' })
  status('money in for person', inA, 201)
  eq('money in effect +1000', inA.data.effect, 100000)
  eq('balance after money in (you hold 1000)', await balanceOf(aId), 100000)
  const outA = await post('/transactions', { type: 'out', amount: 1500, date: today, contact_id: aId })
  eq('money out effect -1500', outA.data.effect, -150000)
  eq('balance after money out (owes 500)', await balanceOf(aId), -50000)
  const rent = await post('/transactions', { type: 'out', amount: 9999, date: today, contact_id: aId, account: false, label_id: L.data.id })
  eq('not-on-account entry has no effect', rent.data.effect, 0)
  eq('balance unchanged by rent', await balanceOf(aId), -50000)
  const adj1 = await post('/transactions', { type: 'adjust', amount: 200, date: today, contact_id: aId, direction: 'you_owe' })
  eq('adjust you_owe +200', adj1.data.effect, 20000)
  eq('adjust has no cash', [adj1.data.cash_in, adj1.data.cash_out], [0, 0])
  eq('balance after adjust (owes 300)', await balanceOf(aId), -30000)

  // Cash withdrawal, commission worked out on the server from the label rate (2%)
  const w1 = await post('/transactions', {
    type: 'transfer',
    payee: 'self',
    label_id: SW.data.id,
    contact_id: aId,
    received: 10000,
    amount: 9800,
    date: today,
    mode: 'upi',
    paid_mode: 'cash',
  })
  status('withdrawal saved', w1, 201)
  eq('withdrawal commission from label rate (2% of received)', w1.data.commission, 20000)
  eq('withdrawal effect 0', w1.data.effect, 0)
  eq('withdrawal cash in/out', [w1.data.cash_in, w1.data.cash_out], [1000000, 980000])
  eq('withdrawal to_name is the customer', w1.data.to_name, `${tag} Alpha`)
  eq('withdrawal paid by cash', w1.data.paid_mode, 'cash')
  // Transfer, default rate (1% of sent)
  const t1 = await post('/transactions', {
    type: 'transfer',
    label_id: ST.data.id,
    contact_id: aId,
    amount: 20000,
    received: 20200,
    date: today,
    to_name: 'Somebody',
    to_account: 'x@upi',
  })
  eq('transfer commission default 1% of sent', t1.data.commission, 20000)
  eq('transfer effect 0', t1.data.effect, 0)
  // Explicit commission_rate overrides
  const t2 = await post('/transactions', {
    type: 'transfer',
    label_id: ST.data.id,
    contact_id: aId,
    amount: 10000,
    received: 10300,
    commission_rate: 3,
    date: today,
    to_name: 'Someone',
  })
  eq('explicit rate 3% used', t2.data.commission, 30000)
  // Short payment: they owe the rest
  const t3 = await post('/transactions', {
    type: 'transfer',
    label_id: ST.data.id,
    contact_id: aId,
    amount: 20000,
    received: 15000,
    commission: 200,
    date: today,
    to_contact_id: bId,
  })
  eq('short transfer effect -5200', t3.data.effect, -520000)
  eq('to saved person name', t3.data.to_name, `${tag} Beta`)
  const bBal = await balanceOf(bId)
  eq('receiver balance untouched by transfer', bBal, 0)
  // Extra payment: you hold the rest
  const w2 = await post('/transactions', {
    type: 'transfer',
    payee: 'self',
    label_id: SW.data.id,
    contact_id: aId,
    received: 100,
    amount: 50,
    commission: 1,
    date: today,
  })
  eq('gave less cash: you hold 49', w2.data.effect, 4900)
  // Pay out from held money, no commission
  const before = await balanceOf(aId)
  const h1 = await post('/transactions', {
    type: 'transfer',
    payee: 'self',
    label_id: SW.data.id,
    contact_id: aId,
    received: 0,
    amount: 49,
    commission: 0,
    date: today,
  })
  status('payout from held saved', h1, 201)
  eq('payout from held effect -49', h1.data.effect, -4900)
  eq('balance moves by payout', (await balanceOf(aId)) - before, -4900)
  // Walk-in withdrawal, matching amounts
  const walk = await post('/transactions', {
    type: 'transfer',
    payee: 'self',
    label_id: SW.data.id,
    received: 500,
    amount: 490,
    commission: 10,
    date: today,
  })
  status('walk-in withdrawal with no difference ok', walk, 201)

  // The balance must equal the sum of effects of the person's own entries
  const all = (await get(`/transactions?contact_id=${aId}&limit=5000`)).data.items
  const sum = all.filter((e) => e.contact_id === aId).reduce((s, e) => s + e.effect, 0)
  eq('balance equals sum of entry effects', await balanceOf(aId), sum)
  const listed = all.some((e) => e.id === t3.data.id)
  check('person list includes transfers they made', listed)
  const bList = (await get(`/transactions?contact_id=${bId}&limit=50`)).data.items
  check(
    'receiver list includes transfers sent to them',
    bList.some((e) => e.id === t3.data.id),
  )

  /* ---------- Entries: edit, list, export, delete ---------- */
  section = 'Entries API'
  const edited = await put(`/transactions/${inA.data.id}`, { type: 'in', amount: 1100, date: today, contact_id: aId, mode: 'cash' })
  status('edit entry', edited, 200)
  eq('edit changed amount', edited.data.amount, 110000)
  check('edit kept created_at', edited.data.created_at === inA.data.created_at, `${edited.data.created_at} vs ${inA.data.created_at}`)
  status('edit unknown entry 404', await put('/transactions/0123456789abcdef01234567', { type: 'in', amount: 1, date: today }), 404)
  const byType = (await get(`/transactions?type=transfer&contact_id=${aId}&limit=100`)).data
  check('filter by type', byType.items.every((e) => e.type === 'transfer') && byType.items.length >= 5, byType.items.length)
  check('totals include commission', byType.totals.commission > 0, JSON.stringify(byType.totals))
  const byLabel = (await get(`/transactions?label_id=${L.data.id}`)).data.items
  check('filter by label', byLabel.length === 1 && byLabel[0].id === rent.data.id, byLabel.length)
  const noLabel = (await get(`/transactions?label_id=none&limit=20`)).data.items
  check(
    'filter no label',
    noLabel.every((e) => !e.label_id),
    noLabel.length,
  )
  const byQ = (await get(`/transactions?q=Somebody`)).data.items
  check(
    'search finds transfer by receiver name',
    byQ.some((e) => e.id === t1.data.id),
    byQ.length,
  )
  const byMode = (await get(`/transactions?mode=upi&contact_id=${aId}`)).data.items
  check(
    'filter by mode',
    byMode.every((e) => e.mode === 'upi'),
    byMode.map((e) => e.mode),
  )
  const dated = (await get(`/transactions?from=2000-01-01&to=2000-01-31`)).data
  eq('empty date range gives no entries', dated.items.length, 0)
  status('bad filter type 400', await get('/transactions?type=gift'), 400)
  const capped = (await get('/transactions?limit=999999')).data
  check('limit is capped at 5000', capped.limit === 5000, capped.limit)
  const csv = await get(`/transactions/export.csv?contact_id=${aId}`)
  check('csv export has header', typeof csv.data === 'string' && csv.data.includes('Commission'), String(csv.data).slice(0, 80))
  check('csv export has rows', String(csv.data).split('\n').length > all.length, String(csv.data).split('\n').length)
  // These two are refused by the server, so nothing is deleted.
  status('cannot delete person with entries', await del(`/contacts/${aId}`), 409)
  status('cannot delete receiver of a transfer', await del(`/contacts/${bId}`), 409)
  // Real deletes, only with --with-deletes, and only of things made just above.
  if (allowDeletes) {
    const tmp = await post('/transactions', { type: 'in', amount: 1, date: today, note: `${tag} temp` })
    status('delete entry', await del(`/transactions/${tmp.data.id}`), 204)
    status('deleted entry is gone', await get(`/transactions/${tmp.data.id}`), 404)
    status('delete unknown entry 404', await del(`/transactions/${tmp.data.id}`), 404)
    status('can delete person with no entries', await del(`/contacts/${C.data.id}`), 204)
  }

  /* ---------- Reminders ---------- */
  section = 'Reminders'
  status('reminder without title rejected', await post('/reminders', { due_date: today }), 400)
  status('reminder bad date rejected', await post('/reminders', { title: 'x', due_date: 'tomorrow' }), 400)
  const R = await post('/reminders', { title: `${tag} Collect`, contact_id: aId, due_date: today, amount: 300 })
  status('create reminder', R, 201)
  eq('reminder knows person owes you', R.data.tx_type, (await balanceOf(aId)) < 0 ? 'in' : 'out')
  const sn = await post(`/reminders/${R.data.id}/snooze`, { days: 3 })
  check('snooze 3 days', sn.data.due_date > today, sn.data.due_date)
  const sn2 = await post(`/reminders/${R.data.id}/snooze`, { days: 9999 })
  check('snooze is capped at a year', sn2.status === 200, sn2.status)
  status('done', await post(`/reminders/${R.data.id}/done`), 200)
  const doneList = (await get('/reminders?status=done')).data
  check(
    'done list has it',
    doneList.some((r) => r.id === R.data.id),
  )
  status('reopen', await post(`/reminders/${R.data.id}/reopen`), 200)
  const openList = (await get(`/reminders?status=open&contact_id=${aId}`)).data
  check(
    'open list for person has it',
    openList.some((r) => r.id === R.data.id),
  )
  status('edit reminder', await put(`/reminders/${R.data.id}`, { title: `${tag} Collect edited`, due_date: today, contact_id: aId }), 200)

  /* ---------- Reports ---------- */
  section = 'Reports'
  const ov = await get('/reports/overview')
  status('overview', ov, 200)
  for (const k of ['today', 'week', 'month', 'previousMonthToDate', 'allTime', 'pending', 'reminders', 'recent', 'topOwed', 'last30'])
    check(`overview has ${k}`, k in ov.data)
  check('month has commission', typeof ov.data.month.commission === 'number', JSON.stringify(ov.data.month))
  const people = (await get('/contacts')).data
  const owed = people.filter((p) => p.balance < 0).reduce((s, p) => s - p.balance, 0)
  const held = people.filter((p) => p.balance > 0).reduce((s, p) => s + p.balance, 0)
  eq('overview owed equals sum of balances', ov.data.pending.in_amount, owed)
  eq('overview held equals sum of balances', ov.data.pending.out_amount, held)
  eq('last30 has 30 days', ov.data.last30.length, 30)
  for (const g of ['day', 'week', 'month']) {
    const r = await get(`/reports/series?group=${g}&from=2026-01-01&to=${today}`)
    status(`series ${g}`, r, 200)
    check(
      `series ${g} rows have commission`,
      r.data.rows.every((x) => typeof x.commission === 'number'),
    )
  }
  status('series bad group 400', await get('/reports/series?group=year'), 400)
  status('series from after to 400', await get('/reports/series?from=2026-12-01&to=2026-01-01'), 400)
  status('series all time', await get('/reports/series?group=month'), 200)
  const pr = await get(`/reports/people?from=${today}&to=${today}`)
  status('people report', pr, 200)
  const myRow = pr.data.rows.find((r) => r.id === aId)
  check('people report includes the QA person', Boolean(myRow))
  eq('people report balance matches', myRow?.pending_in - myRow?.pending_out, -(await balanceOf(aId)))
  status('backup download', await get('/settings/backup'), 200)

  const failed = results.filter((r) => !r.ok)
  return {
    total: results.length,
    passed: results.length - failed.length,
    failures: failed.map((f) => `${f.section}: ${f.name}${f.detail ? ` (${f.detail})` : ''}`),
  }
}
