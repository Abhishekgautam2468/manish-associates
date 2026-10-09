import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import Logo from '../../components/Logo.jsx'
import { useContact, useTransactions } from '../../lib/queries.js'
import DateRange, { presetRange } from '../../dashboard/DateRange.jsx'
import { displayPhone, formatDate, formatFullDate, formatMonth, formatStamp, modeLabel, money, todayISO } from '../../lib/format.js'
import { withBalance } from '../../lib/statement.js'

/*
 * A printable statement of account for one person, laid out as an A4 document.
 * It always uses paper colours, so it looks the same in dark mode and on print.
 * The browser's print dialog saves it as a PDF.
 */

const PAGE_CSS = `
@page { size: A4; margin: 14mm 12mm; }
@media print {
  .doc-sheet dl { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
  .doc-sheet dl > div + div { border-top: 0 !important; border-left: 1px solid #e6e4ee !important; }
  .doc-sheet .overflow-x-auto { overflow: visible !important; }
  html, body { background: #fff !important; }
  .doc-toolbar { display: none !important; }
  .doc-sheet { box-shadow: none !important; margin: 0 !important; padding: 0 !important; width: auto !important; border: 0 !important; }
  .doc-wrap { padding: 0 !important; background: #fff !important; }
  .doc-table tr { break-inside: avoid; }
  .doc-keep { break-inside: avoid; }
}
`

function particulars(e, first) {
  if (e.received_for_other)
    return { title: `Paid for ${e.contact_name}`, sub: `sent to ${first} on their behalf, ${modeLabel(e.paid_mode ?? e.mode)}` }
  if (e.type === 'transfer') {
    const what = e.label_name || (e.payee === 'self' ? 'Cash withdrawal' : 'Money transfer')
    const where =
      e.payee === 'self'
        ? `${modeLabel(e.mode)} in, ${modeLabel(e.paid_mode ?? e.mode)} out`
        : `sent to ${e.to_name}${e.to_account ? ` (${e.to_account})` : ''}, ${modeLabel(e.paid_mode ?? e.mode)}`
    // No commission on the statement: it is shared with the customer.
    return { title: what, sub: [where, e.note].filter(Boolean).join(' · ') }
  }
  if (e.type === 'adjust')
    return {
      title: 'Balance',
      sub: [e.direction === 'owes_you' ? 'Due to Manish Associates' : `Held for ${first}`, e.note].filter(Boolean).join(' · '),
    }
  return {
    title: e.label_name || (e.type === 'in' ? 'Money received' : 'Money paid'),
    sub: [modeLabel(e.mode), e.note].filter(Boolean).join(' · '),
  }
}

// Running balance in words for paper: "1,200 due" / "1,200 held" / "Settled".
function balanceLabel(balance) {
  if (!balance) return { text: 'Settled', cls: 'text-[#15803d]' }
  return balance < 0 ? { text: `${money(-balance)} due`, cls: 'text-[#8a5a00]' } : { text: `${money(balance)} held`, cls: 'text-[#c2410c]' }
}

