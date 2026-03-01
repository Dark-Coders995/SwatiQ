import { apiClient } from './client'

export type MedicineStatus = 'active' | 'low_stock' | 'expired' | 'out_of_stock'

export type Medicine = {
  id: number
  name: string
  generic_name: string
  category: string
  batch_no: string
  expiry_date: string
  quantity: number
  cost_price: number
  mrp: number
  supplier: string
  status: MedicineStatus
}

export type InventoryOverview = {
  total_items: number
  active_stock: number
  low_stock: number
  total_value: number
}

export type MedicinesListResponse = {
  items: Medicine[]
  total: number
}

export type MedicinePayload = {
  name: string
  generic_name: string
  category: string
  batch_no: string
  expiry_date: string
  quantity: number
  cost_price: number
  mrp: number
  supplier: string
}

export const inventoryApi = {
  getOverview: () => apiClient.get<InventoryOverview>('/api/inventory/overview'),
  listMedicines: (params: { search?: string; status?: MedicineStatus; category?: string }) => {
    const query = new URLSearchParams()
    if (params.search) query.set('search', params.search)
    if (params.status) query.set('status', params.status)
    if (params.category) query.set('category', params.category)
    const path = `/api/inventory/medicines${query.toString() ? `?${query}` : ''}`
    return apiClient.get<MedicinesListResponse>(path)
  },
  addMedicine: (payload: MedicinePayload) =>
    apiClient.post<Medicine>('/api/inventory/medicines', payload),
  updateMedicine: (id: number, payload: MedicinePayload) =>
    apiClient.put<Medicine>(`/api/inventory/medicines/${id}`, payload),
  updateStatus: (id: number, status: MedicineStatus) =>
    apiClient.patch<Medicine>(`/api/inventory/medicines/${id}/status`, { status }),
}

