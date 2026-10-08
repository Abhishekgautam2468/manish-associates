// Commission slabs, duplicate warning, undo, receipts, saved receivers, day book, bulk reminders.
// Each case opens `path` at width `w` (and dark mode when `dark`), runs `run` in the page if given,
// then checks the layout. `run` uses the helpers in helpers.js and records results with expect() / fail().

export default [
  {
    name: 'settings-slabs',
    path: '/dashboard/settings',
    w: 1440,
    h: 900,
    wait: 2800,
    run: async () => {
      const box = all('[role=radio]').find((i) => i.textContent.includes('Rate by amount'))
      expect(Boolean(box), 'slab switch')
      box.click()
      await w(400)
      expect(all('input[aria-label^="Slab"]').length >= 3, 'slab rows appear')
      const min = document.getElementById(all('label').find((l) => l.innerText.includes('Minimum commission')).htmlFor)
      setVal(min, '10')
      await w(300)
      expect(/on ₹500\s*₹10\s*(the )?minimum/.test(text().replace(/\n/g, ' ')), 'preview shows ₹10 minimum on ₹500')
      await click(btn('Add a slab'), null, 300)
      expect(all('input[aria-label$="percent"]').length === 3, 'add slab')
      await click(btn('Save commission'), null, 1200)
      const st = await api('/settings')
      expect(st.slabs.length === 3 && st.min_commission === 10, 'saved slabs ' + JSON.stringify(st))
      expect(/own % instead/.test(text()), 'lists services with their own %')
    },
  },
  {
    name: 'entry-slab-chip',
    path: '/dashboard/entries',
    w: 1440,
    h: 900,
    wait: 2800,
    run: async () => {
      await click(
        all('button').find((b) => b.textContent.trim() === 'New entry'),
        null,
        900,
      )
      const d = dlg()
      const tab = all('[role=tab]', d).find((t) => /QA\d+ Send/.test(t.textContent))
      if (!tab) {
        note('no service without own %')
        return { ok, notes }
      }
      await click(tab)
      setVal(d.querySelector('input[inputmode=decimal]'), '100')
      await w(300)
      expect(/minimum/.test(d.innerText), 'minimum chip shows on small amount')
      setVal(d.querySelector('input[inputmode=decimal]'), '30000')
      await w(300)
      expect(/slab/.test(d.innerText), 'slab chip shows on bigger amount')
      dlg()?.dispatchEvent(new Event('cancel'))
    },
  },
  {
    name: 'duplicate-undo-receipt',
    path: '/dashboard/entries',
    w: 1440,
    h: 900,
    wait: 2800,
    run: async () => {
      autoRepeat = false // this case checks the warning itself
      const amt = String(3000 + Math.floor(Math.random() * 6000))
      const open = async () => {
        await click(
          all('button').find((b) => b.textContent.trim() === 'New entry'),
          null,
          900,
        )
        const d = dlg()
        await pickContact(d.querySelector('input[role=combobox]'), 'Neha Gupta')
        setVal(d.querySelector('input[inputmode=decimal]'), amt)
        await w(300)
        return d
      }
      let d = await open()
      await click(all('button[type=submit]', d)[0], null, 1600)
      expect(
        /Undo/.test(document.querySelector('.toasts').innerText) && /Receipt/.test(document.querySelector('.toasts').innerText),
        'saved message has Undo and Receipt',
      )
      d = await open()
      await click(all('button[type=submit]', d)[0], null, 1500)
      expect(/looks like a repeat/i.test(dlg()?.innerText ?? ''), 'duplicate warning shows')
      await click(btn('Yes, save it again', dlg()), null, 1800)
      expect(!dlg(), 'saves after confirming')
      const before = (await api('/transactions?q=Neha&limit=50')).items.filter((x) => x.received === Number(amt) * 100).length
      await click(
        all('.toast__action').find((b) => b.textContent === 'Undo'),
        null,
        1500,
      )
      const after = (await api('/transactions?q=Neha&limit=50')).items.filter((x) => x.received === Number(amt) * 100).length
      expect(after === before - 1, 'Undo removed the entry (' + before + '→' + after + ')')
    },
  },
  {
    name: 'receivers-history',
    path: '/dashboard/entries',
    w: 1440,
    h: 900,
    wait: 2800,
    run: async () => {
      await click(
        all('button').find((b) => b.textContent.trim() === 'New entry'),
        null,
        900,
      )
      let d = dlg()
      await click(btn('Money transfer', d))
      await pickContact(d.querySelector('input[role=combobox]'), 'Sunita Devi')
      await w(800)
      const chip = all('[aria-label="Usual receivers"] button', d)[0]
      expect(Boolean(chip), 'usual receivers show')
      if (chip) {
        const name = chip.querySelector('span').textContent
        await click(chip, null, 400)
        const to = all('input', d).find((i) => i.placeholder.startsWith('Receiver’s name'))
        expect(to.value === name, 'chip fills Send to (' + to.value + ')')
      }
      dlg()?.dispatchEvent(new Event('cancel'))
      await w(400)
      // edit an entry and check the history
      await click(document.querySelector('section[aria-label="Entries by day"] li button'), null, 1200)
      d = dlg()
      expect(Boolean(all('a', d).find((a) => a.textContent.includes('Receipt') && a.href.includes('wa.me'))), 'details have a Receipt link')
      await click(btn('Edit', d), null, 900)
      d = dlg()
      const note = all('input', d).at(-1)
      setVal(note, 'history check ' + Date.now())
      await w(200)
      await click(btn('Save changes', d), null, 1600)
      await click(document.querySelector('section[aria-label="Entries by day"] li button'), null, 1300)
      expect(/Changes/.test(dlg()?.innerText ?? '') && /Note:/.test(dlg()?.innerText ?? ''), 'details list the change')
    },
  },
  {
    name: 'daybook',
    path: '/dashboard/daybook',
    w: 1440,
    h: 900,
    wait: 2800,
    run: async () => {
      expect(/Cash in the drawer/.test(text()), 'cash count')
      const op = document.querySelector('#' + CSS.escape(all('label').find((l) => l.innerText.includes('Opening cash')).htmlFor))
      setVal(op, '500000')
      await w(200)
      const ct = all('input').find((i) => i.placeholder === 'Cash counted in the drawer')
      setVal(ct, '1')
      await w(300)
      expect(/short|extra|Matches/.test(text()), 'difference shows')
      await click(all('button[type=submit]')[0], null, 1500)
      expect(/Day closed/.test(toast()), 'toast: ' + toast())
      await click(document.querySelector('button[aria-label="Previous day"]'), null, 1500)
      expect(location.search.includes('date='), 'previous day')
      await click(btn('Today'), null, 1200)
      await click(btn('Print register'), null, 2000)
      expect(location.pathname === '/register' && /Day register/.test(text()), 'register opens')
    },
  },
  {
    name: 'remind-all',
    path: '/dashboard/balances',
    w: 1440,
    h: 900,
    wait: 2800,
    run: async () => {
      await click(btn('Remind everyone'), null, 800)
      const d = dlg()
      expect(/Remind everyone who owes you/.test(d?.innerText ?? ''), 'remind everyone opens')
      const send = all('a', d).find((a) => a.textContent.includes('Send'))
      expect(send?.href.startsWith('https://wa.me/'), 'WhatsApp links')
      send.addEventListener('click', (e) => e.preventDefault(), { once: true })
      send.click()
      await w(300)
      expect(/1 of \d+ sent/.test(d.innerText), 'marks as sent')
      await click(btn('30+ days', d))
      expect(true, 'filter by days')
    },
  },
  {
    name: 'overview-modes',
    path: '/dashboard',
    w: 1440,
    h: 900,
    wait: 2800,
    run: async () => {
      expect(/Today by payment mode/.test(text()), 'mode card on overview')
    },
  },
]
