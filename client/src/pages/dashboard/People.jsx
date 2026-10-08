import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, CircleCheck, Clock3, MessageCircle, Phone, Plus, Search, UserPlus, Users } from 'lucide-react'
import { useContacts } from '../../lib/queries.js'
import { useUI } from '../../dashboard/ui.jsx'
import { Avatar, EmptyState } from '../../dashboard/bits.jsx'
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
  owed: { bar: 'bg-attn', badge: 'bg-attn-soft text-attn', amount: 'text-attn', label: 'Owes you', sub: 'left to collect' },
  owe: { bar: 'bg-out', badge: 'bg-out-soft text-out', amount: 'text-out', label: 'You owe', sub: 'you hold their money' },
  settled: { bar: 'bg-ok', badge: 'bg-ok-soft text-ok', amount: 'text-ok', label: 'Settled up', sub: 'nothing pending' },
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
    <li className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgb(22_24_43/0.04)] transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-[0_16px_32px_-22px_rgb(22_24_43/0.5)]">
      <span className={`h-1 ${st.bar}`} aria-hidden="true" />
      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="rounded-full ring-2 ring-surface-3 [&_.avatar]:size-11 [&_.avatar]:text-[15px]">
            <Avatar name={p.name} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col pt-0.5">
            {/* The name link covers the whole card; the buttons sit above it. */}
            <Link
              to={`/dashboard/people/${p.id}`}
              className="truncate text-base leading-tight font-extrabold text-ink no-underline after:absolute after:inset-0 after:content-['']"
            >
              {p.name}
            </Link>
            <span className="mt-0.5 truncate text-[13px] text-ink-3">{p.phone ? displayPhone(p.phone) : 'No phone saved'}</span>
          </div>
          <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${st.badge}`}>
            {kind === 'settled' && <CircleCheck size={12} aria-hidden="true" />}
            {st.label}
          </span>
        </div>

        <div>
          {kind === 'settled' ? (
            <p className="m-0 inline-flex items-center gap-2 text-[22px] leading-[26px] font-extrabold tracking-tight text-ok">
              <CircleCheck size={22} aria-hidden="true" /> All clear
            </p>
          ) : (
            <p className={`m-0 text-[26px] leading-none font-extrabold tracking-tight tabular-nums ${st.amount}`}>{money(main)}</p>
          )}
          <p className="m-0 mt-1.5 text-xs font-semibold text-ink-3">
            {st.sub}
            {other > 0 && (
              <span className={kind === 'owed' ? 'text-out' : 'text-attn'}>
                {' '}
                · {kind === 'owed' ? 'you owe' : 'they owe'} {money(other)}
              </span>
            )}
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <div className="flex h-1.5 gap-[2px] overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
            {p.total_in > 0 && <span className="rounded-full bg-in" style={{ flexGrow: p.total_in }} />}
            {p.total_out > 0 && <span className="rounded-full bg-out" style={{ flexGrow: p.total_out }} />}
          </div>
          <p className="m-0 flex justify-between gap-2 text-xs text-ink-3">
            <span className="inline-flex items-center gap-1">
              <ArrowDownLeft size={13} className="text-in" aria-hidden="true" />
              <strong className="font-bold text-ink-2 tabular-nums">{flow ? money(p.total_in) : '–'}</strong> received
            </span>
            <span className="inline-flex items-center gap-1">
              <ArrowUpRight size={13} className="text-out" aria-hidden="true" />
              <strong className="font-bold text-ink-2 tabular-nums">{flow ? money(p.total_out) : '–'}</strong> paid
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-line-soft bg-surface-2 px-4 py-2.5 sm:px-5">
        <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-semibold text-ink-3">
          <Clock3 size={13} className="shrink-0" aria-hidden="true" />
          <span className="truncate" title="Last entry">
            {lastSeen(p)}
            {p.tx_count > 0 && ` · ${p.tx_count} ${p.tx_count === 1 ? 'entry' : 'entries'}`}
          </span>
        </span>
        <span className="relative z-10 flex shrink-0 items-center gap-1">
          {p.phone && (
            <>
              <a className="icon-button size-8" href={telLink(p.phone)} aria-label={`Call ${p.name}`} title="Call">
                <Phone size={15} />
              </a>
              <a
                className="icon-button size-8"
                href={whatsappLink(
                  p.phone,
                  p.pending_in ? reminderMessage({ name: p.name, type: 'in', amount: p.pending_in }) : `Namaste ${p.name},`,
                )}
                target="_blank"
                rel="noreferrer"
                aria-label={`WhatsApp ${p.name}`}
                title="WhatsApp"
              >
                <MessageCircle size={15} />
              </a>
            </>
          )}
          <button
            type="button"
            className="ml-1 inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-line bg-surface px-2.5 text-xs font-bold text-ink-2 transition-colors hover:border-brand hover:text-brand-text"
            onClick={() => ui.newEntry({ contact: { id: p.id, name: p.name } })}
            aria-label={`New entry for ${p.name}`}
          >
            <Plus size={14} aria-hidden="true" /> Entry
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
function BalancePanel({ all }) {
  const owed = all.reduce((s, p) => s + p.pending_in, 0)
  const owe = all.reduce((s, p) => s + p.pending_out, 0)
  const owedN = all.filter((p) => p.pending_in > 0).length
  const oweN = all.filter((p) => p.pending_out > 0).length
  const net = owed - owe
  return (
    <section aria-label="Balance with everyone" className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <div className="min-w-0">
          <p className="m-0 flex items-center gap-1.5 text-xs font-bold text-ink-3">
            <span className="size-2 rounded-full bg-attn" aria-hidden="true" /> People owe you
          </p>
          <p className="m-0 mt-1 truncate text-[22px] leading-none font-extrabold tracking-tight text-attn tabular-nums sm:text-[28px]">
            {money(owed)}
          </p>
          <p className="m-0 mt-1 text-xs text-ink-3">
            {owedN} {owedN === 1 ? 'person' : 'people'}
          </p>
        </div>
        <div className="order-last col-span-2 rounded-xl bg-surface-2 px-4 py-2.5 text-center sm:order-none sm:col-span-1">
          <p className="m-0 text-xs font-bold text-ink-3">Net</p>
          <p className={`m-0 text-lg font-extrabold tabular-nums ${net >= 0 ? 'text-ok' : 'text-out'}`}>{money(net, { sign: true })}</p>
          <p className="m-0 text-[11px] font-semibold text-ink-3">{net >= 0 ? 'in your favour' : 'you owe overall'}</p>
        </div>
        <div className="min-w-0 text-right">
          <p className="m-0 flex items-center justify-end gap-1.5 text-xs font-bold text-ink-3">
            You owe people <span className="size-2 rounded-full bg-out" aria-hidden="true" />
          </p>
          <p className="m-0 mt-1 truncate text-[22px] leading-none font-extrabold tracking-tight text-out tabular-nums sm:text-[28px]">
            {money(owe)}
          </p>
          <p className="m-0 mt-1 text-xs text-ink-3">
            {oweN} {oweN === 1 ? 'person' : 'people'}
          </p>
        </div>
      </div>
      {owed + owe > 0 && (
        <div className="mt-4 flex h-2.5 gap-[3px] overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
          {owed > 0 && <span className="rounded-full bg-attn" style={{ flexGrow: owed }} />}
          {owe > 0 && <span className="rounded-full bg-out" style={{ flexGrow: owe }} />}
        </div>
      )}
    </section>
  )
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
      <header className="flex flex-wrap items-end justify-between gap-4 pt-7">
        <div className="min-w-0">
          <h1 className="m-0 text-[26px] leading-tight font-extrabold tracking-tight text-ink">People</h1>
          <p className="m-0 mt-1 text-[15px] font-semibold text-ink-2">
            {everyone.length} saved
            <span className="text-ink-3"> · {active} active in the last 30 days</span>
          </p>
        </div>
        <div className="toolbar w-full sm:w-auto">
          <div className="search-field w-full sm:w-72">
            <Search size={16} aria-hidden="true" />
            <input
              className="field w-full"
              type="search"
              placeholder="Search by name or phone"
              aria-label="Search people"
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                update({ q: e.target.value.trim() })
              }}
            />
          </div>
          <button type="button" className="btn btn--primary" onClick={() => ui.newPerson(q.trim())}>
            <UserPlus size={17} aria-hidden="true" /> Add person
          </button>
        </div>
      </header>

      {everyone.length > 0 && <BalancePanel all={everyone} />}

      {everyone.length > 0 && (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div role="radiogroup" aria-label="Show" className="flex gap-1.5 overflow-x-auto pb-0.5">
            {FILTERS.map((f) => {
              const on = filter === f.value
              return (
                <button
                  key={f.label}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => update({ filter: f.value })}
                  className={`inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-bold whitespace-nowrap transition-colors ${
                    on ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-ink-2 hover:border-brand/40'
                  }`}
                >
                  {f.label}
                  <span className={`rounded-full px-1.5 text-xs tabular-nums ${on ? 'bg-white/20' : 'bg-surface-3 text-ink-3'}`}>
                    {counts[f.value]}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="toolbar min-w-0 flex-1">
            <select
              className="field field--compact"
              aria-label="Sort by"
              value={sort}
              onChange={(e) => update({ sort: e.target.value === 'recent' ? '' : e.target.value })}
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {isLoading ? (
        <section className="rounded-2xl border border-line bg-surface">
          <p className="loading">Loading people…</p>
        </section>
      ) : people.length === 0 ? (
        <section className="rounded-2xl border border-line bg-surface">
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
