import { apiClient } from '@/shared/services/api-client'
import type {
  DashboardFilterState,
  DashboardData,
  DashboardSummary,
  SalesChartPoint,
  ProductChartPoint,
  RecentTransactionItem,
  TopSpenderItem,
  StockLimitItem
} from '../types/dashboard.types'
import { resolvePresetDates } from '../utils/dashboard-date'

export interface IDashboardService {
  getDashboardData(
    filter: DashboardFilterState,
    signal?: AbortSignal,
    action?: 'view' | 'refresh' | 'filter'
  ): Promise<DashboardData>
  getSummary(filter: DashboardFilterState, signal?: AbortSignal): Promise<DashboardSummary>
  getSalesTrend(filter: DashboardFilterState, signal?: AbortSignal): Promise<SalesChartPoint[]>
  getTopProducts(filter: DashboardFilterState, signal?: AbortSignal): Promise<ProductChartPoint[]>
  getRecentTransactions(
    filter: DashboardFilterState,
    signal?: AbortSignal
  ): Promise<RecentTransactionItem[]>
  getTopSpenders(filter: DashboardFilterState, signal?: AbortSignal): Promise<TopSpenderItem[]>
  getLowStockItems(signal?: AbortSignal): Promise<StockLimitItem[]>
}

export class ApiDashboardService implements IDashboardService {
  private buildQueryParams(
    filter: DashboardFilterState,
    action?: 'view' | 'refresh' | 'filter'
  ): URLSearchParams {
    const params = new URLSearchParams()

    let startDate = filter.startDate
    let endDate = filter.endDate
    const preset = filter.preset || 'this_month'

    if (!startDate || !endDate) {
      const resolved = resolvePresetDates(preset)
      startDate = resolved.startDate
      endDate = resolved.endDate
    }

    params.set('date_from', startDate)
    params.set('date_to', endDate)
    params.set('preset', preset)
    if (action) {
      params.set('action', action)
    }

    return params
  }

  async getDashboardData(
    filter: DashboardFilterState,
    signal?: AbortSignal,
    action?: 'view' | 'refresh' | 'filter'
  ): Promise<DashboardData> {
    const params = this.buildQueryParams(filter, action)
    const res = await apiClient<DashboardData>(`/dashboard/overview?${params.toString()}`, {
      signal
    })
    return res.data
  }

  async getSummary(filter: DashboardFilterState, signal?: AbortSignal): Promise<DashboardSummary> {
    const params = this.buildQueryParams(filter)
    const res = await apiClient<DashboardSummary>(`/dashboard/summary?${params.toString()}`, {
      signal
    })
    return res.data
  }

  async getSalesTrend(
    filter: DashboardFilterState,
    signal?: AbortSignal
  ): Promise<SalesChartPoint[]> {
    const params = this.buildQueryParams(filter)
    const res = await apiClient<SalesChartPoint[]>(`/dashboard/sales-trend?${params.toString()}`, {
      signal
    })
    return res.data
  }

  async getTopProducts(
    filter: DashboardFilterState,
    signal?: AbortSignal
  ): Promise<ProductChartPoint[]> {
    const params = this.buildQueryParams(filter)
    const res = await apiClient<ProductChartPoint[]>(`/dashboard/top-products?${params.toString()}`, {
      signal
    })
    return res.data
  }

  async getRecentTransactions(
    filter: DashboardFilterState,
    signal?: AbortSignal
  ): Promise<RecentTransactionItem[]> {
    const params = this.buildQueryParams(filter)
    const res = await apiClient<RecentTransactionItem[]>(
      `/dashboard/recent-transactions?${params.toString()}`,
      { signal }
    )
    return res.data
  }

  async getTopSpenders(
    filter: DashboardFilterState,
    signal?: AbortSignal
  ): Promise<TopSpenderItem[]> {
    const params = this.buildQueryParams(filter)
    const res = await apiClient<TopSpenderItem[]>(`/dashboard/top-spenders?${params.toString()}`, {
      signal
    })
    return res.data
  }

  async getLowStockItems(signal?: AbortSignal): Promise<StockLimitItem[]> {
    const res = await apiClient<StockLimitItem[]>('/dashboard/low-stock', { signal })
    return res.data
  }
}

export const apiDashboardService = new ApiDashboardService()
export const dashboardService = apiDashboardService
