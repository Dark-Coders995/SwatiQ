import { apiClient } from './client'

export type TodaySalesSummary = {
  total_amount: number
  change_percent: number
  orders_count: number
}

export type ItemsSoldToday = {
  items_sold: number
}

export type LowStockSummary = {
  count: number
  items: { id: number; name: string; quantity: number }[]
}

export type PurchaseOrdersSummary = {
  pending_count: number
  total_value: number
}

export type RecentSale = {
  id: number
  invoice_no: string
  patient_name: string
  items_count: number
  payment_method: string
  total_amount: number
  created_at: string
}

export const dashboardApi = {
  getTodaySalesSummary: () =>
    apiClient.get<TodaySalesSummary>('/api/dashboard/today-sales-summary'),
  getItemsSoldToday: () =>
    apiClient.get<ItemsSoldToday>('/api/dashboard/items-sold-today'),
  getLowStockItems: () =>
    apiClient.get<LowStockSummary>('/api/dashboard/low-stock-items'),
  getPurchaseOrdersSummary: () =>
    apiClient.get<PurchaseOrdersSummary>('/api/dashboard/purchase-orders-summary'),
  getRecentSales: () =>
    apiClient.get<RecentSale[]>('/api/dashboard/recent-sales'),
}

