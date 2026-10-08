const rupees = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 })
const rupeesFixed = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })

// Amounts arrive from the server in paise.
export function money(paise, { sign = false, fixed = false } = {}) {
  const value = (paise ?? 0) / 100
  const formatted = (fixed || !Number.isInteger(value) ? rupeesFixed : rupees).format(Math.abs(value))
  const prefix = sign ? (value > 0 ? '+' : value < 0 ? '−' : '') : value < 0 ? '−' : ''
  return `${prefix}₹${formatted}`
}

// Short form for chart axes: ₹950, ₹12K, ₹4.5L, ₹1.2Cr.
export function moneyShort(paise) {
  const v = Math.abs((paise ?? 0) / 100)
  const sign = paise < 0 ? '−' : ''
  const trim = (n) => n.toFixed(n < 10 ? 1 : 0).replace(/\.0$/, '')
  if (v >= 1e7) return `${sign}₹${trim(v / 1e7)}Cr`
  if (v >= 1e5) return `${sign}₹${trim(v / 1e5)}L`
  if (v >= 1e3) return `${sign}₹${trim(v / 1e3)}K`
  return `${sign}₹${Math.round(v)}`
}

export function toPaise(input) {
  const n = Number(String(input ?? '').replace(/[,₹\s]/g, ''))
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}

export function rupeesInput(paise) {
  return paise ? String(paise / 100) : ''
}

/* Dates are plain YYYY-MM-DD strings in local time. */

export function todayISO() {
  const d = new Date()
  return toISO(d)
}

export function toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function fromISO(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(iso, days) {
  const d = fromISO(iso)
  d.setDate(d.getDate() + days)
  return toISO(d)
}

export function addMonths(iso, months) {
  const d = fromISO(iso)
  d.setMonth(d.getMonth() + months)
  return toISO(d)
}

export function startOfWeek(iso) {
  const d = fromISO(iso)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return toISO(d)
}

export function startOfMonth(iso) {
  return `${iso.slice(0, 7)}-01`
}

export function endOfMonth(iso) {
  const d = fromISO(startOfMonth(iso))
  d.setMonth(d.getMonth() + 1)
  d.setDate(0)
  return toISO(d)
}

export function daysBetween(fromIso, toIso) {
  return Math.round((fromISO(toIso) - fromISO(fromIso)) / 864e5)
}

const fmtDay = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
const fmtDayShort = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' })
const fmtMonth = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' })
const fmtMonthShort = new Intl.DateTimeFormat('en-IN', { month: 'short' })
const fmtWeekday = new Intl.DateTimeFormat('en-IN', { weekday: 'short' })
const fmtLong = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

export function formatDate(iso, { short = false } = {}) {
  if (!iso) return ''
  const d = fromISO(iso.slice(0, 10))
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return (short || sameYear ? fmtDayShort : fmtDay).format(d)
}

export function formatFullDate(iso) {
  return fmtDay.format(fromISO(iso.slice(0, 10)))
}

export function formatLongDate(date = new Date()) {
  return fmtLong.format(date)
}

export function formatMonth(iso) {
  return fmtMonth.format(fromISO(iso))
}

export function formatMonthShort(iso) {
  return fmtMonthShort.format(fromISO(iso))
}

function formatWeekday(iso) {
  return fmtWeekday.format(fromISO(iso))
}

// "Today", "Yesterday", "Tomorrow", otherwise the date.
export function relativeDay(iso) {
  if (!iso) return ''
  const diff = daysBetween(todayISO(), iso.slice(0, 10))
  if (diff === 0) return 'Today'
  if (diff === -1) return 'Yesterday'
  if (diff === 1) return 'Tomorrow'
  return formatDate(iso)
}

const fmtTime = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' })

// A saved-at timestamp in local time: "today at 3:42 pm", "yesterday at 9:05 am", "5 Oct 2026 at 3:42 pm".
export function formatStamp(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const time = fmtTime.format(d).toLowerCase()
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diff = Math.round((today - day) / 864e5)
  if (diff === 0) return `today at ${time}`
  if (diff === 1) return `yesterday at ${time}`
  return `${fmtDay.format(d)} at ${time}`
}

// "3 days overdue", "Due today", "Due in 5 days"
export function dueLabel(iso) {
  const diff = daysBetween(todayISO(), iso)
  if (diff < -1) return `${-diff} days overdue`
  if (diff === -1) return '1 day overdue'
  if (diff === 0) return 'Due today'
  if (diff === 1) return 'Due tomorrow'
  if (diff < 7) return `Due in ${diff} days`
  return `Due ${formatDate(iso)}`
}

export function periodLabel(iso, group) {
  if (group === 'month') return formatMonth(iso)
  if (group === 'week') return `${formatDate(iso, { short: true })} – ${formatDate(addDays(iso, 6), { short: true })}`
  return `${formatWeekday(iso)}, ${formatDate(iso)}`
}

/* People */

export function displayPhone(phone) {
  if (!phone) return ''
  const m = phone.match(/^\+91(\d{5})(\d{5})$/)
  return m ? `+91 ${m[1]} ${m[2]}` : phone
}

export function telLink(phone) {
  return `tel:${phone}`
}

export function whatsappLink(phone, message) {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export function reminderMessage({ name, type, amount, dueDate }) {
  const greeting = `Namaste ${name},`
  const amountText = amount ? ` of ${money(amount)}` : ''
  const when = dueDate ? ` due on ${formatFullDate(dueDate)}` : ''
  const body =
    type === 'out'
      ? `This is to let you know that ${amountText ? `${money(amount)} of yours is` : 'your money is'} with us and ready${when ? ` by ${formatFullDate(dueDate)}` : ''}. Please collect it or tell us where to send it.`
      : `This is a friendly reminder about the payment${amountText}${when}. Please let us know once it's done.`
  return `${greeting}\n${body}\n\nManish Associates`
}

export const MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank', label: 'Bank transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'card', label: 'Card' },
  { value: 'other', label: 'Other' },
]

// A person's running balance in words. Negative: they owe you. Positive: you hold their money.
export function balanceText(balance, name) {
  if (!balance) return 'All settled'
  return balance < 0 ? `${name} owes you ${money(-balance)}` : `You owe ${name} ${money(balance)}`
}

export const modeLabel = (value) => MODES.find((m) => m.value === value)?.label ?? value

export function downloadCsv(filename, header, rows) {
  const cell = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`
  const csv = [header, ...rows].map((r) => r.map(cell).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
