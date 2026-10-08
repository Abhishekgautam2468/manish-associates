import { useId, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Check, ChevronDown, Download, Keyboard, KeyRound, Monitor, Moon, Palette, Percent, Plus, Sun, UserRound, X } from 'lucide-react'
import { api } from '../../api.js'
import { useUI } from '../../dashboard/ui.jsx'
import { useLabels, useSave, useSettings } from '../../lib/queries.js'
import { commissionRule } from '../../lib/commission.js'
import { money } from '../../lib/format.js'
import { Avatar, PageHeader, Segmented } from '../../dashboard/bits.jsx'
import { Card } from '../../dashboard/tw.jsx'

function ChangePassword({ onDone }) {
  const ui = useUI()
  const ids = { current: useId(), next: useId(), confirm: useId() }
  const [v, setV] = useState({ current: '', next: '', confirm: '' })
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setError(null)
    if (v.next !== v.confirm) {
      setError({ field: 'confirm', message: 'The two new passwords don’t match.' })
      return
    }
    setSaving(true)
    try {
      await api('/auth/change-password', { method: 'POST', body: { currentPassword: v.current, password: v.next } })
      ui.toast('Password changed')
      setV({ current: '', next: '', confirm: '' })
      onDone()
    } catch (err) {
      setError({ field: err.data?.field, message: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="mt-3 flex flex-col gap-3 border-t border-line-soft pt-3" onSubmit={submit}>
      <div>
        <label className="label" htmlFor={ids.current}>
          Current password
        </label>
        <input
          id={ids.current}
          className="field"
          type="password"
          autoComplete="current-password"
          value={v.current}
          onChange={set('current')}
          required
          aria-invalid={error?.field === 'currentPassword' || undefined}
        />
      </div>
      <div>
        <label className="label" htmlFor={ids.next}>
          New password
        </label>
        <input
          id={ids.next}
          className="field"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          minLength={8}
          value={v.next}
          onChange={set('next')}
          required
          aria-invalid={error?.field === 'password' || undefined}
        />
      </div>
      <div>
        <label className="label" htmlFor={ids.confirm}>
          Confirm new password
        </label>
        <input
          id={ids.confirm}
          className="field"
          type="password"
          autoComplete="new-password"
          placeholder="Type it again"
          minLength={8}
          value={v.confirm}
          onChange={set('confirm')}
          required
          aria-invalid={error?.field === 'confirm' || undefined}
        />
      </div>
      {error && (
        <p className="field-error m-0" role="alert">
          {error.message}
        </p>
      )}
      <p className="m-0 text-xs text-ink-3">Changing it signs you out on every other device.</p>
      <div className="flex gap-2">
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save password'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  )
}

const SHORTCUTS = [
  ['N', 'New entry'],
  ['/ or Ctrl K', 'Search people and entries'],
  ['Esc', 'Close a window'],
  ['← →', 'Move between days on a chart'],
]

// Commission for services: a default %, a minimum, and optional slabs by amount.
const EXAMPLES = [50000, 500000, 2500000, 10000000] // paise: ₹500, ₹5,000, ₹25,000, ₹1,00,000

const fromSaved = (data) => ({
  rate: String(data.commission_percent),
  min: data.min_commission ? String(data.min_commission) : '',
  slabs: data.slabs.map((x) => ({ up_to: x.up_to == null ? '' : String(x.up_to), percent: String(x.percent) })),
})

const rupee = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

function MoneyInput({ prefix, suffix, className = '', ...rest }) {
  return (
    <span className={`relative block min-w-0 ${className}`}>
      {prefix && (
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-bold text-ink-3">{prefix}</span>
      )}
      <input
        className={`field h-10 min-h-10 w-full py-0 text-sm tabular-nums ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-8' : ''}`}
        inputMode="decimal"
        {...rest}
      />
      {suffix && (
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm font-bold text-ink-3">{suffix}</span>
      )}
    </span>
  )
}

function CommissionSetting() {
  const ui = useUI()
  const ids = { rate: useId(), min: useId(), own: useId() }
  const save = useSave()
  const { data } = useSettings()
  const { data: labels = [] } = useLabels()
  const [draft, setDraft] = useState(null)
  const [error, setError] = useState('')
  const v = draft ?? (data ? fromSaved(data) : null)
  if (!v) return <p className="loading">Loading…</p>

  const change = (patch) => setDraft({ ...v, ...patch })
  const setSlab = (i, patch) => change({ slabs: v.slabs.map((x, j) => (j === i ? { ...x, ...patch } : x)) })
  const bySlab = v.slabs.length > 0
  const preview = {
    commission_percent: Number(v.rate) || 0,
    min_commission: Number(v.min) || 0,
    slabs: v.slabs.map((x, i) => ({ up_to: i === v.slabs.length - 1 ? null : Number(x.up_to) || 0, percent: Number(x.percent) || 0 })),
  }
  const ownRate = labels.filter((l) => l.flow && l.commission_percent != null)

  function setMode(mode) {
    if (mode === 'slabs' && !bySlab) {
      const rate = Number(v.rate) || 1
      change({
        slabs: [
          { up_to: '10000', percent: String(rate) },
          { up_to: '', percent: String(Math.max(0, Math.round((rate - 0.2) * 100) / 100)) },
        ],
      })
    }
    if (mode === 'one' && bySlab) change({ slabs: [] })
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    try {
      await save.mutateAsync({
        path: '/settings',
        method: 'PUT',
        body: {
          commission_percent: v.rate,
          min_commission: v.min || 0,
          slabs: v.slabs.map((x, i) => ({ up_to: i === v.slabs.length - 1 ? null : x.up_to, percent: x.percent })),
        },
      })
      setDraft(null)
      ui.toast('Commission saved')
    } catch (err) {
      setError(err.message)
    }
  }

  async function applySettingsTo(label) {
    try {
      await save.mutateAsync({
        path: `/labels/${label.id}`,
        method: 'PUT',
        body: {
          name: label.name,
          color: label.color,
          flow: label.flow,
          commission_percent: '',
          received_mode: label.received_mode,
          paid_mode: label.paid_mode,
        },
      })
      ui.toast(`${label.name} now uses these settings`)
    } catch (err) {
      ui.toast(err.message, 'error')
    }
  }

  const minimum = (
    <div>
      <label className="label" htmlFor={ids.min}>
        Minimum commission <span className="label__optional">(optional)</span>
      </label>
      <MoneyInput
        id={ids.min}
        prefix="₹"
        placeholder="No minimum"
        value={v.min}
        onChange={(e) => change({ min: e.target.value.replace(/[^\d.]/g, '') })}
      />
    </div>
  )

  return (
    <form onSubmit={submit} noValidate className="flex flex-col">
      <div className="flex flex-col gap-5 p-4 sm:p-5">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold text-ink">How you charge</span>
          <div className="sm:w-fit">
            <Segmented
              label="How you charge"
              value={bySlab ? 'slabs' : 'one'}
              onChange={setMode}
              options={[
                { value: 'one', label: 'One rate for all' },
                { value: 'slabs', label: 'Rate by amount' },
              ]}
            />
          </div>
        </div>

        {bySlab ? (
          <div className="flex flex-col gap-3">
            <div className="overflow-hidden rounded-xl border border-line">
              <div className="grid grid-cols-[minmax(0,1fr)_6.5rem_2.5rem] gap-2 border-b border-line-soft bg-surface-2 px-3 py-2 text-xs font-bold text-ink-3">
                <span>Amount</span>
                <span>Commission</span>
                <span />
              </div>
              <ol className="m-0 flex list-none flex-col p-0">
                {v.slabs.map((x, i) => {
                  const last = i === v.slabs.length - 1
                  const from = i === 0 ? 0 : Number(v.slabs[i - 1].up_to) || 0
                  return (
                    <li
                      key={i}
                      className="grid grid-cols-[minmax(0,1fr)_6.5rem_2.5rem] items-end gap-2 border-b border-line-soft px-3 py-2.5 last:border-b-0"
                    >
                      <div className="min-w-0">
                        <span className="mb-1 block text-xs font-semibold text-ink-3">
                          {last ? (i === 0 ? 'Any amount' : `Above ${rupee(from)}`) : `${rupee(from)} up to`}
                        </span>
                        {last ? (
                          <span className="flex h-10 items-center rounded-[10px] border border-dashed border-line px-3 text-sm text-ink-3">
                            No upper limit
                          </span>
                        ) : (
                          <MoneyInput
                            aria-label={`Slab ${i + 1} up to`}
                            prefix="₹"
                            value={x.up_to}
                            onChange={(e) => setSlab(i, { up_to: e.target.value.replace(/[^\d]/g, '') })}
                          />
                        )}
                      </div>
                      <MoneyInput
                        aria-label={`Slab ${i + 1} percent`}
                        suffix="%"
                        value={x.percent}
                        onChange={(e) => setSlab(i, { percent: e.target.value.replace(/[^\d.]/g, '') })}
                      />
                      {v.slabs.length > 2 ? (
                        <button
                          type="button"
                          className="icon-button size-10"
                          aria-label={`Remove slab ${i + 1}`}
                          onClick={() => change({ slabs: v.slabs.filter((_, j) => j !== i) })}
                        >
                          <X size={16} />
                        </button>
                      ) : (
                        <span />
                      )}
                    </li>
                  )
                })}
              </ol>
            </div>
            {v.slabs.length < 10 && (
              <button
                type="button"
                className="btn btn--ghost btn--sm self-start"
                onClick={() => {
                  const prev = v.slabs.at(-2)
                  const next = String((Number(prev?.up_to) || 10000) * 5)
                  change({ slabs: [...v.slabs.slice(0, -1), { up_to: next, percent: v.slabs.at(-1).percent }, v.slabs.at(-1)] })
                }}
              >
                <Plus size={15} aria-hidden="true" /> Add a slab
              </button>
            )}
            <div className="sm:max-w-[50%]">{minimum}</div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor={ids.rate}>
                Commission
              </label>
              <MoneyInput
                id={ids.rate}
                suffix="%"
                value={v.rate}
                onChange={(e) => change({ rate: e.target.value.replace(/[^\d.]/g, '') })}
              />
            </div>
            {minimum}
          </div>
        )}

        {/* What these settings earn on a few amounts */}
        <div>
          <p className="m-0 mb-2 text-sm font-bold text-ink">What you’d earn</p>
          <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))] gap-2">
            {EXAMPLES.map((amt) => {
              const r = commissionRule(amt, preview)
              return (
                <div key={amt} className="rounded-xl border border-line-soft bg-surface-2 px-3 py-2.5">
                  <dt className="text-xs font-semibold text-ink-3">on {money(amt)}</dt>
                  <dd className="m-0 mt-0.5 text-lg leading-tight font-extrabold text-ok tabular-nums">{money(r.fee)}</dd>
                  <dd className="m-0 text-[11px] font-semibold text-ink-3">{r.min ? 'the minimum' : `at ${r.percent}%`}</dd>
                </div>
              )
            })}
          </dl>
        </div>

        {ownRate.length > 0 && (
          <details className="group rounded-xl border border-attn-line bg-attn-soft/50">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 text-sm font-bold text-ink [&::-webkit-details-marker]:hidden">
              <span className="flex-1">
                {ownRate.length} {ownRate.length === 1 ? 'service uses its' : 'services use their'} own % instead
              </span>
              <ChevronDown size={16} className="text-ink-3 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <ul className="m-0 flex list-none flex-col border-t border-attn-line p-0">
              {ownRate.map((l) => (
                <li
                  key={l.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-attn-line/60 px-3 py-2 text-sm last:border-b-0"
                >
                  <span className="min-w-0 text-ink-2">
                    {l.name} <strong className="ml-1 font-bold text-ink">{l.commission_percent}%</strong>
                  </span>
                  <button type="button" className="btn btn--sm btn--ghost" onClick={() => applySettingsTo(l)} disabled={save.isPending}>
                    Use these settings
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}

        {error && (
          <p className="field-error m-0" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t border-line-soft bg-surface-2/60 px-4 py-3 sm:px-5">
        <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${draft ? 'text-attn' : 'text-ink-3'}`}>
          {draft ? <span className="size-2 rounded-full bg-attn" aria-hidden="true" /> : <Check size={15} aria-hidden="true" />}
          {draft ? 'Unsaved changes' : 'All changes saved'}
        </span>
        <div className="flex gap-2">
          {draft && (
            <button type="button" className="btn btn--ghost" onClick={() => setDraft(null)}>
              Cancel
            </button>
          )}
          <button type="submit" className="btn btn--primary" disabled={save.isPending || !draft}>
            {save.isPending ? 'Saving…' : 'Save commission'}
          </button>
        </div>
      </div>
    </form>
  )
}

function CommissionSummary() {
  const { data } = useSettings()
  if (!data) return null
  const text = data.slabs.length ? `${data.slabs.length} rates by amount` : `${data.commission_percent}%`
  return (
    <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold whitespace-nowrap text-brand-text">
      {text}
      {data.min_commission ? `, min ${rupee(data.min_commission)}` : ''}
    </span>
  )
}

// A small drawing of the dashboard in each theme.
function ThemePreview({ mode }) {
  const light = { bg: '#f6f5fb', bar: '#ffffff', line: '#e3e2ec', side: '#16182b' }
  const dark = { bg: '#0f121a', bar: '#1b1f2a', line: '#2a2f3c', side: '#07080c' }
  const half = (c, clip) => (
    <span className="absolute inset-0 flex" style={{ background: c.bg, clipPath: clip }}>
      <span className="h-full w-1/4" style={{ background: c.side }} />
      <span className="flex flex-1 flex-col gap-1 p-1.5">
        <span className="h-1.5 w-3/5 rounded-full bg-[#6d4aff]" />
        <span className="h-3 rounded" style={{ background: c.bar, border: `1px solid ${c.line}` }} />
        <span className="h-3 rounded" style={{ background: c.bar, border: `1px solid ${c.line}` }} />
      </span>
    </span>
  )
  return (
    <span className="relative block h-16 overflow-hidden rounded-lg border border-line" aria-hidden="true">
      {mode === 'dark' ? half(dark) : half(light)}
      {mode === 'system' && half(dark, 'polygon(100% 0, 100% 100%, 0 100%)')}
    </span>
  )
}

const THEMES = [
  { value: 'system', label: 'Device', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
]

// Who is signed in, with the password change tucked behind a button.
function AccountCard({ id, user, className }) {
  const [changing, setChanging] = useState(false)
  return (
    <Card id={id} icon={<UserRound size={18} />} title="Account" className={className}>
      <div className="flex items-center gap-3">
        <span className="[&_.avatar]:size-11 [&_.avatar]:text-[15px]">
          <Avatar name={user.username} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate text-[15px] font-bold text-ink">{user.username}</p>
          <p className="m-0 truncate text-sm text-ink-3">{user.email}</p>
        </div>
      </div>
      <p className="m-0 mt-2 text-xs text-ink-3">Password reset codes are sent to this email.</p>
      {changing ? (
        <ChangePassword onDone={() => setChanging(false)} />
      ) : (
        <button type="button" className="btn btn--ghost btn--sm mt-3" onClick={() => setChanging(true)}>
          <KeyRound size={15} aria-hidden="true" /> Change password
        </button>
      )}
    </Card>
  )
}

function Settings() {
  const { user, theme, setTheme } = useOutletContext()

  return (
    <div className="page page--settings">
      <PageHeader title="Settings" description="Your commission, your account and how the dashboard looks." />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Phones and tablets: account first. */}
        <AccountCard id="set-account-top" user={user} className="xl:hidden" />

        <div className="flex min-w-0 flex-col gap-5">
          <Card id="set-commission" icon={<Percent size={18} />} tone="brand" title="Commission" aside={<CommissionSummary />} flush>
            <p className="m-0 border-b border-line-soft px-4 py-3 text-sm text-ink-3 sm:px-5">
              Your fee on cash withdrawals and money transfers. You can still change it on any entry.
            </p>
            <CommissionSetting />
          </Card>

          <Card id="set-keys" icon={<Keyboard size={18} />} title="Keyboard shortcuts" className="max-md:hidden">
            <ul className="m-0 grid list-none gap-x-8 gap-y-2 p-0 sm:grid-cols-2">
              {SHORTCUTS.map(([key, label]) => (
                <li key={key} className="flex items-center justify-between gap-3 text-sm text-ink-2">
                  {label}
                  <kbd className="rounded-md border border-b-2 border-line bg-surface-2 px-1.5 py-0.5 font-sans text-xs font-bold text-ink">
                    {key}
                  </kbd>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="grid min-w-0 items-start gap-5 md:grid-cols-2 xl:grid-cols-1">
          <AccountCard id="set-account" user={user} className="max-xl:hidden" />

          <Card id="set-look" icon={<Palette size={18} />} title="Appearance">
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme">
              {THEMES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={theme === value}
                  onClick={() => setTheme(value)}
                  className={`flex cursor-pointer flex-col gap-2 rounded-xl border bg-surface p-1.5 pb-2 text-left transition-colors ${
                    theme === value ? 'border-brand ring-2 ring-brand/30' : 'border-line hover:border-ink-3'
                  }`}
                >
                  <ThemePreview mode={value} />
                  <span
                    className={`flex items-center gap-1 px-0.5 text-xs font-bold ${theme === value ? 'text-brand-text' : 'text-ink-2'}`}
                  >
                    <Icon size={13} aria-hidden="true" /> {label}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          <Card id="set-backup" icon={<Download size={18} />} title="Backup">
            <p className="m-0 text-sm text-ink-3">Every person, label, entry and reminder in one file.</p>
            <a className="btn btn--ghost btn--sm mt-3" href="/api/settings/backup" download>
              <Download size={15} aria-hidden="true" /> Download backup
            </a>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Settings
