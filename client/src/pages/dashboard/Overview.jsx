import { useId, useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  BarChart3,
  Check,
  CircleCheck,
  CornerDownLeft,
  HandCoins,
  MessageCircle,
  ReceiptText,
  Scale,
  SlidersHorizontal,
  Tag,
  TriangleAlert,
  UserPlus,
  Users,
  Wallet,
  Zap,
} from 'lucide-react'
import { useDaybook, useLabels, useOverview, useSave, useSeries, useSettings } from '../../lib/queries.js'
import { useUI } from '../../dashboard/ui.jsx'
import { commissionRule } from '../../lib/commission.js'
import { receiptLink } from '../../lib/receipt.js'
import { Badge, Card, CardLink } from '../../dashboard/tw.jsx'
import CashFlowChart from '../../dashboard/CashFlowChart.jsx'
import ContactPicker from '../../dashboard/ContactPicker.jsx'
import LabelPicker, { LabelChip } from '../../dashboard/LabelPicker.jsx'
import { Avatar, EmptyState, Hero, Segmented } from '../../dashboard/bits.jsx'
import {
  addDays,
  addMonths,
  daysBetween,
  dueLabel,
  formatLongDate,
  modeLabel,
  money,
  relativeDay,
  reminderMessage,
  rupeesInput,
  startOfMonth,
  toPaise,
  todayISO,
  whatsappLink,
} from '../../lib/format.js'

/* ---------- Helpers ---------- */

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

// Compares this month so far with the same days last month.
function vsLastMonth(now, before, hasBefore) {
  if (!hasBefore) return { text: 'No data for last month', dir: 0 }
  const diff = now - before
  if (diff === 0) return { text: 'Same as last month', dir: 0 }
  return { text: `${diff > 0 ? '+' : '−'}${money(Math.abs(diff))}`, suffix: ' vs last month', dir: diff > 0 ? 1 : -1 }
}

/* Reminder line, also used on a person's page (legacy classes) */

export function ReminderItem({ reminder, onDone, compact }) {
  const overdue = reminder.due_date < todayISO()
  const isToday = daysBetween(todayISO(), reminder.due_date) === 0
  const amount = reminder.amount || reminder.tx_remaining
  return (
    <li className={`reminder-item ${overdue ? 'reminder-item--overdue' : isToday ? 'reminder-item--today' : ''}`}>
      <div className="reminder-item__main">
        <p className="reminder-item__title">{reminder.title}</p>
        <p className="reminder-item__meta">
          <span className={overdue ? 'due due--overdue' : isToday ? 'due due--today' : 'due'}>{dueLabel(reminder.due_date)}</span>
          {amount ? <span className="reminder-item__amount">{money(amount)}</span> : null}
        </p>
      </div>
      <div className="reminder-item__actions">
        {reminder.contact_phone && (
          <a
            className="icon-button"
            href={whatsappLink(
              reminder.contact_phone,
              reminderMessage({ name: reminder.contact_name, type: reminder.tx_type ?? 'in', amount, dueDate: reminder.due_date }),
            )}
            target="_blank"
            rel="noreferrer"
            aria-label={`Send WhatsApp reminder to ${reminder.contact_name}`}
            title="Send on WhatsApp"
          >
            <MessageCircle size={16} />
          </a>
        )}
        <button
          type="button"
          className="icon-button"
          onClick={() => onDone(reminder)}
          aria-label={`Mark “${reminder.title}” as done`}
          title="Mark as done"
        >
          <Check size={16} />
        </button>
      </div>
      {!compact && reminder.note && <p className="reminder-item__note">{reminder.note}</p>}
    </li>
  )
}

/* ---------- Quick add (vertical) ---------- */

