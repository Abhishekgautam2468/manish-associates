// Opens each kind of entry, saves it without changes and checks nothing changed.
// Each case opens `path` at width `w` (and dark mode when `dark`), runs `run` in the page if given,
// then checks the layout. `run` uses the helpers in helpers.js and records results with expect() / fail().

export default [
  {
    name: 'edit-in-nobody',
    path: (f) => `/dashboard/entries?q=${f.tag}&range=custom&from=${f.today}&to=${f.today}`,
    w: 1440,
    h: 900,
    wait: 3000,
    shot: false,
    run: async () => {
      const before = await api('/transactions/' + FIX.entries['in-nobody'])
      const fmt = (p) => '₹' + (p / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })
      const rows = all('section[aria-label="Entries by day"] li button').filter((b) => b.innerText.includes(fmt(5500)))
      if (!rows.length) {
        fail('row not found for ' + fmt(5500))
        return { ok, notes }
      }
      note(rows.length + ' matching rows')
      let found = false
      for (const r of rows) {
        r.click()
        await w(1100)
        const d = dlg()
        if (d && d.innerText.includes(fmt(before.amount))) {
          found = true
          break
        }
        d?.dispatchEvent(new Event('cancel'))
        await w(300)
      }
      let d = dlg()
      if (!found || !d) {
        fail('details did not open')
        return { ok, notes }
      }
      await click(btn('Edit', d), null, 1000)
      d = dlg()
      if (!/^Edit /.test(d.querySelector('h2')?.textContent ?? '')) {
        fail('edit window did not open')
        return { ok, notes }
      }
      await click(btn('Save changes', d), null, 1600)
      if (dlg()) {
        fail('did not save: ' + (dlg().querySelector('[role=alert]')?.innerText || dlg().innerText.slice(0, 160).replace(/\n/g, ' ')))
        return { ok, notes }
      }
      const after = await api('/transactions/' + FIX.entries['in-nobody'])
      const keys = [
        'type',
        'amount',
        'received',
        'commission',
        'payee',
        'mode',
        'paid_mode',
        'contact_id',
        'to_contact_id',
        'to_name',
        'to_account',
        'label_id',
        'account',
        'direction',
        'date',
        'note',
        'effect',
      ]
      const changed = keys
        .filter((k) => JSON.stringify(before[k] ?? null) !== JSON.stringify(after[k] ?? null))
        .map((k) => k + ': ' + JSON.stringify(before[k]) + ' -> ' + JSON.stringify(after[k]))
      expect(changed.length === 0, 'unchanged after re-save' + (changed.length ? ' | ' + changed.join(' ; ') : ''))
    },
  },
  {
    name: 'edit-held',
    path: (f) => `/dashboard/entries?q=${f.tag}&range=custom&from=${f.today}&to=${f.today}`,
    w: 1440,
    h: 900,
    wait: 3000,
    shot: false,
    run: async () => {
      const before = await api('/transactions/' + FIX.entries['held'])
      const fmt = (p) => '₹' + (p / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })
      const rows = all('section[aria-label="Entries by day"] li button').filter((b) => b.innerText.includes(fmt(10000)))
      if (!rows.length) {
        fail('row not found for ' + fmt(10000))
        return { ok, notes }
      }
      note(rows.length + ' matching rows')
      let found = false
      for (const r of rows) {
        r.click()
        await w(1100)
        const d = dlg()
        if (d && d.innerText.includes(fmt(before.amount))) {
          found = true
          break
        }
        d?.dispatchEvent(new Event('cancel'))
        await w(300)
      }
      let d = dlg()
      if (!found || !d) {
        fail('details did not open')
        return { ok, notes }
      }
      await click(btn('Edit', d), null, 1000)
      d = dlg()
      if (!/^Edit /.test(d.querySelector('h2')?.textContent ?? '')) {
        fail('edit window did not open')
        return { ok, notes }
      }
      await click(btn('Save changes', d), null, 1600)
      if (dlg()) {
        fail('did not save: ' + (dlg().querySelector('[role=alert]')?.innerText || dlg().innerText.slice(0, 160).replace(/\n/g, ' ')))
        return { ok, notes }
      }
      const after = await api('/transactions/' + FIX.entries['held'])
      const keys = [
        'type',
        'amount',
        'received',
        'commission',
        'payee',
        'mode',
        'paid_mode',
        'contact_id',
        'to_contact_id',
        'to_name',
        'to_account',
        'label_id',
        'account',
        'direction',
        'date',
        'note',
        'effect',
      ]
      const changed = keys
        .filter((k) => JSON.stringify(before[k] ?? null) !== JSON.stringify(after[k] ?? null))
        .map((k) => k + ': ' + JSON.stringify(before[k]) + ' -> ' + JSON.stringify(after[k]))
      expect(changed.length === 0, 'unchanged after re-save' + (changed.length ? ' | ' + changed.join(' ; ') : ''))
    },
  },
  {
    name: 'edit-wd',
    path: (f) => `/dashboard/entries?q=${f.tag}&range=custom&from=${f.today}&to=${f.today}`,
    w: 1440,
    h: 900,
    wait: 3000,
    shot: false,
    run: async () => {
      const before = await api('/transactions/' + FIX.entries['wd'])
      const fmt = (p) => '₹' + (p / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })
      const rows = all('section[aria-label="Entries by day"] li button').filter((b) => b.innerText.includes(fmt(100000)))
      if (!rows.length) {
        fail('row not found for ' + fmt(100000))
        return { ok, notes }
      }
      note(rows.length + ' matching rows')
      let found = false
      for (const r of rows) {
        r.click()
        await w(1100)
        const d = dlg()
        if (d && d.innerText.includes(fmt(before.amount))) {
          found = true
          break
        }
        d?.dispatchEvent(new Event('cancel'))
        await w(300)
      }
      let d = dlg()
      if (!found || !d) {
        fail('details did not open')
        return { ok, notes }
      }
      await click(btn('Edit', d), null, 1000)
      d = dlg()
      if (!/^Edit /.test(d.querySelector('h2')?.textContent ?? '')) {
        fail('edit window did not open')
        return { ok, notes }
      }
      await click(btn('Save changes', d), null, 1600)
      if (dlg()) {
        fail('did not save: ' + (dlg().querySelector('[role=alert]')?.innerText || dlg().innerText.slice(0, 160).replace(/\n/g, ' ')))
        return { ok, notes }
      }
      const after = await api('/transactions/' + FIX.entries['wd'])
      const keys = [
        'type',
        'amount',
        'received',
        'commission',
        'payee',
        'mode',
        'paid_mode',
        'contact_id',
        'to_contact_id',
        'to_name',
        'to_account',
        'label_id',
        'account',
        'direction',
        'date',
        'note',
        'effect',
      ]
      const changed = keys
        .filter((k) => JSON.stringify(before[k] ?? null) !== JSON.stringify(after[k] ?? null))
        .map((k) => k + ': ' + JSON.stringify(before[k]) + ' -> ' + JSON.stringify(after[k]))
      expect(changed.length === 0, 'unchanged after re-save' + (changed.length ? ' | ' + changed.join(' ; ') : ''))
    },
  },
  {
    name: 'edit-wd-diff',
    path: (f) => `/dashboard/entries?q=${f.tag}&range=custom&from=${f.today}&to=${f.today}`,
    w: 1440,
    h: 900,
    wait: 3000,
    shot: false,
    run: async () => {
      const before = await api('/transactions/' + FIX.entries['wd-diff'])
      const fmt = (p) => '₹' + (p / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })
      const rows = all('section[aria-label="Entries by day"] li button').filter((b) => b.innerText.includes(fmt(10000)))
      if (!rows.length) {
        fail('row not found for ' + fmt(10000))
        return { ok, notes }
      }
      note(rows.length + ' matching rows')
      let found = false
      for (const r of rows) {
        r.click()
        await w(1100)
        const d = dlg()
        if (d && d.innerText.includes(fmt(before.amount))) {
          found = true
          break
        }
        d?.dispatchEvent(new Event('cancel'))
        await w(300)
      }
      let d = dlg()
      if (!found || !d) {
        fail('details did not open')
        return { ok, notes }
      }
      await click(btn('Edit', d), null, 1000)
      d = dlg()
      if (!/^Edit /.test(d.querySelector('h2')?.textContent ?? '')) {
        fail('edit window did not open')
        return { ok, notes }
      }
      await click(btn('Save changes', d), null, 1600)
      if (dlg()) {
        fail('did not save: ' + (dlg().querySelector('[role=alert]')?.innerText || dlg().innerText.slice(0, 160).replace(/\n/g, ' ')))
        return { ok, notes }
      }
      const after = await api('/transactions/' + FIX.entries['wd-diff'])
      const keys = [
        'type',
        'amount',
        'received',
        'commission',
        'payee',
        'mode',
        'paid_mode',
        'contact_id',
        'to_contact_id',
        'to_name',
        'to_account',
        'label_id',
        'account',
        'direction',
        'date',
        'note',
        'effect',
      ]
      const changed = keys
        .filter((k) => JSON.stringify(before[k] ?? null) !== JSON.stringify(after[k] ?? null))
        .map((k) => k + ': ' + JSON.stringify(before[k]) + ' -> ' + JSON.stringify(after[k]))
      expect(changed.length === 0, 'unchanged after re-save' + (changed.length ? ' | ' + changed.join(' ; ') : ''))
    },
  },
  {
    name: 'edit-tr-diff',
    path: (f) => `/dashboard/entries?q=${f.tag}&range=custom&from=${f.today}&to=${f.today}`,
    w: 1440,
    h: 900,
    wait: 3000,
    shot: false,
    run: async () => {
      const before = await api('/transactions/' + FIX.entries['tr-diff'])
      const fmt = (p) => '₹' + (p / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })
      const rows = all('section[aria-label="Entries by day"] li button').filter((b) => b.innerText.includes(fmt(1500000)))
      if (!rows.length) {
        fail('row not found for ' + fmt(1500000))
        return { ok, notes }
      }
      note(rows.length + ' matching rows')
      let found = false
      for (const r of rows) {
        r.click()
        await w(1100)
        const d = dlg()
        if (d && d.innerText.includes(fmt(before.amount))) {
          found = true
          break
        }
        d?.dispatchEvent(new Event('cancel'))
        await w(300)
      }
      let d = dlg()
      if (!found || !d) {
        fail('details did not open')
        return { ok, notes }
      }
      await click(btn('Edit', d), null, 1000)
      d = dlg()
      if (!/^Edit /.test(d.querySelector('h2')?.textContent ?? '')) {
        fail('edit window did not open')
        return { ok, notes }
      }
      await click(btn('Save changes', d), null, 1600)
      if (dlg()) {
        fail('did not save: ' + (dlg().querySelector('[role=alert]')?.innerText || dlg().innerText.slice(0, 160).replace(/\n/g, ' ')))
        return { ok, notes }
      }
      const after = await api('/transactions/' + FIX.entries['tr-diff'])
      const keys = [
        'type',
        'amount',
        'received',
        'commission',
        'payee',
        'mode',
        'paid_mode',
        'contact_id',
        'to_contact_id',
        'to_name',
        'to_account',
        'label_id',
        'account',
        'direction',
        'date',
        'note',
        'effect',
      ]
      const changed = keys
        .filter((k) => JSON.stringify(before[k] ?? null) !== JSON.stringify(after[k] ?? null))
        .map((k) => k + ': ' + JSON.stringify(before[k]) + ' -> ' + JSON.stringify(after[k]))
      expect(changed.length === 0, 'unchanged after re-save' + (changed.length ? ' | ' + changed.join(' ; ') : ''))
    },
  },
  {
    name: 'edit-tr',
    path: (f) => `/dashboard/entries?q=${f.tag}&range=custom&from=${f.today}&to=${f.today}`,
    w: 1440,
    h: 900,
    wait: 3000,
    shot: false,
    run: async () => {
      const before = await api('/transactions/' + FIX.entries['tr'])
      const fmt = (p) => '₹' + (p / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })
      const rows = all('section[aria-label="Entries by day"] li button').filter((b) => b.innerText.includes(fmt(1030000)))
      if (!rows.length) {
        fail('row not found for ' + fmt(1030000))
        return { ok, notes }
      }
      note(rows.length + ' matching rows')
      let found = false
      for (const r of rows) {
        r.click()
        await w(1100)
        const d = dlg()
        if (d && d.innerText.includes(fmt(before.amount))) {
          found = true
          break
        }
        d?.dispatchEvent(new Event('cancel'))
        await w(300)
      }
      let d = dlg()
      if (!found || !d) {
        fail('details did not open')
        return { ok, notes }
      }
      await click(btn('Edit', d), null, 1000)
      d = dlg()
      if (!/^Edit /.test(d.querySelector('h2')?.textContent ?? '')) {
        fail('edit window did not open')
        return { ok, notes }
      }
      await click(btn('Save changes', d), null, 1600)
      if (dlg()) {
        fail('did not save: ' + (dlg().querySelector('[role=alert]')?.innerText || dlg().innerText.slice(0, 160).replace(/\n/g, ' ')))
        return { ok, notes }
      }
      const after = await api('/transactions/' + FIX.entries['tr'])
      const keys = [
        'type',
        'amount',
        'received',
        'commission',
        'payee',
        'mode',
        'paid_mode',
        'contact_id',
        'to_contact_id',
        'to_name',
        'to_account',
        'label_id',
        'account',
        'direction',
        'date',
        'note',
        'effect',
      ]
      const changed = keys
        .filter((k) => JSON.stringify(before[k] ?? null) !== JSON.stringify(after[k] ?? null))
        .map((k) => k + ': ' + JSON.stringify(before[k]) + ' -> ' + JSON.stringify(after[k]))
      expect(changed.length === 0, 'unchanged after re-save' + (changed.length ? ' | ' + changed.join(' ; ') : ''))
    },
  },
  {
    name: 'edit-adjust',
    path: (f) => `/dashboard/entries?q=${f.tag}&range=custom&from=${f.today}&to=${f.today}`,
    w: 1440,
    h: 900,
    wait: 3000,
    shot: false,
    run: async () => {
      const before = await api('/transactions/' + FIX.entries['adjust'])
      const fmt = (p) => '₹' + (p / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })
      const rows = all('section[aria-label="Entries by day"] li button').filter((b) => b.innerText.includes(fmt(20000)))
      if (!rows.length) {
        fail('row not found for ' + fmt(20000))
        return { ok, notes }
      }
      note(rows.length + ' matching rows')
      let found = false
      for (const r of rows) {
        r.click()
        await w(1100)
        const d = dlg()
        if (d && d.innerText.includes(fmt(before.amount))) {
          found = true
          break
        }
        d?.dispatchEvent(new Event('cancel'))
        await w(300)
      }
      let d = dlg()
      if (!found || !d) {
        fail('details did not open')
        return { ok, notes }
      }
      await click(btn('Edit', d), null, 1000)
      d = dlg()
      if (!/^Edit /.test(d.querySelector('h2')?.textContent ?? '')) {
        fail('edit window did not open')
        return { ok, notes }
      }
      await click(btn('Save changes', d), null, 1600)
      if (dlg()) {
        fail('did not save: ' + (dlg().querySelector('[role=alert]')?.innerText || dlg().innerText.slice(0, 160).replace(/\n/g, ' ')))
        return { ok, notes }
      }
      const after = await api('/transactions/' + FIX.entries['adjust'])
      const keys = [
        'type',
        'amount',
        'received',
        'commission',
        'payee',
        'mode',
        'paid_mode',
        'contact_id',
        'to_contact_id',
        'to_name',
        'to_account',
        'label_id',
        'account',
        'direction',
        'date',
        'note',
        'effect',
      ]
      const changed = keys
        .filter((k) => JSON.stringify(before[k] ?? null) !== JSON.stringify(after[k] ?? null))
        .map((k) => k + ': ' + JSON.stringify(before[k]) + ' -> ' + JSON.stringify(after[k]))
      expect(changed.length === 0, 'unchanged after re-save' + (changed.length ? ' | ' + changed.join(' ; ') : ''))
    },
  },
  {
    name: 'edit-out-noacc',
    path: (f) => `/dashboard/entries?q=${f.tag}&range=custom&from=${f.today}&to=${f.today}`,
    w: 1440,
    h: 900,
    wait: 3000,
    shot: false,
    run: async () => {
      const before = await api('/transactions/' + FIX.entries['out-noacc'])
      const fmt = (p) => '₹' + (p / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })
      const rows = all('section[aria-label="Entries by day"] li button').filter((b) => b.innerText.includes(fmt(999900)))
      if (!rows.length) {
        fail('row not found for ' + fmt(999900))
        return { ok, notes }
      }
      note(rows.length + ' matching rows')
      let found = false
      for (const r of rows) {
        r.click()
        await w(1100)
        const d = dlg()
        if (d && d.innerText.includes(fmt(before.amount))) {
          found = true
          break
        }
        d?.dispatchEvent(new Event('cancel'))
        await w(300)
      }
      let d = dlg()
      if (!found || !d) {
        fail('details did not open')
        return { ok, notes }
      }
      await click(btn('Edit', d), null, 1000)
      d = dlg()
      if (!/^Edit /.test(d.querySelector('h2')?.textContent ?? '')) {
        fail('edit window did not open')
        return { ok, notes }
      }
      await click(btn('Save changes', d), null, 1600)
      if (dlg()) {
        fail('did not save: ' + (dlg().querySelector('[role=alert]')?.innerText || dlg().innerText.slice(0, 160).replace(/\n/g, ' ')))
        return { ok, notes }
      }
      const after = await api('/transactions/' + FIX.entries['out-noacc'])
      const keys = [
        'type',
        'amount',
        'received',
        'commission',
        'payee',
        'mode',
        'paid_mode',
        'contact_id',
        'to_contact_id',
        'to_name',
        'to_account',
        'label_id',
        'account',
        'direction',
        'date',
        'note',
        'effect',
      ]
      const changed = keys
        .filter((k) => JSON.stringify(before[k] ?? null) !== JSON.stringify(after[k] ?? null))
        .map((k) => k + ': ' + JSON.stringify(before[k]) + ' -> ' + JSON.stringify(after[k]))
      expect(changed.length === 0, 'unchanged after re-save' + (changed.length ? ' | ' + changed.join(' ; ') : ''))
    },
  },
  {
    name: 'edit-out',
    path: (f) => `/dashboard/entries?q=${f.tag}&range=custom&from=${f.today}&to=${f.today}`,
    w: 1440,
    h: 900,
    wait: 3000,
    shot: false,
    run: async () => {
      const before = await api('/transactions/' + FIX.entries['out'])
      const fmt = (p) => '₹' + (p / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })
      const rows = all('section[aria-label="Entries by day"] li button').filter((b) => b.innerText.includes(fmt(150000)))
      if (!rows.length) {
        fail('row not found for ' + fmt(150000))
        return { ok, notes }
      }
      note(rows.length + ' matching rows')
      let found = false
      for (const r of rows) {
        r.click()
        await w(1100)
        const d = dlg()
        if (d && d.innerText.includes(fmt(before.amount))) {
          found = true
          break
        }
        d?.dispatchEvent(new Event('cancel'))
        await w(300)
      }
      let d = dlg()
      if (!found || !d) {
        fail('details did not open')
        return { ok, notes }
      }
      await click(btn('Edit', d), null, 1000)
      d = dlg()
      if (!/^Edit /.test(d.querySelector('h2')?.textContent ?? '')) {
        fail('edit window did not open')
        return { ok, notes }
      }
      await click(btn('Save changes', d), null, 1600)
      if (dlg()) {
        fail('did not save: ' + (dlg().querySelector('[role=alert]')?.innerText || dlg().innerText.slice(0, 160).replace(/\n/g, ' ')))
        return { ok, notes }
      }
      const after = await api('/transactions/' + FIX.entries['out'])
      const keys = [
        'type',
        'amount',
        'received',
        'commission',
        'payee',
        'mode',
        'paid_mode',
        'contact_id',
        'to_contact_id',
        'to_name',
        'to_account',
        'label_id',
        'account',
        'direction',
        'date',
        'note',
        'effect',
      ]
      const changed = keys
        .filter((k) => JSON.stringify(before[k] ?? null) !== JSON.stringify(after[k] ?? null))
        .map((k) => k + ': ' + JSON.stringify(before[k]) + ' -> ' + JSON.stringify(after[k]))
      expect(changed.length === 0, 'unchanged after re-save' + (changed.length ? ' | ' + changed.join(' ; ') : ''))
    },
  },
  {
    name: 'edit-in',
    path: (f) => `/dashboard/entries?q=${f.tag}&range=custom&from=${f.today}&to=${f.today}`,
    w: 1440,
    h: 900,
    wait: 3000,
    shot: false,
    run: async () => {
      const before = await api('/transactions/' + FIX.entries['in'])
      const fmt = (p) => '₹' + (p / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })
      const rows = all('section[aria-label="Entries by day"] li button').filter((b) => b.innerText.includes(fmt(110000)))
      if (!rows.length) {
        fail('row not found for ' + fmt(110000))
        return { ok, notes }
      }
      note(rows.length + ' matching rows')
      let found = false
      for (const r of rows) {
        r.click()
        await w(1100)
        const d = dlg()
        if (d && d.innerText.includes(fmt(before.amount))) {
          found = true
          break
        }
        d?.dispatchEvent(new Event('cancel'))
        await w(300)
      }
      let d = dlg()
      if (!found || !d) {
        fail('details did not open')
        return { ok, notes }
      }
      await click(btn('Edit', d), null, 1000)
      d = dlg()
      if (!/^Edit /.test(d.querySelector('h2')?.textContent ?? '')) {
        fail('edit window did not open')
        return { ok, notes }
      }
      await click(btn('Save changes', d), null, 1600)
      if (dlg()) {
        fail('did not save: ' + (dlg().querySelector('[role=alert]')?.innerText || dlg().innerText.slice(0, 160).replace(/\n/g, ' ')))
        return { ok, notes }
      }
      const after = await api('/transactions/' + FIX.entries['in'])
      const keys = [
        'type',
        'amount',
        'received',
        'commission',
        'payee',
        'mode',
        'paid_mode',
        'contact_id',
        'to_contact_id',
        'to_name',
        'to_account',
        'label_id',
        'account',
        'direction',
        'date',
        'note',
        'effect',
      ]
      const changed = keys
        .filter((k) => JSON.stringify(before[k] ?? null) !== JSON.stringify(after[k] ?? null))
        .map((k) => k + ': ' + JSON.stringify(before[k]) + ' -> ' + JSON.stringify(after[k]))
      expect(changed.length === 0, 'unchanged after re-save' + (changed.length ? ' | ' + changed.join(' ; ') : ''))
    },
  },
  {
    name: 'edit-tr-saved',
    path: (f) => `/dashboard/entries?q=${f.tag}&range=custom&from=${f.today}&to=${f.today}`,
    w: 1440,
    h: 900,
    wait: 3000,
    shot: false,
    run: async () => {
      const before = await api('/transactions/' + FIX.entries['tr-saved'])
      const fmt = (p) => '₹' + (p / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })
      const rows = all('section[aria-label="Entries by day"] li button').filter((b) => b.innerText.includes(fmt(4201600)))
      if (!rows.length) {
        fail('row not found for ' + fmt(4201600))
        return { ok, notes }
      }
      note(rows.length + ' matching rows')
      let found = false
      for (const r of rows) {
        r.click()
        await w(1100)
        const d = dlg()
        if (d && d.innerText.includes(fmt(before.amount))) {
          found = true
          break
        }
        d?.dispatchEvent(new Event('cancel'))
        await w(300)
      }
      let d = dlg()
      if (!found || !d) {
        fail('details did not open')
        return { ok, notes }
      }
      await click(btn('Edit', d), null, 1000)
      d = dlg()
      if (!/^Edit /.test(d.querySelector('h2')?.textContent ?? '')) {
        fail('edit window did not open')
        return { ok, notes }
      }
      await click(btn('Save changes', d), null, 1600)
      if (dlg()) {
        fail('did not save: ' + (dlg().querySelector('[role=alert]')?.innerText || dlg().innerText.slice(0, 160).replace(/\n/g, ' ')))
        return { ok, notes }
      }
      const after = await api('/transactions/' + FIX.entries['tr-saved'])
      const keys = [
        'type',
        'amount',
        'received',
        'commission',
        'payee',
        'mode',
        'paid_mode',
        'contact_id',
        'to_contact_id',
        'to_name',
        'to_account',
        'label_id',
        'account',
        'direction',
        'date',
        'note',
        'effect',
      ]
      const changed = keys
        .filter((k) => JSON.stringify(before[k] ?? null) !== JSON.stringify(after[k] ?? null))
        .map((k) => k + ': ' + JSON.stringify(before[k]) + ' -> ' + JSON.stringify(after[k]))
      expect(changed.length === 0, 'unchanged after re-save' + (changed.length ? ' | ' + changed.join(' ; ') : ''))
    },
  },
]
