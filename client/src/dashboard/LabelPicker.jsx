import { useEffect, useId, useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../api.js'
import { useLabels } from '../lib/queries.js'

export function LabelDot({ color }) {
  return <span className="label-dot" style={{ background: color }} aria-hidden="true" />
}

export function LabelChip({ name, color }) {
  if (!name) return null
  return (
    <span className="label-chip">
      <LabelDot color={color} />
      {name}
    </span>
  )
}

// Pick a saved label by typing, or create a new one from what was typed.
function LabelPicker({ id, value, onChange, invalid }) {
  const listId = useId()
  const client = useQueryClient()
  const { data: labels = [] } = useLabels()
  const [query, setQuery] = useState(value?.name ?? '')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [error, setError] = useState('')
  const wrapRef = useRef(null)

  useEffect(() => {
    setQuery(value?.name ?? '')
  }, [value?.id, value?.name])

  useEffect(() => {
    function handle(e) {
      if (!wrapRef.current?.contains(e.target)) {
        setOpen(false)
        setQuery(value?.name ?? '')
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [value?.name])

  const typed = query.trim()
  const matches = labels.filter((l) => l.name.toLowerCase().includes(typed.toLowerCase())).slice(0, 8)
  const exact = labels.some((l) => l.name.toLowerCase() === typed.toLowerCase())
  const options = [
    ...matches.map((label) => ({ kind: 'label', label })),
    ...(typed && !exact ? [{ kind: 'create' }] : []),
  ]

  async function choose(option) {
    setError('')
    if (option.kind === 'label') {
      onChange({ id: option.label.id, name: option.label.name, color: option.label.color })
      setQuery(option.label.name)
    } else {
      try {
        const created = await api('/labels', { method: 'POST', body: { name: typed } })
        client.invalidateQueries({ queryKey: ['labels'] })
        onChange({ id: created.id, name: created.name, color: created.color })
        setQuery(created.name)
      } catch (err) {
        setError(err.message)
        return
      }
    }
    setOpen(false)
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((a) => Math.min(a + 1, options.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && open && options[active]) {
      e.preventDefault()
      choose(options[active])
    } else if (e.key === 'Escape' && open) {
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
    }
  }

  return (
    <div className="picker" ref={wrapRef}>
      <div className="picker__control">
        {value && <LabelDot color={value.color} />}
        <input
          id={id}
          className={`field ${value ? 'field--with-dot' : ''}`}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && options[active] ? `${listId}-${active}` : undefined}
          aria-invalid={invalid || undefined}
          autoComplete="off"
          placeholder="Choose or create a label"
          value={query}
          maxLength={40}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActive(0)
            if (value) onChange(null)
          }}
          onKeyDown={onKeyDown}
        />
        {value && (
          <button
            type="button"
            className="picker__clear"
            aria-label="Remove label"
            onClick={() => {
              onChange(null)
              setQuery('')
            }}
          >
            <X size={15} />
          </button>
        )}
      </div>
      {open && options.length > 0 && (
        <ul className="picker__list" id={listId} role="listbox">
          {options.map((o, i) => (
            <li
              key={o.kind === 'label' ? o.label.id : 'create'}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className="picker__option"
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault()
                choose(o)
              }}
            >
              {o.kind === 'label' ? (
                <>
                  <span className="picker__name picker__name--label">
                    <LabelDot color={o.label.color} />
                    {o.label.name}
                  </span>
                  <span className="picker__meta">{o.label.count === 1 ? '1 entry' : `${o.label.count} entries`}</span>
                </>
              ) : (
                <span className="picker__create">
                  <Plus size={15} aria-hidden="true" /> Create label “{typed}”
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {open && options.length === 0 && !typed && (
        <div className="picker__list picker__list--empty">No labels yet. Type a name to create one.</div>
      )}
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  )
}

export default LabelPicker