function StatementDoc() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const preset = params.get('range') ?? '12m'
  const range = preset === 'custom' ? { from: params.get('from') ?? '', to: params.get('to') ?? '' } : presetRange(preset)
  const { data: person, error } = useContact(id)
  const { data: tx } = useTransactions({ contact_id: id, limit: 5000 })
  const [generated] = useState(() => new Date().toISOString())

  const doc = useMemo(() => {
    const all = withBalance(tx?.items ?? [], id)
    const from = range.from || ''
    const to = range.to || todayISO()
    const before = all.filter((e) => from && e.date < from)
    const opening = before.length ? before[before.length - 1].balance : 0
    const period = all.filter((e) => e.date >= from && e.date <= to)
    const received = period.reduce((s, e) => s + e.cash_in, 0)
    const paid = period.reduce((s, e) => s + e.cash_out, 0)
    const closing = period.length ? period[period.length - 1].balance : opening
    // Newest first.
    const lines = [...period].reverse()
    const months = []
    for (const e of lines) {
      const key = e.date.slice(0, 7)
      let m = months.at(-1)
      if (!m || m.key !== key) months.push((m = { key, items: [], in: 0, out: 0 }))
      m.items.push(e)
      m.in += e.cash_in
      m.out += e.cash_out
    }
    return { from, to, opening, closing, received, paid, months, count: lines.length }
  }, [tx, id, range.from, range.to])

  if (error) {
    return (
      <div className="p-8">
        <p className="field-error">{error.message}</p>
        <Link to="/dashboard/people">Back to people</Link>
      </div>
    )
  }
  if (!person || !tx) return <p className="page-status">Preparing the statement…</p>

  const first = person.name.split(' ')[0]
  const period = doc.from ? `${formatFullDate(doc.from)} to ${formatFullDate(doc.to)}` : `All entries up to ${formatFullDate(doc.to)}`
  const cell = 'border-b border-[#e6e4ee] px-2.5 py-2 align-top'
  const num = `${cell} text-right whitespace-nowrap tabular-nums`
  const today = balanceLabel(person.balance)

  return (
    <div className="dash-root doc-wrap min-h-screen bg-[#e9e8f0] px-3 py-6 text-[#14172b] sm:px-6">
      <style>{PAGE_CSS}</style>

      {/* Screen-only toolbar */}
      <div className="doc-toolbar mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center justify-between gap-3">
        <Link
          to={`/dashboard/people/${id}`}
          className="inline-flex min-h-10 items-center gap-1.5 text-sm font-bold text-[#4b4f68] no-underline hover:text-[#5b3df5]"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Back to {person.name}
        </Link>
        <div className="toolbar">
          <DateRange
            preset={preset}
            from={range.from}
            to={range.to}
            onChange={({ preset: p, from, to }) => {
              const next = new URLSearchParams()
              if (p !== '12m') next.set('range', p)
              if (p === 'custom') {
                next.set('from', from)
                next.set('to', to)
              }
              setParams(next, { replace: true })
            }}
          />
          <button type="button" className="btn btn--primary" onClick={() => window.print()}>
            <Printer size={16} aria-hidden="true" /> Print or save as PDF
          </button>
        </div>
      </div>

      {/* The document */}
      <article className="doc-sheet mx-auto w-full max-w-[210mm] rounded-sm border border-[#d9d7e3] bg-white p-4 text-[12.5px] leading-snug shadow-[0_20px_50px_-30px_rgb(20_23_43/0.5)] sm:p-[12mm]">
        <header className="doc-keep flex flex-wrap items-start justify-between gap-6 border-b-2 border-[#14172b] pb-4">
          <div>
            <Logo size="md" onLight />
            <p className="m-0 mt-1.5 text-[11px] text-[#6a6e86]">Statement of account</p>
          </div>
          <div className="text-right text-[11px] text-[#4b4f68]">
            <p className="m-0">
              <span className="font-bold text-[#14172b]">Period:</span> {period}
            </p>
            <p className="m-0">
              <span className="font-bold text-[#14172b]">Generated:</span>{' '}
              {formatStamp(generated).replace(/^today/, formatFullDate(todayISO()))}
            </p>
          </div>
        </header>

        <section className="doc-keep mt-5 grid gap-5 sm:grid-cols-[1fr_auto]">
          <div>
            <p className="m-0 text-[11px] font-bold text-[#6a6e86]">Statement for</p>
            <p className="m-0 mt-0.5 text-xl font-extrabold">{person.name}</p>
            {person.phone && <p className="m-0 text-[#4b4f68]">{displayPhone(person.phone)}</p>}
          </div>
          <div className="rounded-lg border border-[#e6e4ee] bg-[#f7f6fb] px-4 py-3 sm:min-w-[15rem]">
            <p className="m-0 text-[11px] font-bold text-[#6a6e86]">Balance today</p>
            <p className={`m-0 mt-0.5 text-lg font-extrabold tabular-nums ${today.cls}`}>
              {person.balance ? money(Math.abs(person.balance)) : 'Settled'}{' '}
              {person.balance !== 0 && (
                <span className="text-xs font-semibold text-[#6a6e86]">
                  {person.balance < 0 ? 'due to Manish Associates' : `held for ${first}`}
                </span>
              )}
            </p>
          </div>
        </section>

        {(() => {
          // Brought forward only shows when money was carried in from before the start date;
          // the end balance only when the period stops before today (otherwise it is "Balance today").
          const tiles = [
            doc.from &&
              doc.opening !== 0 && {
                label: `Brought forward (before ${formatDate(doc.from, { short: true })})`,
                value: balanceLabel(doc.opening).text,
                tone: balanceLabel(doc.opening).cls,
              },
            { label: 'Total received', value: money(doc.received), tone: 'text-[#1d4ed8]' },
            { label: 'Total paid or sent', value: money(doc.paid), tone: 'text-[#c2410c]' },
            doc.to < todayISO() && {
              label: `Balance on ${formatDate(doc.to, { short: true })}`,
              value: balanceLabel(doc.closing).text,
              tone: balanceLabel(doc.closing).cls,
            },
          ].filter(Boolean)
          const cols = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4' }[tiles.length]
          return (
            <dl
              className={`doc-keep m-0 mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#e6e4ee] bg-[#e6e4ee] ${cols}`}
            >
              {tiles.map((f) => (
                <div key={f.label} className="bg-white px-4 py-3">
                  <dt className="text-[11px] font-bold text-[#6a6e86]">{f.label}</dt>
                  <dd className={`m-0 mt-0.5 text-base font-extrabold tabular-nums ${f.tone}`}>{f.value}</dd>
                </div>
              ))}
            </dl>
          )
        })()}

        <h2 className="m-0 mt-6 mb-2 text-sm font-extrabold text-[#14172b]">
          Transactions <span className="font-semibold text-[#6a6e86]">({doc.count})</span>
        </h2>
        {doc.count === 0 ? (
          <p className="m-0 rounded-lg border border-dashed border-[#d9d7e3] px-4 py-6 text-center text-[#6a6e86]">
            No entries in this period.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="doc-table w-full min-w-[34rem] border-collapse text-left">
              <thead>
                <tr className="bg-[#14172b] text-[11px] text-white">
                  <th scope="col" className="px-2.5 py-2 font-bold">
                    Date
                  </th>
                  <th scope="col" className="px-2.5 py-2 font-bold">
                    Particulars
                  </th>
                  <th scope="col" className="px-2.5 py-2 text-right font-bold">
                    Received
                  </th>
                  <th scope="col" className="px-2.5 py-2 text-right font-bold">
                    Paid / sent
                  </th>
                  <th scope="col" className="px-2.5 py-2 text-right font-bold">
                    Balance
                  </th>
                </tr>
              </thead>
              {doc.months.map((m) => {
                const end = balanceLabel(m.items[0].balance)
                return (
                  <tbody key={m.key}>
                    <tr className="bg-[#efedf8]">
                      <th scope="rowgroup" colSpan={2} className="px-2.5 py-1.5 text-left text-[11.5px] font-extrabold">
                        {formatMonth(`${m.key}-01`)}
                      </th>
                      <td className="px-2.5 py-1.5 text-right text-[11.5px] font-bold text-[#1d4ed8] tabular-nums">
                        {m.in ? money(m.in) : ''}
                      </td>
                      <td className="px-2.5 py-1.5 text-right text-[11.5px] font-bold text-[#c2410c] tabular-nums">
                        {m.out ? money(m.out) : ''}
                      </td>
                      <td className={`px-2.5 py-1.5 text-right text-[11.5px] font-bold tabular-nums ${end.cls}`}>{end.text}</td>
                    </tr>
                    {m.items.map((e) => {
                      const p = particulars(e, first)
                      const b = balanceLabel(e.balance)
                      return (
                        <tr key={e.id}>
                          <td className={`${cell} whitespace-nowrap`}>{formatDate(e.date, { short: true })}</td>
                          <td className={cell}>
                            <span className="font-bold">{p.title}</span>
                            {p.sub && <span className="block text-[11px] text-[#6a6e86]">{p.sub}</span>}
                          </td>
                          <td className={`${num} font-semibold text-[#1d4ed8]`}>{e.cash_in ? money(e.cash_in) : ''}</td>
                          <td className={`${num} font-semibold text-[#c2410c]`}>{e.cash_out ? money(e.cash_out) : ''}</td>
                          <td className={`${num} font-bold ${b.cls}`}>{b.text}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                )
              })}
              <tfoot>
                <tr className="border-t-2 border-[#14172b]">
                  <th scope="row" colSpan={2} className="px-2.5 py-2 text-left font-extrabold">
                    Total for the period
                  </th>
                  <td className="px-2.5 py-2 text-right font-extrabold text-[#1d4ed8] tabular-nums">{money(doc.received)}</td>
                  <td className="px-2.5 py-2 text-right font-extrabold text-[#c2410c] tabular-nums">{money(doc.paid)}</td>
                  <td className={`px-2.5 py-2 text-right font-extrabold tabular-nums ${balanceLabel(doc.closing).cls}`}>
                    {balanceLabel(doc.closing).text}
                  </td>
                </tr>
                {doc.from && doc.opening !== 0 && (
                  <tr>
                    <td colSpan={5} className="px-2.5 pt-2 text-right text-[11px] text-[#6a6e86]">
                      Brought forward from before {formatFullDate(doc.from)}: {balanceLabel(doc.opening).text}
                    </td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>
        )}

        <footer className="doc-keep mt-8 border-t border-[#e6e4ee] pt-3 text-[10.5px] text-[#6a6e86]">
          Balance is what is left after each entry: “due” is owed to Manish Associates, “held” is money held for {person.name}. Received and
          paid count money that changed hands.
        </footer>
      </article>
    </div>
  )
}

export default StatementDoc
