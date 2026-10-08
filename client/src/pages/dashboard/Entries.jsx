import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Download, ListFilter, Pencil, ReceiptText, Scale, Search, X } from 'lucide-react'
import { qs, useLabels, useTransactions } from '../../lib/queries.js'
import { LabelChip } from '../../dashboard/LabelPicker.jsx'
import { useUI } from '../../dashboard/ui.jsx'
import DateRange, { presetRange } from '../../dashboard/DateRange.jsx'
import { Avatar, EmptyState, Hero, Segmented } from '../../dashboard/bits.jsx'
import { MODES, formatDate, formatFullDate, formatMonthShort, modeLabel, money, relativeDay } from '../../lib/format.js'

const PAGE = 100
const fmtWeekdayLong = new Intl.DateTimeFormat('en-IN', {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
})
const formatWeekdayLong = (iso) => fmtWeekdayLong.format(new Date(`${iso}T00:00:00`))
const RANGE_WORDS = {
  today: 'today',
  week: 'this week',
  month: 'this month',
  'last-month': 'last month',
  '30d': 'in the last 30 days',
  '3m': 'in the last 3 months',
  '12m': 'in the last 12 months',
  year: 'this year',
}

/*
 * The entries page reads like a day book: a date rail on the left, the day's
 * entries on the right with separate Money in and Money out columns.
 * Colour is kept for money only: blue in, orange out, marigold not yet paid.
 */

// One grid for the column header, the day headers and every row, so the
// columns line up down the page. Phones: party + amount. Tablets: party, in, out.
// Wide screens: party, label, mode, note, in, out.
const ROW =
  'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-4 sm:grid-cols-[minmax(0,1fr)_7rem_7rem] sm:px-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,0.9fr)_minmax(0,0.75fr)_minmax(0,1.1fr)_7.5rem_7.5rem]'

// A stable empty list, so the day grouping isn't redone on every render while loading.
const NO_ITEMS = []

function periodText(preset, from, to) {
  if (!from && !to) return 'All time'
  if (from === to) return formatFullDate(from)
  const sameYear = from.slice(0, 4) === to.slice(0, 4)
  return `${sameYear ? formatDate(from, { short: true }) : formatFullDate(from)} – ${formatFullDate(to)}`
}

function Cash({ value, tone }) {
  if (!value) return null
  return (
    <span className={`text-[15px] font-bold whitespace-nowrap tabular-nums ${tone === 'in' ? 'text-in' : 'text-out'}`}>{money(value)}</span>
  )
}

// A label as a soft chip tinted with the label's own colour.
function LabelTag({ entry: e }) {
  if (!e.label_name) return <span className="text-ink-3">–</span>
  return (
    <span
      className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-bold"
      style={{
        color: `color-mix(in oklab, ${e.label_color} 70%, var(--ink))`,
        background: `color-mix(in oklab, ${e.label_color} 13%, transparent)`,
      }}
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ background: e.label_color }} aria-hidden="true" />
      <span className="truncate">{e.label_name}</span>
    </span>
  )
}

// Who the entry is with, plus a small badge for what happened:
// ↙ money in, ↗ money out, ⇄ a service where money came in and went out, ⚖ a balance.
const MARK = {
  in: { Icon: ArrowDownLeft, badge: 'bg-in', soft: 'bg-in-soft text-in', label: 'Money in' },
  out: { Icon: ArrowUpRight, badge: 'bg-out', soft: 'bg-out-soft text-out', label: 'Money out' },
  transfer: { Icon: ArrowLeftRight, badge: 'bg-brand', soft: 'bg-brand-soft text-brand', label: 'Money in and out' },
  adjust: { Icon: Scale, badge: 'bg-attn', soft: 'bg-attn-soft text-attn', label: 'Balance' },
}

