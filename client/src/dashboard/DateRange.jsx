import { useId } from 'react'
import { addDays, addMonths, endOfMonth, startOfMonth, startOfWeek, todayISO } from '../lib/format.js'

export function presetRange(preset) {
  const today = todayISO()
  switch (preset) {
    case 'today':
      return { from: today, to: today }
    case 'week':
      return { from: startOfWeek(today), to: today }
    case 'month':
      return { from: startOfMonth(today), to: today }
    case 'last-month': {
      const start = startOfMonth(addMonths(startOfMonth(today), -1))
      return { from: start, to: endOfMonth(start) }
    }
    case '30d':
      return { from: addDays(today, -29), to: today }
    case '3m':
      return { from: startOfMonth(addMonths(today, -2)), to: today }
    case '12m':
      return { from: startOfMonth(addMonths(today, -11)), to: today }
    case 'year':
      return { from: `${today.slice(0, 4)}-01-01`, to: today }
    default:
      return { from: '', to: '' }
  }
}

export const PRESETS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'last-month', label: 'Last month' },
  { value: '30d', label: 'Last 30 days' },
  { value: '3m', label: 'Last 3 months' },
  { value: '12m', label: 'Last 12 months' },
  { value: 'year', label: 'This year' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom dates' },
]

function DateRange({ preset, from, to, onChange, presets = PRESETS }) {
  const ids = { preset: useId(), from: useId(), to: useId() }
  return (
    <div className="date-range">
      <label className="visually-hidden" htmlFor={ids.preset}>Date range</label>
      <select
        id={ids.preset}
        className="field field--compact"
        value={preset}
        onChange={(e) => {
          const next = e.target.value
          onChange({ preset: next, ...(next === 'custom' ? { from: from || todayISO(), to: to || todayISO() } : presetRange(next)) })
        }}
      >
        {presets.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>
      {preset === 'custom' && (
        <>
          <label className="visually-hidden" htmlFor={ids.from}>From</label>
          <input id={ids.from} className="field field--compact" type="date" value={from} max={to || undefined} onChange={(e) => onChange({ preset, from: e.target.value, to })} />
          <span className="date-range__to" aria-hidden="true">to</span>
          <label className="visually-hidden" htmlFor={ids.to}>To</label>
          <input id={ids.to} className="field field--compact" type="date" value={to} min={from || undefined} onChange={(e) => onChange({ preset, from, to: e.target.value })} />
        </>
      )}
    </div>
  )
}

export default DateRange
