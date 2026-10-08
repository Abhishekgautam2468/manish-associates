import { Link } from 'react-router-dom'
import { ArrowLeftRight, ListFilter, Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import { useLabels, useSave } from '../../lib/queries.js'
import { useUI } from '../../dashboard/ui.jsx'
import { EmptyState, PageHeader } from '../../dashboard/bits.jsx'
import { LabelChip } from '../../dashboard/LabelPicker.jsx'
import { money, relativeDay } from '../../lib/format.js'

function Labels() {
  const ui = useUI()
  const save = useSave()
  const { data: labels = [], isLoading } = useLabels()

  async function remove(label) {
    const ok = await ui.confirm({
      title: `Delete “${label.name}”?`,
      body:
        label.count > 0
          ? `${label.count === 1 ? '1 entry keeps' : `${label.count} entries keep`} their amounts and details but will no longer have this label.`
          : 'No entries use this label.',
      confirmLabel: 'Delete label',
      danger: true,
    })
    if (!ok) return
    try {
      await save.mutateAsync({ path: `/labels/${label.id}`, method: 'DELETE' })
      ui.toast('Label deleted')
    } catch (err) {
      ui.toast(err.message, 'error')
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Labels"
        description="Your services, like Cash withdrawal and Money transfer, and any other labels for grouping entries."
        actions={
          <button type="button" className="btn btn--primary" onClick={() => ui.newLabel()}>
            <Plus size={17} aria-hidden="true" /> New label
          </button>
        }
      />

      <section className="panel panel--flush">
        {isLoading ? (
          <p className="loading">Loading labels…</p>
        ) : labels.length === 0 ? (
          <EmptyState
            icon={<Tags size={22} />}
            title="No labels yet"
            action={
              <button type="button" className="btn btn--primary" onClick={() => ui.newLabel()}>
                Create a label
              </button>
            }
          >
            You can also create one while adding an entry: type a new name in the Label field.
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table table--middle">
              <thead>
                <tr>
                  <th scope="col">Label</th>
                  <th scope="col" className="num">Entries</th>
                  <th scope="col" className="num">Money in</th>
                  <th scope="col" className="num">Money out</th>
                  <th scope="col">Last used</th>
                  <th scope="col"><span className="visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {labels.map((l) => (
                  <tr key={l.id}>
                    <td data-label="Label">
                      <Link to={`/dashboard/entries?label_id=${l.id}&range=all`} className="label-link">
                        <LabelChip name={l.name} color={l.color} />
                        {l.flow && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-md whitespace-nowrap bg-brand-soft px-1.5 py-0.5 text-[11px] font-bold text-brand-text">
                            <ArrowLeftRight size={11} aria-hidden="true" />
                            {l.flow === 'withdrawal' ? 'Withdrawal' : 'Transfer'}
                            {l.commission_percent != null ? ` · ${l.commission_percent}%` : ''}
                          </span>
                        )}
                      </Link>
                    </td>
                    <td data-label="Entries" className="num">{l.count}</td>
                    <td data-label="Money in" className="num">{l.in_amount ? money(l.in_amount) : '–'}</td>
                    <td data-label="Money out" className="num">{l.out_amount ? money(l.out_amount) : '–'}</td>
                    <td data-label="Last used">{l.last_date ? relativeDay(l.last_date) : <span className="muted">Not used yet</span>}</td>
                    <td>
                      <div className="table__actions">
                        <Link
                          to={`/dashboard/entries?label_id=${l.id}&range=all`}
                          className="icon-button"
                          aria-label={`Show entries labelled ${l.name}`}
                          title="Show entries"
                        >
                          <ListFilter size={16} />
                        </Link>
                        <button type="button" className="icon-button" onClick={() => ui.editLabel(l)} aria-label={`Edit ${l.name}`} title="Edit">
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-button icon-button--danger"
                          onClick={() => remove(l)}
                          aria-label={`Delete ${l.name}`}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default Labels
