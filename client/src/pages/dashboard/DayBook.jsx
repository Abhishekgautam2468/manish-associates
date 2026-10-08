import { useEffect, useId, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Banknote,
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CreditCard,
  FileText,
  Landmark,
  Printer,
  Smartphone,
  TriangleAlert,
  Wallet,
} from 'lucide-react'
import { useDaybook, useSave } from '../../lib/queries.js'
import { useUI } from '../../dashboard/ui.jsx'
import {
  addDays,
  formatDate,
  formatFullDate,
  formatLongDate,
  formatStamp,
  fromISO,
  modeLabel,
  money,
  rupeesInput,
  toPaise,
  todayISO,
} from '../../lib/format.js'
import { Hero } from '../../dashboard/bits.jsx'

/*
 * Day book: money in and out by payment mode for one day, and the end-of-day cash count.
 * Expected cash in the drawer = opening cash + cash in − cash out. Count it, and see if it's short or extra.
 */

const CARD = 'rounded-[20px] bg-surface shadow-[var(--soft-card)] ring-1 ring-[var(--soft-ring)]'
const MODE_ICON = { cash: Banknote, upi: Smartphone, bank: Landmark, cheque: FileText, card: CreditCard, other: Wallet }

// Money in and out for each payment mode, as rows of one card, with the day's totals under a double rule.
function ModesCard({ modes }) {
  const total = modes.reduce((t, m) => ({ in: t.in + m.in_amount, out: t.out + m.out_amount, count: t.count + m.count }), {
    in: 0,
    out: 0,
    count: 0,
  })
  const row = 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-4 sm:grid-cols-[minmax(0,1fr)_5rem_8rem_8rem_8rem] sm:px-5'
  return (
    <section className={`${CARD} overflow-hidden`} aria-labelledby="db-modes">
      <h2 id="db-modes" className="m-0 border-b border-line-soft px-4 py-3.5 text-base font-bold text-ink sm:px-5">
        By payment mode
      </h2>
      <div className={`${row} hidden h-9 bg-surface-2 text-xs font-semibold text-ink-3 sm:grid`} aria-hidden="true">
        <span>Mode</span>
        <span className="text-right">Moves</span>
        <span className="text-right">In</span>
        <span className="text-right">Out</span>
        <span className="text-right">Net</span>
      </div>
      <ul className="m-0 list-none p-0">
        {modes.map((m) => {
          const Icon = MODE_ICON[m.mode] ?? Wallet
          const net = m.in_amount - m.out_amount
          return (
            <li key={m.mode} className={`${row} border-t border-line-soft py-3 first:border-t-0`}>
              <span className="flex min-w-0 items-center gap-3">
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-ink-2 ring-1 ring-line-soft"
                  aria-hidden="true"
                >
                  <Icon size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-ink">{modeLabel(m.mode)}</span>
                  <span className="block text-xs text-ink-3 sm:hidden">
                    in {money(m.in_amount)} · out {money(m.out_amount)}
                  </span>
                </span>
              </span>
              <span className="hidden text-right text-sm text-ink-3 tabular-nums sm:block">{m.count}</span>
              <span className="hidden text-right text-sm font-bold text-in tabular-nums sm:block">
                {m.in_amount ? money(m.in_amount) : '–'}
              </span>
              <span className="hidden text-right text-sm font-bold text-out tabular-nums sm:block">
                {m.out_amount ? money(m.out_amount) : '–'}
              </span>
              <span className={`text-right text-[15px] font-extrabold tabular-nums ${net >= 0 ? 'text-ink' : 'text-out'}`}>
                {money(net, { sign: true })}
              </span>
            </li>
          )
        })}
      </ul>
      <div className={`${row} border-0 border-t-[3px] border-double border-ink/40 bg-surface-2 py-3 text-sm font-extrabold`}>
        <span className="text-ink">Total</span>
        <span className="hidden text-right text-ink-3 tabular-nums sm:block">{total.count}</span>
        <span className="hidden text-right text-in tabular-nums sm:block">{money(total.in)}</span>
        <span className="hidden text-right text-out tabular-nums sm:block">{money(total.out)}</span>
        <span className={`text-right tabular-nums ${total.in - total.out >= 0 ? 'text-ink' : 'text-out'}`}>
          {money(total.in - total.out, { sign: true })}
        </span>
      </div>
    </section>
  )
}

