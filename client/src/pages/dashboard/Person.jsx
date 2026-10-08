import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowLeft,
  ArrowUpRight,
  BellPlus,
  BellRing,
  ChevronDown,
  Download,
  MessageCircle,
  Pencil,
  Phone,
  Printer,
  Scale,
  Search,
  Trash2,
  Wallet,
  X,
} from 'lucide-react'
import { useContact, useReminders, useSave, useTransactions } from '../../lib/queries.js'
import { useUI } from '../../dashboard/ui.jsx'
import { Avatar, EmptyState, Hero as NavyHero, Menu, MenuItem } from '../../dashboard/bits.jsx'
import DateRange, { presetRange } from '../../dashboard/DateRange.jsx'
import { ReminderItem } from './Overview.jsx'
import { balanceWord, withBalance } from '../../lib/statement.js'
import {
  displayPhone,
  downloadCsv,
  formatDate,
  formatMonth,
  modeLabel,
  money,
  reminderMessage,
  relativeDay,
  telLink,
  todayISO,
  whatsappLink,
} from '../../lib/format.js'

/*
 * One person's account: where you stand in a sentence, what is still open with
 * them, and a month-by-month statement with a running balance.
 */

const CARD = 'rounded-[20px] bg-surface shadow-[var(--soft-card)] ring-1 ring-[var(--soft-ring)]'

// Date, details, received, paid, balance. Phones: details and amount.
const ROW = 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-4 sm:grid-cols-[4.5rem_minmax(0,1fr)_6.5rem_6.5rem_7rem] sm:px-5'

// The person's navy header: who they are, how to reach them, where you stand, and what to record next.
function PersonHero({ person: p, ui, contact, onDelete }) {
  const navigate = useNavigate()
  const owedMessage = reminderMessage({ name: p.name, type: 'in', amount: p.pending_in })
  const first = p.name.split(' ')[0]
  const standing =
    p.balance < 0
      ? { label: `${first} owes you`, hint: 'Left to collect' }
      : p.balance > 0
        ? { label: `You owe ${first}`, hint: 'You hold their money' }
        : { label: 'Balance', hint: 'All settled' }
  return (
    <NavyHero
      eyebrow={
        <Link to="/dashboard/people" className="no-print">
          <ArrowLeft size={15} aria-hidden="true" /> People
        </Link>
      }
      title={
        <span className="hero__person">
          <Avatar name={p.name} />
          <span className="min-w-0 truncate">{p.name}</span>
        </span>
      }
      subtitle={
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {p.phone ? (
            <a href={telLink(p.phone)} className="inline-flex min-h-8 items-center text-white no-underline hover:underline">
              {displayPhone(p.phone)}
            </a>
          ) : (
            <span>No phone number saved</span>
          )}
          {p.created_at && <span>Added {formatDate(p.created_at.slice(0, 10))}</span>}
          {p.last_date && <span>Last entry {relativeDay(p.last_date).toLowerCase()}</span>}
          {p.note && <span className="basis-full">{p.note}</span>}
        </span>
      }
      actions={
        <div className="no-print flex flex-wrap items-center gap-2">
          {p.phone && (
            <>
              <a className="btn btn--sm" href={telLink(p.phone)}>
                <Phone size={15} aria-hidden="true" /> Call
              </a>
              <a
                className="btn btn--sm"
                href={whatsappLink(p.phone, p.pending_in > 0 ? owedMessage : `Namaste ${p.name},`)}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={15} aria-hidden="true" /> WhatsApp
              </a>
            </>
          )}
          <Menu label={`More for ${p.name}`}>
            <MenuItem icon={<Pencil size={15} />} onSelect={() => ui.editPerson(p)}>
              Edit person
            </MenuItem>
            <MenuItem icon={<BellPlus size={15} />} onSelect={() => ui.newReminder({ contact, title: `Call ${p.name}` })}>
              Add reminder
            </MenuItem>
            <MenuItem icon={<Printer size={15} />} onSelect={() => navigate(`/statement/${p.id}`)}>
              Print statement
            </MenuItem>
            <MenuItem icon={<Trash2 size={15} />} danger onSelect={onDelete}>
              Delete person
            </MenuItem>
          </Menu>
        </div>
      }
      stats={[
        { label: standing.label, featured: true, value: p.balance ? money(Math.abs(p.balance)) : 'Settled', hint: standing.hint },
        { label: 'Received in total', tone: 'in', value: money(p.total_in), hint: 'All time' },
        { label: 'Paid or sent', tone: 'out', value: money(p.total_out), hint: 'All time' },
        { label: 'Your commission', tone: 'ok', value: money(p.commission ?? 0), hint: 'All time' },
      ]}
    >
      <div className="no-print mt-5 flex flex-wrap gap-2" role="group" aria-label="Record">
        {p.balance !== 0 && (
          <button type="button" className="hero-action" onClick={() => ui.recordPayment(p)}>
            <span className="hero-action__icon hero-action__icon--primary" aria-hidden="true">
              <Wallet size={16} strokeWidth={2.3} />
            </span>
            {p.balance < 0 ? `Record money from ${first}` : `Record money given to ${first}`}
          </button>
        )}
        <button type="button" className="hero-action" onClick={() => ui.newEntry({ contact })}>
          <span className="hero-action__icon hero-action__icon--service" aria-hidden="true">
            <ArrowLeftRight size={16} strokeWidth={2.3} />
          </span>
          Withdrawal or transfer
        </button>
        <button type="button" className="hero-action" onClick={() => ui.newEntry({ type: 'in', contact })}>
          <span className="hero-action__icon hero-action__icon--in" aria-hidden="true">
            <ArrowDownLeft size={16} strokeWidth={2.3} />
          </span>
          Money in
        </button>
        <button type="button" className="hero-action" onClick={() => ui.newEntry({ type: 'out', contact })}>
          <span className="hero-action__icon hero-action__icon--out" aria-hidden="true">
            <ArrowUpRight size={16} strokeWidth={2.3} />
          </span>
          Money out
        </button>
        <button type="button" className="hero-action" onClick={() => ui.newReminder({ contact, title: `Call ${p.name}` })}>
          <span className="hero-action__icon hero-action__icon--service" aria-hidden="true">
            <BellPlus size={16} strokeWidth={2.3} />
          </span>
          Add reminder
        </button>
      </div>
    </NavyHero>
  )
}

