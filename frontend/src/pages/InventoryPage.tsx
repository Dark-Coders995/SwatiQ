import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { ApiError } from '../api/client'
import { inventoryApi, type Medicine, type MedicinePayload, type MedicineStatus } from '../api/inventory'
import { Button } from '../components/Button'
import { ErrorBanner } from '../components/ErrorBanner'
import { Loader } from '../components/Loader'
import { Modal } from '../components/Modal'
import { StatCard } from '../components/StatCard'
import { StatusBadge } from '../components/StatusBadge'
import { formatDateShort, formatINR } from '../utils/format'
import '../components/FormControls.css'
import './InventoryPage.css'

const emptyPayload: MedicinePayload = {
  name: '',
  generic_name: '',
  category: '',
  batch_no: '',
  expiry_date: '',
  quantity: 0,
  cost_price: 0,
  mrp: 0,
  supplier: '',
}

function badgeVariant(status: MedicineStatus): 'active' | 'low' | 'expired' | 'out' {
  switch (status) {
    case 'active':
      return 'active'
    case 'low_stock':
      return 'low'
    case 'expired':
      return 'expired'
    case 'out_of_stock':
      return 'out'
  }
}

function badgeLabel(status: MedicineStatus): string {
  switch (status) {
    case 'active':
      return 'Active'
    case 'low_stock':
      return 'Low Stock'
    case 'expired':
      return 'Expired'
    case 'out_of_stock':
      return 'Out of Stock'
  }
}