function Line({ sign, label, hint, value, tone = 'text-ink', strong }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 py-2.5 ${strong ? 'border-t-2 border-ink/70 pt-3' : 'border-t border-line-soft first:border-t-0'}`}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span
          className={`grid size-6 shrink-0 place-items-center rounded-full text-sm font-extrabold ${strong ? 'bg-brand text-white' : 'bg-surface-3 text-ink-2'}`}
          aria-hidden="true"
        >
          {sign}
        </span>
        <span className="min-w-0">
          <span className={`block text-sm ${strong ? 'font-extrabold text-ink' : 'font-semibold text-ink-2'}`}>{label}</span>
          {hint && <span className="block text-xs text-ink-3">{hint}</span>}
        </span>
      </span>
      <span className={`shrink-0 font-extrabold tabular-nums ${strong ? 'text-2xl' : 'text-base'} ${tone}`}>{value}</span>
    </div>
  )
}

function CashCount({ data, date }) {
  const ui = useUI()
  const save = useSave()
  const ids = { opening: useId(), counted: useId(), note: useId() }
  const saved = data.close
  const [opening, setOpening] = useState('')
  const [counted, setCounted] = useState('')
  const [note, setNote] = useState('')
  const [touched, setTouched] = useState(false)

  // Load what was saved for this day, or carry the last count forward as the opening cash.
  useEffect(() => {
    setOpening(rupeesInput(saved ? saved.opening_cash : data.suggested_opening) || '')
    setCounted(saved?.counted_cash != null ? rupeesInput(saved.counted_cash) || '0' : '')
    setNote(saved?.note ?? '')
    setTouched(false)
  }, [date, saved?.updated_at, data.suggested_opening]) // eslint-disable-line react-hooks/exhaustive-deps

  const cash = data.modes.find((m) => m.mode === 'cash') ?? { in_amount: 0, out_amount: 0 }
  const expected = toPaise(opening) + cash.in_amount - cash.out_amount
  const countedP = counted === '' ? null : toPaise(counted)
  const diff = countedP == null ? null : countedP - expected

  async function submit(e) {
    e.preventDefault()
    try {
      await save.mutateAsync({ path: `/daybook/${date}`, method: 'PUT', body: { opening_cash: opening || 0, counted_cash: counted, note } })
      setTouched(false)
      ui.toast(
        counted === ''
          ? 'Opening cash saved'
          : diff === 0
            ? 'Day closed. Cash matches'
            : `Day closed. ${money(Math.abs(diff))} ${diff < 0 ? 'short' : 'extra'}`,
      )
    } catch (err) {
      ui.toast(err.message, 'error')
    }
  }

  const edit = (fn) => (e) => {
    fn(e.target.value.replace(/[^\d.,]/g, ''))
    setTouched(true)
  }
  const moneyInput = 'flex h-11 items-center gap-1 rounded-xl border border-line bg-surface px-3 focus-within:border-brand'

  return (
    <form onSubmit={submit} className={`${CARD} flex flex-col overflow-hidden`} aria-labelledby="cash-count">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft px-4 py-3.5 sm:px-5">
        <h2 id="cash-count" className="m-0 flex items-center gap-2 text-[15px] font-extrabold text-ink">
          <Banknote size={17} className="text-brand" aria-hidden="true" /> Cash in the drawer
        </h2>
        {saved?.counted_cash != null && !touched && (
          <span className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-2.5 py-0.5 text-xs font-bold text-ok">
            <CircleCheck size={13} aria-hidden="true" /> Closed {formatStamp(saved.updated_at)}
          </span>
        )}
      </div>
      <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <div>
          <div className="flex items-center justify-between gap-3 py-2.5">
            <label htmlFor={ids.opening} className="flex min-w-0 items-center gap-2.5">
              <span
                className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-3 text-sm font-extrabold text-ink-2"
                aria-hidden="true"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink-2">Opening cash</span>
                <span className="block text-xs text-ink-3">
                  {data.previous_date && !saved ? `Carried from the ${formatDate(data.previous_date)} count` : 'In the drawer at the start'}
                </span>
              </span>
            </label>
            <span className={`${moneyInput} w-36`}>
              <span className="text-sm font-bold text-ink-3" aria-hidden="true">
                ₹
              </span>
              <input
                id={ids.opening}
                className="w-full min-w-0 border-0 bg-transparent p-0 text-right text-base font-extrabold text-ink tabular-nums outline-none"
                inputMode="decimal"
                placeholder="0"
                value={opening}
                onChange={edit(setOpening)}
              />
            </span>
          </div>
          <Line sign="+" label="Cash in" hint="Received in cash today" value={money(cash.in_amount)} tone="text-in" />
          <Line sign="−" label="Cash out" hint="Given or paid in cash today" value={money(cash.out_amount)} tone="text-out" />
          <Line sign="=" label="Should be in the drawer" value={money(expected)} strong />
          {expected < 0 && (
            <p className="m-0 mt-2 flex items-start gap-2 rounded-lg bg-attn-soft px-3 py-2 text-xs font-semibold text-attn">
              <TriangleAlert size={14} className="mt-px shrink-0" aria-hidden="true" />
              More cash went out than came in. Enter the opening cash you started the day with.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-xl bg-surface-2 p-4">
          <label htmlFor={ids.counted} className="text-sm font-bold text-ink">
            Counted cash
          </label>
          <span className={`${moneyInput} h-14`}>
            <span className="text-xl font-bold text-ink-3" aria-hidden="true">
              ₹
            </span>
            <input
              id={ids.counted}
              className="w-full min-w-0 border-0 bg-transparent p-0 text-right text-2xl font-extrabold text-ink tabular-nums outline-none placeholder:text-ink-3/40"
              inputMode="decimal"
              placeholder="Cash counted in the drawer"
              value={counted}
              onChange={edit(setCounted)}
            />
          </span>
          {diff != null && (
            <p
              className={`m-0 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${
                diff === 0 ? 'bg-ok-soft text-ok' : diff < 0 ? 'bg-danger-soft text-danger' : 'bg-attn-soft text-attn'
              }`}
              aria-live="polite"
            >
              {diff === 0 ? <CircleCheck size={16} aria-hidden="true" /> : <TriangleAlert size={16} aria-hidden="true" />}
              {diff === 0 ? 'Matches exactly' : diff < 0 ? `${money(-diff)} short` : `${money(diff)} extra`}
            </p>
          )}
          <label htmlFor={ids.note} className="sr-only">
            Note
          </label>
          <input
            id={ids.note}
            className="field h-10 min-h-10 py-0 text-sm"
            placeholder="Add a note (optional)"
            value={note}
            onChange={(e) => (setNote(e.target.value), setTouched(true))}
            maxLength={500}
          />
          <button type="submit" className="btn btn--primary" disabled={save.isPending}>
            {save.isPending
              ? 'Saving…'
              : counted === ''
                ? 'Save opening cash'
                : saved?.counted_cash != null
                  ? 'Update day close'
                  : 'Close the day'}
          </button>
        </div>
      </div>
    </form>
  )
}

function History({ items }) {
  if (!items.length) return null
  return (
    <section className={`${CARD} overflow-hidden`} aria-labelledby="closes">
      <h2 id="closes" className="m-0 border-b border-line-soft px-4 py-3.5 text-[15px] font-extrabold text-ink sm:px-5">
        Past day closes
      </h2>
      <div className="table-wrap">
        <table className="table table--middle">
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col" className="num">
                Should be
              </th>
              <th scope="col" className="num">
                Counted
              </th>
              <th scope="col" className="num">
                Difference
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.date}>
                <td>
                  <Link
                    to={`/dashboard/daybook?date=${c.date}`}
                    className="inline-flex min-h-8 items-center font-bold text-ink no-underline hover:underline"
                  >
                    {formatFullDate(c.date)}
                  </Link>
                  {c.note && <span className="block text-xs text-ink-3">{c.note}</span>}
                </td>
                <td className="num">{money(c.expected_cash)}</td>
                <td className="num">{money(c.counted_cash)}</td>
                <td className={`num font-bold ${c.difference === 0 ? 'text-ok' : c.difference < 0 ? 'text-danger' : 'text-attn'}`}>
                  {c.difference === 0 ? 'Matches' : `${money(Math.abs(c.difference))} ${c.difference < 0 ? 'short' : 'extra'}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function DayBook() {
  const [params, setParams] = useSearchParams()
  const today = todayISO()
  const date = params.get('date') && params.get('date') <= today ? params.get('date') : today
  const { data, isLoading } = useDaybook({ date })
  const go = (d) => setParams(d === today ? {} : { date: d }, { replace: true })
  const isToday = date === today

  return (
    <div className="page">
      <Hero
        title="Day book"
        subtitle={
          <>
            {formatLongDate(fromISO(date))}
            {isToday && <> · today</>}
          </>
        }
        actions={
          <>
            <button
              type="button"
              className="icon-button icon-button--bordered"
              onClick={() => go(addDays(date, -1))}
              aria-label="Previous day"
              title="Previous day"
            >
              <ChevronLeft size={17} />
            </button>
            <input
              type="date"
              className="field field--compact w-auto"
              aria-label="Pick a day"
              value={date}
              max={today}
              onChange={(e) => e.target.value && go(e.target.value)}
            />
            <button
              type="button"
              className="icon-button icon-button--bordered"
              onClick={() => go(addDays(date, 1))}
              disabled={isToday}
              aria-label="Next day"
              title="Next day"
            >
              <ChevronRight size={17} />
            </button>
            {!isToday && (
              <button type="button" className="btn btn--ghost" onClick={() => go(today)}>
                Today
              </button>
            )}
            <Link className="btn btn--ghost" to={`/register?date=${date}`}>
              <Printer size={16} aria-hidden="true" /> Print register
            </Link>
          </>
        }
        stats={
          data
            ? [
                {
                  label: 'Commission',
                  featured: true,
                  value: money(data.commission),
                  hint: `${data.count} ${data.count === 1 ? 'entry' : 'entries'}`,
                  to: `/dashboard/entries?range=custom&from=${date}&to=${date}`,
                },
                { label: 'Money in', tone: 'in', value: money(data.modes.reduce((t, m) => t + m.in_amount, 0)), hint: 'All payment modes' },
                {
                  label: 'Money out',
                  tone: 'out',
                  value: money(data.modes.reduce((t, m) => t + m.out_amount, 0)),
                  hint: 'All payment modes',
                },
              ]
            : null
        }
      />

      {isLoading || !data ? (
        <p className="loading">Loading…</p>
      ) : (
        <>
          {data.modes.length === 0 ? (
            <section className={`${CARD} px-5 py-10 text-center`}>
              <Building2 size={22} className="mx-auto text-ink-3" aria-hidden="true" />
              <p className="m-0 mt-2 font-bold text-ink">No money moved on this day</p>
              <p className="m-0 mt-1 text-sm text-ink-3">You can still record the opening cash below.</p>
            </section>
          ) : (
            <ModesCard modes={data.modes} />
          )}

          <CashCount data={data} date={date} />
          <History items={data.history} />
        </>
      )}
    </div>
  )
}

export default DayBook