function PartyMark({ entry: e }) {
  const { Icon, badge, soft, label } = MARK[e.type] ?? MARK.in
  if (!e.contact_name) {
    return (
      <span className={`grid size-9 shrink-0 place-items-center rounded-full ${soft}`} aria-label={label}>
        <Icon size={16} strokeWidth={2.4} />
      </span>
    )
  }
  return (
    <span className="relative shrink-0">
      <Avatar name={e.contact_name} />
      <span
        className={`absolute -right-1.5 -bottom-1 grid size-4 place-items-center rounded-full text-white ring-2 ring-[var(--surface)] ${badge}`}
        aria-label={label}
      >
        <Icon size={10} strokeWidth={3} />
      </span>
    </span>
  )
}

// The "what" line under the name: where a transfer went, the commission, and the mode.
function details(e) {
  if (e.type === 'transfer') {
    const where =
      e.payee === 'self'
        ? `${modeLabel(e.mode)} in, ${modeLabel(e.paid_mode ?? e.mode)} out`
        : `to ${e.to_name}${e.to_account ? ` (${e.to_account})` : ''}`
    return [where, e.commission ? `${money(e.commission)} commission` : 'no commission']
  }
  if (e.type === 'adjust') return [e.direction === 'owes_you' ? `${e.contact_name} owes you` : `You owe ${e.contact_name}`]
  return [modeLabel(e.mode), e.contact_name && !e.account ? 'not in balance' : '']
}

function EntryRow({ entry: e, onOpen }) {
  const service = e.type === 'transfer'
  const title = e.contact_name ?? e.label_name ?? MARK[e.type]?.label
  const parts = details(e).filter(Boolean)
  const effect = e.effect ?? 0
  const balanceNote = service && effect !== 0 ? (effect < 0 ? `owes ${money(-effect)}` : `you hold ${money(effect)}`) : ''

  return (
    <li className="border-t border-line-soft first:border-t-0">
      <button
        type="button"
        onClick={() => onOpen(e.id)}
        className={`${ROW} group min-h-16 w-full cursor-pointer border-0 bg-transparent py-3 text-left text-sm transition-colors hover:bg-surface-2 hover:shadow-[inset_3px_0_0_var(--primary)]`}
      >
        <span className="flex min-w-0 items-center gap-3">
          <PartyMark entry={e} />
          <span className="flex min-w-0 flex-col gap-1">
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate text-[15px] font-bold text-ink">{title}</span>
              {balanceNote && (
                <span
                  className={`shrink-0 rounded-md px-1.5 py-px text-[11px] font-bold ${effect < 0 ? 'bg-attn-soft text-attn' : 'bg-out-soft text-out'}`}
                >
                  {balanceNote}
                </span>
              )}
            </span>
            {/* Phones and tablets: details under the name */}
            <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs whitespace-nowrap text-ink-3 xl:hidden">
              {e.label_name && e.contact_name && <LabelTag entry={e} />}
              {parts.map((t) => (
                <span key={t} className="max-w-full min-w-0 truncate">
                  {t}
                </span>
              ))}
              {e.note && <span className="max-w-full min-w-0 truncate">{e.note}</span>}
            </span>
          </span>
        </span>
        <span className="hidden min-w-0 xl:block">
          <LabelTag entry={e} />
        </span>
        <span className="hidden min-w-0 truncate text-ink-2 xl:block">{parts.join(' · ')}</span>
        <span className="hidden truncate text-ink-3 xl:block">{e.note || '–'}</span>
        {/* Phones: what moved, stacked */}
        <span className="flex flex-col items-end sm:hidden">
          {e.cash_in > 0 && <span className="text-[15px] font-bold whitespace-nowrap text-in tabular-nums">+{money(e.cash_in)}</span>}
          {e.cash_out > 0 && <span className="text-[13px] font-bold whitespace-nowrap text-out tabular-nums">−{money(e.cash_out)}</span>}
          {e.type === 'adjust' && <span className="text-[15px] font-bold whitespace-nowrap text-attn tabular-nums">{money(e.amount)}</span>}
        </span>
        <span className="hidden text-right sm:block">
          <Cash value={e.cash_in} tone="in" />
          {e.type === 'adjust' && e.direction === 'you_owe' && <span className="font-bold text-attn tabular-nums">{money(e.amount)}</span>}
        </span>
        <span className="hidden text-right sm:block">
          <Cash value={e.cash_out} tone="out" />
          {e.type === 'adjust' && e.direction === 'owes_you' && <span className="font-bold text-attn tabular-nums">{money(e.amount)}</span>}
        </span>
      </button>
    </li>
  )
}

