import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  BellPlus,
  BellRing,
  CheckCircle2,
  CircleHelp,
  Clock3,
  History as History_,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Tag,
  Trash2,
  TriangleAlert,
  UserPlus,
  Scale,
  XCircle,
} from 'lucide-react'
import Modal from './Modal.jsx'
import { EntryForm, LabelForm, PersonForm, ReminderForm } from './forms.jsx'
import { LabelChip } from './LabelPicker.jsx'
import { Amount, Avatar } from './bits.jsx'
import { useContact, useSave, useTransaction } from '../lib/queries.js'
import { receiptLink } from '../lib/receipt.js'
import { balanceText, displayPhone, formatFullDate, formatStamp, modeLabel, money, telLink, whatsappLink } from '../lib/format.js'

const UIContext = createContext(null)
export const useUI = () => useContext(UIContext)

let seq = 0

export function UIProvider({ children }) {
  const navigate = useNavigate()
  const [modals, setModals] = useState([])
  const [toasts, setToasts] = useState([])
  const toastTimers = useRef(new Map())

  const open = useCallback((kind, props = {}) => {
    const id = ++seq
    setModals((m) => [...m, { id, kind, props }])
    return id
  }, [])
  const close = useCallback((id) => setModals((m) => m.filter((x) => x.id !== id)), [])

  // A short message at the bottom. `actions` (optional) adds buttons such as Undo; those messages stay longer.
  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const toast = useCallback(
    (message, tone = 'done', actions = []) => {
      const id = ++seq
      setToasts((t) => [...t.slice(-2), { id, message, tone, actions }])
      toastTimers.current.set(
        id,
        setTimeout(() => dismissToast(id), actions.length ? 8000 : 3500),
      )
    },
    [dismissToast],
  )

  const confirm = useCallback((options) => new Promise((resolve) => open('confirm', { ...options, resolve })), [open])

  const value = useMemo(
    () => ({
      toast,
      confirm,
      newEntry: (defaults) => open('entry', { defaults }),
      editEntry: (entry) => open('entry', { entry }),
      viewEntry: (id) => open('entryDetail', { id }),
      // Record money towards a person's balance: money in when they owe you, money out when you hold theirs.
      recordPayment: (person) =>
        open('entry', {
          defaults: {
            type: person.balance > 0 ? 'out' : 'in',
            contact: { id: person.id, name: person.name },
            amount: Math.abs(person.balance ?? 0),
          },
        }),
      newPerson: (initialName) => open('person', { initialName }),
      editPerson: (person) => open('person', { person }),
      newReminder: (defaults) => open('reminder', { defaults }),
      newLabel: () => open('label', {}),
      editLabel: (label) => open('label', { label }),
      editReminder: (reminder) => open('reminder', { reminder }),
    }),
    [open, toast, confirm],
  )

  function renderModal({ id, kind, props }) {
    const done = () => close(id)
    switch (kind) {
      case 'entry':
        return (
          <Modal key={id} title={props.entry ? 'Edit entry' : 'New entry'} labelledBy={`entry-title-${id}`} onClose={done} size="lg">
            <EntryForm {...props} titleId={`entry-title-${id}`} toast={toast} onDone={done} onCancel={done} />
          </Modal>
        )
      case 'person':
        return (
          <Modal
            key={id}
            title={props.person ? 'Edit person' : 'Add person'}
            description={props.person ? 'Update their name, phone number or note.' : 'Save someone you receive money from or pay.'}
            icon={props.person ? <Pencil size={19} /> : <UserPlus size={19} />}
            onClose={done}
          >
            <PersonForm
              {...props}
              toast={toast}
              onDone={(saved) => {
                done()
                if (!props.person) navigate(`/dashboard/people/${saved.id}`)
              }}
              onCancel={done}
              onOpenPerson={(personId) => {
                done()
                navigate(`/dashboard/people/${personId}`)
              }}
            />
          </Modal>
        )
      case 'label':
        return (
          <Modal
            key={id}
            title={props.label ? 'Edit label' : props.defaults?.flow ? 'New service' : 'New label'}
            description={
              props.defaults?.flow || props.label?.flow
                ? 'A service fills in the entry form for you, commission included.'
                : 'Labels group entries by what they’re for.'
            }
            icon={<Tag size={19} />}
            onClose={done}
            size="md"
          >
            <LabelForm {...props} toast={toast} onDone={done} onCancel={done} />
          </Modal>
        )
      case 'reminder':
        return (
          <Modal
            key={id}
            title={props.reminder ? 'Edit reminder' : 'New reminder'}
            description="Get reminded about a payment or anything else on a date."
            icon={props.reminder ? <BellRing size={19} /> : <BellPlus size={19} />}
            tone="attn"
            onClose={done}
          >
            <ReminderForm {...props} toast={toast} onDone={done} onCancel={done} />
          </Modal>
        )
      case 'entryDetail':
        return <EntryDetail key={id} entryId={props.id} onClose={done} ui={value} navigate={navigate} />
      case 'confirm': {
        const cancel = () => {
          props.resolve(false)
          done()
        }
        return (
          <Modal
            key={id}
            title={props.title}
            description={props.body}
            icon={props.danger ? <TriangleAlert size={19} /> : <CircleHelp size={19} />}
            tone={props.danger ? 'danger' : 'neutral'}
            size="sm"
            onClose={cancel}
          >
            <footer className="modal__foot">
              <span className="modal__foot-spacer" />
              <button type="button" className="btn btn--ghost" onClick={cancel}>
                Cancel
              </button>
              <button
                type="button"
                className={`btn ${props.danger ? 'btn--danger' : 'btn--primary'}`}
                autoFocus
                onClick={() => {
                  props.resolve(true)
                  done()
                }}
              >
                {props.confirmLabel}
              </button>
            </footer>
          </Modal>
        )
      }
      default:
        return null
    }
  }

  return (
    <UIContext.Provider value={value}>
      {children}
      {modals.map(renderModal)}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.tone}`}>
            {t.tone === 'error' ? <XCircle size={18} aria-hidden="true" /> : <CheckCircle2 size={18} aria-hidden="true" />}
            <span className="toast__text">{t.message}</span>
            {t.actions?.map((a) => (
              <button
                key={a.label}
                type="button"
                className="toast__action"
                onClick={() => {
                  dismissToast(t.id)
                  a.onClick()
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
        ))}
      </div>
    </UIContext.Provider>
  )
}

/* One entry, with its payments and actions */

const FIELD_NAMES = {
  type: 'Kind',
  amount: 'Amount',
  received: 'Received',
  commission: 'Commission',
  date: 'Date',
  mode: 'Mode',
  paidMode: 'Paid by',
  contact: 'Person',
  toContact: 'Sent to',
  toName: 'Sent to',
  toAccount: 'Their account',
  label: 'Label',
  note: 'Note',
  account: 'Counted in balance',
  direction: 'Direction',
  payee: 'Given to',
}
const KIND_NAMES = { in: 'Money in', out: 'Money out', transfer: 'Withdrawal or transfer', adjust: 'Balance' }

function showValue(field, value) {
  if (value == null || value === '') return '—'
  if (['amount', 'received', 'commission'].includes(field)) return money(value)
  if (field === 'date') return formatFullDate(value)
  if (field === 'mode' || field === 'paidMode') return modeLabel(value)
  if (field === 'type') return KIND_NAMES[value] ?? value
  if (field === 'account') return value ? 'Yes' : 'No'
  if (field === 'direction') return value === 'owes_you' ? 'They owe you' : 'You owe them'
  if (field === 'payee') return value === 'self' ? 'The customer' : 'Someone else'
  return String(value)
}

// Every saved change to this entry, newest first.
function History({ items }) {
  return (
    <section className="flex flex-col gap-2" aria-label="Changes">
      <h3 className="m-0 flex items-center gap-1.5 text-xs font-bold text-ink-3">
        <History_ size={13} aria-hidden="true" /> Changes
      </h3>
      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {items.map((h, i) => (
          <li key={i} className="rounded-xl border border-line-soft px-3 py-2.5 text-xs">
            <p className="m-0 font-bold text-ink-2">{formatStamp(h.at)}</p>
            <ul className="m-0 mt-1 flex list-none flex-col gap-0.5 p-0">
              {h.changes.map((c) => (
                <li key={c.field} className="text-ink-3">
                  <span className="font-semibold text-ink-2">{FIELD_NAMES[c.field] ?? c.field}:</span>{' '}
                  <span className="line-through decoration-ink-3/50">{showValue(c.field, c.from)}</span> →{' '}
                  <strong className="font-bold text-ink">{showValue(c.field, c.to)}</strong>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  )
}

// When the entry was added and last changed. Recording a payment also counts as a change.
function SavedAt({ created, updated }) {
  const changed = updated && new Date(updated) - new Date(created) > 60_000
  return (
    <div className="mt-1 flex flex-col gap-1.5 rounded-xl bg-surface-2 px-3.5 py-3 text-xs text-ink-3">
      <p className="m-0 flex items-center gap-2" title={new Date(created).toLocaleString('en-IN')}>
        <Plus size={13} className="shrink-0" aria-hidden="true" />
        <span>
          Added <strong className="font-bold text-ink-2">{formatStamp(created)}</strong>
        </span>
      </p>
      <p className="m-0 flex items-center gap-2" title={changed ? new Date(updated).toLocaleString('en-IN') : undefined}>
        <Clock3 size={13} className="shrink-0" aria-hidden="true" />
        {changed ? (
          <span>
            Last changed <strong className="font-bold text-ink-2">{formatStamp(updated)}</strong>
          </span>
        ) : (
          <span>Not changed since it was added</span>
        )}
      </p>
    </div>
  )
}

const KIND_TITLE = { in: 'Money in', out: 'Money out', adjust: 'Balance' }

function Row({ label, children, strong }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-sm text-ink-3">{label}</dt>
      <dd className={`m-0 text-right tabular-nums ${strong ? 'text-base font-extrabold text-ink' : 'text-sm font-semibold text-ink-2'}`}>
        {children}
      </dd>
    </div>
  )
}

function EntryDetail({ entryId, onClose, ui, navigate }) {
  const { data: entry, isLoading } = useTransaction(entryId)
  const { data: contactNow } = useContact(entry?.contact_id)
  const save = useSave()

  async function handleDelete() {
    const ok = await ui.confirm({
      title: 'Delete this entry?',
      body: `This permanently removes the entry${entry.contact_name ? ` and changes ${entry.contact_name}'s balance back` : ''}.`,
      confirmLabel: 'Delete entry',
      danger: true,
    })
    if (!ok) return
    try {
      await save.mutateAsync({ path: `/transactions/${entry.id}`, method: 'DELETE' })
      ui.toast('Entry deleted')
      onClose()
    } catch (err) {
      ui.toast(err.message, 'error')
    }
  }

  const openPerson = (id) => {
    onClose()
    navigate(`/dashboard/people/${id}`)
  }

  const service = entry?.type === 'transfer'
  const withdrawal = service && entry.payee === 'self'
  const title = !entry
    ? 'Entry'
    : service
      ? entry.label_name || (withdrawal ? 'Cash withdrawal' : 'Money transfer')
      : KIND_TITLE[entry.type]
  const icon = !entry ? null : service ? (
    <ArrowLeftRight size={20} />
  ) : entry.type === 'in' ? (
    <ArrowDownLeft size={20} />
  ) : entry.type === 'out' ? (
    <ArrowUpRight size={20} />
  ) : (
    <Scale size={20} />
  )
  const tone = !entry ? 'neutral' : service ? 'neutral' : entry.type === 'adjust' ? 'attn' : entry.type

  return (
    <Modal title={title} description={entry ? formatFullDate(entry.date) : undefined} icon={icon} tone={tone} onClose={onClose}>
      {isLoading || !entry ? (
        <div className="modal__body">
          <p className="loading">Loading…</p>
        </div>
      ) : (
        <>
          <div className="modal__body detail">
            {/* Headline amount */}
            {service ? (
              <div className="grid grid-cols-3 gap-2 rounded-xl border border-line bg-surface-2 p-3 text-center">
                <div>
                  <p className="m-0 text-xs font-bold text-ink-3">
                    {entry.received ? (withdrawal ? 'Paid you' : 'Gave you') : 'Came from'}
                  </p>
                  <p className="m-0 mt-0.5 text-lg font-extrabold text-in tabular-nums">{entry.received ? money(entry.received) : '—'}</p>
                  <p className="m-0 text-[11px] text-ink-3">{entry.received ? modeLabel(entry.mode) : 'what you hold'}</p>
                </div>
                <div>
                  <p className="m-0 text-xs font-bold text-ink-3">{withdrawal ? 'You gave' : 'You sent'}</p>
                  <p className="m-0 mt-0.5 text-lg font-extrabold text-out tabular-nums">{money(entry.amount)}</p>
                  <p className="m-0 text-[11px] text-ink-3">{modeLabel(entry.paid_mode ?? entry.mode)}</p>
                </div>
                <div>
                  <p className="m-0 text-xs font-bold text-ink-3">Commission</p>
                  <p className="m-0 mt-0.5 text-lg font-extrabold text-ok tabular-nums">{money(entry.commission)}</p>
                  {entry.commission > 0 && entry.commission_rate != null && (
                    <p className="m-0 text-[11px] text-ink-3">{entry.commission_rate / 100}%</p>
                  )}
                </div>
              </div>
            ) : entry.type === 'adjust' ? (
              <div className="detail__amount">
                <span className="text-2xl font-extrabold text-attn tabular-nums">{money(entry.amount)}</span>
                <span className="pill pill--pending">
                  {entry.direction === 'owes_you' ? `${entry.contact_name} owes you` : `You owe ${entry.contact_name}`}
                </span>
              </div>
            ) : (
              <div className="detail__amount">
                <Amount value={entry.amount} type={entry.type} strong />
                <span className="text-sm text-ink-3">{modeLabel(entry.mode)}</span>
              </div>
            )}

            {entry.contact_name && (
              <div className="detail__person">
                <Avatar name={entry.contact_name} />
                <div className="detail__person-main">
                  <button type="button" className="link-button detail__person-name" onClick={() => openPerson(entry.contact_id)}>
                    {entry.contact_name}
                  </button>
                  <span className="detail__person-phone">
                    {entry.contact_phone ? displayPhone(entry.contact_phone) : ''}
                    {contactNow && (
                      <span className={contactNow.balance < 0 ? 'text-attn' : contactNow.balance > 0 ? 'text-out' : 'text-ok'}>
                        {entry.contact_phone ? ' · ' : ''}
                        {contactNow.balance ? balanceText(contactNow.balance, entry.contact_name.split(' ')[0]) : 'All settled'} now
                      </span>
                    )}
                  </span>
                </div>
                {entry.contact_phone && (
                  <div className="detail__person-actions">
                    <a
                      className="icon-button icon-button--bordered"
                      href={telLink(entry.contact_phone)}
                      aria-label={`Call ${entry.contact_name}`}
                      title="Call"
                    >
                      <Phone size={16} />
                    </a>
                    <a
                      className="icon-button icon-button--bordered"
                      target="_blank"
                      rel="noreferrer"
                      href={whatsappLink(entry.contact_phone, `Namaste ${entry.contact_name},`)}
                      aria-label={`WhatsApp ${entry.contact_name}`}
                      title="WhatsApp"
                    >
                      <MessageCircle size={16} />
                    </a>
                  </div>
                )}
              </div>
            )}

            <dl className="m-0 divide-y divide-line-soft">
              {service && !withdrawal && (
                <Row label="Sent to">
                  {entry.to_contact_id ? (
                    <button type="button" className="link-button" onClick={() => openPerson(entry.to_contact_id)}>
                      {entry.to_name}
                    </button>
                  ) : (
                    entry.to_name
                  )}
                  {entry.to_account && <span className="block text-xs font-normal text-ink-3">{entry.to_account}</span>}
                </Row>
              )}
              {entry.label_name && !service && (
                <Row label="Label">
                  <LabelChip name={entry.label_name} color={entry.label_color} />
                </Row>
              )}
              {(entry.type === 'in' || entry.type === 'out') && entry.contact_name && (
                <Row label="Balance">{entry.account ? `Counted in ${entry.contact_name}'s balance` : 'Not counted in the balance'}</Row>
              )}
              {entry.note && (
                <Row label="Note">
                  <span className="whitespace-pre-wrap">{entry.note}</span>
                </Row>
              )}
            </dl>

            {entry.history?.length > 0 && <History items={entry.history} />}
            {entry.created_at && <SavedAt created={entry.created_at} updated={entry.updated_at} />}
          </div>
          <footer className="modal__foot">
            <button type="button" className="btn btn--ghost btn--danger-text" onClick={handleDelete}>
              <Trash2 size={16} aria-hidden="true" /> Delete
            </button>
            <span className="modal__foot-spacer" />
            <a
              className="btn btn--ghost"
              href={receiptLink(entry, contactNow?.balance ?? null, entry.contact_phone)}
              target="_blank"
              rel="noreferrer"
              title={entry.contact_phone ? `Send a receipt to ${entry.contact_name} on WhatsApp` : 'Send a receipt on WhatsApp'}
            >
              <MessageCircle size={16} aria-hidden="true" /> Receipt
            </a>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                onClose()
                ui.editEntry(entry)
              }}
            >
              <Pencil size={16} aria-hidden="true" /> Edit
            </button>
          </footer>
        </>
      )}
    </Modal>
  )
}
