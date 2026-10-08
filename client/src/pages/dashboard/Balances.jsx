import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, BellPlus, BellRing, CircleCheck, MessageCircle, Plus, Search, Wallet } from 'lucide-react'
import { useContacts, useReminders } from '../../lib/queries.js'
import { useUI } from '../../dashboard/ui.jsx'
import Modal from '../../dashboard/Modal.jsx'
import { Avatar, EmptyState, Hero } from '../../dashboard/bits.jsx'
import { daysBetween, displayPhone, dueLabel, money, reminderMessage, todayISO, whatsappLink } from '../../lib/format.js'

/*
 * Balances: what's left with each person.
 *   Owe you — they owe you money (for example a transfer they paid only part of).
 *   You owe — you hold their money (they gave extra, or left money with you).
 * One ranked list per side, with the quick actions you need to settle it.
 */

const SORTS = [
  { value: 'amount', label: 'Largest first' },
  { value: 'quiet', label: 'Quiet longest' },
  { value: 'name', label: 'Name' },
]

function since(lastDate) {
  if (!lastDate) return 'no entries'
  const d = daysBetween(lastDate, todayISO())
  if (d <= 0) return 'today'
  if (d === 1) return 'yesterday'
  if (d < 60) return `${d} days ago`
  return `${Math.floor(d / 30)} months ago`
}

const SIDE = {
  in: {
    label: 'Owe you',
    Icon: ArrowDownLeft,
    tone: 'text-attn',
    soft: 'bg-attn-soft text-attn',
    bar: 'bg-attn',
    word: 'owes you',
    action: 'Received',
  },
  out: {
    label: 'You owe',
    Icon: ArrowUpRight,
    tone: 'text-out',
    soft: 'bg-out-soft text-out',
    bar: 'bg-out',
    word: 'you owe',
    action: 'Paid',
  },
}

