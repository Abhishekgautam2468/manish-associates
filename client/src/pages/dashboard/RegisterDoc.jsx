import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Building2, Printer } from 'lucide-react'
import { useDaybook, useTransactions } from '../../lib/queries.js'
import { formatFullDate, formatStamp, modeLabel, money, todayISO } from '../../lib/format.js'

/*
 * The day register: every entry of a day on one A4 sheet, with totals by payment mode
 * and the cash count. Paper colours always, so it prints the same in dark mode.
 */

const PAGE_CSS = `
@page { size: A4 landscape; margin: 12mm; }
@media print {
  html, body { background: #fff !important; }
  .doc-toolbar { display: none !important; }
  .doc-sheet { box-shadow: none !important; margin: 0 !important; padding: 0 !important; border: 0 !important; max-width: none !important; }
  .doc-wrap { padding: 0 !important; background: #fff !important; }
  .doc-sheet .overflow-x-auto { overflow: visible !important; }
  .doc-table tr { break-inside: avoid; }
}
`

const time = (iso) => new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date(iso)).toLowerCase()

function what(e) {
  if (e.type === 'transfer') {
    const name = e.label_name || (e.payee === 'self' ? 'Cash withdrawal' : 'Money transfer')
    return e.payee === 'self' ? name : `${name} to ${e.to_name}${e.to_account ? ` (${e.to_account})` : ''}`
  }
  if (e.type === 'adjust') return `Balance: ${e.direction === 'owes_you' ? 'owes you' : 'you owe'}`
  return e.label_name || (e.type === 'in' ? 'Money in' : 'Money out')
}

