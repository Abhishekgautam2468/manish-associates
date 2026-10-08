import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, BellPlus, Hourglass, Search, UserPlus, User, ReceiptText, CornerDownLeft } from 'lucide-react'
import Modal from './Modal.jsx'
import { useContacts, useTransactions } from '../lib/queries.js'
import { displayPhone, formatDate, money } from '../lib/format.js'
import { ALL_PAGES } from './nav.js'

function CommandPalette({ onClose, ui }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [active, setActive] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 150)
    return () => clearTimeout(t)
  }, [query])

  const { data: people = [] } = useContacts({ q: debounced, sort: 'recent' })
  const { data: entries } = useTransactions({ q: debounced, limit: 6 }, { enabled: debounced.length > 1 })

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    const match = (label) => !q || label.toLowerCase().includes(q)
    const actions = [
      { label: 'New entry: money in', icon: ArrowDownLeft, run: () => ui.newEntry({ type: 'in' }) },
      { label: 'New entry: money out', icon: ArrowUpRight, run: () => ui.newEntry({ type: 'out' }) },
      { label: 'New pending entry', icon: Hourglass, run: () => ui.newEntry({ status: 'pending' }) },
      { label: 'Add person', icon: UserPlus, run: () => ui.newPerson(query.trim()) },
      { label: 'New reminder', icon: BellPlus, run: () => ui.newReminder() },
    ].filter((a) => match(a.label))
    const pages = ALL_PAGES.filter((p) => match(p.label)).map((p) => ({
      label: `Go to ${p.label}`,
      icon: p.icon,
      run: () => navigate(p.to),
    }))
    const personItems = (debounced ? people : people.slice(0, 4)).slice(0, 6).map((p) => ({
      label: p.name,
      meta: p.phone ? displayPhone(p.phone) : '',
      icon: User,
      run: () => navigate(`/dashboard/people/${p.id}`),
    }))
    const entryItems = (debounced.length > 1 ? entries?.items ?? [] : []).map((e) => ({
      label: `${e.contact_name ?? e.label_name ?? 'Entry'}: ${money(e.amount)} ${e.type === 'in' ? 'in' : 'out'}`,
      meta: formatDate(e.date),
      icon: ReceiptText,
      run: () => ui.viewEntry(e.id),
    }))
    return [
      { group: 'People', items: personItems },
      { group: 'Entries', items: entryItems },
      { group: 'Actions', items: actions },
      { group: 'Pages', items: pages },
    ].filter((g) => g.items.length)
  }, [query, debounced, people, entries, ui, navigate])

  const flat = items.flatMap((g) => g.items)
  useEffect(() => setActive(0), [query])

  function run(item) {
    onClose()
    item.run()
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, flat.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && flat[active]) {
      e.preventDefault()
      run(flat[active])
    }
  }

  let index = -1
  return (
    <Modal title="Search" onClose={onClose} size="palette">
      <div className="palette">
        <div className="palette__input">
          <Search size={18} aria-hidden="true" />
          <input
            autoFocus
            className="palette__field"
            placeholder="Search people, entries, or type an action"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Search"
            aria-controls="palette-results"
            aria-activedescendant={flat[active] ? `palette-${active}` : undefined}
          />
        </div>
        <div className="palette__results" id="palette-results" role="listbox">
          {flat.length === 0 && <p className="palette__empty">Nothing matches “{query}”.</p>}
          {items.map((g) => (
            <div key={g.group} role="group" aria-label={g.group}>
              <p className="palette__group">{g.group}</p>
              {g.items.map((item) => {
                index += 1
                const i = index
                const Icon = item.icon
                return (
                  <div
                    key={`${g.group}-${item.label}-${i}`}
                    id={`palette-${i}`}
                    role="option"
                    aria-selected={i === active}
                    className="palette__item"
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      run(item)
                    }}
                  >
                    <Icon size={16} aria-hidden="true" />
                    <span className="palette__label">{item.label}</span>
                    {item.meta && <span className="palette__meta">{item.meta}</span>}
                    {i === active && <CornerDownLeft size={14} className="palette__enter" aria-hidden="true" />}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}

export default CommandPalette
