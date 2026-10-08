import { Suspense, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Ellipsis, LayoutDashboard, LogOut, Moon, Plus, ReceiptText, Scale, Search, Sun, X } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import CommandPalette from './CommandPalette.jsx'
import { LABELS_PAGE, MORE_PAGES, NAV, SETTINGS_PAGE } from './nav.js'
import { LabelDot } from './LabelPicker.jsx'
import Modal from './Modal.jsx'
import { UIProvider, useUI } from './ui.jsx'
import { applyTheme, getTheme, isDark } from './theme.js'
import { useLabels, useOverview } from '../lib/queries.js'
import { api } from '../api.js'

const isTyping = (el) => el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

function Shell({ user }) {
  const ui = useUI()
  const navigate = useNavigate()
  const location = useLocation()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [theme, setTheme] = useState(getTheme)
  const { data: overview } = useOverview()
  const { data: labels = [] } = useLabels()
  // On Entries filtered by a label, highlight that label rather than Entries.
  const activeLabel = location.pathname === '/dashboard/entries' ? new URLSearchParams(location.search).get('label_id') : null

  useEffect(() => applyTheme(theme), [theme])
  useEffect(() => setMoreOpen(false), [location.pathname, location.search])

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target) || document.querySelector('dialog[open]')) return
      if (e.key === '/') {
        e.preventDefault()
        setPaletteOpen(true)
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault()
        ui.newEntry()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ui])

  const badges = {
    reminders: overview ? overview.reminders.overdue + overview.reminders.today : 0,
  }

  async function signOut() {
    await api('/auth/logout', { method: 'POST' }).catch(() => {})
    navigate('/login', { replace: true })
  }

  const dark = isDark(theme)

  return (
    <div className="app">
      <aside className="sidebar" aria-label="Main">
        <div className="sidebar__head">
          <NavLink to="/" className="sidebar__brand" aria-label="Open the public home page">
            <Logo size="sm" />
          </NavLink>
        </div>

        <nav className="sidebar__nav">
          {NAV.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-link${isActive && !(to === '/dashboard/entries' && activeLabel) ? ' active' : ''}`}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
              {badge && badges[badge] > 0 && (
                <span className="nav-link__badge" aria-label={`${badges[badge]} due`}>
                  {badges[badge]}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <section className="sidebar__labels" aria-labelledby="sidebar-labels">
          <div className="sidebar__section-head">
            <NavLink to={LABELS_PAGE.to} id="sidebar-labels" className="sidebar__section-title">
              Labels
            </NavLink>
            <button
              type="button"
              className="icon-button icon-button--xs"
              onClick={() => ui.newLabel()}
              aria-label="New label"
              title="New label"
            >
              <Plus size={16} />
            </button>
          </div>
          {labels.length === 0 ? (
            <button type="button" className="sidebar__empty" onClick={() => ui.newLabel()}>
              Create your first label
            </button>
          ) : (
            <ul className="sidebar__label-list">
              {labels.slice(0, 8).map((l) => (
                <li key={l.id}>
                  <Link
                    to={`/dashboard/entries?label_id=${l.id}&range=all`}
                    className={`nav-link nav-link--label${activeLabel === l.id ? ' active' : ''}`}
                    aria-current={activeLabel === l.id ? 'page' : undefined}
                  >
                    <LabelDot color={l.color} />
                    <span className="nav-link__text">{l.name}</span>
                    <span className="nav-link__count">{l.count}</span>
                  </Link>
                </li>
              ))}
              {labels.length > 8 && (
                <li>
                  <NavLink to={LABELS_PAGE.to} className="nav-link nav-link--more">
                    All {labels.length} labels
                  </NavLink>
                </li>
              )}
            </ul>
          )}
        </section>

        <nav className="sidebar__nav sidebar__nav--bottom" aria-label="Settings">
          <NavLink to={SETTINGS_PAGE.to} className="nav-link">
            <SETTINGS_PAGE.icon size={18} aria-hidden="true" />
            <span>{SETTINGS_PAGE.label}</span>
          </NavLink>
        </nav>
        <div className="sidebar__foot">
          <span className="avatar" aria-hidden="true">
            {user.username.slice(0, 1).toUpperCase()}
          </span>
          <div className="sidebar__user">
            <span className="sidebar__user-name">{user.username}</span>
            <span className="sidebar__user-email">{user.email}</span>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={() => setTheme(dark ? 'light' : 'dark')}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={dark ? 'Light mode' : 'Dark mode'}
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button type="button" className="icon-button" onClick={signOut} aria-label="Sign out" title="Sign out">
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      <div className="app__main">
        {/* The coloured top band of the frame (desktop) */}
        <header className="frame-bar">
          <button type="button" className="frame-bar__search" onClick={() => setPaletteOpen(true)}>
            <Search size={16} aria-hidden="true" />
            <span>Search people and entries</span>
            <kbd>{isMac ? '⌘K' : 'Ctrl K'}</kbd>
          </button>
          <button type="button" className="frame-bar__new" onClick={() => ui.newEntry()} title="New entry (N)">
            <Plus size={17} aria-hidden="true" /> New entry
          </button>
        </header>

        {/* Phones and small tablets: the dark frame becomes a top bar, and the menu moves to a bar at the bottom. */}
        <header className="mobile-bar">
          <Link to="/dashboard" className="mobile-bar__brand" aria-label="Overview">
            <Logo size="sm" />
          </Link>
          <span className="mobile-bar__spacer" />
          <button type="button" className="mobile-bar__icon" onClick={() => setPaletteOpen(true)} aria-label="Search">
            <Search size={20} />
          </button>
          <button type="button" className="mobile-bar__me" onClick={() => setMoreOpen(true)} aria-label="Your account and more pages">
            <span className="mobile-bar__avatar">{user.username.slice(0, 1).toUpperCase()}</span>
          </button>
        </header>

        <main className="sheet" id="main">
          {/* Keeps the menu and header on screen while the next page loads. */}
          <Suspense fallback={<p className="page-status">Loading…</p>}>
            <Outlet context={{ user, theme, setTheme, openSearch: () => setPaletteOpen(true) }} />
          </Suspense>
        </main>
      </div>

      <nav className="tabbar" aria-label="Main">
        <NavLink to="/dashboard" end className="tabbar__item">
          <span className="tabbar__icon">
            <LayoutDashboard size={21} aria-hidden="true" />
          </span>
          Home
        </NavLink>
        <NavLink to="/dashboard/entries" className="tabbar__item">
          <span className="tabbar__icon">
            <ReceiptText size={21} aria-hidden="true" />
          </span>
          Entries
        </NavLink>
        <button type="button" className="tabbar__new" onClick={() => ui.newEntry()} aria-label="New entry">
          <Plus size={26} strokeWidth={2.5} />
        </button>
        <NavLink to="/dashboard/balances" className="tabbar__item">
          <span className="tabbar__icon">
            <Scale size={21} aria-hidden="true" />
          </span>
          Balances
        </NavLink>
        <button
          type="button"
          className={`tabbar__item${MORE_PAGES.some((p) => location.pathname.startsWith(p.to)) ? ' active' : ''}`}
          onClick={() => setMoreOpen(true)}
          aria-haspopup="dialog"
        >
          <span className="tabbar__icon">
            <Ellipsis size={21} aria-hidden="true" />
            {badges.reminders > 0 && <span className="tabbar__dot" aria-label={`${badges.reminders} reminders due`} />}
          </span>
          More
        </button>
      </nav>

      {moreOpen && (
        <MoreSheet
          user={user}
          badges={badges}
          dark={dark}
          onTheme={() => setTheme(dark ? 'light' : 'dark')}
          onSignOut={signOut}
          onClose={() => setMoreOpen(false)}
        />
      )}
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} ui={ui} />}
    </div>
  )
}

// Phones: the pages that don't fit in the bottom bar, the theme and signing out.
function MoreSheet({ user, badges, dark, onTheme, onSignOut, onClose }) {
  return (
    <Modal title="More" labelledBy="more-title" onClose={onClose} size="sm">
      <div className="more">
        <header className="more__head">
          <span className="more__me" aria-hidden="true">
            {user.username.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="more-title" className="more__name">
              {user.username}
            </h2>
            <p className="more__email">{user.email}</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <nav className="more__grid" aria-label="More pages">
          {MORE_PAGES.map(({ to, label, icon: Icon, badge }) => (
            <NavLink key={to} to={to} className="more__tile">
              <span className="more__tile-icon">
                <Icon size={20} aria-hidden="true" />
                {badge && badges[badge] > 0 && <span className="more__badge">{badges[badge]}</span>}
              </span>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="more__row">
          <button type="button" className="more__action" onClick={onTheme} aria-pressed={dark}>
            {dark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
            {dark ? 'Light mode' : 'Dark mode'}
          </button>
          <button type="button" className="more__action more__action--out" onClick={onSignOut}>
            <LogOut size={18} aria-hidden="true" /> Sign out
          </button>
        </div>
      </div>
    </Modal>
  )
}

function AppShell({ user }) {
  return (
    <div className="dash-root">
      <UIProvider>
        <Shell user={user} />
      </UIProvider>
    </div>
  )
}

export default AppShell