function ReminderTag({ reminder }) {
  if (!reminder) return null
  const today = todayISO()
  const tone =
    reminder.due_date < today
      ? 'bg-danger-soft text-danger'
      : reminder.due_date === today
        ? 'bg-attn-soft text-attn'
        : 'bg-surface-3 text-ink-2'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${tone}`}>
      <BellRing size={11} aria-hidden="true" /> {dueLabel(reminder.due_date)}
    </span>
  )
}

// Person, last entry, balance with its share of the total, actions.
const ROW = 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-4 sm:px-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_9rem_13rem]'

function PersonRow({ person: p, side, max, reminder, ui }) {
  const s = SIDE[side]
  const amount = Math.abs(p.balance)
  return (
    <li className={`${ROW} border-t border-line-soft py-3 text-sm first:border-t-0 hover:bg-surface-2`}>
      <Link to={`/dashboard/people/${p.id}`} className="flex min-w-0 items-center gap-3 no-underline">
        <Avatar name={p.name} />
        <span className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-[15px] font-bold text-ink">{p.name}</span>
          <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-3">
            <span>{p.phone ? displayPhone(p.phone) : 'No phone'}</span>
            <span className="lg:hidden">· last entry {since(p.last_date)}</span>
            <ReminderTag reminder={reminder} />
          </span>
        </span>
      </Link>

      {/* Share of the total, wide screens */}
      <span className="hidden min-w-0 flex-col gap-1.5 lg:flex">
        <span className="h-1.5 overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
          <span className={`block h-full rounded-full ${s.bar}`} style={{ width: `${Math.max(3, (amount / max) * 100)}%` }} />
        </span>
        <span className="text-xs text-ink-3">Last entry {since(p.last_date)}</span>
      </span>

      <span className="flex flex-col items-end text-right">
        <span className={`text-[17px] font-extrabold whitespace-nowrap tabular-nums ${s.tone}`}>{money(amount)}</span>
        <span className="text-[11px] font-semibold text-ink-3">{s.word}</span>
      </span>

      <span className="col-span-2 flex items-center justify-end gap-1.5 pt-2 lg:col-span-1 lg:pt-0">
        {p.phone ? (
          <a
            className="icon-button icon-button--bordered size-9"
            href={whatsappLink(p.phone, reminderMessage({ name: p.name, type: side, amount, dueDate: reminder?.due_date }))}
            target="_blank"
            rel="noreferrer"
            aria-label={`WhatsApp ${p.name}`}
            title="Send a reminder on WhatsApp"
          >
            <MessageCircle size={16} />
          </a>
        ) : (
          <span
            className="icon-button icon-button--bordered size-9 cursor-not-allowed opacity-40"
            title="No phone saved"
            aria-label="No phone saved"
          >
            <MessageCircle size={16} />
          </span>
        )}
        <button
          type="button"
          className={`icon-button icon-button--bordered size-9 ${
            !reminder
              ? ''
              : reminder.due_date < todayISO()
                ? '!border-danger/40 !bg-danger-soft !text-danger'
                : '!border-attn-line !bg-attn-soft !text-attn'
          }`}
          onClick={() =>
            reminder
              ? ui.editReminder(reminder)
              : ui.newReminder({
                  contact: { id: p.id, name: p.name },
                  title: side === 'in' ? `Collect ${money(amount)} from ${p.name}` : `Give ${money(amount)} back to ${p.name}`,
                  amount: amount / 100,
                })
          }
          aria-label={reminder ? `Reminder for ${p.name}: ${dueLabel(reminder.due_date)}. Edit it` : `Set a reminder for ${p.name}`}
          title={reminder ? `Reminder: ${dueLabel(reminder.due_date)}` : 'Set a reminder'}
        >
          {reminder ? <BellRing size={16} /> : <BellPlus size={16} />}
        </button>
        <button
          type="button"
          className="btn btn--sm btn--ghost"
          onClick={() => ui.recordPayment(p)}
          title={side === 'in' ? 'Record money they paid you' : 'Record money you gave them'}
        >
          <Wallet size={14} aria-hidden="true" /> {s.action}
        </button>
      </span>
    </li>
  )
}

// Send a WhatsApp reminder to everyone on one side, one tap each (browsers allow one chat at a time).
const QUIET = [
  { days: 0, label: 'Everyone' },
  { days: 7, label: 'Quiet 7+ days' },
  { days: 15, label: '15+ days' },
  { days: 30, label: '30+ days' },
]

function RemindAll({ side, people, onClose }) {
  const [quiet, setQuiet] = useState(0)
  const [sent, setSent] = useState(() => new Set())
  const list = people
    .filter((p) => (p.last_date ? daysBetween(p.last_date, todayISO()) : 999) >= quiet)
    .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
  const withPhone = list.filter((p) => p.phone)
  const total = list.reduce((s, p) => s + Math.abs(p.balance), 0)
  return (
    <Modal
      title={side === 'in' ? 'Remind everyone who owes you' : 'Tell everyone you hold money for'}
      description="Opens WhatsApp with the message ready, one person at a time."
      icon={<MessageCircle size={19} />}
      onClose={onClose}
    >
      <div className="modal__body flex flex-col gap-4">
        <div role="radiogroup" aria-label="Who to remind" className="flex flex-wrap gap-1.5">
          {QUIET.map((q) => (
            <button
              key={q.days}
              type="button"
              role="radio"
              aria-checked={quiet === q.days}
              onClick={() => setQuiet(q.days)}
              className={`inline-flex h-8 cursor-pointer items-center rounded-full border px-3 text-xs font-bold ${
                quiet === q.days ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-ink-2 hover:border-brand/40'
              }`}
            >
              {q.label}
            </button>
          ))}
        </div>
        <p className="m-0 flex flex-wrap items-baseline justify-between gap-2 text-sm">
          <span className="font-bold text-ink">
            {list.length} {list.length === 1 ? 'person' : 'people'} · {money(total)}
          </span>
          <span className="text-xs font-semibold text-ink-3">
            {withPhone.filter((p) => sent.has(p.id)).length} of {withPhone.length} sent
          </span>
        </p>
        {list.length === 0 ? (
          <p className="m-0 rounded-xl bg-surface-2 px-4 py-6 text-center text-sm text-ink-3">Nobody matches.</p>
        ) : (
          <ul className="m-0 flex max-h-[50vh] list-none flex-col overflow-y-auto rounded-xl border border-line p-0">
            {list.map((p) => {
              const amount = Math.abs(p.balance)
              const done = sent.has(p.id)
              return (
                <li key={p.id} className="flex items-center gap-3 border-t border-line-soft px-3 py-2.5 first:border-t-0">
                  <Avatar name={p.name} size="sm" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-bold text-ink">{p.name}</span>
                    <span className="text-xs text-ink-3">
                      <strong className={`font-bold ${side === 'in' ? 'text-attn' : 'text-out'}`}>{money(amount)}</strong> · last entry{' '}
                      {since(p.last_date)}
                    </span>
                  </span>
                  {!p.phone ? (
                    <span className="text-xs font-semibold text-ink-3">No phone</span>
                  ) : done ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-ok">
                      <CircleCheck size={14} aria-hidden="true" /> Sent
                    </span>
                  ) : (
                    <a
                      className="btn btn--sm btn--ghost"
                      href={whatsappLink(p.phone, reminderMessage({ name: p.name, type: side, amount }))}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setSent((x) => new Set(x).add(p.id))}
                    >
                      <MessageCircle size={14} aria-hidden="true" /> Send
                    </a>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <footer className="modal__foot">
        <span className="modal__foot-spacer" />
        <button type="button" className="btn btn--primary" onClick={onClose}>
          Done
        </button>
      </footer>
    </Modal>
  )
}

function Balances() {
  const ui = useUI()
  const [params, setParams] = useSearchParams()
  const side = params.get('side') === 'out' ? 'out' : 'in'
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('amount')
  const [remindAll, setRemindAll] = useState(false)
  const { data: everyone = [], isLoading } = useContacts({ sort: 'recent' })
  const { data: open = [] } = useReminders({ status: 'open' })

  // The soonest open reminder for each person.
  const reminders = useMemo(() => {
    const map = new Map()
    for (const r of [...open].sort((a, b) => a.due_date.localeCompare(b.due_date)))
      if (r.contact_id && !map.has(r.contact_id)) map.set(r.contact_id, r)
    return map
  }, [open])

  const owed = everyone.filter((p) => p.balance < 0)
  const held = everyone.filter((p) => p.balance > 0)
  const sideList = side === 'in' ? owed : held
  const needle = q.trim().toLowerCase()
  const list = sideList
    .filter((p) => !needle || p.name.toLowerCase().includes(needle) || (p.phone ?? '').includes(needle.replace(/\D/g, '') || '§'))
    .sort((a, b) =>
      sort === 'name'
        ? a.name.localeCompare(b.name)
        : sort === 'quiet'
          ? (a.last_date ?? '').localeCompare(b.last_date ?? '')
          : Math.abs(b.balance) - Math.abs(a.balance),
    )
  const max = Math.max(1, ...sideList.map((p) => Math.abs(p.balance)))
  const net = owed.reduce((s, p) => s - p.balance, 0) - held.reduce((s, p) => s + p.balance, 0)

  return (
    <div className="page">
      <Hero
        title="Balances"
        subtitle={
          <>
            What’s left to settle with each person
            {everyone.length > 0 && (
              <>
                {' '}
                · net <strong>{money(Math.abs(net))}</strong> {net >= 0 ? 'in your favour' : 'you owe overall'}
              </>
            )}
          </>
        }
        actions={
          <>
            {sideList.length > 0 && (
              <button type="button" className="btn" onClick={() => setRemindAll(true)}>
                <MessageCircle size={16} aria-hidden="true" /> {side === 'in' ? 'Remind everyone' : 'Message everyone'}
              </button>
            )}
            <button
              type="button"
              className="btn"
              onClick={() => ui.newEntry({ type: 'adjust', direction: side === 'in' ? 'owes_you' : 'you_owe' })}
            >
              <Plus size={16} aria-hidden="true" /> Opening balance
            </button>
          </>
        }
        stats={[
          {
            label: 'Owed to you',
            tone: 'attn',
            value: money(owed.reduce((s, p) => s + Math.abs(p.balance), 0)),
            hint: owed.length ? `By ${owed.length} ${owed.length === 1 ? 'person' : 'people'}` : 'Nobody owes you',
            active: side === 'in',
            onClick: () => setParams({}, { replace: true }),
          },
          {
            label: 'You owe',
            tone: 'out',
            value: money(held.reduce((s, p) => s + Math.abs(p.balance), 0)),
            hint: held.length ? `To ${held.length} ${held.length === 1 ? 'person' : 'people'}` : 'You owe nobody',
            active: side === 'out',
            onClick: () => setParams({ side: 'out' }, { replace: true }),
          },
        ]}
      />

      {sideList.length > 0 && (
        <div className="filterbar">
          <label className="filterbar__search">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search by name or phone number"
              aria-label="Search balances"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <div className="filterbar__end">
            <select className="filterbar__select" aria-label="Sort by" value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORTS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {isLoading ? (
        <section className="rounded-[20px] bg-surface shadow-[var(--soft-card)] ring-1 ring-[var(--soft-ring)]">
          <p className="loading">Loading…</p>
        </section>
      ) : sideList.length === 0 ? (
        <section className="rounded-[20px] bg-surface shadow-[var(--soft-card)] ring-1 ring-[var(--soft-ring)]">
          <EmptyState icon={<CircleCheck size={22} />} title={side === 'in' ? 'Nobody owes you anything' : 'You don’t hold anyone’s money'}>
            {side === 'in'
              ? 'When someone gives you less than you send or give them, the rest shows up here.'
              : 'When someone gives you more than you send or give them, it shows up here.'}
          </EmptyState>
        </section>
      ) : list.length === 0 ? (
        <section className="rounded-[20px] bg-surface shadow-[var(--soft-card)] ring-1 ring-[var(--soft-ring)]">
          <EmptyState icon={<Search size={22} />} title={`No one matching “${q}”`} />
        </section>
      ) : (
        <section
          className="overflow-hidden rounded-[20px] bg-surface shadow-[var(--soft-card)] ring-1 ring-[var(--soft-ring)]"
          aria-label={SIDE[side].label}
        >
          <div
            className={`${ROW} hidden border-b border-line-soft bg-surface-2 py-2 text-xs font-bold text-ink-3 lg:grid`}
            aria-hidden="true"
          >
            <span>Person</span>
            <span>Share of total</span>
            <span className="text-right">Balance</span>
            <span />
          </div>
          <ul className="m-0 list-none p-0">
            {list.map((p) => (
              <PersonRow key={p.id} person={p} side={side} max={max} reminder={reminders.get(p.id)} ui={ui} />
            ))}
          </ul>
          <div className={`${ROW} border-t-2 border-line bg-surface-2 py-3 text-sm font-extrabold`}>
            <span className="text-ink">
              Total · {list.length} {list.length === 1 ? 'person' : 'people'}
            </span>
            <span className="hidden lg:block" />
            <span className={`text-right tabular-nums ${SIDE[side].tone}`}>{money(list.reduce((s, p) => s + Math.abs(p.balance), 0))}</span>
            <span className="hidden lg:block" />
          </div>
        </section>
      )}
      {remindAll && <RemindAll side={side} people={sideList} onClose={() => setRemindAll(false)} />}
    </div>
  )
}

export default Balances