function RegisterDoc() {
  const [params, setParams] = useSearchParams()
  const date = params.get('date') || todayISO()
  const { data: tx } = useTransactions({ from: date, to: date, limit: 5000 })
  const { data: day } = useDaybook({ date })
  const [generated] = useState(() => new Date().toISOString())

  if (!tx || !day) return <p className="page-status">Preparing the register…</p>
  const rows = [...tx.items].sort((a, b) => a.created_at.localeCompare(b.created_at))
  const cash = day.modes.find((m) => m.mode === 'cash') ?? { in_amount: 0, out_amount: 0 }
  const opening = day.close ? day.close.opening_cash : day.suggested_opening
  const expected = opening + cash.in_amount - cash.out_amount
  const counted = day.close?.counted_cash
  const totalIn = rows.reduce((s, e) => s + e.cash_in, 0)
  const totalOut = rows.reduce((s, e) => s + e.cash_out, 0)
  const cell = 'border-b border-[#e6e4ee] px-2 py-1.5 align-top'
  const num = `${cell} text-right whitespace-nowrap tabular-nums`

  return (
    <div className="dash-root doc-wrap min-h-screen bg-[#e9e8f0] px-3 py-6 text-[#14172b] sm:px-6">
      <style>{PAGE_CSS}</style>
      <div className="doc-toolbar mx-auto mb-4 flex max-w-[297mm] flex-wrap items-center justify-between gap-3">
        <Link to={`/dashboard/daybook${date === todayISO() ? '' : `?date=${date}`}`} className="inline-flex min-h-10 items-center gap-1.5 text-sm font-bold text-[#4b4f68] no-underline hover:text-[#5b3df5]">
          <ArrowLeft size={16} aria-hidden="true" /> Back to the day book
        </Link>
        <div className="toolbar">
          <input type="date" className="field field--compact w-auto" aria-label="Day" value={date} max={todayISO()} onChange={(e) => e.target.value && setParams({ date: e.target.value })} />
          <button type="button" className="btn btn--primary" onClick={() => window.print()}>
            <Printer size={16} aria-hidden="true" /> Print or save as PDF
          </button>
        </div>
      </div>

      <article className="doc-sheet mx-auto w-full max-w-[297mm] rounded-sm border border-[#d9d7e3] bg-white p-4 text-[12px] leading-snug shadow-[0_20px_50px_-30px_rgb(20_23_43/0.5)] sm:p-[10mm]">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-[#14172b] pb-3">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-[#6d4aff] text-white" aria-hidden="true">
              <Building2 size={18} strokeWidth={2.25} />
            </span>
            <div>
              <p className="m-0 text-base font-extrabold">Manish Associates</p>
              <p className="m-0 text-[11px] text-[#6a6e86]">Day register · {formatFullDate(date)}</p>
            </div>
          </div>
          <p className="m-0 text-right text-[11px] text-[#4b4f68]">
            {rows.length} {rows.length === 1 ? 'entry' : 'entries'} · commission <strong className="text-[#15803d]">{money(day.commission)}</strong>
            <br />
            Generated {formatStamp(generated)}
          </p>
        </header>

        {rows.length === 0 ? (
          <p className="m-0 mt-6 rounded-lg border border-dashed border-[#d9d7e3] px-4 py-6 text-center text-[#6a6e86]">No entries on this day.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="doc-table w-full min-w-[46rem] border-collapse text-left">
              <thead>
                <tr className="bg-[#14172b] text-[10.5px] text-white">
                  <th className="px-2 py-1.5 font-bold">#</th>
                  <th className="px-2 py-1.5 font-bold">Time</th>
                  <th className="px-2 py-1.5 font-bold">Customer</th>
                  <th className="px-2 py-1.5 font-bold">Details</th>
                  <th className="px-2 py-1.5 text-right font-bold">In</th>
                  <th className="px-2 py-1.5 font-bold">by</th>
                  <th className="px-2 py-1.5 text-right font-bold">Out</th>
                  <th className="px-2 py-1.5 font-bold">by</th>
                  <th className="px-2 py-1.5 text-right font-bold">Commission</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e, i) => (
                  <tr key={e.id}>
                    <td className={`${cell} text-[#6a6e86]`}>{i + 1}</td>
                    <td className={`${cell} whitespace-nowrap`}>{time(e.created_at)}</td>
                    <td className={`${cell} font-bold`}>{e.contact_name ?? 'Walk-in'}</td>
                    <td className={cell}>
                      {what(e)}
                      {e.note && <span className="block text-[10.5px] text-[#6a6e86]">{e.note}</span>}
                    </td>
                    <td className={`${num} font-semibold text-[#1d4ed8]`}>{e.cash_in ? money(e.cash_in) : ''}</td>
                    <td className={`${cell} text-[#6a6e86]`}>{e.cash_in ? modeLabel(e.mode) : ''}</td>
                    <td className={`${num} font-semibold text-[#c2410c]`}>{e.cash_out ? money(e.cash_out) : ''}</td>
                    <td className={`${cell} text-[#6a6e86]`}>{e.cash_out ? modeLabel(e.paid_mode ?? e.mode) : ''}</td>
                    <td className={`${num} text-[#15803d]`}>{e.commission ? money(e.commission) : ''}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#14172b] font-extrabold">
                  <th colSpan={4} className="px-2 py-2 text-left">
                    Total
                  </th>
                  <td className="px-2 py-2 text-right text-[#1d4ed8] tabular-nums">{money(totalIn)}</td>
                  <td />
                  <td className="px-2 py-2 text-right text-[#c2410c] tabular-nums">{money(totalOut)}</td>
                  <td />
                  <td className="px-2 py-2 text-right text-[#15803d] tabular-nums">{money(day.commission)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <section className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <h2 className="m-0 mb-1.5 text-[12px] font-extrabold">By payment mode</h2>
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-[#14172b] text-[10.5px]">
                  <th className="px-2 py-1 font-bold">Mode</th>
                  <th className="px-2 py-1 text-right font-bold">In</th>
                  <th className="px-2 py-1 text-right font-bold">Out</th>
                  <th className="px-2 py-1 text-right font-bold">Net</th>
                </tr>
              </thead>
              <tbody>
                {day.modes.map((m) => (
                  <tr key={m.mode}>
                    <td className={cell}>{modeLabel(m.mode)}</td>
                    <td className={num}>{money(m.in_amount)}</td>
                    <td className={num}>{money(m.out_amount)}</td>
                    <td className={`${num} font-bold`}>{money(m.in_amount - m.out_amount, { sign: true })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h2 className="m-0 mb-1.5 text-[12px] font-extrabold">Cash count</h2>
            <dl className="m-0 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 rounded-lg border border-[#e6e4ee] px-3 py-2">
              <dt>Opening cash</dt>
              <dd className="m-0 text-right tabular-nums">{money(opening)}</dd>
              <dt>+ Cash in</dt>
              <dd className="m-0 text-right tabular-nums">{money(cash.in_amount)}</dd>
              <dt>− Cash out</dt>
              <dd className="m-0 text-right tabular-nums">{money(cash.out_amount)}</dd>
              <dt className="border-t border-[#14172b] pt-1 font-extrabold">Should be in the drawer</dt>
              <dd className="m-0 border-t border-[#14172b] pt-1 text-right font-extrabold tabular-nums">{money(expected)}</dd>
              <dt>Counted</dt>
              <dd className="m-0 text-right tabular-nums">{counted == null ? 'not counted' : money(counted)}</dd>
              {counted != null && (
                <>
                  <dt className="font-bold">Difference</dt>
                  <dd className={`m-0 text-right font-bold tabular-nums ${counted - expected === 0 ? 'text-[#15803d]' : counted - expected < 0 ? 'text-[#b91c1c]' : 'text-[#8a5a00]'}`}>
                    {counted - expected === 0 ? 'Matches' : `${money(Math.abs(counted - expected))} ${counted - expected < 0 ? 'short' : 'extra'}`}
                  </dd>
                </>
              )}
            </dl>
            <p className="m-0 mt-6 flex justify-between gap-6 text-[11px] text-[#6a6e86]">
              <span className="flex-1 border-t border-[#9a9cb0] pt-1">Checked by</span>
              <span className="flex-1 border-t border-[#9a9cb0] pt-1">Signature</span>
            </p>
          </div>
        </section>
      </article>
    </div>
  )
}

export default RegisterDoc