function rowText(e, personName) {
  if (e.received_for_other)
    return { title: `Sent for ${e.contact_name}`, sub: `paid to ${personName} on their behalf · ${modeLabel(e.paid_mode ?? e.mode)}` }
  if (e.type === 'transfer') {
    const what = e.label_name || (e.payee === 'self' ? 'Cash withdrawal' : 'Money transfer')
    const where =
      e.payee === 'self'
        ? `${modeLabel(e.mode)} in, ${modeLabel(e.paid_mode ?? e.mode)} out`
        : `to ${e.to_name}${e.to_account ? ` (${e.to_account})` : ''}`
    return { title: what, sub: [where, e.commission ? `${money(e.commission)} commission` : ''].filter(Boolean).join(' · ') }
  }
  if (e.type === 'adjust') return { title: 'Balance', sub: e.direction === 'owes_you' ? `${personName} owes you` : `You owe ${personName}` }
  return {
    title: e.label_name || (e.type === 'in' ? 'Money in' : 'Money out'),
    sub: [modeLabel(e.mode), e.account ? '' : 'not in balance'].filter(Boolean).join(' · '),
  }
}

const ROW_MARK = {
  in: { Icon: ArrowDownLeft, cls: 'bg-in-soft text-in' },
  out: { Icon: ArrowUpRight, cls: 'bg-out-soft text-out' },
  transfer: { Icon: ArrowLeftRight, cls: 'bg-brand-soft text-brand' },
  adjust: { Icon: Scale, cls: 'bg-attn-soft text-attn' },
}

function BalanceCell({ value }) {
  const w = balanceWord(value, money)
  const tone = w.tone === 'attn' ? 'text-attn' : w.tone === 'out' ? 'text-out' : 'text-ok'
  return <span className={`font-extrabold whitespace-nowrap tabular-nums ${tone}`}>{w.text}</span>
}

