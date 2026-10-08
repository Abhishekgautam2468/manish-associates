// Every pop-up window on a phone, on a desktop and in dark mode.
// Each case opens `path` at width `w` (and dark mode when `dark`), runs `run` in the page if given,
// then checks the layout. `run` uses the helpers in helpers.js and records results with expect() / fail().

export default [
  {
    name: 'm-entry-wd-360',
    path: '/dashboard',
    w: 360,
    h: 740,
    run: async () => {
      await click(
        all('button').find((b) => b.textContent.trim() === 'New entry' || b.getAttribute('aria-label') === 'New entry'),
        null,
        900,
      )
      setVal(dlg().querySelector('input[inputmode=decimal]'), '1000')
      await w(300)
      const d = dlg()
      if (!d) {
        fail('window did not open')
      } else {
        const r = d.getBoundingClientRect()
        expect(r.left >= 0 && r.right <= innerWidth + 1, 'fits width')
        expect(d.scrollWidth <= d.clientWidth + 1, 'no sideways scroll inside')
      }
    },
  },
  {
    name: 'm-entry-wd-1440',
    path: '/dashboard',
    w: 1440,
    h: 900,
    run: async () => {
      await click(
        all('button').find((b) => b.textContent.trim() === 'New entry' || b.getAttribute('aria-label') === 'New entry'),
        null,
        900,
      )
      setVal(dlg().querySelector('input[inputmode=decimal]'), '1000')
      await w(300)
      const d = dlg()
      if (!d) {
        fail('window did not open')
      } else {
        const r = d.getBoundingClientRect()
        expect(r.left >= 0 && r.right <= innerWidth + 1, 'fits width')
        expect(d.scrollWidth <= d.clientWidth + 1, 'no sideways scroll inside')
      }
    },
  },
  {
    name: 'm-entry-wd-390-dark',
    path: '/dashboard',
    w: 390,
    h: 844,
    dark: true,
    run: async () => {
      await click(
        all('button').find((b) => b.textContent.trim() === 'New entry' || b.getAttribute('aria-label') === 'New entry'),
        null,
        900,
      )
      setVal(dlg().querySelector('input[inputmode=decimal]'), '1000')
      await w(300)
      const d = dlg()
      if (!d) {
        fail('window did not open')
      } else {
        const r = d.getBoundingClientRect()
        expect(r.left >= 0 && r.right <= innerWidth + 1, 'fits width')
        expect(d.scrollWidth <= d.clientWidth + 1, 'no sideways scroll inside')
      }
    },
  },
  {
    name: 'm-entry-tr-360',
    path: '/dashboard',
    w: 360,
    h: 740,
    run: async () => {
      await click(
        all('button').find((b) => b.textContent.trim() === 'New entry' || b.getAttribute('aria-label') === 'New entry'),
        null,
        900,
      )
      await click(btn('Money transfer', dlg()))
      await click(btn('different amount', dlg()))
      const d = dlg()
      if (!d) {
        fail('window did not open')
      } else {
        const r = d.getBoundingClientRect()
        expect(r.left >= 0 && r.right <= innerWidth + 1, 'fits width')
        expect(d.scrollWidth <= d.clientWidth + 1, 'no sideways scroll inside')
      }
    },
  },
  {
    name: 'm-entry-tr-1440',
    path: '/dashboard',
    w: 1440,
    h: 900,
    run: async () => {
      await click(
        all('button').find((b) => b.textContent.trim() === 'New entry' || b.getAttribute('aria-label') === 'New entry'),
        null,
        900,
      )
      await click(btn('Money transfer', dlg()))
      await click(btn('different amount', dlg()))
      const d = dlg()
      if (!d) {
        fail('window did not open')
      } else {
        const r = d.getBoundingClientRect()
        expect(r.left >= 0 && r.right <= innerWidth + 1, 'fits width')
        expect(d.scrollWidth <= d.clientWidth + 1, 'no sideways scroll inside')
      }
    },
  },
  {
    name: 'm-entry-tr-390-dark',
    path: '/dashboard',
    w: 390,
    h: 844,
    dark: true,
    run: async () => {
      await click(
        all('button').find((b) => b.textContent.trim() === 'New entry' || b.getAttribute('aria-label') === 'New entry'),
        null,
        900,
      )
      await click(btn('Money transfer', dlg()))
      await click(btn('different amount', dlg()))
      const d = dlg()
      if (!d) {
        fail('window did not open')
      } else {
        const r = d.getBoundingClientRect()
        expect(r.left >= 0 && r.right <= innerWidth + 1, 'fits width')
        expect(d.scrollWidth <= d.clientWidth + 1, 'no sideways scroll inside')
      }
    },
  },
  {
    name: 'm-entry-other-360',
    path: '/dashboard',
    w: 360,
    h: 740,
    run: async () => {
      await click(
        all('button').find((b) => b.textContent.trim() === 'New entry' || b.getAttribute('aria-label') === 'New entry'),
        null,
        900,
      )
      await click(btn('Other', dlg()))
      await click(btn('Balance', dlg()))
      const d = dlg()
      if (!d) {
        fail('window did not open')
      } else {
        const r = d.getBoundingClientRect()
        expect(r.left >= 0 && r.right <= innerWidth + 1, 'fits width')
        expect(d.scrollWidth <= d.clientWidth + 1, 'no sideways scroll inside')
      }
    },
  },
  {
    name: 'm-entry-other-1440',
    path: '/dashboard',
    w: 1440,
    h: 900,
    run: async () => {
      await click(
        all('button').find((b) => b.textContent.trim() === 'New entry' || b.getAttribute('aria-label') === 'New entry'),
        null,
        900,
      )
      await click(btn('Other', dlg()))
      await click(btn('Balance', dlg()))
      const d = dlg()
      if (!d) {
        fail('window did not open')
      } else {
        const r = d.getBoundingClientRect()
        expect(r.left >= 0 && r.right <= innerWidth + 1, 'fits width')
        expect(d.scrollWidth <= d.clientWidth + 1, 'no sideways scroll inside')
      }
    },
  },
  {
    name: 'm-entry-other-390-dark',
    path: '/dashboard',
    w: 390,
    h: 844,
    dark: true,
    run: async () => {
      await click(
        all('button').find((b) => b.textContent.trim() === 'New entry' || b.getAttribute('aria-label') === 'New entry'),
        null,
        900,
      )
      await click(btn('Other', dlg()))
      await click(btn('Balance', dlg()))
      const d = dlg()
      if (!d) {
        fail('window did not open')
      } else {
        const r = d.getBoundingClientRect()
        expect(r.left >= 0 && r.right <= innerWidth + 1, 'fits width')
        expect(d.scrollWidth <= d.clientWidth + 1, 'no sideways scroll inside')
      }
    },
  },
  {
    name: 'm-person-360',
    path: '/dashboard',
    w: 360,
    h: 740,
    run: async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true }))
      await w(500)
      dlg()?.dispatchEvent(new Event('cancel'))
      await w(300)
      location.hash = ''
      await w(100)
      document.querySelector('a[href="/dashboard/people"]')?.click()
      await w(1200)
      await click(btn('Add person'), null, 800)
      const d = dlg()
      if (!d) {
        fail('window did not open')
      } else {
        const r = d.getBoundingClientRect()
        expect(r.left >= 0 && r.right <= innerWidth + 1, 'fits width')
        expect(d.scrollWidth <= d.clientWidth + 1, 'no sideways scroll inside')
      }
    },
  },
  {
    name: 'm-person-1440',
    path: '/dashboard',
    w: 1440,
    h: 900,
    run: async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true }))
      await w(500)
      dlg()?.dispatchEvent(new Event('cancel'))
      await w(300)
      location.hash = ''
      await w(100)
      document.querySelector('a[href="/dashboard/people"]')?.click()
      await w(1200)
      await click(btn('Add person'), null, 800)
      const d = dlg()
      if (!d) {
        fail('window did not open')
      } else {
        const r = d.getBoundingClientRect()
        expect(r.left >= 0 && r.right <= innerWidth + 1, 'fits width')
        expect(d.scrollWidth <= d.clientWidth + 1, 'no sideways scroll inside')
      }
    },
  },
  {
    name: 'm-person-390-dark',
    path: '/dashboard',
    w: 390,
    h: 844,
    dark: true,
    run: async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true }))
      await w(500)
      dlg()?.dispatchEvent(new Event('cancel'))
      await w(300)
      location.hash = ''
      await w(100)
      document.querySelector('a[href="/dashboard/people"]')?.click()
      await w(1200)
      await click(btn('Add person'), null, 800)
      const d = dlg()
      if (!d) {
        fail('window did not open')
      } else {
        const r = d.getBoundingClientRect()
        expect(r.left >= 0 && r.right <= innerWidth + 1, 'fits width')
        expect(d.scrollWidth <= d.clientWidth + 1, 'no sideways scroll inside')
      }
    },
  },
  {
    name: 'm-reminder-360',
    path: '/dashboard',
    w: 360,
    h: 740,
    run: async () => {
      document.querySelector('a[href="/dashboard/reminders"]')?.click()
      await w(1200)
      await click(btn('New reminder'), null, 800)
      const d = dlg()
      if (!d) {
        fail('window did not open')
      } else {
        const r = d.getBoundingClientRect()
        expect(r.left >= 0 && r.right <= innerWidth + 1, 'fits width')
        expect(d.scrollWidth <= d.clientWidth + 1, 'no sideways scroll inside')
      }
    },
  },
  {
    name: 'm-reminder-1440',
    path: '/dashboard',
    w: 1440,
    h: 900,
    run: async () => {
      document.querySelector('a[href="/dashboard/reminders"]')?.click()
      await w(1200)
      await click(btn('New reminder'), null, 800)
      const d = dlg()
      if (!d) {
        fail('window did not open')
      } else {
        const r = d.getBoundingClientRect()
        expect(r.left >= 0 && r.right <= innerWidth + 1, 'fits width')
        expect(d.scrollWidth <= d.clientWidth + 1, 'no sideways scroll inside')
      }
    },
  },
  {
    name: 'm-reminder-390-dark',
    path: '/dashboard',
    w: 390,
    h: 844,
    dark: true,
    run: async () => {
      document.querySelector('a[href="/dashboard/reminders"]')?.click()
      await w(1200)
      await click(btn('New reminder'), null, 800)
      const d = dlg()
      if (!d) {
        fail('window did not open')
      } else {
        const r = d.getBoundingClientRect()
        expect(r.left >= 0 && r.right <= innerWidth + 1, 'fits width')
        expect(d.scrollWidth <= d.clientWidth + 1, 'no sideways scroll inside')
      }
    },
  },
  {
    name: 'm-label-360',
    path: '/dashboard',
    w: 360,
    h: 740,
    run: async () => {
      document.querySelector('a[href="/dashboard/labels"]')?.click()
      await w(1200)
      await click(btn('New label'), null, 800)
      await click(btn('Withdrawal', dlg()))
      const d = dlg()
      if (!d) {
        fail('window did not open')
      } else {
        const r = d.getBoundingClientRect()
        expect(r.left >= 0 && r.right <= innerWidth + 1, 'fits width')
        expect(d.scrollWidth <= d.clientWidth + 1, 'no sideways scroll inside')
      }
    },
  },
  {
    name: 'm-label-1440',
    path: '/dashboard',
    w: 1440,
    h: 900,
    run: async () => {
      document.querySelector('a[href="/dashboard/labels"]')?.click()
      await w(1200)
      await click(btn('New label'), null, 800)
      await click(btn('Withdrawal', dlg()))
      const d = dlg()
      if (!d) {
        fail('window did not open')
      } else {
        const r = d.getBoundingClientRect()
        expect(r.left >= 0 && r.right <= innerWidth + 1, 'fits width')
        expect(d.scrollWidth <= d.clientWidth + 1, 'no sideways scroll inside')
      }
    },
  },
  {
    name: 'm-label-390-dark',
    path: '/dashboard',
    w: 390,
    h: 844,
    dark: true,
    run: async () => {
      document.querySelector('a[href="/dashboard/labels"]')?.click()
      await w(1200)
      await click(btn('New label'), null, 800)
      await click(btn('Withdrawal', dlg()))
      const d = dlg()
      if (!d) {
        fail('window did not open')
      } else {
        const r = d.getBoundingClientRect()
        expect(r.left >= 0 && r.right <= innerWidth + 1, 'fits width')
        expect(d.scrollWidth <= d.clientWidth + 1, 'no sideways scroll inside')
      }
    },
  },
  {
    name: 'm-detail-360',
    path: '/dashboard',
    w: 360,
    h: 740,
    run: async () => {
      document.querySelector('a[href="/dashboard/entries"]')?.click()
      await w(1500)
      await click(document.querySelector('section[aria-label="Entries by day"] li button'), null, 1200)
      const d = dlg()
      if (!d) {
        fail('window did not open')
      } else {
        const r = d.getBoundingClientRect()
        expect(r.left >= 0 && r.right <= innerWidth + 1, 'fits width')
        expect(d.scrollWidth <= d.clientWidth + 1, 'no sideways scroll inside')
      }
    },
  },
  {
    name: 'm-detail-1440',
    path: '/dashboard',
    w: 1440,
    h: 900,
    run: async () => {
      document.querySelector('a[href="/dashboard/entries"]')?.click()
      await w(1500)
      await click(document.querySelector('section[aria-label="Entries by day"] li button'), null, 1200)
      const d = dlg()
      if (!d) {
        fail('window did not open')
      } else {
        const r = d.getBoundingClientRect()
        expect(r.left >= 0 && r.right <= innerWidth + 1, 'fits width')
        expect(d.scrollWidth <= d.clientWidth + 1, 'no sideways scroll inside')
      }
    },
  },
  {
    name: 'm-detail-390-dark',
    path: '/dashboard',
    w: 390,
    h: 844,
    dark: true,
    run: async () => {
      document.querySelector('a[href="/dashboard/entries"]')?.click()
      await w(1500)
      await click(document.querySelector('section[aria-label="Entries by day"] li button'), null, 1200)
      const d = dlg()
      if (!d) {
        fail('window did not open')
      } else {
        const r = d.getBoundingClientRect()
        expect(r.left >= 0 && r.right <= innerWidth + 1, 'fits width')
        expect(d.scrollWidth <= d.clientWidth + 1, 'no sideways scroll inside')
      }
    },
  },
  {
    name: 'm-confirm-360',
    path: '/dashboard',
    w: 360,
    h: 740,
    run: async () => {
      document.querySelector('a[href="/dashboard/entries"]')?.click()
      await w(1500)
      await click(document.querySelector('section[aria-label="Entries by day"] li button'), null, 1200)
      await click(btn('Delete', dlg()), null, 700)
      const d = dlg()
      if (!d) {
        fail('window did not open')
      } else {
        const r = d.getBoundingClientRect()
        expect(r.left >= 0 && r.right <= innerWidth + 1, 'fits width')
        expect(d.scrollWidth <= d.clientWidth + 1, 'no sideways scroll inside')
      }
    },
  },
  {
    name: 'm-confirm-1440',
    path: '/dashboard',
    w: 1440,
    h: 900,
    run: async () => {
      document.querySelector('a[href="/dashboard/entries"]')?.click()
      await w(1500)
      await click(document.querySelector('section[aria-label="Entries by day"] li button'), null, 1200)
      await click(btn('Delete', dlg()), null, 700)
      const d = dlg()
      if (!d) {
        fail('window did not open')
      } else {
        const r = d.getBoundingClientRect()
        expect(r.left >= 0 && r.right <= innerWidth + 1, 'fits width')
        expect(d.scrollWidth <= d.clientWidth + 1, 'no sideways scroll inside')
      }
    },
  },
  {
    name: 'm-confirm-390-dark',
    path: '/dashboard',
    w: 390,
    h: 844,
    dark: true,
    run: async () => {
      document.querySelector('a[href="/dashboard/entries"]')?.click()
      await w(1500)
      await click(document.querySelector('section[aria-label="Entries by day"] li button'), null, 1200)
      await click(btn('Delete', dlg()), null, 700)
      const d = dlg()
      if (!d) {
        fail('window did not open')
      } else {
        const r = d.getBoundingClientRect()
        expect(r.left >= 0 && r.right <= innerWidth + 1, 'fits width')
        expect(d.scrollWidth <= d.clientWidth + 1, 'no sideways scroll inside')
      }
    },
  },
  {
    name: 'm-palette-360',
    path: '/dashboard',
    w: 360,
    h: 740,
    run: async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
      await w(500)
      setVal(all('dialog[open] input')[0], 'a')
      await w(900)
      const d = dlg()
      if (!d) {
        fail('window did not open')
      } else {
        const r = d.getBoundingClientRect()
        expect(r.left >= 0 && r.right <= innerWidth + 1, 'fits width')
        expect(d.scrollWidth <= d.clientWidth + 1, 'no sideways scroll inside')
      }
    },
  },
  {
    name: 'm-palette-1440',
    path: '/dashboard',
    w: 1440,
    h: 900,
    run: async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
      await w(500)
      setVal(all('dialog[open] input')[0], 'a')
      await w(900)
      const d = dlg()
      if (!d) {
        fail('window did not open')
      } else {
        const r = d.getBoundingClientRect()
        expect(r.left >= 0 && r.right <= innerWidth + 1, 'fits width')
        expect(d.scrollWidth <= d.clientWidth + 1, 'no sideways scroll inside')
      }
    },
  },
  {
    name: 'm-palette-390-dark',
    path: '/dashboard',
    w: 390,
    h: 844,
    dark: true,
    run: async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
      await w(500)
      setVal(all('dialog[open] input')[0], 'a')
      await w(900)
      const d = dlg()
      if (!d) {
        fail('window did not open')
      } else {
        const r = d.getBoundingClientRect()
        expect(r.left >= 0 && r.right <= innerWidth + 1, 'fits width')
        expect(d.scrollWidth <= d.clientWidth + 1, 'no sideways scroll inside')
      }
    },
  },
]
