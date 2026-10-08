import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { money, moneyShort, formatDate, formatMonthShort, periodLabel } from '../lib/format.js'

const PAD = { top: 12, right: 8, bottom: 28, left: 56 }
const GAP = 1 // half of the 2px surface gap at the zero line

function niceStep(max, targetTicks) {
  const raw = max / targetTicks
  const mag = 10 ** Math.floor(Math.log10(raw))
  const norm = raw / mag
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10
  return step * mag
}

// Column with a 4px rounded data end and a square base.
function columnPath(x, w, yBase, yEnd) {
  const h = Math.abs(yEnd - yBase)
  if (h < 0.5) return ''
  const r = Math.min(4, w / 2, h)
  if (yEnd < yBase) {
    return `M${x},${yBase}V${yEnd + r}Q${x},${yEnd} ${x + r},${yEnd}H${x + w - r}Q${x + w},${yEnd} ${x + w},${yEnd + r}V${yBase}Z`
  }
  return `M${x},${yBase}V${yEnd - r}Q${x},${yEnd} ${x + r},${yEnd}H${x + w - r}Q${x + w},${yEnd} ${x + w},${yEnd - r}V${yBase}Z`
}

function tickLabel(period, group) {
  if (group === 'month') return formatMonthShort(period)
  return formatDate(period, { short: true })
}

function CashFlowChart({ rows, group = 'day', height = 240, title }) {
  const wrapRef = useRef(null)
  const [width, setWidth] = useState(640)
  const [active, setActive] = useState(null)
  const [showTable, setShowTable] = useState(false)
  const descId = useId()

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [showTable])

  useEffect(() => setActive(null), [rows])

  const n = rows.length
  const maxIn = Math.max(0, ...rows.map((r) => r.in_amount))
  const maxOut = Math.max(0, ...rows.map((r) => r.out_amount))
  const span = Math.max(maxIn + maxOut, 100)
  const step = niceStep(span, 4)
  const top = Math.max(step, Math.ceil(maxIn / step) * step)
  const bottom = maxOut > 0 ? Math.ceil(maxOut / step) * step : 0
  const plotW = width - PAD.left - PAD.right
  const plotH = height - PAD.top - PAD.bottom
  const y = (v) => PAD.top + ((top - v) / (top + bottom)) * plotH
  const y0 = y(0)
  const band = plotW / Math.max(n, 1)
  const barW = Math.max(2, Math.min(24, band * 0.62))
  const ticks = []
  for (let v = -bottom; v <= top + 1e-6; v += step) ticks.push(v)
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(plotW / 64))))

  const totalIn = rows.reduce((s, r) => s + r.in_amount, 0)
  const totalOut = rows.reduce((s, r) => s + r.out_amount, 0)
  const activeRow = active != null ? rows[active] : null

  function onKeyDown(e) {
    if (!n) return
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      setActive((a) => (a == null ? 0 : Math.min(n - 1, a + 1)))
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setActive((a) => (a == null ? n - 1 : Math.max(0, a - 1)))
    } else if (e.key === 'Escape') {
      setActive(null)
    }
  }

  const tooltipLeft = activeRow ? Math.min(Math.max(PAD.left + band * active + band / 2, 90), width - 90) : 0

  if (totalIn + totalOut === 0) {
    return (
      <figure className="chart">
        {title && <figcaption className="chart__title">{title}</figcaption>}
        <div className="chart__empty">
          <BarChart3 size={22} aria-hidden="true" />
          <p>No money moved in this period yet. Entries you add will show up here as bars.</p>
        </div>
      </figure>
    )
  }

  return (
    <figure className="chart">
      <div className="chart__top">
        {title && <figcaption className="chart__title">{title}</figcaption>}
        <div className="chart__legend">
          <span className="legend-key"><span className="legend-key__swatch legend-key__swatch--in" />Money in {money(totalIn)}</span>
          <span className="legend-key"><span className="legend-key__swatch legend-key__swatch--out" />Money out {money(totalOut)}</span>
          <button type="button" className="link-button chart__toggle" onClick={() => setShowTable((s) => !s)}>
            {showTable ? 'Show chart' : 'Show as table'}
          </button>
        </div>
      </div>

      {showTable ? (
        <div className="table-wrap chart__table">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">{group === 'month' ? 'Month' : group === 'week' ? 'Week' : 'Day'}</th>
                <th scope="col" className="num">Money in</th>
                <th scope="col" className="num">Money out</th>
                <th scope="col" className="num">Net</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.period}>
                  <td>{periodLabel(r.period, group)}</td>
                  <td className="num">{money(r.in_amount)}</td>
                  <td className="num">{money(r.out_amount)}</td>
                  <td className="num">{money(r.in_amount - r.out_amount, { sign: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="chart__plot" ref={wrapRef}>
          <svg
            width={width}
            height={height}
            role="img"
            aria-describedby={descId}
            tabIndex={0}
            onKeyDown={onKeyDown}
            onMouseLeave={() => setActive(null)}
            onBlur={() => setActive(null)}
          >
            <desc id={descId}>
              Money in above the line and money out below it, per {group}. Total in {money(totalIn)}, total out {money(totalOut)}.
              Use the left and right arrow keys to read each {group}.
            </desc>
            {ticks.map((v) => (
              <g key={v}>
                <line className={v === 0 ? 'chart__zero' : 'chart__grid'} x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} />
                <text className="chart__axis" x={PAD.left - 8} y={y(v)} dy="0.32em" textAnchor="end">
                  {v === 0 ? '₹0' : moneyShort(v)}
                </text>
              </g>
            ))}
            {activeRow && (
              <rect className="chart__hover" x={PAD.left + band * active} y={PAD.top} width={band} height={plotH} />
            )}
            {rows.map((r, i) => {
              const x = PAD.left + band * i + (band - barW) / 2
              return (
                <g key={r.period}>
                  <path className="chart__bar chart__bar--in" d={columnPath(x, barW, y0 - GAP, Math.min(y(r.in_amount), y0 - GAP))} />
                  <path className="chart__bar chart__bar--out" d={columnPath(x, barW, y0 + GAP, Math.max(y(-r.out_amount), y0 + GAP))} />
                  {i % labelEvery === 0 && (
                    <text className="chart__axis" x={PAD.left + band * i + band / 2} y={height - 8} textAnchor="middle">
                      {tickLabel(r.period, group)}
                    </text>
                  )}
                  <rect
                    x={PAD.left + band * i}
                    y={PAD.top}
                    width={band}
                    height={plotH}
                    fill="transparent"
                    onMouseEnter={() => setActive(i)}
                  />
                </g>
              )
            })}
          </svg>
          {activeRow && (
            <div className="chart__tooltip" style={{ left: tooltipLeft }} aria-live="polite">
              <p className="chart__tooltip-title">{periodLabel(activeRow.period, group)}</p>
              <p><span className="legend-key__swatch legend-key__swatch--in" />In <strong>{money(activeRow.in_amount)}</strong></p>
              <p><span className="legend-key__swatch legend-key__swatch--out" />Out <strong>{money(activeRow.out_amount)}</strong></p>
              <p className="chart__tooltip-net">Net <strong>{money(activeRow.in_amount - activeRow.out_amount, { sign: true })}</strong></p>
            </div>
          )}
        </div>
      )}
    </figure>
  )
}

export default CashFlowChart
