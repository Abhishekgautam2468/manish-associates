import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MessageCircle, Phone, Plus, Search, UserPlus, Users } from 'lucide-react'
import { useContacts } from '../../lib/queries.js'
import { useUI } from '../../dashboard/ui.jsx'
import { Avatar, EmptyState, Hero, Segmented } from '../../dashboard/bits.jsx'
import { addDays, displayPhone, money, relativeDay, reminderMessage, telLink, todayISO, whatsappLink } from '../../lib/format.js'

/*
 * People is a directory: one card per person showing where you stand with them,
 * most recently active first, with quick actions to call, message or add an entry.
 */

const SORTS = [
  { value: 'recent', label: 'Recent activity' },
  { value: 'name', label: 'Name' },
  { value: 'receive', label: 'Owe you most' },
  { value: 'pay', label: 'You owe most' },
]

function lastSeen(p) {
  return p.last_date ? relativeDay(p.last_date) : 'No entries yet'
}

const STANDING = {
  owed: { dot: 'bg-mark', label: 'Owes you', sub: 'Left to collect' },
  owe: { dot: 'bg-out', label: 'You owe', sub: 'You hold their money' },
  settled: { dot: 'bg-ok', label: 'Settled', sub: 'Nothing pending' },
}

// Which way the balance leans for this person; the bigger side wins when both are open.
function standingOf(p) {
  if (!p.pending_in && !p.pending_out) return 'settled'
  return p.pending_in >= p.pending_out ? 'owed' : 'owe'
}

function PersonCard({ person: p, ui }) {
  const kind = standingOf(p)
  const st = STANDING[kind]
  const main = kind === 'owed' ? p.pending_in : kind === 'owe' ? p.pending_out : 0
  const other = kind === 'owed' ? p.pending_out : kind === 'owe' ? p.pending_in : 0
  const flow = p.total_in + p.total_out
  return (
    <li className="group relative flex min-w-0 flex-col rounded-[20px] bg-surface shadow-[var(--soft-card)] ring-1 ring-[var(--soft-ring)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_40px_-26px_rgb(20_23_43/0.45)] hover:ring-brand/30">
      <div className="flex flex-1 flex-col gap-5 p-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="[&_.avatar]:size-11 [&_.avatar]:text-[15px]">
            <Avatar name={p.name} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            {/* The name link covers the whole card; the buttons sit above it. */}
            <Link
              to={`/dashboard/people/${p.id}`}
              className="truncate text-base leading-tight font-bold text-ink no-underline after:absolute after:inset-0 after:rounded-[20px] after:content-['']"
            >
              {p.name}
            </Link>
            <span className="mt-0.5 truncate text-[13px] text-ink-3">{p.phone ? displayPhone(p.phone) : 'No phone number'}</span>
          </div>
        </div>

        <div>
          <p className="m-0 flex items-center gap-2 text-xs font-semibold text-ink-3">
            <span className={`size-2 rounded-full ${st.dot}`} aria-hidden="true" />
            {st.label}
          </p>
          <p
            className={`m-0 mt-1.5 text-[26px] leading-none font-extrabold tracking-tight tabular-nums ${kind === 'settled' ? 'text-ink-3' : 'text-ink'}`}
          >
            {kind === 'settled' ? 'All clear' : money(main)}
          </p>
          <p className="m-0 mt-1.5 text-xs text-ink-3">
            {st.sub}
            {other > 0 && (
              <>
                {' '}
                · {kind === 'owed' ? 'you also owe' : 'they also owe'} {money(other)}
              </>
            )}
          </p>
        </div>

        <dl className="mt-auto grid grid-cols-2 gap-3 rounded-xl bg-surface-2 px-3.5 py-2.5 text-xs">
          <div className="min-w-0">
            <dt className="text-ink-3">Received</dt>
            <dd className="m-0 mt-0.5 truncate text-sm font-bold text-ink tabular-nums">{flow ? money(p.total_in) : '–'}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-ink-3">Paid or sent</dt>
            <dd className="m-0 mt-0.5 truncate text-sm font-bold text-ink tabular-nums">{flow ? money(p.total_out) : '–'}</dd>
          </div>
        </dl>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-line-soft px-5 py-3">
        <span className="min-w-0 truncate text-xs text-ink-3" title="Last entry">
          {lastSeen(p)}
          {p.tx_count > 0 && ` · ${p.tx_count} ${p.tx_count === 1 ? 'entry' : 'entries'}`}
        </span>
        <span className="relative z-10 flex shrink-0 items-center gap-0.5">
          {p.phone && (
            <>
              <a className="icon-button size-9" href={telLink(p.phone)} aria-label={`Call ${p.name}`} title="Call">
                <Phone size={16} />
              </a>
              <a
                className="icon-button size-9"
                href={whatsappLink(
                  p.phone,
                  p.pending_in ? reminderMessage({ name: p.name, type: 'in', amount: p.pending_in }) : `Namaste ${p.name},`,
                )}
                target="_blank"
                rel="noreferrer"
                aria-label={`WhatsApp ${p.name}`}
                title="WhatsApp"
              >
                <MessageCircle size={16} />
              </a>
            </>
          )}
          <button
            type="button"
            className="icon-button size-9 bg-brand-soft text-brand-text hover:bg-brand hover:text-white"
            onClick={() => ui.newEntry({ contact: { id: p.id, name: p.name } })}
            aria-label={`New entry for ${p.name}`}
            title="New entry"
          >
            <Plus size={17} />
          </button>
        </span>
      </div>
    </li>
  )
}

