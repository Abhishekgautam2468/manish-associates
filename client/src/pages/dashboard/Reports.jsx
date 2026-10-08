import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CalendarRange,
  Download,
  Eye,
  EyeOff,
  Tag,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import { usePeopleReport, useSeries, useTransactions } from '../../lib/queries.js'
import CashFlowChart from '../../dashboard/CashFlowChart.jsx'
import DateRange, { PRESETS, presetRange } from '../../dashboard/DateRange.jsx'
import { EmptyState, Hero } from '../../dashboard/bits.jsx'
import { addDays, daysBetween, downloadCsv, formatDate, formatFullDate, money, periodLabel, todayISO } from '../../lib/format.js'

/*
 * Reports: pick what to group by, pick the dates, and read the totals.
 * Every view compares itself with the period just before, where that makes sense.
 */

const CARD = 'rounded-[20px] bg-surface shadow-[var(--soft-card)] ring-1 ring-[var(--soft-ring)]'

const VIEWS = [
  { value: 'day', label: 'Daily', Icon: CalendarDays, unit: 'day' },
  { value: 'week', label: 'Weekly', Icon: CalendarRange, unit: 'week' },
  { value: 'month', label: 'Monthly', Icon: BarChart3, unit: 'month' },
  { value: 'labels', label: 'By label', Icon: Tag },
  { value: 'people', label: 'By person', Icon: Users },
]
const DEFAULT_PRESET = { day: 'month', week: '3m', month: '12m', labels: 'month', people: 'month' }

function useRange(view) {
  const [ranges, setRanges] = useState({})
  const current = ranges[view] ?? { preset: DEFAULT_PRESET[view], ...presetRange(DEFAULT_PRESET[view]) }
  return [current, (r) => setRanges((all) => ({ ...all, [view]: r }))]
}

// The same number of days, just before this range.
function previousRange({ from, to }) {
  if (!from) return null
  const end = to || todayISO()
  const len = daysBetween(from, end) + 1
  const prevTo = addDays(from, -1)
  return { from: addDays(prevTo, -(len - 1)), to: prevTo }
}

function periodText(range) {
  if (!range.from) return 'All time'
  const to = range.to || todayISO()
  if (range.from === to) return formatFullDate(to)
  const sameYear = range.from.slice(0, 4) === to.slice(0, 4)
  return `${sameYear ? formatDate(range.from, { short: true }) : formatFullDate(range.from)} – ${formatFullDate(to)}`
}

/* ---------- Summary with comparison ---------- */

function Delta({ now, before, goodWhenUp = true }) {
  if (before == null) return <span className="text-xs font-semibold text-ink-3">No earlier period to compare</span>
  const diff = now - before
  if (diff === 0) return <span className="text-xs font-semibold text-ink-3">Same as the period before</span>
  const up = diff > 0
  const good = up === goodWhenUp
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span className="flex flex-wrap items-center gap-x-1 text-xs">
      <span className={`inline-flex items-center gap-1 font-bold whitespace-nowrap ${good ? 'text-ok' : 'text-danger'}`}>
        <Icon size={13} aria-hidden="true" />
        {up ? '+' : '−'}
        {money(Math.abs(diff))}
      </span>
      <span className="font-semibold text-ink-3">vs period before</span>
    </span>
  )
}

function Summary({ items }) {
  return (
    <section aria-label="Totals for this period" className={`${CARD} grid grid-cols-2 gap-px overflow-hidden bg-line-soft lg:grid-cols-4`}>
      {items.map((f) => (
        <div key={f.label} className="flex min-w-0 flex-col gap-1 bg-surface px-4 py-3.5 sm:px-5 sm:py-4">
          <span className="flex items-center gap-1.5 text-xs font-bold text-ink-3">
            {f.dot && <span className={`size-2 rounded-full ${f.dot}`} aria-hidden="true" />}
            {f.label}
          </span>
          <span
            className={`truncate font-extrabold tracking-tight tabular-nums ${f.small ? 'text-base leading-7 sm:text-lg sm:leading-8' : 'text-xl sm:text-2xl'} ${f.tone}`}
          >
            {f.value}
          </span>
          {f.hint}
        </div>
      ))}
    </section>
  )
}

