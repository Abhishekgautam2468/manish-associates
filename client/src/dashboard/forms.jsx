import { useEffect, useId, useRef, useState } from 'react'
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, ChevronDown, Ellipsis, Hourglass, Scale, X } from 'lucide-react'
import ContactPicker from './ContactPicker.jsx'
import LabelPicker, { LabelDot } from './LabelPicker.jsx'
import { FieldError, Segmented } from './bits.jsx'
import { qs, useContact, useLabels, useReceivers, useSave, useSettings } from '../lib/queries.js'
import { MODES, addDays, balanceText, formatDate, formatStamp, modeLabel, money, rupeesInput, toPaise, todayISO } from '../lib/format.js'
import { commissionRule } from '../lib/commission.js'
import { receiptLink } from '../lib/receipt.js'
import { api } from '../api.js'

function useFormState(initial) {
  const [values, setValues] = useState(initial)
  const set = (key) => (eventOrValue) =>
    setValues((v) => ({ ...v, [key]: eventOrValue?.target ? eventOrValue.target.value : eventOrValue }))
  return [values, set, setValues]
}

function DateChips({ base, onPick, options = [7, 15, 30] }) {
  return (
    <div className="chips" aria-label="Quick dates">
      {options.map((days) => (
        <button key={days} type="button" className="chip" onClick={() => onPick(addDays(base, days))}>
          {days === 1 ? 'Tomorrow' : `In ${days} days`}
        </button>
      ))}
    </div>
  )
}

function FormFooter({ onCancel, saving, label, savingLabel = 'Saving…', extra }) {
  return (
    <footer className="modal__foot">
      {extra}
      <span className="modal__foot-spacer" />
      <button type="button" className="btn btn--ghost" onClick={onCancel}>
        Cancel
      </button>
      <button type="submit" className="btn btn--primary" disabled={saving}>
        {saving ? savingLabel : label}
      </button>
    </footer>
  )
}

/* New or edited entry */

