import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MoreHorizontal } from 'lucide-react'
import { money } from '../lib/format.js'

export function Amount({ value, type, className = '', strong = false }) {
  const signed = type === 'out' ? -Math.abs(value) : Math.abs(value)
  return <span className={`amount amount--${type} ${strong ? 'amount--strong' : ''} ${className}`}>{money(signed, { sign: true })}</span>
}

export function Segmented({ label, value, onChange, options, size }) {
  return (
    <div className={`segmented ${size ? `segmented--${size}` : ''}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className="segmented__option"
          data-tone={o.tone}
          onClick={() => onChange(o.value)}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function EmptyState({ icon, title, children, action }) {
  return (
    <div className="empty">
      {icon && (
        <div className="empty__icon" aria-hidden="true">
          {icon}
        </div>
      )}
      <p className="empty__title">{title}</p>
      {children && <p className="empty__body">{children}</p>}
      {action}
    </div>
  )
}

// The navy header every page opens with. It continues the dark frame, holds the page's key
// figures in glass panels, and the page's light sheet curves up into its bottom edge.
//   eyebrow: a small line above the title (a date, a back link)
//   stats:   [{ label, value, hint, good, tone, featured, to }]
export function Hero({ eyebrow, title, subtitle, actions, stats, children, compact = false }) {
  return (
    <header className={`hero${compact ? ' hero--compact' : ''}`}>
      <div className="hero__top">
        <div className="hero__heading">
          {eyebrow && <div className="hero__eyebrow">{eyebrow}</div>}
          <h1 className="hero__title">{title}</h1>
          {subtitle && <div className="hero__subtitle">{subtitle}</div>}
        </div>
        {actions && <div className="hero__actions">{actions}</div>}
      </div>
      {stats?.length > 0 && <HeroStats items={stats} />}
      {children}
      <span className="hero__curve" aria-hidden="true" />
    </header>
  )
}

// good: whether a rise is good news (money out rising is not). hint: text, or { text, suffix, dir }.
function HeroHint({ hint, good = 1 }) {
  if (!hint) return null
  if (typeof hint === 'string' || !hint.dir) return <p className="hero-stat__hint">{typeof hint === 'string' ? hint : hint.text}</p>
  const up = hint.dir > 0
  return (
    <p className="hero-stat__hint" title={hint.text + (hint.suffix ?? '')}>
      <span className={up * good > 0 || (!up && good < 0) ? 'hero-stat__up' : 'hero-stat__down'}>
        {up ? '↑' : '↓'} {hint.text.replace(/^[+−-]/, '')}
      </span>
      {hint.suffix && <span className="hero-stat__suffix">{hint.suffix}</span>}
    </p>
  )
}

export function HeroStats({ items }) {
  return (
    <div className={`hero-stats hero-stats--${Math.min(items.length, 4)}`} role={items.some((i) => i.onClick) ? 'tablist' : undefined}>
      {items.map((item) => {
        const cls = `hero-stat${item.featured || item.active ? ' hero-stat--featured' : ''}${item.onClick ? ' hero-stat--tab' : ''}`
        const body = (
          <>
            <p className="hero-stat__label">
              {item.tone && <span className={`hero-stat__dot hero-stat__dot--${item.tone}`} aria-hidden="true" />}
              {item.label}
            </p>
            <p className="hero-stat__value">{item.value}</p>
            <HeroHint hint={item.hint} good={item.good} />
          </>
        )
        if (item.onClick)
          return (
            <button key={item.label} type="button" role="tab" aria-selected={Boolean(item.active)} className={cls} onClick={item.onClick}>
              {body}
            </button>
          )
        return item.to ? (
          <Link key={item.label} to={item.to} className={cls}>
            {body}
          </Link>
        ) : (
          <div key={item.label} className={cls}>
            {body}
          </div>
        )
      })}
    </div>
  )
}

// Older name: a Hero with just a title, a line under it and actions.
export function PageHeader({ title, description, actions }) {
  return <Hero title={title} subtitle={description} actions={actions} compact />
}

// Same name, same colour, everywhere it appears.
function avatarTone(name = '') {
  let h = 0
  for (const ch of name.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h % 8
}

export function Avatar({ name, size }) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
  return (
    <span className={`avatar avatar--tone-${avatarTone(name)}${size ? ` avatar--${size}` : ''}`} aria-hidden="true">
      {letters}
    </span>
  )
}

export function FieldError({ id, children }) {
  if (!children) return null
  return (
    <p id={id} className="field-error" role="alert">
      {children}
    </p>
  )
}

// A small "more actions" menu. Closes on outside click, Escape, or after a choice.
export function Menu({ label, children }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
        ref.current?.querySelector('button')?.focus()
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  return (
    <div className="menu" ref={ref}>
      <button
        type="button"
        className="icon-button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        title="More"
        onClick={() => setOpen((o) => !o)}
      >
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div className="menu__list" role="menu" onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  )
}

export function MenuItem({ icon, danger, onSelect, children }) {
  return (
    <button type="button" role="menuitem" className={`menu__item${danger ? ' menu__item--danger' : ''}`} onClick={onSelect}>
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </button>
  )
}