/* ---------- Day / week / month ---------- */

// Phones: period and net. Wider: period, flow bars, in, out, net, entries.
const SERIES_ROW =
  'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-4 sm:grid-cols-[minmax(0,1.2fr)_7.5rem_7.5rem_7.5rem_4rem] sm:px-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_7.5rem_7.5rem_7.5rem_4rem]'

function FlowBars({ inAmount, outAmount, max }) {
  return (
    <span className="flex flex-col gap-1" aria-hidden="true">
      <span className="h-1.5 rounded-full bg-in" style={{ width: `${max ? Math.max(inAmount ? 2 : 0, (inAmount / max) * 100) : 0}%` }} />
      <span className="h-1.5 rounded-full bg-out" style={{ width: `${max ? Math.max(outAmount ? 2 : 0, (outAmount / max) * 100) : 0}%` }} />
    </span>
  )
}

function SeriesReport({ group, range }) {
  const unit = VIEWS.find((x) => x.value === group).unit
  const to = range.to || todayISO()
  const { data, isLoading, error } = useSeries({ group, from: range.from, to })
  const prev = previousRange(range)
  const { data: prevData } = useSeries(prev ? { group, from: prev.from, to: prev.to } : { group, from: to, to })
  const [hideEmpty, setHideEmpty] = useState(group === 'day')

  if (error)
    return (
      <p className="field-error" role="alert">
        {error.message}
      </p>
    )
  if (isLoading || !data) return <p className="loading">Loading report…</p>

  // "All time" starts at the first period that has entries.
  const firstActive = data.rows.findIndex((r) => r.count > 0)
  const rows = range.from ? data.rows : firstActive === -1 ? [] : data.rows.slice(firstActive)
  const sum = (list) =>
    list.reduce(
      (t, r) => ({
        in: t.in + r.in_amount,
        out: t.out + r.out_amount,
        commission: t.commission + (r.commission ?? 0),
        count: t.count + r.count,
      }),
      { in: 0, out: 0, commission: 0, count: 0 },
    )
  const totals = sum(rows)
  const before = prev && prevData ? sum(prevData.rows) : null
  const busiest = rows.reduce((best, r) => (r.in_amount > (best?.in_amount ?? 0) ? r : best), null)
  const max = Math.max(0, ...rows.map((r) => Math.max(r.in_amount, r.out_amount)))
  const listed = [...rows].reverse().filter((r) => !hideEmpty || r.count > 0)
  const net = totals.in - totals.out

  function exportCsv() {
    downloadCsv(
      `report-${group}-${rows[0]?.period ?? ''}-to-${rows.at(-1)?.period ?? ''}.csv`,
      [unit[0].toUpperCase() + unit.slice(1), 'Money in', 'Money out', 'Net', 'Entries'],
      rows.map((r) => [periodLabel(r.period, group), r.in_amount / 100, r.out_amount / 100, (r.in_amount - r.out_amount) / 100, r.count]),
    )
  }

  if (rows.length === 0 || totals.count === 0) {
    return (
      <section className={CARD}>
        <EmptyState icon={<BarChart3 size={22} />} title="No money moved in this period">
          Pick a wider date range. Once you add entries, totals and a chart appear here.
        </EmptyState>
      </section>
    )
  }

  return (
    <>
      <Summary
        items={[
          {
            label: 'Money in',
            dot: 'bg-in',
            value: money(totals.in),
            tone: 'text-in',
            hint: <Delta now={totals.in} before={before?.in} />,
          },
          {
            label: 'Money out',
            dot: 'bg-out',
            value: money(totals.out),
            tone: 'text-out',
            hint: <Delta now={totals.out} before={before?.out} goodWhenUp={false} />,
          },
          {
            label: 'Commission',
            dot: 'bg-ok',
            value: money(totals.commission),
            tone: 'text-ok',
            hint: <Delta now={totals.commission} before={before?.commission} />,
          },
          {
            label: `Busiest ${unit}`,
            value: busiest && busiest.in_amount > 0 ? periodLabel(busiest.period, group) : '–',
            tone: 'text-ink',
            small: true,
            hint: (
              <span className="text-xs font-semibold text-ink-3">
                {busiest && busiest.in_amount > 0 ? `${money(busiest.in_amount)} in · ` : ''}
                average {money(Math.round(totals.in / rows.length / 100) * 100)} in per {unit}
              </span>
            ),
          },
        ]}
      />

      {rows.length > 1 && (
        <section className={`${CARD} p-4 sm:p-5`} aria-label="Chart">
          <h2 className="m-0 mb-3 text-[15px] font-extrabold text-ink">Money in and out by {unit}</h2>
          <CashFlowChart rows={rows.slice(-90)} group={group} height={280} title={rows.length > 90 ? `Latest 90 ${unit}s` : undefined} />
        </section>
      )}

      <section className={`${CARD} overflow-hidden`} aria-labelledby="report-table">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-4 py-3.5 sm:px-5">
          <h2 id="report-table" className="m-0 text-[15px] font-extrabold text-ink">
            {unit[0].toUpperCase() + unit.slice(1)} by {unit}
          </h2>
          <div className="toolbar">
            <button type="button" className="btn btn--ghost btn--sm" aria-pressed={hideEmpty} onClick={() => setHideEmpty((v) => !v)}>
              {hideEmpty ? <Eye size={15} aria-hidden="true" /> : <EyeOff size={15} aria-hidden="true" />}
              {hideEmpty ? `Show empty ${unit}s` : `Hide empty ${unit}s`}
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={exportCsv}>
              <Download size={15} aria-hidden="true" /> Export CSV
            </button>
          </div>
        </div>
        <div
          className={`${SERIES_ROW.replace('grid ', '')} hidden border-b border-line-soft bg-surface-2 py-2 text-xs font-bold text-ink-3 sm:grid`}
          aria-hidden="true"
        >
          <span>{unit[0].toUpperCase() + unit.slice(1)}</span>
          <span className="hidden lg:block">In vs out</span>
          <span className="text-right">Money in</span>
          <span className="text-right">Money out</span>
          <span className="text-right">Net</span>
          <span className="text-right">Entries</span>
        </div>
        <ul className="m-0 list-none p-0">
          {listed.map((r) => {
            const n = r.in_amount - r.out_amount
            const best = busiest && r.period === busiest.period && r.in_amount > 0
            return (
              <li
                key={r.period}
                className={`${SERIES_ROW} border-t border-line-soft py-3 text-sm first:border-t-0 ${r.count === 0 ? 'text-ink-3' : ''}`}
              >
                <span className="flex min-w-0 flex-col">
                  <span className={`flex items-center gap-2 font-bold ${r.count ? 'text-ink' : 'text-ink-3'}`}>
                    <span className="truncate">{periodLabel(r.period, group)}</span>
                    {best && <span className="shrink-0 rounded-md bg-in-soft px-1.5 py-px text-[11px] font-bold text-in">Busiest</span>}
                  </span>
                  <span className="text-xs text-ink-3 sm:hidden">
                    {r.count ? `${money(r.in_amount)} in · ${money(r.out_amount)} out` : 'No entries'}
                  </span>
                </span>
                <span className="hidden pr-4 lg:block">
                  {r.count > 0 && <FlowBars inAmount={r.in_amount} outAmount={r.out_amount} max={max} />}
                </span>
                <span className="hidden text-right font-semibold text-in tabular-nums sm:block">
                  {r.in_amount ? money(r.in_amount) : '–'}
                </span>
                <span className="hidden text-right font-semibold text-out tabular-nums sm:block">
                  {r.out_amount ? money(r.out_amount) : '–'}
                </span>
                <span className={`text-right font-extrabold tabular-nums ${!r.count ? 'text-ink-3' : n >= 0 ? 'text-ink' : 'text-out'}`}>
                  {r.count ? money(n, { sign: true }) : '–'}
                </span>
                <span className="hidden text-right text-ink-2 tabular-nums sm:block">{r.count || '–'}</span>
              </li>
            )
          })}
        </ul>
        <div className={`${SERIES_ROW} border-t-2 border-line bg-surface-2 py-3 text-sm font-extrabold`}>
          <span className="text-ink">Total</span>
          <span className="hidden lg:block" />
          <span className="hidden text-right text-in tabular-nums sm:block">{money(totals.in)}</span>
          <span className="hidden text-right text-out tabular-nums sm:block">{money(totals.out)}</span>
          <span className="text-right text-ink tabular-nums">{money(net, { sign: true })}</span>
          <span className="hidden text-right text-ink tabular-nums sm:block">{totals.count}</span>
        </div>
      </section>
    </>
  )
}

