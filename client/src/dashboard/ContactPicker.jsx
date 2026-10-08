import { useEffect, useId, useRef, useState } from 'react'
import { UserPlus } from 'lucide-react'
import { api } from '../api.js'
import { useContacts } from '../lib/queries.js'
import { displayPhone } from '../lib/format.js'
import { useQueryClient } from '@tanstack/react-query'

// Search saved people by name or phone, or add a new person without leaving the form.
// With `onText`, a typed name that isn't a saved person can be used as it is (for example a transfer's receiver).
function ContactPicker({ id, value, onChange, onText, text = '', invalid, describedBy, autoFocus, placeholder = 'Search by name or phone number' }) {
  const listId = useId()
  const client = useQueryClient()
  const [query, setQuery] = useState(value?.name ?? text)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [debounced, setDebounced] = useState('')
  const [error, setError] = useState('')
  const wrapRef = useRef(null)

  useEffect(() => {
    if (value) setQuery(value.name)
    else if (!onText) setQuery('')
  }, [value?.id, value?.name]) // eslint-disable-line react-hooks/exhaustive-deps
  // A typed name set from outside (for example a saved-receiver chip) shows in the box.
  useEffect(() => {
    if (onText && !value && text !== query) setQuery(text)
  }, [text]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 150)
    return () => clearTimeout(t)
  }, [query])

  const { data: contacts = [] } = useContacts({ q: debounced, sort: debounced ? 'name' : 'recent' })
  const matches = contacts.slice(0, 8)
  const exact = matches.some((c) => c.name.toLowerCase() === query.trim().toLowerCase())
  const canCreate = query.trim().length > 0 && !exact
  const options = [
    ...(canCreate && onText ? [{ kind: 'text' }] : []),
    ...matches.map((c) => ({ kind: 'contact', contact: c })),
    ...(canCreate ? [{ kind: 'create' }] : []),
  ]

  useEffect(() => {
    function handle(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  async function choose(option) {
    setError('')
    if (option.kind === 'text') {
      onText(query.trim())
      setOpen(false)
      return
    }
    if (option.kind === 'contact') {
      onChange({ id: option.contact.id, name: option.contact.name, phone: option.contact.phone })
      setQuery(option.contact.name)
    } else {
      try {
        const created = await api('/contacts', { method: 'POST', body: { name: query } })
        client.invalidateQueries({ queryKey: ['contacts'] })
        onChange({ id: created.id, name: created.name, phone: created.phone })
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
      e.stopPropagation()
      e.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div className="picker" ref={wrapRef}>
      <input
        id={id}
        className="field"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && options[active] ? `${listId}-${active}` : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        autoComplete="off"
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          setActive(0)
          if (value) onChange(null)
          onText?.(e.target.value)
        }}
        onKeyDown={onKeyDown}
      />
      {open && options.length > 0 && (
        <ul className="picker__list" id={listId} role="listbox">
          {options.map((o, i) => (
            <li
              key={o.kind === 'contact' ? o.contact.id : o.kind}
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
              {o.kind === 'text' ? (
                <span className="picker__create">Use “{query.trim()}” without saving</span>
              ) : o.kind === 'contact' ? (
                <>
                  <span className="picker__name">{o.contact.name}</span>
                  {o.contact.phone && <span className="picker__meta">{displayPhone(o.contact.phone)}</span>}
                </>
              ) : (
                <span className="picker__create">
                  <UserPlus size={15} aria-hidden="true" /> Add “{query.trim()}” as a new person
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  )
}

export default ContactPicker