function ModeSelect({ id, value, onChange, compact }) {
  return (
    <select
      id={id}
      className={`field ${compact ? 'h-10 min-h-10 w-full py-0 text-sm' : ''}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={compact ? 'How' : undefined}
    >
      {MODES.map((m) => (
        <option key={m.value} value={m.value}>
          {m.label}
        </option>
      ))}
    </select>
  )
}

// How money moved, as one small pill with a menu ("UPI ⌄").
function ModePill({ value, onChange, label, small }) {
  return (
    <span className="relative inline-flex">
      <select
        aria-label={label}
        style={{ backgroundImage: 'none', fieldSizing: 'content' }}
        className={`m-0 min-h-0 w-auto cursor-pointer appearance-none rounded-full border border-line bg-surface py-0 pr-6 pl-2.5 font-bold text-ink-2 shadow-none outline-none hover:border-brand/50 focus-visible:border-brand ${
          small ? 'h-6 text-[11px]' : 'h-7 text-xs'
        }`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {MODES.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
      <ChevronDown size={12} className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-ink-3" aria-hidden="true" />
    </span>
  )
}

// The commission percent, small and editable, next to its label.
function RateInput({ value, onChange }) {
  return (
    <label className="inline-flex h-8 cursor-text items-center rounded-md border border-line bg-surface-2 pr-1.5 text-xs font-bold text-ink-2 focus-within:border-brand">
      <input
        className="h-full w-9 border-0 bg-transparent p-0 text-right tabular-nums outline-none"
        inputMode="decimal"
        aria-label="Commission percent"
        value={value}
        onChange={onChange}
      />
      %
    </label>
  )
}

// The request body that saves an entry exactly as it is now (used to undo an edit).
function bodyFromEntry(e) {
  const r = (p) => (p ? rupeesInput(p) : '0')
  if (e.type === 'transfer') {
    return {
      type: 'transfer',
      label_id: e.label_id,
      contact_id: e.contact_id,
      payee: e.payee,
      received: r(e.received),
      amount: r(e.amount),
      commission: r(e.commission),
      commission_rate: e.commission_rate != null ? e.commission_rate / 100 : undefined,
      to_contact_id: e.to_contact_id,
      to_name: e.to_contact_id || e.payee === 'self' ? '' : (e.to_name ?? ''),
      to_account: e.to_account ?? '',
      mode: e.mode,
      paid_mode: e.paid_mode,
      date: e.date,
      note: e.note,
    }
  }
  if (e.type === 'adjust')
    return { type: 'adjust', contact_id: e.contact_id, direction: e.direction, amount: r(e.amount), date: e.date, note: e.note }
  return {
    type: e.type,
    amount: r(e.amount),
    contact_id: e.contact_id,
    account: e.account,
    mode: e.mode,
    label_id: e.label_id,
    date: e.date,
    note: e.note,
  }
}

const rupees = (paise) => (paise ? rupeesInput(paise) : '')

/*
 * One form for every kind of entry:
 *   a service (a label with rules, e.g. Cash withdrawal or Money transfer),
 *   plain Money in / Money out, or a Balance (opening or corrected amount, no cash).
 * For services the commission and the linked amount fill in automatically and stay editable.
 */
// The plain entries under "Other".
const PLAIN_KINDS = [
  { kind: 'in', label: 'Money in', Icon: ArrowDownLeft, tone: 'text-in' },
  { kind: 'out', label: 'Money out', Icon: ArrowUpRight, tone: 'text-out' },
  { kind: 'adjust', label: 'Balance', Icon: Scale, tone: 'text-attn' },
]

// A sideways-scrolling strip that fades at an edge when there is more to see.
function ScrollStrip({ active, children }) {
  const ref = useRef(null)
  const [edges, setEdges] = useState({ left: false, right: false })
  useEffect(() => {
    const el = ref.current
    const measure = () => setEdges({ left: el.scrollLeft > 2, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 })
    measure()
    const ro = new ResizeObserver(measure)
    // The row and its contents: services can arrive after the window opens.
    ro.observe(el)
    if (el.firstElementChild) ro.observe(el.firstElementChild)
    el.addEventListener('scroll', measure, { passive: true })
    return () => {
      ro.disconnect()
      el.removeEventListener('scroll', measure)
    }
  }, [])
  // Keep the selected tab in view, e.g. "Other" at the far end.
  useEffect(() => {
    const el = ref.current
    const tab = el.querySelector('[aria-selected="true"]')
    if (!tab) return
    const left = tab.offsetLeft
    if (left < el.scrollLeft || left + tab.offsetWidth > el.scrollLeft + el.clientWidth)
      el.scrollTo({ left: left - 24, behavior: 'smooth' })
  }, [active])
  const fade = `linear-gradient(to right, ${edges.left ? 'transparent, black 2rem' : 'black'}, ${edges.right ? 'black calc(100% - 2.5rem), transparent' : 'black'})`
  return (
    <div className="-mx-1">
      <div
        ref={ref}
        className="relative flex items-center overflow-x-auto px-1 py-0.5 [scrollbar-width:none]"
        style={{ maskImage: fade, WebkitMaskImage: fade }}
      >
        {children}
      </div>
    </div>
  )
}

export function EntryForm({ entry, defaults = {}, onDone, onCancel, toast, titleId }) {
  const ids = {
    amount: useId(),
    pending: useId(),
    remind: useId(),
    received: useId(),
    paid: useId(),
    commission: useId(),
    date: useId(),
    person: useId(),
    to: useId(),
    account: useId(),
    mode: useId(),
    paidMode: useId(),
    label: useId(),
    note: useId(),
  }
  const editing = Boolean(entry)
  const save = useSave()
  const [error, setError] = useState(null)
  const [dup, setDup] = useState(null) // a recent twin of the entry being saved
  const [dupOk, setDupOk] = useState(false)
  const formRef = useRef(null)
  const { data: labels = [] } = useLabels()
  const { data: settings } = useSettings()
  // Services, most used first.
  const services = labels.filter((l) => l.flow).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  const defaultRate = settings?.commission_percent ?? 1

  const initialKind = entry
    ? entry.type === 'transfer'
      ? 'service'
      : entry.type
    : defaults.type === 'adjust'
      ? 'adjust'
      : defaults.service
        ? 'service'
        : (defaults.type ?? 'in')
  const [v, set, setAll] = useFormState({
    kind: initialKind, // 'service' | 'in' | 'out' | 'adjust'
    serviceId: entry?.type === 'transfer' ? entry.label_id : (defaults.service?.id ?? null),
    // An existing transfer keeps its own payee; a new one follows the chosen service.
    payee: entry?.type === 'transfer' ? entry.payee : defaults.service?.flow === 'withdrawal' ? 'self' : 'other',
    amount: rupees(entry ? (entry.type !== 'transfer' ? entry.amount : 0) : defaults.amount),
    received: rupees(entry?.type === 'transfer' ? entry.received : 0),
    paid: rupees(entry?.type === 'transfer' ? entry.amount : 0),
    commission: rupees(entry?.commission),
    rate: entry?.commission_rate != null ? String(entry.commission_rate / 100) : '',
    date: entry?.date ?? todayISO(),
    contact: entry?.contact_id ? { id: entry.contact_id, name: entry.contact_name } : (defaults.contact ?? null),
    to: entry?.to_contact_id ? { id: entry.to_contact_id, name: entry.to_name } : null,
    toName: entry && !entry.to_contact_id && entry.payee !== 'self' ? (entry.to_name ?? '') : '',
    toAccount: entry?.to_account ?? '',
    mode: entry?.mode ?? 'cash',
    paidMode: entry?.paid_mode ?? 'cash',
    label:
      entry && entry.type !== 'transfer' && entry.label_id
        ? { id: entry.label_id, name: entry.label_name, color: entry.label_color }
        : (defaults.label ?? null),
    account: entry?.account ?? true,
    direction: entry?.direction ?? defaults.direction ?? 'owes_you',
    note: entry?.note ?? '',
    // Which linked amount the user typed last; the other one is worked out.
    // On when what came in and what went out don't match the commission (someone paid short or extra).
    // Pending: part of the money still to collect (transfer) or still to give (withdrawal).
    diff: Boolean(entry?.type === 'transfer' && entry.received - entry.amount - entry.commission !== 0),
    // What actually changed hands on the worked-out side; the rest stays in their balance.
    actual: entry?.type === 'transfer' ? rupees(entry.payee === 'self' ? entry.amount : entry.received) : '',
    remindOn: '',
    base: 'main',
    otherTyped: '',
    fromHeld: entry?.type === 'transfer' && !entry.received,
  })
  // Confirmed "save it again": submit once more. Any change to the entry clears the warning.
  useEffect(() => {
    if (dupOk) formRef.current?.requestSubmit()
  }, [dupOk])
  useEffect(() => {
    setDup(null)
    setDupOk(false)
  }, [v])
  const service = services.find((l) => l.id === v.serviceId) ?? null

  // A new entry with nothing chosen starts on the first service, the most common kind of entry.
  const startedOnService = useRef(false)
  useEffect(() => {
    if (editing || startedOnService.current || defaults.type || defaults.service || !services.length) return
    startedOnService.current = true
    chooseService(services[0])
  }, [services.length]) // eslint-disable-line react-hooks/exhaustive-deps
  const isWithdrawal = v.kind === 'service' && v.payee === 'self'
  // A % typed for this entry or the service's own % is fixed; otherwise the Settings slabs decide.
  const fixedPercent = v.rate !== '' ? Number(v.rate) : (service?.commission_percent ?? null)
  const ruleFor = (amount) => commissionRule(amount, settings, fixedPercent)
  const { data: person } = useContact(v.contact?.id)
  const { data: receivers = [] } = useReceivers(v.kind === 'service' && v.payee === 'other' ? v.contact?.id : null)

  // Pick a service: set its rules and work the amounts out again.
  function chooseService(l) {
    setAll((s) => ({
      ...s,
      kind: 'service',
      serviceId: l.id,
      payee: l.flow === 'withdrawal' ? 'self' : 'other',
      mode: l.received_mode ?? s.mode,
      paidMode: l.paid_mode ?? s.paidMode,
      rate: '',
      commission: '',
      diff: false,
      fromHeld: false,
      base: 'main',
      otherTyped: '',
    }))
  }

  // Linked amounts. Withdrawal: paid out = received − commission (commission on received).
  // Transfer: received = sent + commission (commission on sent).
  // One main amount; the other side is worked out unless "different amount" is on.
  //   Withdrawal: they pay X, commission on X, you give X − commission.
  //   Transfer:   you send X, commission on X, they give X + commission.
  // "From what you hold": money you already hold for the customer is given (withdrawal) or sent (transfer).
  // Nothing comes in, and by default there's no commission.
  const fromHeld = v.kind === 'service' && v.fromHeld
  // Which side is typed: 'main' (they pay / you send) or 'other' (cash they want / total they give).
  const byOther = !fromHeld && isWithdrawal && v.base === 'other'
  const typedOther = toPaise(v.otherTyped)
  const override = v.commission !== '' ? toPaise(v.commission) : null
  const { mainP, autoCommission } = (() => {
    if (fromHeld) return { mainP: 0, autoCommission: 0 }
    if (!byOther) {
      const m = toPaise(isWithdrawal ? v.received : v.paid)
      return { mainP: m, autoCommission: ruleFor(m).fee }
    }
    if (isWithdrawal) {
      // They want X in cash: commission on X, they pay X + commission.
      const auto = ruleFor(typedOther).fee
      return { mainP: typedOther + (override ?? auto), autoCommission: auto }
    }
    // They give X in total: send X ÷ (1 + rate), the rest is commission.
    const flat = fixedPercent ?? defaultRate
    const m = override != null ? typedOther - override : Math.round(typedOther / (1 + flat / 100) / 100) * 100
    return { mainP: Math.max(0, m), autoCommission: Math.max(0, typedOther - m) }
  })()
  const rule = ruleFor(byOther ? typedOther : mainP)
  const rate = rule.percent
  const commissionP = override ?? autoCommission
  const expectedOther = byOther ? typedOther : isWithdrawal ? Math.max(0, mainP - commissionP) : mainP + commissionP
  const otherP = v.diff ? toPaise(v.actual) : expectedOther
  const shownReceived = fromHeld ? 0 : isWithdrawal ? mainP : otherP
  const shownPaid = fromHeld ? toPaise(v.paid) : isWithdrawal ? otherP : mainP
  const effect = shownReceived - shownPaid - commissionP
  const pendingP = v.diff ? Math.abs(effect) : 0
  const before = person?.balance ?? 0
  const setTyped = (key) => (value) => setAll((st) => ({ ...st, [key]: value }))

  async function submit(e) {
    e.preventDefault()
    setError(null)
    let body
    if (v.kind === 'service') {
      if (!service && !editing) return setError({ message: 'Choose a service first.' })
      body = {
        type: 'transfer',
        label_id: v.serviceId,
        contact_id: v.contact?.id ?? null,
        payee: v.payee,
        received: rupeesInput(shownReceived),
        amount: rupeesInput(shownPaid),
        commission: rupeesInput(commissionP) || '0',
        commission_rate: rate,
        to_contact_id: v.payee === 'other' ? (v.to?.id ?? null) : null,
        to_name: v.payee === 'other' && !v.to ? v.toName : '',
        to_account: v.payee === 'other' ? v.toAccount : '',
        mode: v.mode,
        paid_mode: v.paidMode,
        date: v.date,
        note: v.note,
      }
    } else if (v.kind === 'adjust') {
      body = { type: 'adjust', contact_id: v.contact?.id ?? null, direction: v.direction, amount: v.amount, date: v.date, note: v.note }
    } else {
      body = {
        type: v.kind,
        amount: v.amount,
        contact_id: v.contact?.id ?? null,
        account: v.contact ? v.account : true,
        mode: v.mode,
        label_id: v.label?.id ?? null,
        date: v.date,
        note: v.note,
      }
    }
    // A new entry that looks just like one saved in the last 10 minutes: ask before saving it twice.
    if (!editing && !dupOk) {
      const main = toPaise(body.type === 'transfer' ? (body.received && body.payee === 'self' ? body.received : body.amount) : body.amount)
      try {
        const recent = await api(`/transactions${qs({ from: todayISO(), to: todayISO(), contact_id: body.contact_id, limit: 50 })}`)
        const tenMinutes = Date.now() - 10 * 60 * 1000
        const twin = recent.items.find(
          (x) =>
            x.type === body.type &&
            (x.contact_id ?? null) === (body.contact_id ?? null) &&
            new Date(x.created_at).getTime() > tenMinutes &&
            [x.amount, x.received].includes(main),
        )
        if (twin) {
          setDup(twin)
          return
        }
      } catch {
        // If the check fails, just save.
      }
    }
    try {
      const saved = await save.mutateAsync(
        editing ? { path: `/transactions/${entry.id}`, method: 'PUT', body } : { path: '/transactions', body },
      )
      // A reminder for the pending part, if a date was picked.
      if (v.kind === 'service' && pendingP > 0 && v.remindOn && v.contact) {
        await save.mutateAsync({
          path: '/reminders',
          body: {
            title: effect > 0 ? `Give ${money(pendingP)} back to ${v.contact.name}` : `Collect ${money(pendingP)} from ${v.contact.name}`,
            contact_id: v.contact.id,
            amount: rupeesInput(pendingP),
            due_date: v.remindOn,
          },
        })
      }
      // Undo puts things back: a new entry is removed, an edit is reversed. Receipt opens WhatsApp.
      const balanceAfter = saved.contact_id
        ? (person?.balance ?? 0) + saved.effect - (editing && entry.contact_id === saved.contact_id ? entry.effect : 0)
        : null
      const actions = [
        {
          label: 'Undo',
          onClick: async () => {
            try {
              if (editing) await save.mutateAsync({ path: `/transactions/${entry.id}`, method: 'PUT', body: bodyFromEntry(entry) })
              else await save.mutateAsync({ path: `/transactions/${saved.id}`, method: 'DELETE' })
              toast(editing ? 'Change undone' : 'Entry removed')
            } catch (err) {
              toast(err.message, 'error')
            }
          },
        },
        {
          label: 'Receipt',
          onClick: () => window.open(receiptLink(saved, balanceAfter, person?.phone ?? v.contact?.phone), '_blank', 'noopener'),
        },
      ]
      toast(
        editing
          ? 'Entry updated'
          : pendingP > 0
            ? `Saved. ${money(pendingP)} pending${v.remindOn ? ', reminder set' : ''}`
            : v.kind === 'service'
              ? `${service?.name ?? 'Entry'} saved`
              : 'Entry saved',
        'done',
        actions,
      )
      onDone(saved)
    } catch (err) {
      setError({ message: err.message, field: err.data?.field })
    }
  }

  const first = v.contact?.name?.split(' ')[0]
  const name = first ?? 'Customer' // as a subject
  const them = first ?? 'the customer' // as an object
  const pickPlain = (kind) => setAll((st) => ({ ...st, kind }))
  const editRate = (e) => setAll((st) => ({ ...st, rate: e.target.value.replace(/[^\d.]/g, ''), commission: '' }))

  const when = v.date === todayISO() ? 'today' : formatDate(v.date)
  // One card per service plus "Other"; the chosen one takes the service's colour.
  const short = (m) => (m === 'bank' ? 'bank' : modeLabel(m))
  const choices = [
    ...services.map((l) => ({
      key: l.id,
      name: l.name,
      hint:
        l.flow === 'withdrawal'
          ? `${short(l.received_mode ?? 'upi')} in, ${short(l.paid_mode ?? 'cash').toLowerCase()} out`
          : `${short(l.received_mode ?? 'cash')} in, sent by ${short(l.paid_mode ?? 'bank').toLowerCase()}`,
      Icon: ArrowLeftRight,
      color: l.color,
      active: v.kind === 'service' && v.serviceId === l.id,
      pick: () => chooseService(l),
    })),
    {
      key: 'other',
      name: 'Other',
      hint: 'In, out or balance',
      Icon: Ellipsis,
      color: 'var(--ink-2)',
      active: v.kind !== 'service',
      pick: () => v.kind === 'service' && pickPlain('in'),
    },
  ]

  return (
    <form ref={formRef} onSubmit={submit} noValidate>
      <header className="flex items-center gap-3 px-6 pt-4 max-sm:px-5">
        <h2 id={titleId} className="m-0 flex-1 text-base font-bold text-ink">
          {editing ? 'Edit entry' : 'New entry'}{' '}
          <span className="font-semibold text-ink-3">{editing ? `from ${when}` : `for ${when}`}</span>
        </h2>
        <button type="button" className="icon-button -mr-2 shrink-0" onClick={onCancel} aria-label="Close">
          <X size={18} />
        </button>
      </header>
      <div className="modal__body flex flex-col gap-5">
        {/* What happened: a card per service, and "Other" for plain money in, out and balances */}
        <ScrollStrip active={v.kind === 'service' ? v.serviceId : 'other'}>
          <div role="tablist" aria-label="What happened" className="flex min-w-min flex-[1_0_0] gap-2">
            {choices.map(({ key, name, hint, Icon, color, active, pick }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={pick}
                style={
                  active
                    ? { borderColor: color, boxShadow: `0 0 0 1px ${color}`, background: `color-mix(in srgb, ${color} 9%, var(--surface))` }
                    : undefined
                }
                className={`flex min-w-max flex-[1_0_0] cursor-pointer max-sm:min-w-[6rem] items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors max-sm:flex-col max-sm:items-start max-sm:gap-1.5 ${
                  active ? '' : 'border-line bg-surface hover:border-ink-3'
                }`}
              >
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-lg"
                  style={
                    active ? { background: color, color: '#fff' } : { color, background: `color-mix(in srgb, ${color} 13%, transparent)` }
                  }
                  aria-hidden="true"
                >
                  <Icon size={16} strokeWidth={2.4} />
                </span>
                <span className="min-w-0">
                  <span className={`block text-sm leading-tight font-bold whitespace-nowrap max-sm:text-[13px] max-sm:whitespace-normal ${active ? 'text-ink' : 'text-ink-2'}`}>
                    {name}
                  </span>
                  <span className="mt-0.5 block text-xs whitespace-nowrap text-ink-3 max-sm:hidden">{hint}</span>
                </span>
              </button>
            ))}
          </div>
        </ScrollStrip>

        {v.kind !== 'service' && (
          <div role="radiogroup" aria-label="Kind of entry" className="-mt-2 flex gap-1.5">
            {PLAIN_KINDS.map(({ kind, label, Icon, tone }) => (
              <button
                key={kind}
                type="button"
                role="radio"
                aria-checked={v.kind === kind}
                onClick={() => pickPlain(kind)}
                className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition-colors ${
                  v.kind === kind ? 'border-brand bg-brand-soft text-brand-text' : 'border-line bg-surface text-ink-2 hover:border-brand/40'
                }`}
              >
                <Icon size={14} className={tone} aria-hidden="true" /> {label}
              </button>
            ))}
          </div>
        )}

        {/* Who */}
        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <label className="label m-0" htmlFor={ids.person}>
              {v.kind === 'service' ? 'Customer' : 'Person'}{' '}
              {(v.kind === 'in' || v.kind === 'out' || (v.kind === 'service' && !v.diff)) && (
                <span className="label__optional">(optional)</span>
              )}
            </label>
            {v.contact && person && (
              <span className={`text-xs font-bold ${person.balance < 0 ? 'text-attn' : person.balance > 0 ? 'text-out' : 'text-ok'}`}>
                {person.balance ? balanceText(person.balance, first) : 'Settled up'}
              </span>
            )}
          </div>
          <ContactPicker
            id={ids.person}
            value={v.contact}
            onChange={set('contact')}
            placeholder={v.kind === 'service' ? 'Walk-in, or search a saved customer' : 'Search by name or phone'}
            invalid={error?.field === 'contact_id'}
            describedBy={error?.field === 'contact_id' ? `${ids.person}-err` : undefined}
          />
          {error?.field === 'contact_id' && <FieldError id={`${ids.person}-err`}>{error.message}</FieldError>}
        </div>

        {/* The money: one big amount, then the two numbers that follow from it */}
        {v.kind === 'service' &&
          (fromHeld ? (
            <section aria-label="From what you hold" className="shrink-0 overflow-hidden rounded-2xl border border-out/30">
              <div className="bg-out-soft/50 px-4 pt-3.5 pb-4 sm:px-5">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor={ids.paid} className="text-sm font-bold text-ink-2">
                    {isWithdrawal ? `Give ${them} from what you hold` : 'Send from what you hold'}
                  </label>
                  <ModePill value={v.paidMode} onChange={set('paidMode')} label={isWithdrawal ? 'Give by' : 'Send by'} />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-[28px] font-bold text-ink-3" aria-hidden="true">
                    ₹
                  </span>
                  <input
                    id={ids.paid}
                    className="w-full min-w-0 border-0 bg-transparent p-0 text-[40px] leading-tight font-extrabold tracking-tight text-out tabular-nums outline-none placeholder:text-ink-3/35"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0"
                    autoFocus
                    value={v.paid}
                    onChange={(e) => set('paid')(e.target.value.replace(/[^\d.,]/g, ''))}
                  />
                </div>
                <p className="m-0 mt-1 text-xs font-semibold text-ink-3">
                  You hold {money(Math.max(0, before))} for {first ?? 'them'}.{' '}
                  {shownPaid > 0 && (
                    <strong className={before + effect >= 0 ? 'text-ink-2' : 'text-attn'}>
                      After this: {balanceText(before + effect, first)}
                    </strong>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft px-4 py-2.5 text-xs sm:px-5">
                <span className="flex items-center gap-2 font-bold text-ink-3">
                  Commission
                  <span className="flex items-baseline gap-0.5 text-sm text-ok">
                    ₹
                    <input
                      aria-label="Commission amount"
                      style={{ fieldSizing: 'content' }}
                      className="min-w-[2ch] border-0 bg-transparent p-0 text-sm font-extrabold text-ok tabular-nums outline-none focus:underline"
                      inputMode="decimal"
                      value={v.commission !== '' ? v.commission : '0'}
                      onChange={(e) => set('commission')(e.target.value.replace(/[^\d.,]/g, ''))}
                    />
                  </span>
                  <span className="font-semibold">none by default, it’s their money</span>
                </span>
                <button
                  type="button"
                  className="link-button text-xs"
                  onClick={() => setAll((st) => ({ ...st, fromHeld: false, paid: '', commission: '' }))}
                >
                  Back to a normal {isWithdrawal ? 'withdrawal' : 'transfer'}
                </button>
              </div>
            </section>
          ) : (
            <section aria-label="Amounts" className="shrink-0 overflow-hidden rounded-2xl border border-line">
              {before > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setAll((st) => ({
                      ...st,
                      fromHeld: true,
                      received: '',
                      paid: rupeesInput(before),
                      commission: '',
                      diff: false,
                      actual: '',
                    }))
                  }
                  className="flex w-full cursor-pointer items-center justify-between gap-3 border-0 border-b border-out/20 bg-out-soft/60 px-4 py-2.5 text-left text-sm sm:px-5"
                >
                  <span className="font-semibold text-ink-2">
                    You hold <strong className="font-extrabold text-out">{money(before)}</strong> for {first}
                  </span>
                  <span className="text-xs font-bold text-brand-text">{isWithdrawal ? 'Give from this' : 'Send from this'} →</span>
                </button>
              )}
              <div className="bg-surface-2 px-4 pt-3.5 pb-4 sm:px-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {isWithdrawal ? (
                    <div role="radiogroup" aria-label="Which amount you know" className="inline-flex rounded-lg bg-surface-3 p-0.5">
                      {[
                        { key: 'main', label: isWithdrawal ? `${name} pays you` : 'Amount to send' },
                        { key: 'other', label: isWithdrawal ? `${name} wants in cash` : `${name} gives in total` },
                      ].map((o) => (
                        <button
                          key={o.key}
                          type="button"
                          role="radio"
                          aria-checked={(v.base ?? 'main') === o.key}
                          onClick={() =>
                            setAll((st) =>
                              st.base === o.key
                                ? st
                                : {
                                    ...st,
                                    base: o.key,
                                    // Carry the number across so switching never loses it.
                                    otherTyped: o.key === 'other' ? rupees(expectedOther) : '',
                                    received: o.key === 'main' && isWithdrawal ? rupees(mainP) : st.received,
                                    paid: o.key === 'main' && !isWithdrawal ? rupees(mainP) : st.paid,
                                    commission: '',
                                  },
                            )
                          }
                          className={`h-7 cursor-pointer rounded-md border-0 px-2.5 text-xs font-bold whitespace-nowrap ${
                            (v.base ?? 'main') === o.key
                              ? 'bg-surface text-ink shadow-[0_1px_2px_rgb(22_24_43/0.12)]'
                              : 'bg-transparent text-ink-3 hover:text-ink'
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <label htmlFor={ids.paid} className="text-sm font-bold text-ink-2">
                      Amount to send
                    </label>
                  )}
                  <ModePill
                    value={isWithdrawal === !byOther ? v.mode : v.paidMode}
                    onChange={set(isWithdrawal === !byOther ? 'mode' : 'paidMode')}
                    label={isWithdrawal === !byOther ? 'Paid by' : 'Send by'}
                  />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-[28px] font-bold text-ink-3" aria-hidden="true">
                    ₹
                  </span>
                  <input
                    id={isWithdrawal ? ids.received : ids.paid}
                    aria-label={
                      byOther ? (isWithdrawal ? 'Cash they want' : 'Total they give') : isWithdrawal ? 'They pay you' : 'Amount to send'
                    }
                    className="w-full min-w-0 border-0 bg-transparent p-0 text-[40px] leading-tight font-extrabold tracking-tight text-ink tabular-nums outline-none placeholder:text-ink-3/35"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0"
                    autoFocus={!editing}
                    value={byOther ? v.otherTyped : isWithdrawal ? v.received : v.paid}
                    onChange={(e) =>
                      setTyped(byOther ? 'otherTyped' : isWithdrawal ? 'received' : 'paid')(e.target.value.replace(/[^\d.,]/g, ''))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 divide-x divide-line-soft border-t border-line">
                <div className="flex min-w-0 flex-col gap-1 px-4 py-3 sm:px-5">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-ink-3">
                    Commission
                    <RateInput value={v.rate !== '' ? v.rate : String(rate)} onChange={editRate} />
                    {v.commission === '' && (rule.min || rule.source === 'slab') && (
                      <span className="rounded bg-ok-soft px-1 py-px text-[10px] font-bold text-ok">{rule.min ? 'minimum' : 'slab'}</span>
                    )}
                  </span>
                  <span className="flex items-baseline gap-0.5 text-xl font-extrabold text-ok tabular-nums">
                    ₹
                    <input
                      aria-label="Commission amount"
                      style={{ fieldSizing: 'content' }}
                      className="min-w-[3ch] border-0 bg-transparent p-0 text-xl font-extrabold text-ok tabular-nums outline-none focus:underline"
                      inputMode="decimal"
                      value={v.commission !== '' ? v.commission : rupees(autoCommission) || '0'}
                      onChange={(e) => set('commission')(e.target.value.replace(/[^\d.,]/g, ''))}
                    />
                  </span>
                </div>
                <div className="flex min-w-0 flex-col gap-1 px-4 py-3 sm:px-5">
                  <span className="flex flex-wrap items-center justify-between gap-1.5 text-xs font-bold text-ink-3">
                    {byOther ? (isWithdrawal ? `Get from ${them}` : 'Send') : isWithdrawal ? `Give ${them}` : 'Collect'}
                    <ModePill
                      value={isWithdrawal === !byOther ? v.paidMode : v.mode}
                      onChange={set(isWithdrawal === !byOther ? 'paidMode' : 'mode')}
                      label={isWithdrawal === !byOther ? 'Give by' : 'Collect by'}
                      small
                    />
                  </span>
                  <span className="truncate text-xl font-extrabold text-ink tabular-nums">{money(byOther ? mainP : expectedOther)}</span>
                </div>
              </div>
              {v.diff && (
                <div className="flex flex-col gap-3 border-t border-attn-line bg-attn-soft/60 px-4 py-3.5 sm:px-5">
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor={ids.pending} className="flex flex-col text-sm font-bold text-ink">
                      {isWithdrawal ? `You actually gave ${them}` : `${name} actually gave you`}
                      <span className="text-xs font-semibold text-ink-3">
                        Worked out {money(expectedOther)}. The rest is stored as pending.
                      </span>
                    </label>
                    <span className="flex items-baseline gap-1 border-b-2 border-attn-line pb-0.5 focus-within:border-attn">
                      <span className="font-bold text-ink-3" aria-hidden="true">
                        ₹
                      </span>
                      <input
                        id={ids.pending}
                        style={{ fieldSizing: 'content' }}
                        className="min-w-[4ch] border-0 bg-transparent p-0 text-right text-xl font-extrabold text-attn tabular-nums outline-none"
                        inputMode="decimal"
                        autoFocus={!editing}
                        placeholder="0"
                        value={v.actual}
                        onChange={(e) => set('actual')(e.target.value.replace(/[^\d.,]/g, ''))}
                      />
                    </span>
                  </div>
                  {v.actual !== '' && (
                    <p
                      className={`m-0 rounded-lg px-3 py-2 text-sm font-bold ${
                        effect === 0 ? 'bg-surface text-ink-3' : effect < 0 ? 'bg-attn/15 text-attn' : 'bg-out-soft text-out'
                      }`}
                      aria-live="polite"
                    >
                      {effect === 0
                        ? 'Nothing pending, it matches.'
                        : effect < 0
                          ? `Pending: ${first ?? 'they'} owe${first ? 's' : ''} you ${money(-effect)}`
                          : `Pending: you hold ${money(effect)} for ${first ?? 'them'} (to give back)`}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <label htmlFor={ids.remind} className="font-bold text-ink-2">
                      Remind me
                    </label>
                    {[1, 3, 7].map((d) => {
                      const iso = addDays(todayISO(), d)
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => set('remindOn')(v.remindOn === iso ? '' : iso)}
                          className={`h-7 cursor-pointer rounded-full border px-2.5 font-bold ${
                            v.remindOn === iso
                              ? 'border-attn bg-attn text-white'
                              : 'border-attn-line bg-surface text-ink-2 hover:border-attn'
                          }`}
                        >
                          {d === 1 ? 'Tomorrow' : `In ${d} days`}
                        </button>
                      )
                    })}
                    <input
                      id={ids.remind}
                      type="date"
                      className="field h-7 min-h-7 w-auto px-2 py-0 text-xs"
                      value={v.remindOn}
                      min={todayISO()}
                      onChange={set('remindOn')}
                    />
                  </div>
                  {!v.contact && (
                    <p className="m-0 text-xs font-bold text-danger">
                      Choose the customer above, so the pending amount goes to their balance.
                    </p>
                  )}
                  {v.contact && person && pendingP > 0 && v.actual !== '' && (
                    <p className="m-0 text-xs font-semibold text-ink-3" aria-live="polite">
                      After this: {balanceText(before + effect, first)}
                    </p>
                  )}
                </div>
              )}
              <button
                type="button"
                aria-expanded={v.diff}
                onClick={() => setAll((st) => ({ ...st, diff: !st.diff, actual: '', remindOn: '' }))}
                className={`flex w-full cursor-pointer items-center gap-2 border-0 border-t px-4 py-2.5 text-left text-xs font-bold sm:px-5 ${
                  v.diff
                    ? 'border-attn-line bg-attn-soft/60 text-ink-3 hover:text-danger'
                    : 'border-line-soft bg-transparent text-brand-text hover:bg-surface-2'
                }`}
              >
                <Hourglass size={14} aria-hidden="true" />
                {v.diff
                  ? 'No pending, all settled now'
                  : isWithdrawal
                    ? 'Gave a different amount? Store the rest as pending'
                    : 'Got a different amount? Store the rest as pending'}
              </button>
            </section>
          ))}

        {v.kind === 'service' && !isWithdrawal && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor={ids.to}>
                Send to
              </label>
              {receivers.length > 0 && !v.to && !v.toName && (
                <div className="mb-2 flex flex-wrap gap-1.5" aria-label="Usual receivers">
                  {receivers.map((r) => (
                    <button
                      key={(r.to_contact_id ?? r.name) + r.to_account}
                      type="button"
                      onClick={() =>
                        setAll((st) => ({
                          ...st,
                          to: r.to_contact_id ? { id: r.to_contact_id, name: r.name } : null,
                          toName: r.to_contact_id ? '' : r.name,
                          toAccount: r.to_account || st.toAccount,
                        }))
                      }
                      className="inline-flex max-w-full cursor-pointer flex-col items-start rounded-lg border border-line bg-surface px-2.5 py-1.5 text-left hover:border-brand/40"
                      title={`Sent ${r.count} time${r.count === 1 ? '' : 's'}, last on ${r.last_date}`}
                    >
                      <span className="truncate text-xs font-bold text-ink">{r.name}</span>
                      {r.to_account && <span className="max-w-[11rem] truncate text-[11px] text-ink-3">{r.to_account}</span>}
                    </button>
                  ))}
                </div>
              )}
              <ContactPicker
                id={ids.to}
                value={v.to}
                onChange={set('to')}
                onText={set('toName')}
                text={v.toName}
                placeholder="Type a name or pick a saved person"
                invalid={error?.field === 'to'}
              />
            </div>
            <div>
              <label className="label" htmlFor={ids.account}>
                Their account <span className="label__optional">(optional)</span>
              </label>
              <input
                id={ids.account}
                className="field"
                placeholder="UPI ID, bank account or phone"
                value={v.toAccount}
                onChange={set('toAccount')}
                maxLength={200}
              />
            </div>
          </div>
        )}

        {(v.kind === 'in' || v.kind === 'out' || v.kind === 'adjust') && (
          <section aria-label="Amount" className="shrink-0 overflow-hidden rounded-2xl border border-line">
            {v.kind === 'adjust' && (
              <div className="border-b border-line px-4 py-3 sm:px-5">
                <Segmented
                  label="Which way"
                  value={v.direction}
                  onChange={set('direction')}
                  options={[
                    { value: 'owes_you', label: `${first ?? 'They'} owe${first ? 's' : ''} you` },
                    { value: 'you_owe', label: `You owe ${first ?? 'them'}` },
                  ]}
                />
              </div>
            )}
            <div className="bg-surface-2 px-4 pt-3.5 pb-4 sm:px-5">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor={ids.amount} className="text-sm font-bold text-ink-2">
                  {v.kind === 'adjust'
                    ? 'Amount'
                    : v.kind === 'in'
                      ? first
                        ? `${first} pays you`
                        : 'Money in'
                      : first
                        ? `You pay ${first}`
                        : 'Money out'}
                </label>
                {v.kind !== 'adjust' && <ModePill value={v.mode} onChange={set('mode')} label="Paid by" />}
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-[28px] font-bold text-ink-3" aria-hidden="true">
                  ₹
                </span>
                <input
                  id={ids.amount}
                  className={`w-full min-w-0 border-0 bg-transparent p-0 text-[40px] leading-tight font-extrabold tracking-tight tabular-nums outline-none placeholder:text-ink-3/35 ${
                    v.kind === 'in' ? 'text-in' : v.kind === 'out' ? 'text-out' : 'text-attn'
                  }`}
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0"
                  autoFocus={!editing}
                  aria-invalid={error?.field === 'amount' || undefined}
                  value={v.amount}
                  onChange={(e) => set('amount')(e.target.value.replace(/[^\d.,]/g, ''))}
                />
              </div>
            </div>
          </section>
        )}

        {(v.kind === 'in' || v.kind === 'out') && (
          <div className="flex flex-col gap-3">
            {v.contact && (
              <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 accent-[var(--primary)]"
                  checked={v.account}
                  onChange={(e) => set('account')(e.target.checked)}
                />
                <span>
                  <span className="font-bold text-ink">Count in {first}’s balance</span>
                  <span className="block text-xs text-ink-3">Turn off for things like rent or salary.</span>
                </span>
              </label>
            )}
            <div>
              <label className="label" htmlFor={ids.label}>
                Label <span className="label__optional">(optional)</span>
              </label>
              <LabelPicker id={ids.label} value={v.label} onChange={set('label')} />
            </div>
          </div>
        )}

        {/* When and a note */}
        <div className="grid gap-3 sm:grid-cols-[11rem_minmax(0,1fr)]">
          <div>
            <label className="label" htmlFor={ids.date}>
              Date
            </label>
            <input id={ids.date} className="field" type="date" value={v.date} onChange={set('date')} required />
          </div>
          <div>
            <label className="label" htmlFor={ids.note}>
              Note <span className="label__optional">(optional)</span>
            </label>
            <input id={ids.note} className="field" value={v.note} onChange={set('note')} maxLength={1000} />
          </div>
        </div>

        {dup && !dupOk && (
          <div className="flex flex-col gap-2 rounded-xl border border-attn-line bg-attn-soft px-4 py-3 text-sm" role="alert">
            <p className="m-0 font-bold text-ink">This looks like a repeat of an entry saved {formatStamp(dup.created_at)}</p>
            <p className="m-0 text-ink-2">
              {dup.contact_name ?? 'Walk-in'} · {money(dup.received || dup.amount)}
              {dup.label_name ? ` · ${dup.label_name}` : ''}
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn--sm btn--primary" onClick={() => setDupOk(true)}>
                Yes, save it again
              </button>
              <button type="button" className="btn btn--sm btn--ghost" onClick={() => setDup(null)}>
                Don’t save
              </button>
            </div>
          </div>
        )}

        {error && error.field !== 'contact_id' && (
          <p className="field-error m-0" role="alert">
            {error.message}
          </p>
        )}
      </div>
      <FormFooter
        extra={
          v.kind === 'service' ? (
            <span className="hidden text-sm text-ink-3 sm:inline">
              You keep <strong className="text-base font-extrabold text-ok tabular-nums">{money(commissionP)}</strong>
            </span>
          ) : null
        }
        onCancel={onCancel}
        saving={save.isPending}
        label={editing ? 'Save changes' : v.kind === 'service' && service ? `Save ${service.name.toLowerCase()}` : 'Save entry'}
      />
    </form>
  )
}

/* Person */

export function PersonForm({ person, initialName = '', onDone, onCancel, toast, onOpenPerson }) {
  const ids = { name: useId(), phone: useId(), note: useId() }
  const save = useSave()
  const [error, setError] = useState(null)
  const [v, set] = useFormState({
    name: person?.name ?? initialName,
    phone: person?.phone?.replace(/^\+91/, '') ?? '',
    note: person?.note ?? '',
  })

  async function submit(e) {
    e.preventDefault()
    setError(null)
    try {
      const saved = await save.mutateAsync(
        person ? { path: `/contacts/${person.id}`, method: 'PUT', body: v } : { path: '/contacts', body: v },
      )
      toast(person ? 'Person updated' : 'Person added')
      onDone(saved)
    } catch (err) {
      setError({ message: err.message, field: err.data?.field ?? 'name', id: err.data?.id })
    }
  }

  const errorFor = (field) =>
    error?.field === field && (
      <FieldError id={`${ids[field]}-err`}>
        {error.message}{' '}
        {error.id && onOpenPerson && (
          <button type="button" className="link-button" onClick={() => onOpenPerson(error.id)}>
            Open saved person
          </button>
        )}
      </FieldError>
    )

  return (
    <form onSubmit={submit} noValidate>
      <div className="modal__body form-grid">
        <div className="form-grid__full">
          <label className="label" htmlFor={ids.name}>
            Name
          </label>
          <input
            id={ids.name}
            className="field"
            autoFocus
            autoComplete="off"
            value={v.name}
            onChange={set('name')}
            maxLength={80}
            aria-invalid={error?.field === 'name' || undefined}
            aria-describedby={error?.field === 'name' ? `${ids.name}-err` : `${ids.name}-hint`}
            required
          />
          {errorFor('name') || (
            <p id={`${ids.name}-hint`} className="hint">
              Each name can only be saved once.
            </p>
          )}
        </div>
        <div className="form-grid__full">
          <label className="label" htmlFor={ids.phone}>
            Phone <span className="label__optional">(optional)</span>
          </label>
          <input
            id={ids.phone}
            className="field"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="98765 43210"
            value={v.phone}
            onChange={set('phone')}
            aria-invalid={error?.field === 'phone' || undefined}
            aria-describedby={error?.field === 'phone' ? `${ids.phone}-err` : `${ids.phone}-hint`}
          />
          {errorFor('phone') || (
            <p id={`${ids.phone}-hint`} className="hint">
              Used for call and WhatsApp reminder buttons. Indian numbers get +91 added.
            </p>
          )}
        </div>
        <div className="form-grid__full">
          <label className="label" htmlFor={ids.note}>
            Note <span className="label__optional">(optional)</span>
          </label>
          <textarea
            id={ids.note}
            className="field field--area"
            rows={3}
            value={v.note}
            onChange={set('note')}
            maxLength={1000}
            placeholder="Address, business name, anything to remember"
          />
        </div>
        {error && !['name', 'phone'].includes(error.field) && (
          <p className="form-grid__full field-error" role="alert">
            {error.message}
          </p>
        )}
      </div>
      <FormFooter onCancel={onCancel} saving={save.isPending} label={person ? 'Save changes' : 'Add person'} />
    </form>
  )
}

/* Reminder */

export function ReminderForm({ reminder, defaults = {}, onDone, onCancel, toast }) {
  const ids = { title: useId(), person: useId(), amount: useId(), date: useId(), note: useId() }
  const linked = Boolean(reminder?.transaction_id)
  const save = useSave()
  const [error, setError] = useState(null)
  const [v, set] = useFormState({
    title: reminder?.title ?? defaults.title ?? '',
    contact: reminder?.contact_id ? { id: reminder.contact_id, name: reminder.contact_name } : (defaults.contact ?? null),
    amount: reminder ? rupeesInput(reminder.amount) : defaults.amount ? String(defaults.amount) : '',
    due_date: reminder?.due_date ?? defaults.due_date ?? addDays(todayISO(), 7),
    note: reminder?.note ?? '',
  })

  async function submit(e) {
    e.preventDefault()
    setError(null)
    const body = { title: v.title, contact_id: v.contact?.id ?? null, amount: v.amount, due_date: v.due_date, note: v.note }
    try {
      const saved = await save.mutateAsync(
        reminder ? { path: `/reminders/${reminder.id}`, method: 'PUT', body } : { path: '/reminders', body },
      )
      toast(reminder ? 'Reminder updated' : 'Reminder set')
      onDone(saved)
    } catch (err) {
      setError({ message: err.message, field: err.data?.field })
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="modal__body form-grid">
        {linked ? (
          <p className="form-grid__full hint">This reminder belongs to a pending entry, so only the date and note can change here.</p>
        ) : (
          <>
            <div className="form-grid__full">
              <label className="label" htmlFor={ids.title}>
                What's it for?
              </label>
              <input
                id={ids.title}
                className="field"
                autoFocus
                placeholder="e.g. Collect rent, Pay electricity bill"
                value={v.title}
                onChange={set('title')}
                maxLength={120}
                aria-invalid={error?.field === 'title' || undefined}
                required
              />
            </div>
            <div className="form-grid__full">
              <label className="label" htmlFor={ids.person}>
                Person <span className="label__optional">(optional)</span>
              </label>
              <ContactPicker id={ids.person} value={v.contact} onChange={set('contact')} />
            </div>
          </>
        )}
        <div className="form-grid__full">
          <label className="label" htmlFor={ids.date}>
            Remind me on
          </label>
          <div className="date-with-chips">
            <input id={ids.date} className="field" type="date" value={v.due_date} onChange={set('due_date')} required autoFocus={linked} />
            <DateChips base={todayISO()} onPick={set('due_date')} options={[1, 7, 15, 30]} />
          </div>
        </div>
        {!linked && (
          <div>
            <label className="label" htmlFor={ids.amount}>
              Amount <span className="label__optional">(optional)</span>
            </label>
            <div className="money-field">
              <span aria-hidden="true">₹</span>
              <input
                id={ids.amount}
                className="field field--money"
                inputMode="decimal"
                placeholder="0"
                value={v.amount}
                onChange={set('amount')}
              />
            </div>
          </div>
        )}
        <div className="form-grid__full">
          <label className="label" htmlFor={ids.note}>
            Note <span className="label__optional">(optional)</span>
          </label>
          <textarea id={ids.note} className="field field--area" rows={2} value={v.note} onChange={set('note')} maxLength={1000} />
        </div>
        {error && (
          <p className="form-grid__full field-error" role="alert">
            {error.message}
          </p>
        )}
      </div>
      <FormFooter onCancel={onCancel} saving={save.isPending} label={reminder ? 'Save changes' : 'Set reminder'} />
    </form>
  )
}

/* Label: name and colour */

const LABEL_COLORS = ['#7c3aed', '#0d9488', '#db2777', '#16a34a', '#0284c7', '#4f46e5', '#b45309', '#64748b']
const COLOR_NAMES = ['Violet', 'Teal', 'Pink', 'Green', 'Sky blue', 'Indigo', 'Brown', 'Slate']

export function LabelForm({ label, defaults = {}, onDone, onCancel, toast }) {
  const nameId = useId()
  const rateId = useId()
  const inId = useId()
  const outId = useId()
  const save = useSave()
  const [error, setError] = useState('')
  const { data: settings } = useSettings()
  const [v, set, setAll] = useFormState({
    name: label?.name ?? '',
    color: label?.color ?? '',
    flow: label?.flow ?? defaults.flow ?? '',
    rate: label?.commission_percent != null ? String(label.commission_percent) : '',
    receivedMode: label?.received_mode ?? (defaults.flow === 'withdrawal' ? 'upi' : 'cash'),
    paidMode: label?.paid_mode ?? (defaults.flow === 'withdrawal' ? 'cash' : defaults.flow === 'transfer' ? 'bank' : 'cash'),
  })

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!v.name.trim()) {
      setError('Enter a name for the label.')
      return
    }
    try {
      const body = {
        name: v.name,
        color: v.color || undefined,
        flow: v.flow || null,
        commission_percent: v.flow ? v.rate : '',
        received_mode: v.flow ? v.receivedMode : null,
        paid_mode: v.flow ? v.paidMode : null,
      }
      const saved = await save.mutateAsync(label ? { path: `/labels/${label.id}`, method: 'PUT', body } : { path: '/labels', body })
      toast(label ? (v.flow ? 'Service updated' : 'Label updated') : v.flow ? `${saved.name} is ready in New entry` : 'Label created')
      onDone(saved)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="modal__body form-grid">
        <div className="form-grid__full">
          <label className="label" htmlFor={nameId}>
            Name
          </label>
          <input
            id={nameId}
            className="field"
            autoFocus
            autoComplete="off"
            placeholder={v.flow ? 'e.g. Cash withdrawal, Money transfer' : 'e.g. Rent, Salary, Office expense'}
            maxLength={40}
            value={v.name}
            onChange={set('name')}
            aria-invalid={Boolean(error) || undefined}
            required
          />
        </div>
        <fieldset className="form-grid__full swatches">
          <legend className="label">Colour</legend>
          {LABEL_COLORS.map((color, i) => (
            <label key={color} className="swatch" title={COLOR_NAMES[i]}>
              <input
                type="radio"
                name="label-color"
                value={color}
                checked={(v.color || (label ? label.color : '')) === color}
                onChange={() => set('color')(color)}
              />
              <span className="swatch__dot" style={{ background: color }} />
              <span className="visually-hidden">{COLOR_NAMES[i]}</span>
            </label>
          ))}
        </fieldset>
        {!label && !v.color && <p className="form-grid__full hint">Leave the colour unpicked to use the next one in turn.</p>}

        {/* Service rules: turn a label into a service the entry form fills in for you */}
        <fieldset className="form-grid__full m-0 flex flex-col gap-3 rounded-xl border border-line p-4">
          <legend className="px-1 text-sm font-bold text-ink">Is this a service?</legend>
          <div role="radiogroup" aria-label="Service type" className="grid gap-2 sm:grid-cols-3">
            {[
              { value: '', title: 'No, just a label', sub: 'For grouping, like Rent' },
              { value: 'withdrawal', title: 'Withdrawal', sub: 'They pay you, you give it back (e.g. UPI in, cash out)' },
              { value: 'transfer', title: 'Transfer', sub: 'They give you money, you send it to someone else' },
            ].map((o) => (
              <button
                key={o.value || 'none'}
                type="button"
                role="radio"
                aria-checked={v.flow === o.value}
                onClick={() =>
                  setAll((st) => ({
                    ...st,
                    flow: o.value,
                    // Usual ways money moves for each kind, when setting up a new service.
                    ...(!label && o.value === 'withdrawal' ? { receivedMode: 'upi', paidMode: 'cash' } : {}),
                    ...(!label && o.value === 'transfer' ? { receivedMode: 'cash', paidMode: 'bank' } : {}),
                  }))
                }
                className={`flex cursor-pointer flex-col items-start gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  v.flow === o.value ? 'border-brand bg-brand-soft' : 'border-line bg-surface hover:border-brand/40'
                }`}
              >
                <span className="text-sm font-bold text-ink">{o.title}</span>
                <span className="text-xs text-ink-3">{o.sub}</span>
              </button>
            ))}
          </div>
          {v.flow && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="label" htmlFor={rateId}>
                  Commission %
                </label>
                <input
                  id={rateId}
                  className="field"
                  inputMode="decimal"
                  placeholder={`${settings?.commission_percent ?? 1} (default)`}
                  value={v.rate}
                  onChange={(e) => set('rate')(e.target.value.replace(/[^\d.]/g, ''))}
                />
              </div>
              <div>
                <label className="label" htmlFor={inId}>
                  Money comes in by
                </label>
                <ModeSelect id={inId} value={v.receivedMode} onChange={set('receivedMode')} />
              </div>
              <div>
                <label className="label" htmlFor={outId}>
                  {v.flow === 'withdrawal' ? 'You give it back by' : 'You send it by'}
                </label>
                <ModeSelect id={outId} value={v.paidMode} onChange={set('paidMode')} />
              </div>
              <p className="m-0 text-xs text-ink-3 sm:col-span-3">
                {v.flow === 'withdrawal'
                  ? `Example: ₹10,000 comes in, you give back ₹${(10000 - 10000 * (Number(v.rate || settings?.commission_percent || 1) / 100)).toLocaleString('en-IN')} and keep ₹${(10000 * (Number(v.rate || settings?.commission_percent || 1) / 100)).toLocaleString('en-IN')}.`
                  : `Example: to send ₹10,000, they give you ₹${(10000 + 10000 * (Number(v.rate || settings?.commission_percent || 1) / 100)).toLocaleString('en-IN')} and you keep ₹${(10000 * (Number(v.rate || settings?.commission_percent || 1) / 100)).toLocaleString('en-IN')}.`}
              </p>
            </div>
          )}
        </fieldset>
        {v.name.trim() && (
          <p className="form-grid__full label-preview">
            Preview:{' '}
            <span className="label-chip">
              <LabelDot color={v.color || label?.color || LABEL_COLORS[0]} />
              {v.name.trim()}
            </span>
          </p>
        )}
        {error && (
          <p className="form-grid__full field-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <FormFooter onCancel={onCancel} saving={save.isPending} label={label ? 'Save changes' : v.flow ? 'Create service' : 'Create label'} />
    </form>
  )
}