const FILTERS = [
  { value: '', label: 'Everyone' },
  { value: 'receive', label: 'Owe you' },
  { value: 'pay', label: 'You owe' },
  { value: 'settled', label: 'Settled up' },
]

// The overall balance with everyone: who owes whom, as one split bar.
// Owed to you, you owe, and the net, for the hero.
function balanceStats(all) {
  const owed = all.reduce((s, p) => s + p.pending_in, 0)
  const owe = all.reduce((s, p) => s + p.pending_out, 0)
  const owedN = all.filter((p) => p.pending_in > 0).length
  const oweN = all.filter((p) => p.pending_out > 0).length
  const net = owed - owe
  const people = (n) => `${n} ${n === 1 ? 'person' : 'people'}`
  return [
    {
      label: 'Owed to you',
      tone: 'attn',
      value: money(owed),
      hint: owedN ? `By ${people(owedN)}` : 'Nobody owes you',
      to: '/dashboard/balances',
    },
    {
      label: 'You owe',
      tone: 'out',
      value: money(owe),
      hint: oweN ? `To ${people(oweN)}` : 'You owe nobody',
      to: '/dashboard/balances?side=out',
    },
    {
      label: 'Net',
      featured: true,
      value: money(Math.abs(net)),
      hint: net === 0 ? 'All square' : net > 0 ? 'In your favour' : 'You owe overall',
    },
  ]
}

function People() {
  const ui = useUI()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const filter = params.get('filter') ?? ''
  const sort = params.get('sort') ?? 'recent'
  const serverFilter = filter === 'settled' ? '' : filter
  const { data: list = [], isLoading } = useContacts({ q: q.trim(), filter: serverFilter, sort })
  const people = filter === 'settled' ? list.filter((p) => !p.pending_in && !p.pending_out) : list
  // Everyone, newest activity first, for the header and the counts.
  const { data: everyone = [] } = useContacts({ q: '', filter: '', sort: 'recent' })

  function update(changes) {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    setParams(next, { replace: true })
  }

  const active = everyone.filter((p) => p.last_date && p.last_date >= addDays(todayISO(), -29)).length
  const counts = {
    '': everyone.length,
    receive: everyone.filter((p) => p.pending_in > 0).length,
    pay: everyone.filter((p) => p.pending_out > 0).length,
    settled: everyone.filter((p) => !p.pending_in && !p.pending_out).length,
  }

  return (
    <div className="page">
      <Hero
        title="People"
        subtitle={
          <>
            <strong>{everyone.length}</strong> saved · {active} active in the last 30 days
          </>
        }
        actions={
          <button type="button" className="btn btn--primary" onClick={() => ui.newPerson(q.trim())}>
            <UserPlus size={17} aria-hidden="true" /> Add person
          </button>
        }
        stats={everyone.length > 0 ? balanceStats(everyone) : null}
      />

      {everyone.length > 0 && (
        <div className="filterbar">
          <label className="filterbar__search">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search by name or phone number"
              aria-label="Search people"
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                update({ q: e.target.value.trim() })
              }}
            />
          </label>
          <div className="filterbar__tabs">
            <Segmented
              label="Show"
              size="sm"
              value={filter}
              onChange={(value) => update({ filter: value })}
              options={FILTERS.map((x) => ({
                value: x.value,
                label: (
                  <>
                    {x.label}
                    <span className="segmented__count">{counts[x.value]}</span>
                  </>
                ),
              }))}
            />
          </div>
          <div className="filterbar__end">
            <select
              className="filterbar__select"
              aria-label="Sort by"
              value={sort}
              onChange={(e) => update({ sort: e.target.value === 'recent' ? '' : e.target.value })}
            >
              {SORTS.map((x) => (
                <option key={x.value} value={x.value}>
                  {x.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {isLoading ? (
        <section className="rounded-[20px] bg-surface shadow-[var(--soft-card)] ring-1 ring-[var(--soft-ring)]">
          <p className="loading">Loading people…</p>
        </section>
      ) : people.length === 0 ? (
        <section className="rounded-[20px] bg-surface shadow-[var(--soft-card)] ring-1 ring-[var(--soft-ring)]">
          <EmptyState
            icon={<Users size={22} />}
            title={q ? `No one called “${q}”` : filter ? 'No one here' : 'No people yet'}
            action={
              <button type="button" className="btn btn--primary" onClick={() => ui.newPerson(q.trim())}>
                {q ? `Add “${q.trim()}”` : 'Add person'}
              </button>
            }
          >
            {q ? 'Check the spelling, or add them as a new person.' : 'Add the people you receive money from or pay.'}
          </EmptyState>
        </section>
      ) : (
        <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
          {people.map((p) => (
            <PersonCard key={p.id} person={p} ui={ui} />
          ))}
        </ul>
      )}
    </div>
  )
}

export default People