function StatementRow({ entry: e, person, onOpen }) {
  const t = rowText(e, person.name.split(' ')[0])
  const note = e.note ? ` · ${e.note}` : ''
  const mark = e.received_for_other ? ROW_MARK.out : (ROW_MARK[e.type] ?? ROW_MARK.in)
  return (
    <li className="border-t border-line-soft first:border-t-0">
      <button
        type="button"
        onClick={() => onOpen(e.id)}
        className={`${ROW} min-h-14 w-full cursor-pointer border-0 bg-transparent py-2.5 text-left text-sm transition-colors hover:bg-surface-2`}
      >
        <span className="hidden flex-col leading-tight sm:flex">
          <span className="font-extrabold text-ink tabular-nums">{Number(e.date.slice(8, 10))}</span>
          <span className="text-xs text-ink-3">{formatDate(e.date).replace(/^\d+\s/, '')}</span>
        </span>
        <span className="flex min-w-0 items-center gap-3">
          <span className={`grid size-8 shrink-0 place-items-center rounded-full ${mark.cls}`} aria-hidden="true">
            <mark.Icon size={15} strokeWidth={2.4} />
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate font-bold text-ink">{t.title}</span>
            <span className="line-clamp-2 text-xs text-ink-3">
              <span className="sm:hidden">{formatDate(e.date)} · </span>
              {t.sub}
              {note}
            </span>
          </span>
        </span>
        {/* Phones: what moved, then the balance */}
        <span className="flex flex-col items-end text-right sm:hidden">
          {e.cash_in > 0 && <span className="font-bold whitespace-nowrap text-in tabular-nums">+{money(e.cash_in)}</span>}
          {e.cash_out > 0 && <span className="text-[13px] font-bold whitespace-nowrap text-out tabular-nums">−{money(e.cash_out)}</span>}
          <span className="text-[11px]">
            <BalanceCell value={e.balance} />
          </span>
        </span>
        <span className="hidden text-right font-bold text-in tabular-nums sm:block">{e.cash_in ? money(e.cash_in) : ''}</span>
        <span className="hidden text-right font-bold text-out tabular-nums sm:block">{e.cash_out ? money(e.cash_out) : ''}</span>
        <span className="hidden text-right sm:block">
          <BalanceCell value={e.balance} />
        </span>
      </button>
    </li>
  )
}

function MonthPill({ tone, children }) {
  return (
    <span className={`text-sm font-extrabold whitespace-nowrap tabular-nums ${tone === 'in' ? 'text-in' : 'text-out'}`}>{children}</span>
  )
}

// One month of the statement. The header band stays pinned while its rows scroll by.
function MonthCard({ month: m, person, onOpen }) {
  const [year, mon] = m.key.split('-')
  const short = new Date(Number(year), Number(mon) - 1, 1).toLocaleString('en-IN', { month: 'short' })
  const closing = m.items[0].balance
  return (
    <section className="rounded-2xl bg-surface shadow-[var(--soft-card)] ring-1 ring-[var(--soft-ring)]" aria-label={m.title}>
      <h3 className={`${ROW} m-0 rounded-t-2xl border-b border-line-soft bg-surface-2 py-2.5 lg:sticky lg:top-9 lg:z-10`}>
        <span className="flex min-w-0 items-center gap-3 sm:col-span-2">
          <span
            className="flex w-11 shrink-0 flex-col overflow-hidden rounded-xl bg-surface text-center leading-none shadow-[0_1px_2px_rgb(20_23_43/0.08)] ring-1 ring-line"
            aria-hidden="true"
          >
            <span className="bg-[var(--side)] py-[3px] text-[9px] font-extrabold tracking-wide text-white">{year}</span>
            <span className="py-1 text-[13px] font-extrabold text-ink">{short}</span>
          </span>
          <span className="flex min-w-0 flex-col gap-0.5 leading-tight">
            <span className="truncate text-[15px] font-extrabold text-ink">{m.title}</span>
            <span className="truncate text-xs font-semibold text-ink-3">
              {m.items.length} {m.items.length === 1 ? 'entry' : 'entries'}
              <span className="sm:hidden">
                {' '}
                · month end <BalanceCell value={closing} />
              </span>
            </span>
          </span>
        </span>
        <span className="flex flex-col items-end gap-1 sm:hidden">
          {m.in > 0 && <MonthPill tone="in">+{money(m.in)}</MonthPill>}
          {m.out > 0 && <MonthPill tone="out">−{money(m.out)}</MonthPill>}
        </span>
        <span className="hidden justify-end sm:flex">{m.in > 0 && <MonthPill tone="in">{money(m.in)}</MonthPill>}</span>
        <span className="hidden justify-end sm:flex">{m.out > 0 && <MonthPill tone="out">{money(m.out)}</MonthPill>}</span>
        <span className="hidden flex-col items-end leading-tight sm:flex">
          <span className="text-sm">
            <BalanceCell value={closing} />
          </span>
          <span className="text-[11px] font-semibold text-ink-3">month end</span>
        </span>
      </h3>
      <ul className="m-0 list-none p-0 [&>li:last-child>button]:rounded-b-2xl">
        {m.items.map((e) => (
          <StatementRow key={e.id} entry={e} person={person} onOpen={onOpen} />
        ))}
      </ul>
    </section>
  )
}

