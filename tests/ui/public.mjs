// Signed-out screens: home, sign in and password reset.
// Each case opens `path` at width `w` (and dark mode when `dark`), runs `run` in the page if given,
// then checks the layout. `run` uses the helpers in helpers.js and records results with expect() / fail().

export default [
  { name: 'home-360', path: '/', w: 360, h: 740 },
  { name: 'home-390', path: '/', w: 390, h: 844 },
  { name: 'home-768', path: '/', w: 768, h: 1024 },
  { name: 'home-1440', path: '/', w: 1440, h: 900 },
  { name: 'home-390-dark', path: '/', w: 390, h: 844, dark: true },
  { name: 'login-360', path: '/login', w: 360, h: 740 },
  { name: 'login-390', path: '/login', w: 390, h: 844 },
  { name: 'login-768', path: '/login', w: 768, h: 1024 },
  { name: 'login-1440', path: '/login', w: 1440, h: 900 },
  { name: 'login-390-dark', path: '/login', w: 390, h: 844, dark: true },
  { name: 'forgot-360', path: '/forgot-password', w: 360, h: 740 },
  { name: 'forgot-390', path: '/forgot-password', w: 390, h: 844 },
  { name: 'forgot-768', path: '/forgot-password', w: 768, h: 1024 },
  { name: 'forgot-1440', path: '/forgot-password', w: 1440, h: 900 },
  { name: 'forgot-390-dark', path: '/forgot-password', w: 390, h: 844, dark: true },
  {
    name: 'guard',
    path: '/dashboard/entries',
    w: 1440,
    h: 900,
    run: async () => {
      expect(location.pathname === '/login', 'signed-out visit goes to login (' + location.pathname + ')')
    },
  },
  {
    name: 'login-empty',
    path: '/login',
    w: 1440,
    h: 900,
    run: async () => {
      await click(all('button[type=submit]')[0], null, 800)
      expect(location.pathname === '/login', 'stays on login')
      note(document.querySelector('[role=alert], .field-error')?.innerText || 'no message (browser required-field check)')
    },
  },
  {
    name: 'login-wrong',
    path: '/login',
    w: 1440,
    h: 900,
    run: async () => {
      const [u, p] = all('input')
      setVal(u, 'manish')
      setVal(p, 'definitely-wrong')
      await click(all('button[type=submit]')[0], null, 1500)
      expect(/incorrect/i.test(text()), 'wrong password message shown')
      expect(location.pathname === '/login', 'not signed in')
      const eye = all('button').find((b) => /show|hide/i.test(b.getAttribute('aria-label') || b.textContent))
      if (eye) {
        await click(eye)
        expect(p.type === 'text', 'show password works')
      } else note('no show-password button')
    },
  },
  {
    name: 'forgot-flow',
    path: '/forgot-password',
    w: 1440,
    h: 900,
    run: async () => {
      const e = all('input')[0]
      setVal(e, 'admin@example.com')
      await click(all('button[type=submit]')[0], null, 1500)
      expect(/code/i.test(text()), 'moves to the code step')
      const c = all('input').find((i) => i.inputMode === 'numeric' || /code/i.test(i.getAttribute('aria-label') || i.name || i.id || ''))
      expect(Boolean(c), 'code field shown')
      if (c) {
        setVal(c, '000000')
        await click(all('button[type=submit]')[0], null, 1500)
        expect(/wrong|expired/i.test(text()), 'wrong code message')
      }
    },
  },
  {
    name: 'home-landing',
    path: '/',
    w: 1440,
    h: 900,
    wait: 3500,
    run: async () => {
      for (const id of ['services', 'travel', 'how', 'contact']) expect(Boolean(document.getElementById(id)), 'section ' + id)
      expect(all('a[href="#services"]').length > 0, 'nav links to services')
      expect(/Insurance and investments/.test(text()) && /Tickets and tours/.test(text()), 'service groups listed')
      expect(all('img').length >= 6 && all('img').every((i) => i.alt), 'photos have descriptions')
      expect(Boolean(all('a').find((a) => a.getAttribute('href') === '/login')), 'staff sign in link')
    },
  },
  {
    name: 'home-menu-phone',
    path: '/',
    w: 390,
    h: 844,
    wait: 3500,
    run: async () => {
      await click(document.querySelector('button[aria-label="Open menu"]'), null, 600)
      expect(Boolean(all('header a').find((a) => a.textContent.trim() === 'Tours')), 'phone menu opens')
      await click(all('header a').filter((a) => a.textContent.trim() === 'Tours').at(-1), null, 900)
      expect(!document.querySelector('button[aria-label="Close menu"]'), 'menu closes after a choice')
    },
  },
]
