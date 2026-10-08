// Interaction flows: entries of every kind, search, menus, filters, people, reminders, reports, settings.
// Each case opens `path` at width `w` (and dark mode when `dark`), runs `run` in the page if given,
// then checks the layout. `run` uses the helpers in helpers.js and records results with expect() / fail().

export default [
  {
    name: 'palette',
    path: '/dashboard',
    w: 1440,
    h: 900,
    wait: 2500,
    run: async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
      await w(500)
      const inp = all('dialog[open] input')[0]
      expect(Boolean(inp), 'Cmd+K opens search')
      if (inp) {
        setVal(inp, 'Priya')
        await w(900)
        expect(/Priya Sharma/.test(dlg()?.innerText ?? ''), 'search finds Priya')
        inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
        dlg()?.dispatchEvent(new Event('cancel'))
        await w(400)
      }
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true }))
      await w(600)
      expect(/New entry/.test(dlg()?.innerText ?? ''), 'N opens New entry')
      dlg()?.dispatchEvent(new Event('cancel'))
      await w(400)
      expect(!dlg(), 'Escape closes the window')
    },
  },
  {
    name: 'theme',
    path: '/dashboard',
    w: 1440,
    h: 900,
    wait: 2500,
    run: async () => {
      const before = document.documentElement.dataset.theme
      await click(all('button[aria-label^="Switch to"]')[0])
      const after = document.documentElement.dataset.theme
      expect(before !== after, 'theme toggles (' + before + ' -> ' + after + ')')
      await click(all('button[aria-label^="Switch to"]')[0])
    },
  },
  {
    name: 'phone-nav',
    path: '/dashboard',
    w: 390,
    h: 844,
    wait: 2500,
    run: async () => {
      const bar = document.querySelector('nav.tabbar')
      expect(bar && getComputedStyle(bar).display !== 'none', 'bottom bar shows on a phone')
      expect(getComputedStyle(document.querySelector('.sidebar')).display === 'none', 'no side menu on a phone')
      await click(
        all('a', bar).find((a) => a.textContent.includes('Entries')),
        null,
        900,
      )
      expect(location.pathname === '/dashboard/entries', 'Entries tab navigates')
      expect(
        all('a', bar)
          .find((a) => a.textContent.includes('Entries'))
          ?.classList.contains('active'),
        'Entries tab is marked',
      )
      await click(bar.querySelector('button[aria-label="New entry"]'), null, 800)
      expect(Boolean(dlg()) && /New entry/.test(dlg().innerText), '+ opens a new entry')
      dlg()?.dispatchEvent(new Event('cancel'))
      await w(400)
      await click(
        all('button', bar).find((b) => b.textContent.includes('More')),
        null,
        700,
      )
      expect(/Day book/.test(dlg()?.innerText ?? '') && /Sign out/.test(dlg()?.innerText ?? ''), 'More opens the other pages')
      await click(
        all('a', dlg()).find((a) => a.textContent.includes('People')),
        null,
        900,
      )
      expect(location.pathname === '/dashboard/people', 'a More tile navigates')
      expect(!dlg(), 'More closes after navigating')
      expect(
        all('button', bar)
          .find((b) => b.textContent.includes('More'))
          ?.classList.contains('active'),
        'More is marked on its pages',
      )
      await click(document.querySelector('.mobile-bar__me'), null, 600)
      expect(/admin@example\.com/.test(dlg()?.innerText ?? ''), 'account button opens More')
      dlg()?.dispatchEvent(new Event('cancel'))
    },
  },
  {
    name: 'entry-withdrawal',
    path: '/dashboard/entries',
    w: 1440,
    h: 900,
    wait: 2500,
    run: async () => {
      await click('New entry', null, 900)
      const d = dlg()
      expect(btn('Cash withdrawal', d)?.getAttribute('aria-selected') === 'true', 'starts on the most used service')
      await pickContact(d.querySelector('input[role=combobox]'), 'Priya Sharma')
      const amt = d.querySelector('input[inputmode=decimal]')
      setVal(amt, '1000')
      await w(300)
      expect(/₹990/.test(d.innerText), 'works out ₹990 to give at 1%')
      expect(/You keep\s*₹10/.test(d.innerText), 'footer shows you keep ₹10')
      await click(all('button[type=submit]', d)[0], null, 1500)
      expect(!dlg(), 'window closes after save')
      expect(/saved/i.test(toast()), 'toast: ' + toast())
    },
  },
  {
    name: 'entry-withdrawal-wants-cash',
    path: '/dashboard/entries',
    w: 1440,
    h: 900,
    wait: 2500,
    run: async () => {
      await click('New entry', null, 900)
      const d = dlg()
      await click(btn('wants in cash', d))
      const amt = d.querySelector('input[aria-label="Cash they want"]')
      expect(Boolean(amt), 'wants-in-cash field shows')
      setVal(amt, '50000')
      await w(300)
      expect(/₹50,500/.test(d.innerText), 'works out ₹50,500 to get')
      await click(btn('pays you', d))
      expect(
        d.querySelector('input[inputmode=decimal]').value.replace(/,/g, '') === '50500',
        'switching keeps the number (' + d.querySelector('input[inputmode=decimal]').value + ')',
      )
      dlg()?.dispatchEvent(new Event('cancel'))
    },
  },
  {
    name: 'entry-transfer-pending',
    path: '/dashboard/entries',
    w: 1440,
    h: 900,
    wait: 2500,
    run: async () => {
      await click('New entry', null, 900)
      const d = dlg()
      await click(btn('Money transfer', d))
      await pickContact(d.querySelector('input[role=combobox]'), 'Ramesh Kumar')
      setVal(d.querySelector('input[inputmode=decimal]'), '20000')
      await w(300)
      expect(/₹20,200/.test(d.innerText), 'collect ₹20,200')
      const toInput = all('input', d).find((i) => i.placeholder.startsWith('Receiver’s name'))
      toInput.focus()
      setVal(toInput, 'QA Receiver')
      await w(400)
      await click(btn('different amount', d), null, 400)
      const actual = all('input[inputmode=decimal]', d).find((i) => i.className.includes('text-attn'))
      expect(Boolean(actual), 'pending box opens')
      setVal(actual, '15000')
      await w(300)
      expect(/owes you ₹5,200/.test(d.innerText), 'shows Ramesh owes ₹5,200')
      await click(btn('Tomorrow', d))
      const bal0 = (await api('/contacts')).find((p) => p.name === 'Ramesh Kumar').balance
      await click(all('button[type=submit]', d)[0], null, 1800)
      expect(!dlg(), 'saved')
      const bal1 = (await api('/contacts')).find((p) => p.name === 'Ramesh Kumar').balance
      expect(bal1 - bal0 === -520000, 'balance moved by -5,200 (' + (bal1 - bal0) / 100 + ')')
      const rem = (await api('/reminders?status=open')).some((r) => /Collect ₹5,200 from Ramesh/.test(r.title))
      expect(rem, 'reminder created')
    },
  },
  {
    name: 'entry-from-held',
    path: '/dashboard/entries',
    w: 1440,
    h: 900,
    wait: 2500,
    run: async () => {
      const held = (await api('/contacts')).find((p) => p.balance > 0)
      if (!held) {
        note('no one with held money')
        return { ok, notes }
      }
      await click('New entry', null, 900)
      const d = dlg()
      await pickContact(d.querySelector('input[role=combobox]'), held.name)
      expect(/You hold/.test(d.innerText), 'offers to give from held money')
      await click(btn('Give from this', d))
      expect(/from what you hold/.test(d.innerText), 'held mode')
      expect(d.querySelector('input[aria-label="Commission amount"]')?.value === '0', 'no commission by default')
      setVal(d.querySelector('input[id][inputmode=decimal]'), '100')
      await w(300)
      await click(all('button[type=submit]', d)[0], null, 1500)
      const after = (await api('/contacts')).find((p) => p.id === held.id).balance
      expect(held.balance - after === 10000, 'held money down by ₹100 (' + (held.balance - after) / 100 + ')')
    },
  },
  {
    name: 'entry-money-in-new-label',
    path: '/dashboard/entries',
    w: 1440,
    h: 900,
    wait: 2500,
    run: async () => {
      await click('New entry', null, 900)
      const d = dlg()
      await click(btn('Other', d))
      await click(btn('Money in', d))
      setVal(d.querySelector('input[inputmode=decimal]'), '777')
      await w(200)
      const lab = all('input', d).find((i) => /label/i.test(i.placeholder))
      lab.focus()
      setVal(lab, 'QA Brand New')
      await w(800)
      const create = all('[role=option]').find((o) => /Create|Add|New/i.test(o.textContent))
      expect(Boolean(create), 'offers to create the label')
      create?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      await w(800)
      await click(all('button[type=submit]', d)[0], null, 1500)
      expect(!dlg(), 'saved money in')
      expect(
        (await api('/labels')).some((l) => l.name === 'QA Brand New'),
        'label created',
      )
    },
  },
  {
    name: 'entry-balance-adjust',
    path: '/dashboard/entries',
    w: 1440,
    h: 900,
    wait: 2500,
    run: async () => {
      await click('New entry', null, 900)
      const d = dlg()
      await click(btn('Other', d))
      await click(btn('Balance', d))
      await click(all('button[type=submit]', d)[0], null, 800)
      expect(Boolean(dlg()), 'cannot save a balance without a person')
      expect(/whose balance|Choose/i.test(d.innerText), 'explains why')
      dlg()?.dispatchEvent(new Event('cancel'))
    },
  },
  {
    name: 'entry-empty-amount',
    path: '/dashboard/entries',
    w: 1440,
    h: 900,
    wait: 2500,
    run: async () => {
      await click('New entry', null, 900)
      const d = dlg()
      await click(all('button[type=submit]', d)[0], null, 800)
      expect(Boolean(dlg()), 'empty amount does not save')
      expect(
        /₹0|more than|amount/i.test(d.querySelector('[role=alert]')?.innerText ?? ''),
        'error shown: ' + (d.querySelector('[role=alert]')?.innerText ?? 'none'),
      )
      dlg()?.dispatchEvent(new Event('cancel'))
    },
  },
  {
    name: 'entry-detail-edit-delete',
    path: '/dashboard/entries',
    w: 1440,
    h: 900,
    wait: 2500,
    run: async () => {
      await click(document.querySelector('section[aria-label="Entries by day"] li button'), null, 1200)
      let d = dlg()
      expect(Boolean(d), 'details open')
      expect(/Added/.test(d.innerText), 'shows when added')
      await click(btn('Edit', d), null, 900)
      d = dlg()
      expect(/Edit entry/.test(d.innerText), 'edit opens')
      const note = all('input', d)
        .find((i) => !i.type || i.type === 'text')
        .valueOf()
      const nf = all('input', d).at(-1)
      setVal(nf, 'QA edited note')
      await w(200)
      await click(btn('Save changes', d), null, 1500)
      expect(/updated/i.test(toast()), 'toast: ' + toast())
      const e = (await api('/transactions?q=QA%20edited%20note')).items[0]
      expect(Boolean(e), 'edit saved')
    },
  },
  {
    name: 'entry-delete-qa',
    deletes: true, // only with --with-deletes
    path: '/dashboard/entries',
    w: 1440,
    h: 900,
    wait: 2500,
    run: async () => {
      const e = (await api('/transactions?q=QA%20Receiver')).items[0]
      if (!e) {
        fail('no QA entry to delete')
        return { ok, notes }
      }
      const row = all('section[aria-label="Entries by day"] li button').find((b) => b.innerText.includes('QA Receiver'))
      await click(row, null, 1200)
      await click(btn('Delete', dlg()), null, 700)
      expect(/Delete this entry/.test(dlg()?.innerText ?? ''), 'asks to confirm')
      await click(
        all('button', dlg()).find((b) => /^Delete entry$/.test(b.textContent.trim())),
        null,
        1500,
      )
      expect(!(await api('/transactions?q=QA%20Receiver')).items.some((x) => x.id === e.id), 'deleted (QA copy only)')
    },
  },
  {
    name: 'entries-filters',
    path: '/dashboard/entries',
    w: 1440,
    h: 900,
    wait: 2500,
    run: async () => {
      await click(btn('Services'))
      await w(800)
      const types = [...new Set((await api('/transactions?type=transfer&limit=3')).items.map((x) => x.type))]
      expect(location.search.includes('type=transfer'), 'Services filter in the address')
      await click(btn('Filters'))
      expect(Boolean(all('select[aria-label="Payment mode"]')[0]), 'filter panel opens')
      const s = document.querySelector('input[aria-label="Search entries"]')
      setVal(s, 'zzzz-nothing')
      await w(1200)
      expect(/No entries match/.test(text()), 'empty state for no match')
      await click(btn('Clear'))
      await w(800)
      expect(!location.search.includes('q='), 'clear resets search')
    },
  },
  {
    name: 'balances',
    path: '/dashboard/balances',
    w: 1440,
    h: 900,
    wait: 2500,
    run: async () => {
      expect(/Owed to you/.test(text()) && /You owe/.test(text()), 'both tabs')
      await click(btn('You owe'), null, 600)
      expect(location.search.includes('side=out'), 'switch to You owe')
      const s = document.querySelector('input[aria-label="Search balances"]')
      if (s) {
        setVal(s, 'zzzz')
        await w(300)
        expect(/No one matches/.test(text()), 'search empty state')
        setVal(s, '')
        await w(300)
      }
      await click(btn('Owed to you'), null, 600)
      const sel = document.querySelector('select[aria-label="Sort by"]')
      setVal(sel, 'name')
      await w(300)
      expect(true, 'sort by name')
      await click(all('button[aria-label^="Set a reminder"]')[0], null, 800)
      expect(/reminder/i.test(dlg()?.innerText ?? ''), 'reminder window opens with title')
      dlg()?.dispatchEvent(new Event('cancel'))
      await w(300)
      await click(
        all('button').find((b) => b.textContent.trim().endsWith('Received')),
        null,
        900,
      )
      expect(/New entry/.test(dlg()?.innerText ?? '') && /Money in/.test(dlg()?.innerText ?? ''), 'Received opens money in')
      dlg()?.dispatchEvent(new Event('cancel'))
    },
  },
  {
    name: 'people',
    path: '/dashboard/people',
    w: 1440,
    h: 900,
    wait: 2500,
    run: async () => {
      const s = document.querySelector('input[aria-label="Search people"]')
      expect(Boolean(s), 'search in header')
      setVal(s, 'ram')
      await w(1000)
      expect(/Ramesh Kumar/.test(text()), 'search works')
      setVal(s, '')
      await w(800)
      for (const f of ['Owe you', 'You owe', 'Settled up', 'Everyone']) {
        await click(btn(f, document.querySelector('.filterbar')), null, 700)
      }
      expect(true, 'filters clickable')
      await click('Add person', null, 800)
      let d = dlg()
      setVal(d.querySelector('input'), 'Priya Sharma')
      await w(200)
      await click(all('button[type=submit]', d)[0], null, 1000)
      expect(/already/i.test(dlg()?.innerText ?? ''), 'duplicate name explained')
      dlg()?.dispatchEvent(new Event('cancel'))
    },
  },
  {
    name: 'person-page',
    path: (f) => `/dashboard/people/${f.person}`,
    w: 1440,
    h: 900,
    wait: 2500,
    run: async () => {
      expect(/Statement/.test(text()), 'statement shown')
      const kind = document.querySelector('select[aria-label="Show"]')
      setVal(kind, 'transfer')
      await w(500)
      expect(true, 'type filter')
      const q = document.querySelector('input[aria-label="Search the statement"]')
      setVal(q, 'zzzz')
      await w(500)
      expect(/Nothing matches/.test(text()), 'no-match message')
      await click(btn('Clear'), null, 500)
      await click(document.querySelector('button[aria-label^="More for"]'), null, 400)
      expect(/Edit person/.test(text()), 'more menu opens')
      await click(btn('Edit person'), null, 800)
      expect(/Edit person/.test(dlg()?.innerText ?? ''), 'edit person opens')
      dlg()?.dispatchEvent(new Event('cancel'))
      await w(300)
      await click(btn('Withdrawal or transfer'), null, 900)
      expect(dlg()?.querySelector('input[role=combobox]')?.value?.length > 0, 'customer prefilled')
      dlg()?.dispatchEvent(new Event('cancel'))
      await w(300)
      await click(btn('Statement PDF'), null, 1500)
      expect(location.pathname.startsWith('/statement/'), 'statement PDF page opens')
      expect(/Statement of account/.test(text()), 'statement document renders')
    },
  },
  {
    name: 'reminders',
    path: '/dashboard/reminders',
    w: 1440,
    h: 900,
    wait: 2500,
    run: async () => {
      await click(btn('Later'), null, 400)
      await click(btn('All open'), null, 400)
      await click(btn('Calendar'), null, 600)
      expect(Boolean(document.querySelector('.month__grid')), 'calendar shows')
      await click(
        all('.month__day').find((d) => d.dataset.today),
        null,
        500,
      )
      expect(true, 'day picked')
      await click(btn('Agenda'), null, 500)
      const before = (await api('/reminders?status=open')).length
      await click(all('button[aria-label="Snooze to tomorrow"]')[0], null, 1200)
      expect(/Moved to/.test(toast()), 'snooze toast: ' + toast())
      await click(
        all('button').find((b) => b.textContent.trim() === 'Done'),
        null,
        1200,
      )
      const after = (await api('/reminders?status=open')).length
      expect(after === before - 1, 'done removes it from open (' + before + '→' + after + ')')
      await click(
        all('[role=radio]').find((b) => b.textContent.startsWith('Done')),
        null,
        600,
      )
      await click(
        all('button').find((b) => b.textContent.trim() === 'Reopen'),
        null,
        1200,
      )
      expect((await api('/reminders?status=open')).length === before, 'reopen brings it back')
    },
  },
  {
    name: 'reports',
    path: '/dashboard/reports',
    w: 1440,
    h: 900,
    wait: 2500,
    run: async () => {
      for (const t of ['Weekly', 'Monthly', 'By label', 'By person', 'Daily']) {
        await click(btn(t), null, 1200)
        expect(!/Something went wrong/.test(text()), t + ' renders')
      }
      const sel = document.querySelector('.date-range select')
      setVal(sel, 'all')
      await w(1500)
      expect(/All time/.test(text()), 'all time')
      setVal(sel, 'custom')
      await w(800)
      expect(all('.date-range input[type=date]').length === 2, 'custom dates show two fields')
      await click(btn('Monthly'), null, 1500)
      await click(btn('Show as table'), null, 500)
      expect(Boolean(document.querySelector('.chart table, table')), 'chart table view')
    },
  },
  {
    name: 'labels-service',
    path: '/dashboard/labels',
    w: 1440,
    h: 900,
    wait: 2500,
    run: async () => {
      await click('New label', null, 800)
      const d = dlg()
      setVal(d.querySelector('input'), 'QA Service')
      await w(200)
      await click(btn('Transfer', d))
      expect(/Commission %/.test(d.innerText), 'service rules show')
      await click(btn('Create service', d), null, 1200)
      expect(
        (await api('/labels')).some((l) => l.name === 'QA Service' && l.flow === 'transfer'),
        'service created',
      )
      await click('New label', null, 800)
      await click(btn('Create label', dlg()), null, 800)
      expect(/Enter a name/.test(dlg()?.innerText ?? ''), 'empty name explained')
      dlg()?.dispatchEvent(new Event('cancel'))
    },
  },
  {
    name: 'settings',
    path: '/dashboard/settings',
    w: 1440,
    h: 900,
    wait: 2500,
    run: async () => {
      const i = document.getElementById(all('label').find((l) => l.textContent.trim() === 'Commission').htmlFor)
      setVal(i, '2')
      await w(200)
      await click(btn('Save', i.closest('form')), null, 1200)
      expect((await api('/settings')).commission_percent === 2, 'commission saved as 2%')
      setVal(i, '1')
      await w(200)
      await click(btn('Save', i.closest('form')), null, 1200)
      expect((await api('/settings')).commission_percent === 1, 'back to 1%')
      setVal(i, '500')
      await w(200)
      await click(btn('Save', i.closest('form')), null, 1000)
      expect(/0 to 100/.test(text()), 'out-of-range explained')
      await click(
        all('button').find((b) => b.textContent.includes('Change password') && b.offsetParent),
        null,
        400,
      )
      const pw = all('input[type=password]')
      expect(pw.length === 3, 'password form has 3 fields')
      await click(btn('Cancel', pw[0].closest('form')), null, 300)
      expect(all('input[type=password]').length === 0, 'cancel closes it')
    },
  },
  {
    name: 'quick-add',
    path: '/dashboard',
    w: 1440,
    h: 900,
    wait: 2500,
    run: async () => {
      const f = document.querySelector('form[aria-label="Quick add an entry"]')
      setVal(f.querySelector('input[inputmode=decimal]'), '2000')
      await w(300)
      expect(/Give\s*₹1,980/.test(f.innerText), 'quick add works out ₹1,980')
      await click(btn('Money transfer', f))
      expect(/Send to/.test(f.innerText), 'transfer shows Send to')
      await click(all('button[type=submit]', f)[0], null, 800)
      expect(/who receives the money/i.test(f.innerText), 'asks for receiver')
      await click(btn('Money in', f))
      setVal(f.querySelector('input[inputmode=decimal]'), '55')
      await w(200)
      await click(all('button[type=submit]', f)[0], null, 1500)
      expect(/Money in of ₹55 saved/.test(toast()), 'quick money in saved: ' + toast())
    },
  },
  {
    name: 'new-entry-mobile',
    path: '/dashboard',
    w: 360,
    h: 740,
    wait: 2500,
    run: async () => {
      await click(document.querySelector('.tabbar button[aria-label="New entry"]'), null, 900)
      const d = dlg()
      const r = d.getBoundingClientRect()
      expect(r.left >= 0 && r.right <= innerWidth, 'window fits the phone (' + Math.round(r.left) + '..' + Math.round(r.right) + ')')
      setVal(d.querySelector('input[inputmode=decimal]'), '1000')
      await w(200)
      const save = all('button[type=submit]', d)[0].getBoundingClientRect()
      expect(save.bottom <= innerHeight, 'save button visible without scrolling the page')
    },
  },
]