const KINDS = [
  { value: 'all', label: 'All entries' },
  { value: 'transfer', label: 'Withdrawals and transfers' },
  { value: 'in', label: 'Money in' },
  { value: 'out', label: 'Money out' },
  { value: 'adjust', label: 'Balance changes' },
]
const MONTHS_PER_PAGE = 6

/*
 * The full statement. The date range sets the period (with its opening and closing
 * balance); type, label and search only narrow which rows are listed.
 * The running balance always counts every entry, so it matches the account.
 */
function Statement({ rows, person, onOpen }) {
  const [range, setRange] = useState(() => ({ preset: '12m', ...presetRange('12m') }))
  const [kind, setKind] = useState('all')
  const [label, setLabel] = useState('')
  const [q, setQ] = useState('')
  const [shownMonths, setShownMonths] = useState(MONTHS_PER_PAGE)

  const labels = useMemo(() => {
    const map = new Map()
    for (const e of rows) if (e.label_id) map.set(e.label_id, e.label_name)
    return [...map].sort((a, b) => a[1].localeCompare(b[1]))
  }, [rows])

  const view = useMemo(() => {
    const from = range.from || ''
    const to = range.to || '9999-12-31'
    const before = rows.filter((e) => from && e.date < from)
    const opening = before.length ? before[before.length - 1].balance : 0
    const period = rows.filter((e) => e.date >= from && e.date <= to)
    const needle = q.trim().toLowerCase()
    const listed = period
      .filter((e) => {
        return kind === 'all' || e.type === kind
      })
      .filter((e) => !label || (label === 'none' ? !e.label_id : e.label_id === label))
      .filter(
        (e) =>
          !needle ||
          [e.label_name, e.note, e.to_name, e.to_account, modeLabel(e.mode), String(e.amount / 100), formatDate(e.date)].some(
            (t) => t && String(t).toLowerCase().includes(needle),
          ),
      )
      .reverse()
    const byMonth = new Map()
    for (const e of listed) {
      const key = e.date.slice(0, 7)
      if (!byMonth.has(key)) byMonth.set(key, { key, title: formatMonth(`${key}-01`), items: [], in: 0, out: 0 })
      const m = byMonth.get(key)
      m.items.push(e)
      m.in += e.cash_in
      m.out += e.cash_out
    }
    const months = [...byMonth.values()]
    return { opening, listed, count: months.reduce((n, m) => n + m.items.length, 0), months, from }
  }, [rows, range, kind, label, q])

  const narrowed = kind !== 'all' || label || q.trim()
  const months = view.months.slice(0, shownMonths)
  const hiddenMonths = view.months.length - months.length

  function resetPaging(fn) {
    return (v) => {
      fn(v)
      setShownMonths(MONTHS_PER_PAGE)
    }
  }

  function exportCsv() {
    downloadCsv(
      `statement-${person.name.replace(/\W+/g, '-').toLowerCase()}-${view.from || 'start'}-to-${range.to || todayISO()}.csv`,
      ['Date', 'Details', 'Sent to', 'Mode', 'Received', 'Paid or sent', 'Balance (− owes you, + you hold)', 'Note'],
      [...view.listed].reverse().map((e) => {
        const t = rowText(e, person.name.split(' ')[0])
        return [
          e.date,
          t.title,
          e.type === 'transfer' && e.payee !== 'self' ? [e.to_name, e.to_account].filter(Boolean).join(' · ') : '',
          modeLabel(e.mode),
          e.cash_in ? e.cash_in / 100 : '',
          e.cash_out ? e.cash_out / 100 : '',
          e.balance / 100,
          e.note ?? '',
        ]
      }),
    )
  }

  return (
    <section className={`${CARD} flex min-w-0 flex-col`} aria-labelledby="person-statement">
      {/* Title and document actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-4 py-3.5 sm:px-5">
        <div className="min-w-0">
          <h2 id="person-statement" className="m-0 flex items-baseline gap-2 text-[17px] font-extrabold text-ink">
            Statement
            <span className="text-xs font-semibold text-ink-3">
              {view.count} {view.count === 1 ? 'entry' : 'entries'}
            </span>
          </h2>
          <p className="m-0 text-xs text-ink-3">
            Balance is what’s left with this person after each entry: “due” means they owe you, “held” means you hold their money.
          </p>
        </div>
        <div className="toolbar no-print">
          <button type="button" className="btn btn--ghost" onClick={exportCsv} title="Download these rows as a spreadsheet">
            <Download size={16} aria-hidden="true" /> CSV
          </button>
          <Link
            className="btn btn--ghost"
            to={`/statement/${person.id}${
              range.preset === '12m'
                ? ''
                : range.preset === 'custom'
                  ? `?range=custom&from=${range.from}&to=${range.to}`
                  : `?range=${range.preset}`
            }`}
            title="A printable statement you can save as PDF"
          >
            <Printer size={16} aria-hidden="true" /> Statement PDF
          </Link>
        </div>
      </div>

      {/* Filters: one row, every control the same height */}
      <div className="toolbar no-print border-b border-line-soft px-4 py-3 sm:px-5">
        <label className="filterbar__search min-w-[14rem] bg-surface-2">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search notes, labels or amounts"
            aria-label="Search the statement"
            value={q}
            onChange={(e) => resetPaging(setQ)(e.target.value)}
          />
        </label>
        <DateRange preset={range.preset} from={range.from} to={range.to} onChange={resetPaging(setRange)} />
        <select className="filterbar__select" aria-label="Show" value={kind} onChange={(e) => resetPaging(setKind)(e.target.value)}>
          {KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
        {labels.length > 0 && (
          <select className="filterbar__select" aria-label="Label" value={label} onChange={(e) => resetPaging(setLabel)(e.target.value)}>
            <option value="">All labels</option>
            <option value="none">Without a label</option>
            {labels.map(([lid, name]) => (
              <option key={lid} value={lid}>
                {name}
              </option>
            ))}
          </select>
        )}
        {narrowed && (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              setKind('all')
              setLabel('')
              setQ('')
              setShownMonths(MONTHS_PER_PAGE)
            }}
          >
            <X size={15} aria-hidden="true" /> Clear
          </button>
        )}
      </div>

      {/* Scrolling body: column headings and month headers stay pinned on wide screens */}
      <div className="min-h-0 bg-surface-2 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto">
        {view.listed.length === 0 ? (
          <EmptyState title={rows.length ? 'Nothing matches' : 'No entries with this person yet'}>
            {rows.length ? 'Try a wider date range or clear the filters.' : 'Use Money in or Money out above to add the first one.'}
          </EmptyState>
        ) : (
          <>
            <div
              className={`${ROW.replace('grid ', '')} hidden h-9 border-b border-line-soft bg-surface text-xs font-bold text-ink-3 sm:grid lg:sticky lg:top-0 lg:z-20`}
              aria-hidden="true"
            >
              <span>Date</span>
              <span>Details</span>
              <span className="text-right">Received</span>
              <span className="text-right">Paid</span>
              <span className="text-right">Balance</span>
            </div>
            <div className="flex flex-col gap-3 p-3 sm:p-4">
              {months.map((m) => (
                <MonthCard key={m.key} month={m} person={person} onOpen={onOpen} />
              ))}
              {hiddenMonths > 0 ? (
                <button type="button" className="btn btn--ghost self-center" onClick={() => setShownMonths((n) => n + MONTHS_PER_PAGE)}>
                  <ChevronDown size={16} aria-hidden="true" /> Show {Math.min(hiddenMonths, MONTHS_PER_PAGE)} older{' '}
                  {Math.min(hiddenMonths, MONTHS_PER_PAGE) === 1 ? 'month' : 'months'} ({hiddenMonths} left)
                </button>
              ) : (
                view.from && (
                  <p className="m-0 rounded-xl border border-dashed border-line px-4 py-3 text-center text-xs font-semibold text-ink-3">
                    Brought forward from before {formatDate(view.from)}:{' '}
                    <strong className="font-extrabold text-ink-2 tabular-nums">{money(view.opening, { sign: true })}</strong>
                  </p>
                )
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function Person() {
  const { id } = useParams()
  const navigate = useNavigate()
  const ui = useUI()
  const save = useSave()
  const { data: person, isLoading, error } = useContact(id)
  const { data: tx } = useTransactions({ contact_id: id, limit: 5000 })
  const { data: reminders = [] } = useReminders({ contact_id: id, status: 'open' })

  // Running balance, oldest first. The statement shows it newest first.
  const rows = useMemo(() => withBalance(tx?.items ?? [], id), [tx, id])

  if (isLoading)
    return (
      <div className="page">
        <p className="loading">Loading…</p>
      </div>
    )
  if (error) {
    return (
      <div className="page">
        <EmptyState
          title="This person couldn’t be found"
          action={
            <Link to="/dashboard/people" className="btn btn--primary">
              Back to people
            </Link>
          }
        >
          {error.message}
        </EmptyState>
      </div>
    )
  }

  const contact = { id: person.id, name: person.name, phone: person.phone }

  async function remove() {
    const ok = await ui.confirm({
      title: `Delete ${person.name}?`,
      body: 'This removes the person and their phone number. It can’t be undone.',
      confirmLabel: 'Delete person',
      danger: true,
    })
    if (!ok) return
    try {
      await save.mutateAsync({ path: `/contacts/${person.id}`, method: 'DELETE' })
      ui.toast('Person deleted')
      navigate('/dashboard/people')
    } catch (err) {
      ui.toast(err.message, 'error')
    }
  }

  async function markDone(reminder) {
    await save.mutateAsync({ path: `/reminders/${reminder.id}/done` })
    ui.toast('Reminder done')
  }

  const side = reminders.length > 0

  return (
    <div className="page">
      <PersonHero person={person} ui={ui} contact={contact} onDelete={remove} />

      <div className={`grid items-start gap-5 ${side ? 'lg:grid-cols-[minmax(0,1fr)_22rem]' : ''}`}>
        <Statement rows={rows} person={person} onOpen={ui.viewEntry} />
        {side && (
          <div className="order-first flex min-w-0 flex-col gap-5 lg:order-none lg:sticky lg:top-4">
            {reminders.length > 0 && (
              <section className={`${CARD} no-print`} aria-labelledby="person-rem">
                <h2
                  id="person-rem"
                  className="m-0 flex items-center gap-2 border-b border-line-soft px-4 py-3.5 text-[15px] font-extrabold text-ink sm:px-5"
                >
                  <BellRing size={16} className="text-brand" aria-hidden="true" /> Reminders
                </h2>
                <ul className="reminder-list px-4 pb-2 sm:px-5">
                  {reminders.map((r) => (
                    <ReminderItem key={r.id} reminder={r} onDone={markDone} compact />
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Person