function QuickAdd() {
  const ui = useUI()
  const save = useSave()
  const ids = { amount: useId(), person: useId(), to: useId(), label: useId() }
  const { data: labels = [] } = useLabels()
  const { data: settings } = useSettings()
  const services = labels.filter((l) => l.flow).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  const [pick, setPick] = useState(null) // a service id, 'in' or 'out'
  const [amount, setAmount] = useState('')
  const [contact, setContact] = useState(null)
  const [to, setTo] = useState(null)
  const [toName, setToName] = useState('')
  const [label, setLabel] = useState(null)
  const [error, setError] = useState('')

  const kind = pick ?? services[0]?.id ?? 'in'
  const service = services.find((l) => l.id === kind) ?? null
  const isWithdrawal = service?.flow === 'withdrawal'
  const main = toPaise(amount)
  const rule = commissionRule(main, settings, service?.commission_percent ?? null)
  const rate = rule.percent
  const fee = service ? rule.fee : 0
  // Withdrawal: they pay X, you give X − fee. Transfer: you send X, they give X + fee.
  const other = service ? (isWithdrawal ? Math.max(0, main - fee) : main + fee) : 0

  function reset() {
    setAmount('')
    setContact(null)
    setTo(null)
    setToName('')
    setLabel(null)
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (main <= 0) return setError('Enter an amount first.')
    let body
    if (service) {
      if (!isWithdrawal && !to && !toName.trim()) return setError('Type who the money goes to.')
      body = {
        type: 'transfer',
        label_id: service.id,
        contact_id: contact?.id ?? null,
        payee: isWithdrawal ? 'self' : 'other',
        received: rupeesInput(isWithdrawal ? main : other),
        amount: rupeesInput(isWithdrawal ? other : main),
        commission: rupeesInput(fee) || '0',
        commission_rate: rate,
        mode: service.received_mode ?? (isWithdrawal ? 'upi' : 'cash'),
        paid_mode: service.paid_mode ?? (isWithdrawal ? 'cash' : 'bank'),
        to_contact_id: to?.id ?? null,
        to_name: to ? '' : toName,
        date: todayISO(),
      }
    } else {
      body = { type: kind, amount, date: todayISO(), mode: 'cash', contact_id: contact?.id ?? null, label_id: label?.id ?? null }
    }
    try {
      const saved = await save.mutateAsync({ path: '/transactions', body })
      ui.toast(
        service ? `${service.name} saved · you keep ${money(fee)}` : `${kind === 'in' ? 'Money in' : 'Money out'} of ${money(main)} saved`,
        'done',
        [
          {
            label: 'Undo',
            onClick: async () => {
              await save.mutateAsync({ path: `/transactions/${saved.id}`, method: 'DELETE' })
              ui.toast('Entry removed')
            },
          },
          { label: 'Receipt', onClick: () => window.open(receiptLink(saved, null, contact?.phone), '_blank', 'noopener') },
        ],
      )
      reset()
    } catch (err) {
      setError(err.message)
    }
  }

  const options = [
    ...services.map((l) => ({ key: l.id, label: l.name, Icon: ArrowLeftRight, tone: 'text-brand' })),
    { key: 'in', label: 'Money in', Icon: ArrowDownLeft, tone: 'text-in' },
    { key: 'out', label: 'Money out', Icon: ArrowUpRight, tone: 'text-out' },
  ]
  const accent = service ? 'bg-brand' : kind === 'in' ? 'bg-in' : 'bg-out'

  return (
    <form className="flex flex-col gap-3" onSubmit={submit} aria-label="Quick add an entry">
      <div role="radiogroup" aria-label="What happened" className="flex flex-wrap gap-1.5">
        {options.map(({ key, label: text, Icon, tone }) => {
          const on = kind === key
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => {
                setPick(key)
                setError('')
              }}
              className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition-colors ${
                on ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-ink-2 hover:border-brand/40'
              }`}
            >
              <Icon size={13} className={on ? 'text-white' : tone} aria-hidden="true" /> {text}
            </button>
          )
        })}
      </div>

      <div className="rounded-xl border border-line bg-surface-2 px-3.5 pt-2.5 pb-3">
        <label htmlFor={ids.amount} className="text-xs font-bold text-ink-3">
          {service ? (isWithdrawal ? 'Customer pays you' : 'Amount to send') : 'Amount'}
        </label>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-ink-3" aria-hidden="true">
            ₹
          </span>
          <input
            id={ids.amount}
            className="w-full min-w-0 border-0 bg-transparent p-0 text-[28px] leading-tight font-extrabold tracking-tight text-ink tabular-nums outline-none placeholder:text-ink-3/40"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
          />
        </div>
        {service && (
          <p className="m-0 mt-2 flex items-center justify-between gap-2 border-t border-line-soft pt-2 text-xs" aria-live="polite">
            <span className="text-ink-3">
              Commission <strong className="font-extrabold text-ok tabular-nums">{money(fee)}</strong> ({rate}%)
            </span>
            <span className="text-ink-3">
              {isWithdrawal ? 'Give' : 'Collect'} <strong className="text-sm font-extrabold text-ink tabular-nums">{money(other)}</strong>
            </span>
          </p>
        )}
      </div>

      <div>
        <label htmlFor={ids.person} className="mb-1 block text-xs font-bold text-ink-3">
          {service ? 'Customer' : kind === 'in' ? 'Received from' : 'Paid to'} <span className="font-semibold">(optional)</span>
        </label>
        <ContactPicker
          id={ids.person}
          value={contact}
          onChange={setContact}
          placeholder={service ? 'Walk-in, or search' : 'Search by name or phone'}
        />
      </div>

      {service && !isWithdrawal && (
        <div>
          <label htmlFor={ids.to} className="mb-1 block text-xs font-bold text-ink-3">
            Send to
          </label>
          <ContactPicker
            id={ids.to}
            value={to}
            onChange={setTo}
            onText={setToName}
            text={toName}
            placeholder="Type a name or pick a saved person"
          />
        </div>
      )}

      {!service && (
        <div>
          <label htmlFor={ids.label} className="mb-1 block text-xs font-bold text-ink-3">
            Label <span className="font-semibold">(optional)</span>
          </label>
          <LabelPicker id={ids.label} value={label} onChange={setLabel} />
        </div>
      )}

      {error && (
        <p className="field-error m-0" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={save.isPending}
        className={`inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-0 text-[15px] font-bold text-white transition hover:brightness-110 disabled:opacity-60 ${accent}`}
      >
        <CornerDownLeft size={16} aria-hidden="true" /> Save{' '}
        {service ? service.name.toLowerCase() : kind === 'in' ? 'money in' : 'money out'}
      </button>
      <p className="m-0 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-3">
        <span>
          Today
          {service
            ? ` · ${modeLabel(service.received_mode ?? (isWithdrawal ? 'upi' : 'cash'))} in, ${modeLabel(service.paid_mode ?? (isWithdrawal ? 'cash' : 'bank'))} out`
            : ' · cash'}
        </span>
        <button
          type="button"
          onClick={() => ui.newEntry(service ? { service, contact } : { type: kind, contact, label })}
          className="inline-flex min-h-7 cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-xs font-bold text-brand-text hover:underline"
        >
          <SlidersHorizontal size={13} aria-hidden="true" /> More options
        </button>
      </p>
    </form>
  )
}

/* ---------- Cash flow ---------- */

const RANGES = {
  '7d': { label: '7D', title: 'Last 7 days', group: 'day', from: (t) => addDays(t, -6) },
  '30d': { label: '30D', title: 'Last 30 days', group: 'day', from: (t) => addDays(t, -29) },
  '90d': { label: '90D', title: 'Last 90 days, by week', group: 'week', from: (t) => addDays(t, -89) },
  '12m': { label: '12M', title: 'Last 12 months', group: 'month', from: (t) => startOfMonth(addMonths(t, -11)) },
}

function CashFlowCard({ className = '' }) {
  const [range, setRange] = useState('30d')
  const today = todayISO()
  const r = RANGES[range]
  const { data } = useSeries({ group: r.group, from: r.from(today), to: today })
  return (
    <Card
      className={className}
      id="ov-cash"
      icon={<BarChart3 size={18} />}
      tone="brand"
      title="Cash flow"
      aside={
        <Segmented
          label="Range"
          size="sm"
          value={range}
          onChange={setRange}
          options={Object.entries(RANGES).map(([value, x]) => ({ value, label: x.label }))}
        />
      }
    >
      <p className="m-0 mb-3 text-sm text-ink-3">{r.title}</p>
      {data ? <CashFlowChart rows={data.rows} group={r.group} height={230} /> : <div className="chart__empty">Loading…</div>}
    </Card>
  )
}

/* ---------- Recent activity ---------- */

function RecentTable({ items, onOpen }) {
  return (
    <ul className="m-0 list-none p-0">
      {items.map((e) => {
        const title = e.contact_name ?? e.label_name ?? (e.type === 'in' ? 'Money in' : e.type === 'out' ? 'Money out' : 'Balance')
        const Mark = e.type === 'transfer' ? ArrowLeftRight : e.type === 'adjust' ? Scale : e.type === 'in' ? ArrowDownLeft : ArrowUpRight
        const markCls =
          e.type === 'transfer'
            ? 'bg-brand-soft text-brand'
            : e.type === 'adjust'
              ? 'bg-attn-soft text-attn'
              : e.type === 'in'
                ? 'bg-in-soft text-in'
                : 'bg-out-soft text-out'
        return (
          <li key={e.id} className="border-b border-line-soft last:border-b-0">
            <button
              type="button"
              onClick={() => onOpen(e.id)}
              className="flex w-full cursor-pointer items-center gap-3 border-0 bg-transparent px-4 py-3 text-left transition-colors hover:bg-surface-2 sm:px-5"
            >
              <span className={`grid size-9 shrink-0 place-items-center rounded-full ${markCls}`} aria-hidden="true">
                <Mark size={16} strokeWidth={2.4} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-[15px] font-bold text-ink">{title}</span>
                <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-3">
                  <span className="font-semibold">{relativeDay(e.date)}</span>
                  {e.label_name && e.contact_name && <LabelChip name={e.label_name} color={e.label_color} />}
                  {e.type === 'transfer' && e.commission > 0 && (
                    <span className="font-semibold text-ok">{money(e.commission)} commission</span>
                  )}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end tabular-nums">
                {e.cash_in > 0 && <span className="text-[15px] font-extrabold whitespace-nowrap text-in">+{money(e.cash_in)}</span>}
                {e.cash_out > 0 && (
                  <span className={`font-extrabold whitespace-nowrap text-out ${e.cash_in ? 'text-[13px]' : 'text-[15px]'}`}>
                    −{money(e.cash_out)}
                  </span>
                )}
                {e.type === 'adjust' && <span className="text-[15px] font-extrabold whitespace-nowrap text-attn">{money(e.amount)}</span>}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function MonthSplit({ month }) {
  const total = month.in_amount + month.out_amount
  if (!total) return null
  return (
    <div className="border-b border-line-soft px-4 pt-4 pb-3.5 sm:px-5">
      <div className="flex h-2.5 gap-[3px] overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
        {month.in_amount > 0 && <span className="bg-in" style={{ flexGrow: month.in_amount }} />}
        {month.out_amount > 0 && <span className="bg-out" style={{ flexGrow: month.out_amount }} />}
      </div>
      <p className="m-0 mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-ink-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-in" aria-hidden="true" />
          {money(month.in_amount)} in
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-out" aria-hidden="true" />
          {money(month.out_amount)} out
        </span>
        <span className="text-ink-3">this month</span>
      </p>
    </div>
  )
}

/* ---------- Side cards ---------- */

// Today's money by payment mode, with a link to count the cash.
function TodayByMode({ className = '' }) {
  const { data } = useDaybook({ date: todayISO() })
  const modes = data?.modes ?? []
  return (
    <Card
      className={className}
      id="ov-modes"
      icon={<Wallet size={18} />}
      tone="brand"
      title="Today by payment mode"
      aside={<CardLink to="/dashboard/daybook">Day book</CardLink>}
    >
      {modes.length === 0 ? (
        <p className="m-0 text-sm text-ink-3">Nothing has moved yet today.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {modes.map((m) => {
            const net = m.in_amount - m.out_amount
            return (
              <li key={m.mode} className="flex items-center justify-between gap-3 text-sm">
                <span className="font-bold text-ink">{modeLabel(m.mode)}</span>
                <span className="flex flex-col items-end leading-tight">
                  <span className={`font-extrabold tabular-nums ${net >= 0 ? 'text-ink' : 'text-out'}`}>{money(net, { sign: true })}</span>
                  <span className="text-[11px] text-ink-3 tabular-nums">
                    in {money(m.in_amount)} · out {money(m.out_amount)}
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      )}
      {data?.close?.counted_cash != null ? (
        <p className="m-0 mt-3 rounded-lg bg-ok-soft px-3 py-2 text-xs font-bold text-ok">Cash counted for today</p>
      ) : (
        <CardLink to="/dashboard/daybook" className="mt-3">
          Count the cash
        </CardLink>
      )}
    </Card>
  )
}

function Outstanding({ pending, className = '' }) {
  const rows = [
    { label: 'Owed to you', value: pending.in_amount, people: pending.in_people, word: 'by', highlight: true },
    { label: 'You hold for others', value: pending.out_amount, people: pending.out_people, word: 'for', highlight: false },
  ]
  return (
    <Card className={className} id="ov-owed" icon={<HandCoins size={18} />} tone="attn" title="Outstanding">
      <dl className="m-0 divide-y divide-line-soft">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-3 py-2.5 first:pt-0">
            <dt className="text-sm font-semibold text-ink-2">{r.label}</dt>
            <dd className="m-0 flex flex-col items-end">
              <span className={`text-2xl font-extrabold tracking-tight tabular-nums ${r.highlight ? 'text-attn' : 'text-ink'}`}>
                {money(r.value)}
              </span>
              <span className="text-xs text-ink-3">
                {r.people ? `${r.word} ${r.people} ${r.people === 1 ? 'person' : 'people'}` : 'nobody'}
              </span>
            </dd>
          </div>
        ))}
      </dl>
      <CardLink to="/dashboard/balances" className="mt-3">
        View balances
      </CardLink>
    </Card>
  )
}

function LargestBalances({ people, className = '' }) {
  const biggest = Math.max(...people.map((x) => Math.max(x.pending_in, x.pending_out)), 1)
  return (
    <Card className={className} id="ov-balances" icon={<Users size={18} />} title="Largest balances">
      {people.length === 0 ? (
        <p className="m-0 text-sm text-ink-2">
          Nobody owes you and you hold nobody’s money. Balances show up here when amounts don’t match.
        </p>
      ) : (
        <ul className="m-0 list-none divide-y divide-line-soft p-0">
          {people.map((p) => {
            const value = Math.max(p.pending_in, p.pending_out)
            const owesYou = p.pending_in >= p.pending_out
            return (
              <li key={p.id}>
                <Link to={`/dashboard/people/${p.id}`} className="group flex items-center gap-3 py-2.5 text-ink no-underline">
                  <Avatar name={p.name} size="sm" />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate font-semibold group-hover:underline">{p.name}</span>
                      <span className="font-extrabold tabular-nums">{money(value)}</span>
                    </span>
                    <span className="block h-[5px] overflow-hidden rounded bg-surface-3" aria-hidden="true">
                      <span
                        className={`block h-full rounded ${owesYou ? 'bg-mark' : 'bg-ink-3'}`}
                        style={{ width: `${Math.max(4, (value / biggest) * 100)}%` }}
                      />
                    </span>
                    <span className="text-xs text-ink-3">{owesYou ? 'Owes you' : 'You owe'}</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

function GetStarted({ ui, className = '' }) {
  const steps = [
    {
      icon: <ArrowDownLeft size={20} />,
      title: 'Add your first entry',
      body: 'Use Quick add on the right, or press N from anywhere.',
      action: () => ui.newEntry(),
      label: 'New entry',
    },
    {
      icon: <UserPlus size={20} />,
      title: 'Add the people you deal with',
      body: 'Save names and phone numbers to track who owes what.',
      action: () => ui.newPerson(),
      label: 'Add person',
    },
    {
      icon: <Tag size={20} />,
      title: 'Create a few labels',
      body: 'Group entries like Rent, Fees or Salary to see where money goes.',
      action: () => ui.newLabel(),
      label: 'New label',
    },
  ]
  return (
    <Card className={className} id="ov-start" icon={<CircleCheck size={18} />} tone="brand" title="Get started">
      <ol className="m-0 list-none divide-y divide-line-soft p-0">
        {steps.map((step) => (
          <li key={step.title} className="flex items-center gap-3.5 py-3 first:pt-0 last:pb-0">
            <span
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-brand-soft text-brand"
              aria-hidden="true"
            >
              {step.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="m-0 font-bold text-ink">{step.title}</p>
              <p className="m-0 text-sm text-ink-3">{step.body}</p>
            </div>
            <button type="button" className="btn btn--sm" onClick={step.action}>
              {step.label}
            </button>
          </li>
        ))}
      </ol>
    </Card>
  )
}

/* ---------- Page ---------- */

function Overview() {
  const { user } = useOutletContext()
  const ui = useUI()
  const save = useSave()
  const { data, isLoading, error } = useOverview()
  const { data: labels = [] } = useLabels()
  const services = labels.filter((l) => l.flow)

  async function markDone(reminder) {
    await save.mutateAsync({ path: `/reminders/${reminder.id}/done` })
    ui.toast('Reminder done')
  }

  const name = user.username.charAt(0).toUpperCase() + user.username.slice(1)
  const isNew = useMemo(
    () =>
      data &&
      data.allTime.in_amount + data.allTime.out_amount === 0 &&
      data.pending.in_amount + data.pending.out_amount === 0 &&
      data.recent.length === 0,
    [data],
  )
  const attention = data ? data.reminders.overdue + data.reminders.today : 0
  // Quick actions: the two most used services (the rest are one tap away in New entry), then money in and out.
  const actions = [
    ...[...services]
      .sort((a, b) => b.count - a.count)
      .slice(0, 2)
      .map((l, i) => ({
        key: l.id,
        label: l.name,
        Icon: ArrowLeftRight,
        tint: i === 0 ? 'primary' : 'service',
        open: () => ui.newEntry({ service: l }),
      })),
    { key: 'in', label: 'Money in', Icon: ArrowDownLeft, tint: 'in', open: () => ui.newEntry({ type: 'in' }) },
    { key: 'out', label: 'Money out', Icon: ArrowUpRight, tint: 'out', open: () => ui.newEntry({ type: 'out' }) },
  ]
  const month = data?.month
  const prev = data?.previousMonthToDate

  return (
    <div className="page">
      <Hero
        eyebrow={formatLongDate()}
        title={`${greeting()}, ${name}`}
        subtitle={
          data &&
          !isNew &&
          (attention > 0 || data.pending.in_amount > 0) && (
            <div className="hero-pills">
              {attention > 0 && (
                <Link to="/dashboard/reminders" className="hero-pill">
                  <span className="hero-pill__dot hero-pill__dot--due" aria-hidden="true" />
                  {attention} {attention === 1 ? 'reminder' : 'reminders'} due
                </Link>
              )}
              {data.pending.in_amount > 0 && (
                <Link to="/dashboard/balances" className="hero-pill">
                  <span className="hero-pill__dot hero-pill__dot--receive" aria-hidden="true" />
                  {money(data.pending.in_amount)} to collect
                </Link>
              )}
              <Link to="/dashboard/entries?range=month" className="hero-pill max-sm:hidden">
                <span className="hero-pill__dot" aria-hidden="true" />
                {month.count} {month.count === 1 ? 'entry' : 'entries'} this month
              </Link>
            </div>
          )
        }
        actions={
          <div className="flex flex-wrap gap-2 max-sm:hidden" role="group" aria-label="New entry">
            {actions.map(({ key, label, Icon, tint, open }) => (
              <button key={key} type="button" onClick={open} className="hero-action">
                <span className={`hero-action__icon hero-action__icon--${tint}`} aria-hidden="true">
                  <Icon size={16} strokeWidth={2.3} />
                </span>
                {label}
              </button>
            ))}
          </div>
        }
        stats={
          data && !isNew
            ? [
                {
                  label: 'Commission this month',
                  featured: true,
                  value: money(month.commission ?? 0),
                  hint: vsLastMonth(month.commission ?? 0, prev.commission ?? 0, prev.count > 0),
                },
                {
                  label: 'Money in',
                  tone: 'in',
                  value: money(month.in_amount),
                  hint: vsLastMonth(month.in_amount, prev.in_amount, prev.count > 0),
                },
                {
                  label: 'Money out',
                  tone: 'out',
                  good: -1,
                  value: money(month.out_amount),
                  hint: vsLastMonth(month.out_amount, prev.out_amount, prev.count > 0),
                },
                {
                  label: 'Owed to you',
                  tone: 'attn',
                  to: '/dashboard/balances',
                  value: money(data.pending.in_amount),
                  hint: data.pending.in_people
                    ? `from ${data.pending.in_people} ${data.pending.in_people === 1 ? 'person' : 'people'}`
                    : 'Nobody owes you',
                },
              ]
            : null
        }
      >
        {/* Phones: quick actions as a dock of four */}
        <div className="ov-dock" role="group" aria-label="New entry">
          {actions.map(({ key, label, Icon, tint, open }) => (
            <button key={key} type="button" onClick={open} className="ov-dock__item">
              <span className={`ov-dock__icon hero-action__icon--${tint}`} aria-hidden="true">
                <Icon size={19} strokeWidth={2.2} />
              </span>
              <span className="ov-dock__label">{label}</span>
            </button>
          ))}
        </div>
      </Hero>

      {error && (
        <p className="field-error" role="alert">
          {error.message}
        </p>
      )}
      {isLoading && <p className="loading">Loading the overview…</p>}

      {data && (
        <>
          <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)] lg:items-start">
            <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-5">
              {isNew && <GetStarted ui={ui} className="order-first lg:order-none" />}

              <Card
                className="order-2 lg:order-none"
                id="ov-attention"
                icon={<TriangleAlert size={18} />}
                tone={attention ? 'danger' : 'neutral'}
                title="Needs your attention"
                aside={attention ? <Badge tone="danger">{attention} due</Badge> : <Badge tone="ok">All clear</Badge>}
              >
                {data.reminders.items.length === 0 ? (
                  <div className="flex flex-col items-center gap-1.5 px-4 py-9 text-center text-ink-3">
                    <CircleCheck size={26} aria-hidden="true" />
                    <p className="m-0 mt-1.5 text-lg font-bold text-ink">Nothing needs you right now</p>
                    <p className="m-0 text-sm">No payments are overdue or due this week.</p>
                  </div>
                ) : (
                  <>
                    <ul className="reminder-list">
                      {data.reminders.items.slice(0, 5).map((r) => (
                        <ReminderItem key={r.id} reminder={r} onDone={markDone} compact />
                      ))}
                    </ul>
                    <CardLink to="/dashboard/reminders" className="mt-3.5">
                      All reminders
                    </CardLink>
                  </>
                )}
              </Card>

              {!isNew && <CashFlowCard className="order-4 lg:order-none" />}

              <Card
                className="order-5 lg:order-none"
                id="ov-recent"
                icon={<ReceiptText size={18} />}
                title="Recent activity"
                flush
                aside={<CardLink to="/dashboard/entries">All entries</CardLink>}
              >
                {data.recent.length === 0 ? (
                  <EmptyState icon={<ReceiptText size={22} />} title="No entries yet">
                    Use Quick add to record your first one.
                  </EmptyState>
                ) : (
                  <>
                    <MonthSplit month={month} />
                    <RecentTable items={data.recent} onOpen={ui.viewEntry} />
                  </>
                )}
              </Card>
            </div>

            <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-5">
              <Card className="order-1 lg:order-none" id="ov-quick" icon={<Zap size={18} />} tone="brand" title="Quick add">
                <QuickAdd />
              </Card>
              <TodayByMode className="order-3 lg:order-none" />
              <Outstanding className="order-3 lg:order-none" pending={data.pending} />
              <LargestBalances className="order-6 lg:order-none" people={data.topOwed} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Overview