function DayGroup({ day, onOpen }) {
  const rel = relativeDay(day.date)
  const named = rel === 'Today' || rel === 'Yesterday'
  const year = day.date.slice(0, 4) !== String(new Date().getFullYear()) ? ` ${day.date.slice(0, 4)}` : ''
  const rows = day.items
  return (
    <section
      className="overflow-hidden rounded-[20px] bg-surface shadow-[var(--soft-card)] ring-1 ring-[var(--soft-ring)]"
      aria-label={formatFullDate(day.date)}
    >
      {/* Day header: a calm band with a date badge, and the day's totals under the In / Out columns */}
      <h2 className={`${ROW} m-0 border-b border-line-soft bg-surface-2 py-3`}>
        <span className="flex min-w-0 items-center gap-3">
          <span
            className="flex w-11 shrink-0 flex-col overflow-hidden rounded-xl bg-surface text-center leading-none shadow-[0_1px_2px_rgb(20_23_43/0.08)] ring-1 ring-line"
            aria-hidden="true"
          >
            <span className="bg-[var(--side)] py-[3px] text-[9px] font-bold tracking-wide text-white">{formatMonthShort(day.date)}</span>
            <span className="py-1 text-[17px] font-extrabold text-ink tabular-nums">{Number(day.date.slice(8, 10))}</span>
          </span>
          <span className="flex min-w-0 flex-col gap-0.5 leading-tight">
            <span className="truncate text-[15px] font-extrabold text-ink">
              {named ? rel : formatWeekdayLong(day.date)}
              {year}
            </span>
            <span className="text-xs font-semibold text-ink-3">
              {named && `${formatWeekdayLong(day.date)} · `}
              {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
              {day.commission > 0 && <span className="text-ok"> · {money(day.commission)} commission</span>}
            </span>
          </span>
        </span>
        <span className="hidden xl:block" />
        <span className="hidden xl:block" />
        <span className="hidden xl:block" />
        <span className="flex flex-col items-end gap-1 sm:hidden">
          {day.in > 0 && <TotalPill tone="in">+{money(day.in)}</TotalPill>}
          {day.out > 0 && <TotalPill tone="out">−{money(day.out)}</TotalPill>}
        </span>
        <span className="hidden justify-end sm:flex">{day.in > 0 && <TotalPill tone="in">{money(day.in)}</TotalPill>}</span>
        <span className="hidden justify-end sm:flex">{day.out > 0 && <TotalPill tone="out">{money(day.out)}</TotalPill>}</span>
      </h2>
      <ul className="m-0 list-none p-0">
        {rows.map((e) => (
          <EntryRow key={e.id} entry={e} onOpen={onOpen} />
        ))}
      </ul>
    </section>
  )
}

function TotalPill({ tone, children }) {
  return (
    <span className={`text-sm font-extrabold whitespace-nowrap tabular-nums ${tone === 'in' ? 'text-in' : 'text-out'}`}>{children}</span>
  )
}

// "48% of all money moved"
function share(value, totals) {
  const moved = totals.done_in + totals.done_out
  return moved ? `${Math.round((value / moved) * 100)}% of all money moved` : ''
}

function Entries() {
  const ui = useUI()
  const [params, setParams] = useSearchParams()
  const [limit, setLimit] = useState(PAGE)
  const { data: labels = [] } = useLabels()

  const preset = params.get('range') ?? '30d'
  const range = preset === 'custom' ? { from: params.get('from') ?? '', to: params.get('to') ?? '' } : presetRange(preset)
  const filters = {
    q: params.get('q') ?? '',
    type: params.get('type') ?? '',
    mode: params.get('mode') ?? '',
    label_id: params.get('label_id') ?? '',
    from: range.from,
    to: range.to,
  }

  function update(changes) {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    setParams(next, { replace: true })
    setLimit(PAGE)
  }

  const { data, isLoading, isFetching } = useTransactions({
    ...filters,
    limit,
  })
  const items = data?.items ?? NO_ITEMS
  const totals = data?.totals

  // Group by day, like a day book.
  const days = useMemo(() => {
    const map = new Map()
    for (const e of items) {
      if (!map.has(e.date)) map.set(e.date, { date: e.date, items: [], in: 0, out: 0, commission: 0 })
      const day = map.get(e.date)
      day.items.push(e)
      day.in += e.cash_in
      day.out += e.cash_out
      day.commission += e.commission ?? 0
    }
    return [...map.values()]
  }, [items])

  const activeFilters = ['q', 'type', 'mode', 'label_id'].filter((k) => filters[k]).length
  const currentLabel = labels.find((l) => l.id === filters.label_id)
  const exportHref = `/api/transactions/export.csv${qs(filters)}`

  const clearFilters = () => update({ q: '', type: '', mode: '', label_id: '' })
  const extraFilters = ['mode', 'label_id'].filter((k) => filters[k]).length
  const [showFilters, setShowFilters] = useState(extraFilters > 0)
  const select = 'field field--compact'

  return (
    <div className="page">
      <Hero
        title="Entries"
        subtitle={
          <>
            {periodText(preset, range.from, range.to)}
            {totals && (
              <>
                {' '}
                · <strong>{totals.count.toLocaleString('en-IN')}</strong> {totals.count === 1 ? 'entry' : 'entries'}
              </>
            )}
            {currentLabel && (
              <span className="mt-2 flex flex-wrap items-center gap-2">
                Showing <LabelChip name={currentLabel.name} color={currentLabel.color} />
                <button type="button" className="link-button text-white" onClick={() => ui.editLabel(currentLabel)}>
                  <Pencil size={13} aria-hidden="true" /> Edit label
                </button>
              </span>
            )}
          </>
        }
        actions={
          <>
            <DateRange
              preset={preset}
              from={range.from}
              to={range.to}
              onChange={({ preset: p, from, to }) =>
                update({
                  range: p === '30d' ? '' : p,
                  from: p === 'custom' ? from : '',
                  to: p === 'custom' ? to : '',
                })
              }
            />
            <a
              className="icon-button icon-button--bordered size-10"
              href={exportHref}
              download
              aria-label="Download these entries as a CSV file"
              title="Download CSV"
            >
              <Download size={17} />
            </a>
          </>
        }
        stats={
          totals && totals.count > 0
            ? [
                {
                  label: 'Cash in hand',
                  featured: true,
                  value: money(totals.done_in - totals.done_out, { sign: true }),
                  hint: 'In minus out',
                },
                { label: 'Money in', tone: 'in', value: money(totals.done_in), hint: share(totals.done_in, totals) },
                { label: 'Money out', tone: 'out', value: money(totals.done_out), hint: share(totals.done_out, totals) },
                {
                  label: 'Commission',
                  tone: 'ok',
                  value: money(totals.commission ?? 0),
                  hint: totals.transfers
                    ? `From ${totals.transfers} ${totals.transfers === 1 ? 'service' : 'services'}`
                    : 'No services yet',
                },
              ]
            : null
        }
      />

      {/* One filter bar: search, what kind of entry, and more filters */}
      <div className="flex flex-col gap-2">
        <div className="filterbar">
          <label className="filterbar__search">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search by name, label or note"
              aria-label="Search entries"
              defaultValue={filters.q}
              onChange={(e) => update({ q: e.target.value.trim() })}
            />
          </label>
          <div className="filterbar__tabs">
            <Segmented
              label="Kind of entry"
              size="sm"
              value={filters.type}
              onChange={(type) => update({ type })}
              options={[
                { value: '', label: 'All' },
                { value: 'in', label: 'Money in', tone: 'in' },
                { value: 'out', label: 'Money out', tone: 'out' },
                { value: 'transfer', label: 'Services' },
                { value: 'adjust', label: 'Balances' },
              ]}
            />
          </div>
          <div className="filterbar__end">
            <button
              type="button"
              className={`filterbar__button${showFilters || extraFilters ? ' is-on' : ''}`}
              aria-expanded={showFilters}
              onClick={() => setShowFilters((v) => !v)}
            >
              <ListFilter size={16} aria-hidden="true" /> <span className="max-sm:sr-only">Filters</span>
              {extraFilters > 0 && <span className="filterbar__count">{extraFilters}</span>}
            </button>
            {activeFilters > 0 && (
              <button type="button" className="filterbar__button" onClick={clearFilters}>
                <X size={16} aria-hidden="true" /> <span className="max-sm:sr-only">Clear</span>
              </button>
            )}
          </div>
        </div>
        {showFilters && (
          <div className="filterbar filterbar--more">
            <select className={select} aria-label="Payment mode" value={filters.mode} onChange={(e) => update({ mode: e.target.value })}>
              <option value="">All payment modes</option>
              {MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <select className={select} aria-label="Label" value={filters.label_id} onChange={(e) => update({ label_id: e.target.value })}>
              <option value="">All labels</option>
              <option value="none">Without a label</option>
              {labels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Day book */}
      <section aria-label="Entries by day" aria-busy={isFetching}>
        {isLoading || items.length === 0 ? (
          <div className="overflow-hidden rounded-[20px] bg-surface shadow-[var(--soft-card)] ring-1 ring-[var(--soft-ring)]">
            {isLoading ? (
              <p className="loading">Loading entries…</p>
            ) : items.length === 0 ? (
              <EmptyState
                icon={<ReceiptText size={22} />}
                title={
                  activeFilters
                    ? 'No entries match these filters'
                    : preset === 'all'
                      ? 'No entries yet'
                      : `No entries ${RANGE_WORDS[preset] ?? 'in these dates'}`
                }
                action={
                  <div className="empty__actions">
                    {activeFilters > 0 ? (
                      <button type="button" className="btn" onClick={clearFilters}>
                        Clear filters
                      </button>
                    ) : preset !== 'all' ? (
                      <button type="button" className="btn" onClick={() => update({ range: 'all', from: '', to: '' })}>
                        Show all time
                      </button>
                    ) : null}
                    <button type="button" className="btn btn--primary" onClick={() => ui.newEntry()}>
                      New entry
                    </button>
                  </div>
                }
              >
                {activeFilters
                  ? 'Try removing a filter or picking a wider date range.'
                  : preset === 'all'
                    ? 'Record money that comes in or goes out. Press N from anywhere to add one.'
                    : 'Nothing was recorded in this date range.'}
              </EmptyState>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className={`${ROW.replace('grid ', '')} -mb-2 hidden text-xs font-bold text-ink-3 sm:grid`} aria-hidden="true">
              <span>Party</span>
              <span className="hidden xl:block">Label</span>
              <span className="hidden xl:block">Mode</span>
              <span className="hidden xl:block">Note</span>
              <span className="text-right">Money in</span>
              <span className="text-right">Money out</span>
            </div>
            {days.map((day) => (
              <DayGroup key={day.date} day={day} onOpen={ui.viewEntry} />
            ))}
          </div>
        )}
      </section>

      {totals && items.length < totals.count && (
        <div className="flex justify-center">
          <button type="button" className="btn btn--ghost" onClick={() => setLimit((l) => l + PAGE)} disabled={isFetching}>
            {isFetching ? 'Loading…' : `Show more (${totals.count - items.length} left)`}
          </button>
        </div>
      )}
    </div>
  )
}

export default Entries