export function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [overview, setOverview] = useState<{ total_items: number; active_stock: number; low_stock: number; total_value: number } | null>(
    null,
  )
  const [items, setItems] = useState<Medicine[]>([])

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<MedicineStatus | ''>('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState<string[]>([])

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Medicine | null>(null)
  const [form, setForm] = useState<MedicinePayload>(emptyPayload)
  const [saving, setSaving] = useState(false)
  const [rowBusyId, setRowBusyId] = useState<number | null>(null)

  const filters = useMemo(
    () => ({ search: search.trim() || undefined, status: status || undefined, category: category.trim() || undefined }),
    [search, status, category],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [ov, list] = await Promise.all([inventoryApi.getOverview(), inventoryApi.listMedicines(filters)])
      setOverview(ov)
      setItems(list.items)

      if (categories.length === 0) {
        const all = await inventoryApi.listMedicines({})
        const unique = Array.from(
          new Set(all.items.map((m) => m.category).filter((c) => typeof c === 'string' && c.trim().length > 0)),
        ).sort((a, b) => a.localeCompare(b))
        setCategories(unique)
      }
    } catch (e) {
      console.error("🔥 UI Caught an Error:", e)
      setError(e as ApiError)
    } finally {
      setLoading(false)
    }
  }, [filters, categories.length])

  const openAdd = useCallback(() => {
    setEditing(null)
    setForm(emptyPayload)
    setModalOpen(true)
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load()
    }, 250)
    return () => window.clearTimeout(t)
  }, [load])

  useEffect(() => {
    if (searchParams.get('add') !== '1') return
    openAdd()
    searchParams.delete('add')
    setSearchParams(searchParams, { replace: true })
  }, [openAdd, searchParams, setSearchParams])

  function openEdit(med: Medicine) {
    setEditing(med)
    setForm({
      name: med.name,
      generic_name: med.generic_name,
      category: med.category,
      batch_no: med.batch_no,
      expiry_date: med.expiry_date,
      quantity: med.quantity,
      cost_price: med.cost_price,
      mrp: med.mrp,
      supplier: med.supplier,
    })
    setModalOpen(true)
  }

  async function save() {
    if (
      !form.name.trim() ||
      !form.generic_name.trim() ||
      !form.category.trim() ||
      !form.batch_no.trim() ||
      !form.expiry_date.trim() ||
      !form.supplier.trim()
    ) {
      setError({
        code: 'validation_error',
        message: 'Please fill all required fields (name, generic, category, batch, expiry date, supplier).',
      })
      return
    }

    setSaving(true)
    setError(null)
    try {
      if (editing) {
        await inventoryApi.updateMedicine(editing.id, {
          ...form,
          quantity: Number(form.quantity),
          cost_price: Number(form.cost_price),
          mrp: Number(form.mrp),
        })
      } else {
        await inventoryApi.addMedicine({
          ...form,
          quantity: Number(form.quantity),
          cost_price: Number(form.cost_price),
          mrp: Number(form.mrp),
        })
      }
      setModalOpen(false)
      await load()
    } catch (e) {
      setError(e as ApiError)
    } finally {
      setSaving(false)
    }
  }

  async function markStatus(id: number, nextStatus: MedicineStatus) {
    setRowBusyId(id)
    setError(null)
    try {
      await inventoryApi.updateStatus(id, nextStatus)
      await load()
    } catch (e) {
      setError(e as ApiError)
    } finally {
      setRowBusyId(null)
    }
  }

  return (
    <div>
      <div className="inv-top">
        <div>
          <div className="inv-title">Inventory Overview</div>
          <div className="inv-subtitle">Complete inventory and status overview</div>
        </div>
        <div className="inv-top-actions">
          <Button variant="secondary" onClick={load} disabled={loading}>
            Refresh
          </Button>
          <Button variant="primary" onClick={openAdd}>
            Add Medicine
          </Button>
        </div>
      </div>

      <div className="inv-cards">
        <StatCard title="Total Items" value={overview ? `${overview.total_items}` : '—'} subtitle="Total Items" accent="blue" />
        <StatCard title="Active Stock" value={overview ? `${overview.active_stock}` : '—'} subtitle="Active Stock" accent="green" />
        <StatCard title="Low Stock" value={overview ? `${overview.low_stock}` : '—'} subtitle="Low Stock" accent="orange" />
        <StatCard title="Total Value" value={overview ? formatINR(overview.total_value) : '—'} subtitle="Total Value" accent="purple" />
      </div>

      <div className="inv-table-card">
        <div className="inv-table-header">
          <div className="inv-table-title">Complete Inventory</div>
          <div className="inv-filters">
            <div className="field">
              <div className="label">Search</div>
              <input
                className="input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search medicines…"
              />
            </div>
            <div className="field">
              <div className="label">Status</div>
              <select className="select" value={status} onChange={(e) => setStatus(e.target.value as MedicineStatus | '')}>
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="low_stock">Low Stock</option>
                <option value="expired">Expired</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
          <div className="field">
            <div className="label">Category</div>
            <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          </div>
        </div>

        {loading && <Loader label="Fetching inventory…" />}
        {error && <div style={{ marginTop: 12 }}><ErrorBanner error={error} onRetry={load} /></div>}

        {!loading && !error && (
          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Medicine Name</th>
                  <th>Generic Name</th>
                  <th>Category</th>
                  <th>Batch No</th>
                  <th>Expiry Date</th>
                  <th className="num">Quantity</th>
                  <th className="num">Cost Price</th>
                  <th className="num">MRP</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th className="actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="inv-empty">
                      No medicines found.
                    </td>
                  </tr>
                ) : (
                  items.map((m) => (
                    <tr key={m.id}>
                      <td className="strong">{m.name}</td>
                      <td>{m.generic_name}</td>
                      <td>{m.category}</td>
                      <td>{m.batch_no}</td>
                      <td>{formatDateShort(m.expiry_date)}</td>
                      <td className="num">{m.quantity}</td>
                      <td className="num">{formatINR(m.cost_price)}</td>
                      <td className="num">{formatINR(m.mrp)}</td>
                      <td>{m.supplier}</td>
                      <td>
                        <StatusBadge label={badgeLabel(m.status)} variant={badgeVariant(m.status)} />
                      </td>
                      <td className="actions">
                        <Button variant="secondary" onClick={() => openEdit(m)}>
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={rowBusyId === m.id}
                          onClick={() => markStatus(m.id, 'expired')}
                        >
                          Mark Expired
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={rowBusyId === m.id}
                          onClick={() => markStatus(m.id, 'out_of_stock')}
                        >
                          Out of Stock
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        title={editing ? `Update Medicine (#${editing.id})` : 'Add Medicine'}
        onClose={() => setModalOpen(false)}
      >
        <div className="grid-2">
          <div className="field">
            <div className="label">Medicine Name *</div>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <div className="label">Generic Name *</div>
            <input
              className="input"
              value={form.generic_name}
              onChange={(e) => setForm({ ...form, generic_name: e.target.value })}
            />
          </div>
        </div>

        <div style={{ height: 12 }} />

        <div className="grid-3">
          <div className="field">
            <div className="label">Category *</div>
            <input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </div>
          <div className="field">
            <div className="label">Batch No *</div>
            <input className="input" value={form.batch_no} onChange={(e) => setForm({ ...form, batch_no: e.target.value })} />
          </div>
          <div className="field">
            <div className="label">Expiry Date *</div>
            <input
              className="input"
              type="date"
              value={form.expiry_date}
              onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
            />
          </div>
        </div>

        <div style={{ height: 12 }} />

        <div className="grid-3">
          <div className="field">
            <div className="label">Quantity</div>
            <input
              className="input"
              type="number"
              min={0}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
            />
          </div>
          <div className="field">
            <div className="label">Cost Price</div>
            <input
              className="input"
              type="number"
              min={0}
              value={form.cost_price}
              onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })}
            />
          </div>
          <div className="field">
            <div className="label">MRP</div>
            <input
              className="input"
              type="number"
              min={0}
              value={form.mrp}
              onChange={(e) => setForm({ ...form, mrp: Number(e.target.value) })}
            />
          </div>
        </div>

        <div style={{ height: 12 }} />

        <div className="field">
          <div className="label">Supplier *</div>
          <input className="input" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
          <div className="helper">Status is computed automatically from expiry date and quantity, unless manually changed.</div>
        </div>

        <div style={{ height: 14 }} />

        <div className="inv-modal-actions">
          <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Update' : 'Add'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

