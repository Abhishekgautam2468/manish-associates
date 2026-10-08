import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlarmClockPlus,
  BellRing,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  List,
  MessageCircle,
  Pencil,
  Plus,
  ReceiptText,
  RotateCcw,
  Trash2,
  User,
} from 'lucide-react'
import { useReminders, useSave } from '../../lib/queries.js'
import { useUI } from '../../dashboard/ui.jsx'
import { EmptyState, Hero, Menu, MenuItem, Segmented } from '../../dashboard/bits.jsx'
import {
  addDays,
  addMonths,
  dueLabel,
  formatDate,
  formatFullDate,
  formatMonth,
  fromISO,
  money,
  reminderMessage,
  startOfMonth,
  toISO,
  todayISO,
  whatsappLink,
} from '../../lib/format.js'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const fmtDayNum = new Intl.DateTimeFormat('en-IN', { day: 'numeric' })
const fmtMonthShort = new Intl.DateTimeFormat('en-IN', { month: 'short' })
const fmtWeekday = new Intl.DateTimeFormat('en-IN', { weekday: 'short' })

// overdue | today | week | later | done
function bucketOf(r, today, weekEnd) {
  if (r.done_at) return 'done'
  if (r.due_date < today) return 'overdue'
  if (r.due_date === today) return 'today'
  if (r.due_date <= weekEnd) return 'week'
  return 'later'
}

const TONE = {
  overdue: { tile: 'bg-danger-soft text-danger', due: 'text-danger', dot: 'bg-danger', ring: 'ring-danger/25', label: 'text-danger' },
  today: { tile: 'bg-attn-soft text-attn', due: 'text-attn', dot: 'bg-attn', ring: 'ring-attn/30', label: 'text-attn' },
  week: {
    tile: 'bg-surface-2 text-ink-2 ring-1 ring-line-soft',
    due: 'text-ink-2',
    dot: 'bg-brand',
    ring: 'ring-brand/20',
    label: 'text-brand-text',
  },
  later: {
    tile: 'bg-surface-2 text-ink-3 ring-1 ring-line-soft',
    due: 'text-ink-3',
    dot: 'bg-ink-3',
    ring: 'ring-line',
    label: 'text-ink-2',
  },
  done: { tile: 'bg-ok-soft text-ok', due: 'text-ok', dot: 'bg-ok', ring: 'ring-ok/20', label: 'text-ok' },
}

function DateTile({ iso, bucket }) {
  const d = fromISO(iso)
  return (
    <span className={`flex w-12 shrink-0 flex-col items-center rounded-xl py-1.5 leading-none ${TONE[bucket].tile}`} aria-hidden="true">
      <span className="text-[10px] font-bold opacity-80">{fmtWeekday.format(d)}</span>
      <span className="mt-0.5 text-lg font-extrabold tabular-nums">{fmtDayNum.format(d)}</span>
      <span className="mt-0.5 text-[10px] font-bold opacity-80">{fmtMonthShort.format(d)}</span>
    </span>
  )
}