/* ---------- By label ---------- */

function LabelColumn({ title, tone, rows, total, range }) {
  const bar = tone === 'in' ? 'bg-in' : 'bg-out'
  const text = tone === 'in' ? 'text-in' : 'text-out'
  const query = (id) =>
    `/dashboard/entries?label_id=${id}${range.from ? `&range=custom&from=${range.from}&to=${range.to || todayISO()}` : '&range=all'}`
  return (
    <section className={`${CARD} overflow-hidden`} aria-label={title}>
      <div className="flex items-center justify-between gap-3 border-b border-line-soft px-4 py-3.5 sm:px-5">
        <h2 className="m-0 flex items-center gap-2 text-[15px] font-extrabold text-ink">
          {tone === 'in' ? (
            <ArrowDownLeft size={16} className="text-in" aria-hidden="true" />
          ) : (
            <ArrowUpRight size={16} className="text-out" aria-hidden="true" />
          )}
          {title}
        </h2>
        <span className={`text-lg font-extrabold tabular-nums ${text}`}>{money(total)}</span>
      </div>
      {rows.length === 0 ? (
        <p className="m-0 px-5 py-8 text-center text-sm text-ink-3">Nothing in this period.</p>
      ) : (
        <ul className="m-0 list-none p-0">
          {rows.map((r) => {
            const pct = total ? (r.amount / total) * 100 : 0
            return (
              <li key={r.id} className="border-t border-line-soft first:border-t-0">
                <Link to={query(r.id)} className="flex flex-col gap-2 px-4 py-3 no-underline transition-colors hover:bg-surface-2 sm:px-5">
                  <span className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2 font-bold text-ink">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ background: r.color ?? 'var(--ink-3)' }}
                        aria-hidden="true"
                      />
                      <span className="truncate">{r.name}</span>
                      <span className="shrink-0 text-xs font-semibold text-ink-3">
                        {r.count} {r.count === 1 ? 'entry' : 'entries'}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-baseline gap-2">
                      <span className="font-extrabold text-ink tabular-nums">{money(r.amount)}</span>
                      <span className="w-10 text-right text-xs font-bold text-ink-3 tabular-nums">{Math.round(pct)}%</span>
                    </span>
                  </span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
                    <span className={`block h-full rounded-full ${bar}`} style={{ width: `${Math.max(pct, 1)}%` }} />
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function LabelsReport({ range }) {
  const { data, isLoading } = useTransactions({ from: range.from, to: range.to, limit: 5000 })
  const { inRows, outRows, totals } = useMemo(() => {
    const groups = { in: new Map(), out: new Map() }
    const totals = { in: 0, out: 0 }
    // A service counts on both sides: what came in and what went out.
    for (const e of data?.items ?? []) {
      const id = e.label_id ?? 'none'
      for (const side of ['in', 'out']) {
        const value = side === 'in' ? e.cash_in : e.cash_out
        if (!value) continue
        const map = groups[side]
        if (!map.has(id)) map.set(id, { id, name: e.label_name ?? 'No label', color: e.label_color, amount: 0, count: 0 })
        const g = map.get(id)
        g.amount += value
        g.count += 1
        totals[side] += value
      }
    }
    const sorted = (m) => [...m.values()].sort((a, b) => b.amount - a.amount)
    return { inRows: sorted(groups.in), outRows: sorted(groups.out), totals }
  }, [data])

  if (isLoading || !data) return <p className="loading">Loading report…</p>
  if (!totals.in && !totals.out) {
    return (
      <section className={CARD}>
        <EmptyState icon={<Tag size={22} />} title="No money moved in this period">
          Pick a wider date range to see where money came from and where it went.
        </EmptyState>
      </section>
    )
  }

  function exportCsv() {
    downloadCsv(
      `report-labels-${range.from || 'start'}-to-${range.to || todayISO()}.csv`,
      ['Direction', 'Label', 'Amount', 'Share %', 'Entries'],
      [
        ...inRows.map((r) => ['Money in', r.name, r.amount / 100, totals.in ? Math.round((r.amount / totals.in) * 1000) / 10 : 0, r.count]),
        ...outRows.map((r) => [
          'Money out',
          r.name,
          r.amount / 100,
          totals.out ? Math.round((r.amount / totals.out) * 1000) / 10 : 0,
          r.count,
        ]),
      ],
    )
  }

  return (
    <>
      <div className="toolbar justify-end">
        <button type="button" className="btn btn--ghost btn--sm" onClick={exportCsv}>
          <Download size={15} aria-hidden="true" /> Export CSV
        </button>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <LabelColumn title="Where money came from" tone="in" rows={inRows} total={totals.in} range={range} />
        <LabelColumn title="Where money went" tone="out" rows={outRows} total={totals.out} range={range} />
      </div>
    </>
  )
}

/* ---------- By person ---------- */

const PEOPLE_ROW =
  'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-4 sm:grid-cols-[minmax(0,1.3fr)_7rem_7rem_7rem] sm:px-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_7rem_7rem_7rem_7rem_7rem]'

function PeopleReport({ range }) {
  const { data, isLoading } = usePeopleReport({ from: range.from, to: range.to })
  if (isLoading || !data) return <p className="loading">Loading report…</p>
  const rows = data.rows
  if (rows.length === 0) {
    return (
      <section className={CARD}>
        <EmptyState icon={<Users size={22} />} title="No one has entries in this period">
          Pick a wider date range, or add entries with a person attached.
        </EmptyState>
      </section>
    )
  }
  const totals = rows.reduce(
    (t, r) => ({ in: t.in + r.in_amount, out: t.out + r.out_amount, pin: t.pin + r.pending_in, pout: t.pout + r.pending_out }),
    { in: 0, out: 0, pin: 0, pout: 0 },
  )
  const max = Math.max(0, ...rows.map((r) => Math.max(r.in_amount, r.out_amount)))

  function exportCsv() {
    downloadCsv(
      `report-people-${range.from || 'start'}-to-${range.to || todayISO()}.csv`,
      ['Name', 'Phone', 'Received', 'Paid', 'Net', 'Owes you now', 'You owe now', 'Entries', 'Last entry'],
      rows.map((r) => [
        r.name,
        r.phone,
        r.in_amount / 100,
        r.out_amount / 100,
        (r.in_amount - r.out_amount) / 100,
        r.pending_in / 100,
        r.pending_out / 100,
        r.count,
        r.last_date,
      ]),
    )
  }

  return (
    <section className={`${CARD} overflow-hidden`} aria-labelledby="report-people">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-4 py-3.5 sm:px-5">
        <div className="min-w-0">
          <h2 id="report-people" className="m-0 text-[15px] font-extrabold text-ink">
            Person by person
          </h2>
          <p className="m-0 text-xs text-ink-3">Received and paid are for the chosen dates. What’s owed is as of today.</p>
        </div>
        <div className="toolbar">
          <button type="button" className="btn btn--ghost btn--sm" onClick={exportCsv}>
            <Download size={15} aria-hidden="true" /> Export CSV
          </button>
        </div>
      </div>
      <div
        className={`${PEOPLE_ROW.replace('grid ', '')} hidden border-b border-line-soft bg-surface-2 py-2 text-xs font-bold text-ink-3 sm:grid`}
        aria-hidden="true"
      >
        <span>Person</span>
        <span className="hidden lg:block">Received vs paid</span>
        <span className="text-right">Received</span>
        <span className="text-right">Paid</span>
        <span className="text-right">Net</span>
        <span className="hidden text-right lg:block">Owes you now</span>
        <span className="hidden text-right lg:block">You owe now</span>
      </div>
      <ul className="m-0 list-none p-0">
        {rows.map((r) => {
          const n = r.in_amount - r.out_amount
          return (
            <li key={r.id} className="border-t border-line-soft first:border-t-0">
              <Link
                to={`/dashboard/people/${r.id}`}
                className={`${PEOPLE_ROW} py-3 text-sm no-underline transition-colors hover:bg-surface-2`}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-bold text-ink">{r.name}</span>
                  <span className="text-xs text-ink-3">
                    {r.count} {r.count === 1 ? 'entry' : 'entries'}
                    <span className="sm:hidden">
                      {' '}
                      · {money(r.in_amount)} in · {money(r.out_amount)} out
                    </span>
                  </span>
                </span>
                <span className="hidden pr-4 lg:block">
                  <FlowBars inAmount={r.in_amount} outAmount={r.out_amount} max={max} />
                </span>
                <span className="hidden text-right font-semibold text-in tabular-nums sm:block">
                  {r.in_amount ? money(r.in_amount) : '–'}
                </span>
                <span className="hidden text-right font-semibold text-out tabular-nums sm:block">
                  {r.out_amount ? money(r.out_amount) : '–'}
                </span>
                <span className={`text-right font-extrabold tabular-nums ${n >= 0 ? 'text-ink' : 'text-out'}`}>
                  {money(n, { sign: true })}
                </span>
                <span className="hidden text-right font-bold text-attn tabular-nums lg:block">
                  {r.pending_in ? money(r.pending_in) : <span className="text-ink-3">–</span>}
                </span>
                <span className="hidden text-right font-bold text-out tabular-nums lg:block">
                  {r.pending_out ? money(r.pending_out) : <span className="text-ink-3">–</span>}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
      <div className={`${PEOPLE_ROW} border-t-2 border-line bg-surface-2 py-3 text-sm font-extrabold`}>
        <span className="text-ink">Total</span>
        <span className="hidden lg:block" />
        <span className="hidden text-right text-in tabular-nums sm:block">{money(totals.in)}</span>
        <span className="hidden text-right text-out tabular-nums sm:block">{money(totals.out)}</span>
        <span className="text-right text-ink tabular-nums">{money(totals.in - totals.out, { sign: true })}</span>
        <span className="hidden text-right text-attn tabular-nums lg:block">{money(totals.pin)}</span>
        <span className="hidden text-right text-out tabular-nums lg:block">{money(totals.pout)}</span>
      </div>
    </section>
  )
}

/* ---------- Page ---------- */

function Reports() {
  const [view, setView] = useState('day')
  const [range, setRange] = useRange(view)
  const presets = view === 'day' ? PRESETS.filter((p) => !['12m', 'year', 'all'].includes(p.value)) : PRESETS

  return (
    <div className="page">
      <Hero
        title="Reports"
        subtitle={periodText(range)}
        actions={<DateRange preset={range.preset} from={range.from} to={range.to} onChange={setRange} presets={presets} />}
      >
        <div role="tablist" aria-label="Report" className="hero-tabs">
          {VIEWS.map(({ value, label, Icon }) => (
            <button key={value} type="button" role="tab" aria-selected={view === value} onClick={() => setView(value)} className="hero-tab">
              <Icon size={16} aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
      </Hero>

      {view === 'people' ? (
        <PeopleReport range={range} />
      ) : view === 'labels' ? (
        <LabelsReport range={range} />
      ) : (
        <SeriesReport key={view} group={view} range={range} />
      )}
    </div>
  )
}

export default Reports
