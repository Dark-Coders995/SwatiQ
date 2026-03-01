import { useCallback, useEffect, useState } from 'react'
import type { ApiError } from '../api/client'
import { dashboardApi, type LowStockSummary, type PurchaseOrdersSummary, type RecentSale, type TodaySalesSummary } from '../api/dashboard'
import { Button } from '../components/Button'
import { ErrorBanner } from '../components/ErrorBanner'
import { Loader } from '../components/Loader'
import { StatCard } from '../components/StatCard'
import { formatDateShort, formatINR } from '../utils/format'
import './DashboardPage.css'

type DashboardState = {
  salesSummary: TodaySalesSummary | null
  itemsSold: number | null
  lowStock: LowStockSummary | null
  purchaseOrders: PurchaseOrdersSummary | null
  recentSales: RecentSale[] | null
}

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'sales' | 'purchase' | 'inventory'>('inventory')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [state, setState] = useState<DashboardState>({
    salesSummary: null,
    itemsSold: null,
    lowStock: null,
    purchaseOrders: null,
    recentSales: null,
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [salesSummary, itemsSold, lowStock, purchaseOrders, recentSales] = await Promise.all([
        dashboardApi.getTodaySalesSummary(),
        dashboardApi.getItemsSoldToday(),
        dashboardApi.getLowStockItems(),
        dashboardApi.getPurchaseOrdersSummary(),
        dashboardApi.getRecentSales(),
      ])

      setState({
        salesSummary,
        itemsSold: itemsSold.items_sold,
        lowStock,
        purchaseOrders,
        recentSales,
      })
    } catch (e) {
      setError(e as ApiError)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div>
      <div className="dash-cards">
        <StatCard
          title="Today's Sales"
          value={state.salesSummary ? formatINR(state.salesSummary.total_amount) : '—'}
          subtitle="Today's Sales"
          accent="green"
          badgeText={state.salesSummary ? `${state.salesSummary.change_percent >= 0 ? '+' : ''}${state.salesSummary.change_percent}%` : undefined}
        />
        <StatCard
          title="Items Sold Today"
          value={state.itemsSold != null ? `${state.itemsSold}` : '—'}
          subtitle={state.salesSummary ? `${state.salesSummary.orders_count} Orders` : '—'}
          accent="blue"
          badgeText={state.salesSummary ? `${state.salesSummary.orders_count} Orders` : undefined}
        />
        <StatCard
          title="Low Stock Items"
          value={state.lowStock ? `${state.lowStock.count}` : '—'}
          subtitle="Low Stock Items"
          accent="orange"
          badgeText={state.lowStock && state.lowStock.count > 0 ? 'Action Needed' : 'All Good'}
        />
        <StatCard
          title="Purchase Orders"
          value={state.purchaseOrders ? formatINR(state.purchaseOrders.total_value) : '—'}
          subtitle="Purchase Orders"
          accent="purple"
          badgeText={state.purchaseOrders ? `${state.purchaseOrders.pending_count} Pending` : undefined}
        />
      </div>

      <div className="dash-main-card">
        <div className="dash-main-header">
          <div className="dash-tabs">
            <button
              className={`dash-tab ${activeTab === 'sales' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('sales')}
            >
              Sales
            </button>
            <button
              className={`dash-tab ${activeTab === 'purchase' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('purchase')}
            >
              Purchase
            </button>
            <button
              className={`dash-tab ${activeTab === 'inventory' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('inventory')}
            >
              Inventory
            </button>
          </div>

          <div className="dash-actions">
            <Button variant="primary">New Sale</Button>
            <Button variant="secondary">New Purchase</Button>
          </div>
        </div>

        {loading && <Loader label="Fetching dashboard data…" />}
        {error && <ErrorBanner error={error} onRetry={load} />}

        {!loading && !error && (
          <div className="dash-content">
            <div className="dash-section">
              <div className="dash-section-title">Recent Sales</div>
              <div className="dash-sales-list">
                {(state.recentSales ?? []).map((s) => (
                  <div key={s.id} className="dash-sale-row">
                    <div className="dash-sale-left">
                      <div className="dash-sale-invoice">{s.invoice_no}</div>
                      <div className="dash-sale-sub">
                        {s.patient_name} • {s.items_count} items • {s.payment_method}
                      </div>
                    </div>
                    <div className="dash-sale-right">
                      <div className="dash-sale-amount">{formatINR(s.total_amount)}</div>
                      <div className="dash-sale-date">{formatDateShort(s.created_at)}</div>
                    </div>
                    <div className="dash-sale-badge">Completed</div>
                  </div>
                ))}
              </div>
            </div>

            {activeTab === 'inventory' && state.lowStock && (
              <div className="dash-section">
                <div className="dash-section-title">Low Stock Alerts</div>
                <div className="dash-low-stock">
                  {state.lowStock.items.length === 0 ? (
                    <div className="dash-empty">No low stock items.</div>
                  ) : (
                    state.lowStock.items.map((m) => (
                      <div key={m.id} className="dash-low-stock-row">
                        <div className="dash-low-stock-name">{m.name}</div>
                        <div className="dash-low-stock-qty">{m.quantity}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'purchase' && (
              <div className="dash-section">
                <div className="dash-section-title">Purchase Orders</div>
                <div className="dash-empty">
                  Summary is shown above. Full purchase management is out of scope for this task.
                </div>
              </div>
            )}

            {activeTab === 'sales' && (
              <div className="dash-section">
                <div className="dash-section-title">Sales</div>
                <div className="dash-empty">
                  Recent sales are listed above. Sale creation flow can be added next if needed.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

