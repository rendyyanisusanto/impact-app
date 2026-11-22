import type { IDashboardService } from './dashboard.service'
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
import {
  MOCK_TRANSACTIONS,
  MOCK_STOCK_ITEMS,
  MOCK_BASE_DATE,
  type MockTransaction
} from '../mocks/dashboard.mock-data'
import { formatCurrency, formatDateShort, formatDateLabel } from '@/shared/utils/formatters'

const PRODUCT_COLORS = [
  '#0F766E', // Teal 700 (Brand Primary)
  '#0284C7', // Sky 600
  '#D97706', // Amber 600
  '#059669', // Emerald 600
  '#6366F1', // Indigo 500
  '#8B5CF6' // Violet 500
]

function resolveDateRange(filter: DashboardFilterState): { start: string; end: string } {
  const base = MOCK_BASE_DATE
  switch (filter.preset) {
    case 'today':
      return { start: base, end: base }
    case '7d':
      return { start: '2026-10-25', end: base }
    case '30d':
      return { start: '2026-10-02', end: base }
    case 'month':
      return { start: '2026-10-01', end: base }
    case 'custom':
      return {
        start: filter.startDate || '2026-10-01',
        end: filter.endDate || base
      }
    default:
      return { start: '2026-10-01', end: base }
  }
}

function filterTransactions(filter: DashboardFilterState): MockTransaction[] {
  const { start, end } = resolveDateRange(filter)
  return MOCK_TRANSACTIONS.filter(t => t.date >= start && t.date <= end)
}

export class MockDashboardService implements IDashboardService {
  private latencyMs: number

  constructor(latencyMs = 150) {
    this.latencyMs = latencyMs
  }

  private async delay(signal?: AbortSignal): Promise<void> {
    if (this.latencyMs <= 0) return
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => resolve(), this.latencyMs)
      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timer)
          reject(new DOMException('Request aborted', 'AbortError'))
        })
      }
    })
  }

  async getSummary(filter: DashboardFilterState, signal?: AbortSignal): Promise<DashboardSummary> {
    await this.delay(signal)
    const filtered = filterTransactions(filter)
    const todayTransactions = MOCK_TRANSACTIONS.filter(t => t.date === MOCK_BASE_DATE)
    const lowStockCount = MOCK_STOCK_ITEMS.filter(
      item => item.currentStock <= item.minimumLimit
    ).length

    return {
      totalTransactionsCount: filtered.length,
      totalTransactionsAmount: filtered.reduce((acc, t) => acc + t.totalAmount, 0),
      todayTransactionsCount: todayTransactions.length,
      todayTransactionsAmount: todayTransactions.reduce((acc, t) => acc + t.totalAmount, 0),
      activeProductionOrdersCount: 19,
      lowStockItemsCount: lowStockCount
    }
  }

  async getSalesTrend(
    filter: DashboardFilterState,
    signal?: AbortSignal
  ): Promise<SalesChartPoint[]> {
    await this.delay(signal)
    const filtered = filterTransactions(filter)

    // Group by date
    const dateMap = new Map<string, { amount: number; count: number }>()
    for (const t of filtered) {
      const current = dateMap.get(t.date) || { amount: 0, count: 0 }
      current.amount += t.totalAmount
      current.count += 1
      dateMap.set(t.date, current)
    }

    // Sort ascending by date
    const sortedDates = Array.from(dateMap.keys()).sort()
    return sortedDates.map(date => {
      const data = dateMap.get(date)!
      return {
        date: formatDateLabel(date),
        fullDate: date,
        amount: data.amount,
        count: data.count
      }
    })
  }

  async getTopProducts(
    filter: DashboardFilterState,
    signal?: AbortSignal
  ): Promise<ProductChartPoint[]> {
    await this.delay(signal)
    const filtered = filterTransactions(filter)

    // Aggregate by productId
    const productMap = new Map<
      string,
      { name: string; category: string; quantity: number; revenue: number }
    >()

    for (const t of filtered) {
      for (const item of t.items) {
        const existing = productMap.get(item.productId) || {
          name: item.productName,
          category: item.category,
          quantity: 0,
          revenue: 0
        }
        existing.quantity += item.quantity
        existing.revenue += item.quantity * item.unitPrice
        productMap.set(item.productId, existing)
      }
    }

    const totalSoldQuantity = Array.from(productMap.values()).reduce(
      (sum, p) => sum + p.quantity,
      0
    )

    // Sort by quantity sold descending
    const sorted = Array.from(productMap.entries())
      .map(([id, p]) => ({
        productId: id,
        productName: p.name,
        category: p.category,
        quantity: p.quantity,
        totalRevenue: p.revenue,
        percentage: totalSoldQuantity > 0 ? Math.round((p.quantity / totalSoldQuantity) * 100) : 0,
        color: ''
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    // Assign colors
    return sorted.map((item, idx) => ({
      ...item,
      color: PRODUCT_COLORS[idx % PRODUCT_COLORS.length]
    }))
  }

  async getRecentTransactions(
    filter: DashboardFilterState,
    signal?: AbortSignal
  ): Promise<RecentTransactionItem[]> {
    await this.delay(signal)
    const filtered = filterTransactions(filter)

    // Sort descending by date and id
    const sorted = [...filtered].sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date)
      return b.id.localeCompare(a.id)
    })

    return sorted.slice(0, 10).map(t => ({
      id: t.id,
      customer: t.customer,
      date: formatDateShort(t.date),
      rawDate: t.date,
      total: t.totalAmount,
      totalFormatted: formatCurrency(t.totalAmount),
      status: t.status
    }))
  }

  async getTopSpenders(
    filter: DashboardFilterState,
    signal?: AbortSignal
  ): Promise<TopSpenderItem[]> {
    await this.delay(signal)
    const filtered = filterTransactions(filter)

    const spenderMap = new Map<string, { count: number; total: number }>()
    for (const t of filtered) {
      const current = spenderMap.get(t.customer) || { count: 0, total: 0 }
      current.count += 1
      current.total += t.totalAmount
      spenderMap.set(t.customer, current)
    }

    const sorted = Array.from(spenderMap.entries())
      .map(([customer, data]) => ({
        customerName: customer,
        orderCount: data.count,
        totalSpent: data.total,
        totalSpentFormatted: formatCurrency(data.total)
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5)

    return sorted.map((item, index) => ({
      rank: index + 1,
      ...item
    }))
  }

  async getLowStockItems(signal?: AbortSignal): Promise<StockLimitItem[]> {
    await this.delay(signal)
    return MOCK_STOCK_ITEMS.filter(item => item.currentStock <= item.minimumLimit).map(item => ({
      id: item.id,
      materialName: item.materialName,
      warehouse: item.warehouse,
      currentStock: item.currentStock,
      minimumLimit: item.minimumLimit,
      unit: item.unit,
      isCritical: item.currentStock <= Math.floor(item.minimumLimit / 2)
    }))
  }

  async getDashboardData(
    filter: DashboardFilterState,
    signal?: AbortSignal
  ): Promise<DashboardData> {
    const [summary, salesTrend, topProducts, recentTransactions, topSpenders, stockLimits] =
      await Promise.all([
        this.getSummary(filter, signal),
        this.getSalesTrend(filter, signal),
        this.getTopProducts(filter, signal),
        this.getRecentTransactions(filter, signal),
        this.getTopSpenders(filter, signal),
        this.getLowStockItems(signal)
      ])

    return {
      summary,
      salesTrend,
      topProducts,
      recentTransactions,
      topSpenders,
      stockLimits
    }
  }
}

export const mockDashboardService = new MockDashboardService()
