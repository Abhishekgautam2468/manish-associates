import { Link } from 'react-router-dom'
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react'

// Shared Tailwind building blocks for dashboard pages.

const TONE_TILE = {
  neutral: 'border border-line-soft bg-surface-2 text-ink-2',
  brand: 'bg-brand-soft text-brand',
  attn: 'bg-attn-soft text-attn',
  danger: 'bg-danger-soft text-danger',
  in: 'bg-in-soft text-in',
}

// A card with an icon-tile header, a dividing line and an optional item on the right.
export function Card({ id, icon, tone = 'neutral', title, aside, flush = false, className = '', children }) {
  return (
    <section
      aria-labelledby={id}
      className={`flex min-w-0 flex-col rounded-[20px] bg-surface shadow-[var(--soft-card)] ring-1 ring-[var(--soft-ring)] ${className}`}
    >
      <header className="flex min-h-16 items-center gap-3 border-b border-line-soft px-4 py-3 sm:px-5">
        <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl ${TONE_TILE[tone]}`} aria-hidden="true">
          {icon}
        </span>
        <h2 id={id} className="m-0 min-w-0 flex-1 text-base font-bold tracking-tight text-ink">
          {title}
        </h2>
        {aside && <div className="flex shrink-0 items-center">{aside}</div>}
      </header>
      <div className={flush ? '' : 'p-4 sm:p-5'}>{children}</div>
    </section>
  )
}

const BADGE_TONE = {
  ok: 'border-ok/25 bg-ok-soft text-ok',
  danger: 'border-danger/25 bg-danger-soft text-danger',
  attn: 'border-attn-line bg-attn-soft text-attn',
}

export function Badge({ tone, children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${BADGE_TONE[tone]}`}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  )
}

const CHIP_TONE = {
  danger: 'border-danger/25 bg-danger-soft text-danger',
  attn: 'border-attn-line bg-attn-soft text-attn',
  neutral: 'border-line bg-surface text-ink-2',
}

export function HeaderChip({ to, tone, icon, children }) {
  return (
    <Link
      to={to}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold whitespace-nowrap no-underline transition-opacity hover:opacity-80 ${CHIP_TONE[tone]}`}
    >
      <span aria-hidden="true" className="inline-flex">
        {icon}
      </span>
      {children}
    </Link>
  )
}

export function CardLink({ to, children, className = '' }) {
  return (
    <Link
      to={to}
      className={`inline-flex min-h-8 items-center gap-1 text-sm font-bold text-brand-text no-underline hover:underline ${className}`}
    >
      {children} <ArrowRight size={14} aria-hidden="true" />
    </Link>
  )
}

const STAT_TILE = {
  in: 'bg-in-soft text-in',
  out: 'bg-out-soft text-out',
  attn: 'bg-attn-soft text-attn',
}

// good: whether a rise is good news (money out rising is not).
function Trend({ hint, good = 1, featured }) {
  if (typeof hint === 'string' || !hint.dir) {
    const text = typeof hint === 'string' ? hint : hint.text
    return <p className={`m-0 text-xs font-semibold ${featured ? 'text-white/60' : 'text-ink-3'}`}>{text}</p>
  }
  const positive = hint.dir * good > 0
  const Icon = hint.dir > 0 ? TrendingUp : TrendingDown
  const tone = featured ? 'bg-white/12 text-white' : positive ? 'bg-ok-soft text-ok' : 'bg-danger-soft text-danger'
  return (
    <p
      className={`m-0 inline-flex max-w-full items-center gap-1 self-start rounded-md px-1.5 py-0.5 text-xs font-bold ${tone}`}
      title={hint.text + hint.suffix}
    >
      <Icon size={13} aria-hidden="true" className="shrink-0" />
      <span className="truncate">
        {hint.text}
        <span className="hidden xl:inline">{hint.suffix}</span>
      </span>
    </p>
  )
}

export function StatCards({ items, label = 'At a glance' }) {
  return (
    <section aria-label={label} className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => {
        const featured = item.featured
        const body = (
          <>
            <div className="flex items-center justify-between gap-2">
              <p className={`m-0 truncate text-[13px] leading-snug font-bold ${featured ? 'text-white/75' : 'text-ink-2'}`}>{item.label}</p>
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-lg ${featured ? 'bg-white/12 text-white' : STAT_TILE[item.tone]}`}
                aria-hidden="true"
              >
                {item.icon}
              </span>
            </div>
            <p
              className={`m-0 mt-1 truncate text-xl leading-tight font-extrabold tracking-tight tabular-nums xl:text-[22px] ${featured ? 'text-white' : 'text-ink'}`}
            >
              {item.value}
            </p>
            <Trend hint={item.hint} good={item.good} featured={featured} />
          </>
        )
        const base = 'flex min-w-0 flex-col gap-1 rounded-2xl px-4 py-3.5 no-underline'
        return item.to ? (
          <Link
            key={item.label}
            to={item.to}
            className={`${base} border border-line bg-surface shadow-[0_1px_2px_rgb(22_24_43/0.04)] transition-colors hover:border-attn-line`}
          >
            {body}
          </Link>
        ) : (
          <div
            key={item.label}
            className={
              featured
                ? `${base} relative overflow-hidden bg-[linear-gradient(135deg,var(--side)_0%,color-mix(in_oklab,var(--side),var(--primary)_38%)_100%)] shadow-[0_10px_24px_-14px_var(--side)]`
                : `${base} border border-line bg-surface shadow-[0_1px_2px_rgb(22_24_43/0.04)]`
            }
          >
            {body}
          </div>
        )
      })}
    </section>
  )
}