function ReminderRow({ r, bucket, ui, save }) {
  const amount = r.amount || r.tx_remaining
  const today = todayISO()
  const urgent = bucket === 'overdue' || bucket === 'today'

  async function act(path, message) {
    try {
      await save.mutateAsync({ path })
      ui.toast(message)
    } catch (err) {
      ui.toast(err.message, 'error')
    }
  }

  async function snooze(days) {
    try {
      await save.mutateAsync({ path: `/reminders/${r.id}/snooze`, body: { days } })
      ui.toast(`Moved to ${formatFullDate(addDays(r.due_date > today ? r.due_date : today, days))}`)
    } catch (err) {
      ui.toast(err.message, 'error')
    }
  }

  async function remove() {
    const ok = await ui.confirm({
      title: 'Delete this reminder?',
      body: r.transaction_id ? 'The pending entry stays. Only the reminder is removed.' : `“${r.title}” will be removed.`,
      confirmLabel: 'Delete reminder',
      danger: true,
    })
    if (!ok) return
    await save.mutateAsync({ path: `/reminders/${r.id}`, method: 'DELETE' })
    ui.toast('Reminder deleted')
  }

  return (
    <li
      className={`relative flex flex-col gap-3 border-t border-line-soft p-4 first:border-t-0 sm:flex-row sm:items-center sm:gap-4 sm:px-5 ${r.done_at ? 'opacity-75' : ''}`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3.5">
        <DateTile iso={r.due_date} bucket={bucket} />
        <div className="min-w-0 flex-1">
          <p className={`m-0 text-[15px] leading-snug font-bold text-ink ${r.done_at ? 'line-through decoration-ink-3/60' : ''}`}>
            {r.title}
          </p>
          <p className="m-0 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className={`font-bold ${TONE[bucket].due}`}>
              {r.done_at ? `Done · was due ${formatDate(r.due_date)}` : dueLabel(r.due_date)}
            </span>
            {amount ? <span className="text-[13px] font-extrabold text-ink tabular-nums">{money(amount)}</span> : null}
            {r.contact_id && (
              <Link
                to={`/dashboard/people/${r.contact_id}`}
                className="inline-flex min-h-7 items-center gap-1 font-semibold text-ink-2 no-underline hover:text-brand-text"
              >
                <User size={12} aria-hidden="true" /> {r.contact_name}
              </Link>
            )}
            {r.transaction_id && (
              <button
                type="button"
                className="inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 font-semibold text-ink-3 hover:text-brand-text"
                onClick={() => ui.viewEntry(r.transaction_id)}
              >
                <ReceiptText size={12} aria-hidden="true" /> Linked entry
              </button>
            )}
          </p>
          {r.note && <p className="m-0 mt-1.5 text-sm text-ink-3">{r.note}</p>}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-1.5 border-t border-line-soft pt-2.5 sm:border-0 sm:pt-0">
        {!r.done_at && r.contact_phone && (
          <a
            className="icon-button size-9"
            href={whatsappLink(
              r.contact_phone,
              reminderMessage({ name: r.contact_name, type: r.tx_type ?? 'in', amount, dueDate: r.due_date }),
            )}
            target="_blank"
            rel="noreferrer"
            aria-label={`WhatsApp ${r.contact_name}`}
            title="Send on WhatsApp"
          >
            <MessageCircle size={17} />
          </a>
        )}
        {!r.done_at && (
          <button
            type="button"
            className="icon-button size-9"
            onClick={() => snooze(1)}
            aria-label="Snooze to tomorrow"
            title="Snooze to tomorrow"
          >
            <AlarmClockPlus size={17} />
          </button>
        )}
        <Menu label={`More actions for ${r.title}`}>
          {!r.done_at && (
            <>
              <MenuItem icon={<AlarmClockPlus size={15} />} onSelect={() => snooze(1)}>
                Snooze to tomorrow
              </MenuItem>
              <MenuItem icon={<AlarmClockPlus size={15} />} onSelect={() => snooze(3)}>
                Snooze 3 days
              </MenuItem>
              <MenuItem icon={<AlarmClockPlus size={15} />} onSelect={() => snooze(7)}>
                Snooze a week
              </MenuItem>
              <MenuItem icon={<Pencil size={15} />} onSelect={() => ui.editReminder(r)}>
                Edit
              </MenuItem>
            </>
          )}
          <MenuItem icon={<Trash2 size={15} />} danger onSelect={remove}>
            Delete
          </MenuItem>
        </Menu>
        {r.done_at ? (
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => act(`/reminders/${r.id}/reopen`, 'Reminder reopened')}>
            <RotateCcw size={15} aria-hidden="true" /> Reopen
          </button>
        ) : (
          <button
            type="button"
            className={`btn btn--sm ${urgent ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => act(`/reminders/${r.id}/done`, 'Reminder marked as done')}
          >
            <Check size={15} aria-hidden="true" /> Done
          </button>
        )}
      </div>
    </li>
  )
}

function ReminderList({ items, today, weekEnd, ui, save }) {
  return (
    <ul className="m-0 flex list-none flex-col overflow-hidden rounded-[20px] bg-surface p-0 shadow-[var(--soft-card)] ring-1 ring-[var(--soft-ring)]">
      {items.map((r) => (
        <ReminderRow key={r.id} r={r} bucket={bucketOf(r, today, weekEnd)} ui={ui} save={save} />
      ))}
    </ul>
  )
}

// A group on the timeline: a coloured node and label, then its reminder cards.
function TimelineGroup({ id, title, hint, bucket, count, children }) {
  return (
    <section className="relative pl-7 sm:pl-9" aria-labelledby={id}>
      <span className="absolute top-2 bottom-0 left-[9px] w-0.5 rounded-full bg-line sm:left-[13px]" aria-hidden="true" />
      <span
        className={`absolute top-1 left-0.5 size-[16px] rounded-full ring-4 ring-[var(--sheet)] sm:left-1.5 ${TONE[bucket].dot}`}
        aria-hidden="true"
      />
      <h2 id={id} className="m-0 mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className={`text-base font-extrabold ${TONE[bucket].label}`}>{title}</span>
        <span className="text-xs font-bold text-ink-3">
          {count} {count === 1 ? 'reminder' : 'reminders'}
          {hint ? ` · ${hint}` : ''}
        </span>
      </h2>
      {children}
    </section>
  )
}

// Overdue, today, each of the next six days, then later and done, as chips that filter the list.
function WeekStrip({ all, filter, onFilter, today, buckets }) {
  const open = all.filter((r) => !r.done_at)
  const count = (iso) => open.filter((r) => r.due_date === iso).length
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i))
  const chip = (active) =>
    `flex min-w-[4.25rem] shrink-0 cursor-pointer flex-col items-center gap-0.5 rounded-xl border-0 px-2.5 py-2 text-center transition-colors ${
      active ? 'bg-[var(--side)] text-white shadow-[0_10px_20px_-12px_rgb(20_23_43/0.7)]' : 'bg-transparent hover:bg-surface-2'
    }`
  const num = (n, active, tone) => (
    <span className={`text-lg leading-none font-extrabold tabular-nums ${active ? 'text-white' : n ? tone : 'text-ink-3/60'}`}>{n}</span>
  )
  return (
    <div className="filterbar !flex-nowrap gap-1 overflow-x-auto [scrollbar-width:none]" role="radiogroup" aria-label="Show reminders for">
      <button
        type="button"
        role="radio"
        aria-checked={filter === 'open'}
        className={chip(filter === 'open')}
        onClick={() => onFilter('open')}
      >
        <span className={`text-[11px] font-bold ${filter === 'open' ? 'text-white/80' : 'text-ink-3'}`}>All open</span>
        {num(open.length, filter === 'open', 'text-ink')}
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={filter === 'overdue'}
        className={chip(filter === 'overdue')}
        onClick={() => onFilter('overdue')}
      >
        <span className={`text-[11px] font-bold ${filter === 'overdue' ? 'text-white/80' : 'text-danger'}`}>Overdue</span>
        {num(buckets.overdue.length, filter === 'overdue', 'text-danger')}
      </button>
      <span className="mx-0.5 w-px shrink-0 self-stretch bg-line" aria-hidden="true" />
      {days.map((iso, i) => {
        const d = fromISO(iso)
        const n = count(iso)
        const active = filter === iso
        return (
          <button key={iso} type="button" role="radio" aria-checked={active} className={chip(active)} onClick={() => onFilter(iso)}>
            <span className={`text-[11px] font-bold ${active ? 'text-white/80' : i === 0 ? 'text-attn' : 'text-ink-3'}`}>
              {i === 0 ? 'Today' : `${fmtWeekday.format(d)} ${fmtDayNum.format(d)}`}
            </span>
            {num(n, active, i === 0 ? 'text-attn' : 'text-brand-text')}
          </button>
        )
      })}
      <span className="mx-0.5 w-px shrink-0 self-stretch bg-line" aria-hidden="true" />
      <button
        type="button"
        role="radio"
        aria-checked={filter === 'later'}
        className={chip(filter === 'later')}
        onClick={() => onFilter('later')}
      >
        <span className={`text-[11px] font-bold ${filter === 'later' ? 'text-white/80' : 'text-ink-3'}`}>Later</span>
        {num(buckets.later.length, filter === 'later', 'text-ink-2')}
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={filter === 'done'}
        className={chip(filter === 'done')}
        onClick={() => onFilter('done')}
      >
        <span className={`text-[11px] font-bold ${filter === 'done' ? 'text-white/80' : 'text-ok'}`}>Done</span>
        {num(buckets.done.length, filter === 'done', 'text-ok')}
      </button>
    </div>
  )
}

/* Month view: reminders shown inside each day */

function MonthView({ month, onMonth, reminders, selected, onSelect, today, weekEnd }) {
  const byDay = useMemo(() => {
    const map = new Map()
    for (const r of reminders) {
      if (!map.has(r.due_date)) map.set(r.due_date, [])
      map.get(r.due_date).push(r)
    }
    return map
  }, [reminders])

  const first = fromISO(month)
  const lead = (first.getDay() + 6) % 7
  const cells = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(first)
    d.setDate(1 - lead + i)
    cells.push(toISO(d))
  }
  const rows = cells.slice(35).every((c) => c.slice(0, 7) !== month.slice(0, 7)) ? 5 : 6

  return (
    <section className="panel month" aria-label={formatMonth(month)}>
      <div className="month__head">
        <h2 className="month__title">{formatMonth(month)}</h2>
        <div className="month__nav">
          <button type="button" className="btn btn--sm" onClick={() => onMonth(startOfMonth(today))}>
            Today
          </button>
          <button type="button" className="icon-button" onClick={() => onMonth(addMonths(month, -1))} aria-label="Previous month">
            <ChevronLeft size={18} />
          </button>
          <button type="button" className="icon-button" onClick={() => onMonth(addMonths(month, 1))} aria-label="Next month">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="month__grid" role="grid">
        {WEEKDAYS.map((d) => (
          <span key={d} className="month__weekday" role="columnheader">
            {d}
          </span>
        ))}
        {cells.slice(0, rows * 7).map((iso) => {
          const list = byDay.get(iso) ?? []
          const outside = iso.slice(0, 7) !== month.slice(0, 7)
          return (
            <button
              key={iso}
              type="button"
              role="gridcell"
              className="month__day"
              data-outside={outside || undefined}
              data-today={iso === today || undefined}
              aria-pressed={selected === iso}
              aria-label={`${formatFullDate(iso)}${list.length ? `, ${list.length} reminder${list.length > 1 ? 's' : ''}` : ''}`}
              onClick={() => onSelect(selected === iso ? null : iso)}
            >
              <span className="month__num">{Number(iso.slice(8))}</span>
              <span className="month__items">
                {list.slice(0, 2).map((r) => (
                  <span key={r.id} className={`month__item month__item--${bucketOf(r, today, weekEnd)}`}>
                    {r.title}
                  </span>
                ))}
                {list.length > 2 && <span className="month__more">+{list.length - 2} more</span>}
              </span>
              {list.length > 0 && (
                <span className={`month__dot month__dot--${bucketOf(list[0], today, weekEnd)}`} aria-hidden="true">
                  {list.length}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function Reminders() {
  const ui = useUI()
  const save = useSave()
  const [view, setView] = useState('list')
  const [filter, setFilter] = useState('open')
  const [month, setMonth] = useState(startOfMonth(todayISO()))
  const [day, setDay] = useState(null)
  const { data: all = [], isLoading } = useReminders({ status: 'all' })

  const today = todayISO()
  // Today plus the next six days, matching the strip.
  const weekEnd = addDays(today, 6)
  const buckets = useMemo(() => {
    const b = { overdue: [], today: [], week: [], later: [], done: [] }
    for (const r of all) b[bucketOf(r, today, weekEnd)].push(r)
    b.done.sort((x, y) => (y.done_at ?? '').localeCompare(x.done_at ?? ''))
    return b
  }, [all, today, weekEnd])
  const openCount = all.length - buckets.done.length

  // "week" holds today + 6 days for the strip; the list groups use the classic buckets.
  const isDay = /^\d{4}-\d{2}-\d{2}$/.test(filter)
  const titles = { overdue: 'Overdue', today: 'Today', week: 'Next 7 days', later: 'Later', done: 'Done' }
  const hints = { overdue: 'follow up now', today: 'due today', week: 'coming up', later: 'after next week', done: 'most recent first' }
  const sections = isDay
    ? [
        {
          key: 'day',
          bucket: filter === today ? 'today' : 'week',
          title: filter === today ? 'Today' : formatFullDate(filter),
          items: all.filter((r) => !r.done_at && r.due_date === filter),
        },
      ]
    : filter === 'open'
      ? ['overdue', 'today', 'week', 'later']
          .map((k) => ({ key: k, bucket: k, title: titles[k], hint: hints[k], items: buckets[k] }))
          .filter((x) => x.items.length)
      : [{ key: filter, bucket: filter, title: titles[filter], hint: hints[filter], items: buckets[filter] }]

  const calendarItems = all.filter((r) => !r.done_at)
  const dayItems = day ? all.filter((r) => r.due_date === day) : []
  const thisWeek = buckets.today.length + buckets.week.length

  return (
    <div className="page">
      <Hero
        title="Reminders"
        subtitle={openCount ? `${thisWeek} due this week · ${openCount} open in all` : 'Nothing open. You’re all caught up.'}
        actions={
          <>
            <Segmented
              label="View"
              value={view}
              onChange={(v) => {
                setView(v)
                setDay(null)
              }}
              options={[
                { value: 'list', label: 'Agenda', icon: <List size={15} aria-hidden="true" /> },
                { value: 'calendar', label: 'Calendar', icon: <CalendarDays size={15} aria-hidden="true" /> },
              ]}
            />
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => ui.newReminder(day ? { due_date: day } : isDay ? { due_date: filter } : undefined)}
            >
              <Plus size={17} aria-hidden="true" /> New reminder
            </button>
          </>
        }
        stats={
          openCount
            ? [
                {
                  label: 'Overdue',
                  tone: 'danger',
                  value: buckets.overdue.length,
                  hint: buckets.overdue.length ? 'Needs a call or a message' : 'Nothing late',
                  featured: buckets.overdue.length > 0,
                },
                { label: 'Due today', tone: 'attn', value: buckets.today.length, hint: 'Today' },
                { label: 'Next 7 days', tone: 'in', value: buckets.week.length, hint: 'Coming up' },
                { label: 'Open in all', value: openCount, hint: `${buckets.done.length} done` },
              ]
            : null
        }
      />

      {view === 'list' && <WeekStrip all={all} filter={filter} onFilter={setFilter} today={today} buckets={buckets} />}

      {isLoading ? (
        <p className="loading">Loading reminders…</p>
      ) : view === 'calendar' ? (
        <>
          <MonthView
            month={month}
            onMonth={setMonth}
            reminders={calendarItems}
            selected={day}
            onSelect={setDay}
            today={today}
            weekEnd={weekEnd}
          />
          {day && (
            <TimelineGroup
              id="rem-day"
              title={formatFullDate(day)}
              bucket={day === today ? 'today' : day < today ? 'overdue' : 'week'}
              count={dayItems.length}
            >
              {dayItems.length ? (
                <ReminderList items={dayItems} today={today} weekEnd={weekEnd} ui={ui} save={save} />
              ) : (
                <div className="rounded-[20px] bg-surface shadow-[var(--soft-card)] ring-1 ring-[var(--soft-ring)]">
                  <EmptyState
                    title="Nothing on this day"
                    action={
                      <button type="button" className="btn btn--primary" onClick={() => ui.newReminder({ due_date: day })}>
                        Add a reminder for this day
                      </button>
                    }
                  />
                </div>
              )}
            </TimelineGroup>
          )}
        </>
      ) : sections.every((x) => x.items.length === 0) ? (
        <section className="rounded-[20px] bg-surface shadow-[var(--soft-card)] ring-1 ring-[var(--soft-ring)]">
          <EmptyState
            icon={<BellRing size={22} />}
            title={filter === 'open' ? 'You’re all caught up' : `Nothing for ${sections[0].title}`}
            action={
              filter === 'open' ? (
                <button type="button" className="btn btn--primary" onClick={() => ui.newReminder()}>
                  New reminder
                </button>
              ) : (
                <div className="empty__actions">
                  <button type="button" className="btn" onClick={() => setFilter('open')}>
                    Show all open
                  </button>
                  {isDay && (
                    <button type="button" className="btn btn--primary" onClick={() => ui.newReminder({ due_date: filter })}>
                      Add one for this day
                    </button>
                  )}
                </div>
              )
            }
          >
            {filter === 'open' && 'Reminders you set on pending entries also show up here.'}
          </EmptyState>
        </section>
      ) : (
        <div className="flex flex-col gap-6">
          {sections.map((x) => (
            <TimelineGroup key={x.key} id={`rem-${x.key}`} title={x.title} hint={x.hint} bucket={x.bucket} count={x.items.length}>
              <ReminderList items={x.items} today={today} weekEnd={weekEnd} ui={ui} save={save} />
            </TimelineGroup>
          ))}
        </div>
      )}
    </div>
  )
}

export default Reminders
