import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { money } from '../lib/format.js'

export function Amount({ value, type, className = '', strong = false }) {
  const signed = type === 'out' ? -Math.abs(value) : Math.abs(value)
  return (
    <span className={`amount amount--${type} ${strong ? 'amount--strong' : ''} ${className}`}>
      {money(signed, { sign: true })}
    </span>
  )
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
      {icon && <div className="empty__icon" aria-hidden="true">{icon}</div>}
      <p className="empty__title">{title}</p>
      {children && <p className="empty__body">{children}</p>}
      {action}
    </div>
  )
}

// Same header as the other pages: a large title, a short line under it, actions on the right.
export function PageHeader({ title, description, actions, icon }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 pt-7">
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-surface text-ink-2" aria-hidden="true">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h1 className="m-0 text-[26px] leading-tight font-extrabold tracking-tight text-ink">{title}</h1>
          {description && <p className="m-0 mt-1 max-w-[70ch] text-[15px] font-semibold text-ink-3">{description}</p>}
        </div>
      </div>
      {actions && <div className="toolbar">{actions}</div>}
    </header>
  )
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

