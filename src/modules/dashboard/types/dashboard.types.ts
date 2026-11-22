export type DashboardDatePreset =
  | 'today'
  | 'yesterday'
  | '7d'
  | '30d'
  | 'month'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'custom'

// Backward compatibility alias for any existing code
export type DashboardDateFilterPreset = DashboardDatePreset | 'last_7_days'

export interface DashboardFilterState {
  preset: DashboardDatePreset
  startDate?: string // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD
}

export interface DashboardSummary {
  totalTransactionsCount: number
  totalTransactionsAmount: number
  todayTransactionsCount: number
  todayTransactionsAmount: number
  activeProductionOrdersCount: number
  lowStockItemsCount: number
  completedProductionThisWeekCount?: number
  referenceDate?: string
}

export interface DashboardKpiItem {
  id: string
  title: string
  value: string | number
  unit?: string
  subtitle?: string
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    text: string
  }
  iconName?: 'cart' | 'currency' | 'package' | 'alert'
  isMock?: boolean
  loading?: boolean
}

export interface SalesChartPoint {
  date: string // e.g. "18 Nov"
  fullDate: string // YYYY-MM-DD
  amount: number
  count: number
}

export interface ProductChartPoint {
  productId: string
  productName: string
  category: string
  quantity: number
  totalRevenue: number
  percentage: number
  color: string
}

export interface RecentTransactionItem {
  id: string
  orderNumber?: string
  customer: string
  date: string // DD/MM/YYYY
  rawDate?: string // YYYY-MM-DD
  total: number | string
  totalFormatted?: string
  status: 'Selesai' | 'Diproses' | 'Menunggu' | 'Dibatalkan'
  orderType?: string
}

export interface TopSpenderItem {
  rank: number
  customerId?: number | null
  customerName: string
  orderCount: number
  totalSpent?: number
  totalSpentFormatted: string
}

export interface StockLimitItem {
  id: string
  materialName: string
  warehouse: string
  currentStock: number
  minimumLimit: number
  unit: string
  isCritical?: boolean
  statusText?: 'Habis' | 'Kritis' | 'Batas Minimum'
}

export interface DashboardData {
  period?: {
    date_from: string
    date_to: string
    timezone: string
    preset: string
    reference_date?: string
  }
  summary: DashboardSummary
  salesTrend: SalesChartPoint[]
  topProducts: ProductChartPoint[]
  recentTransactions: RecentTransactionItem[]
  topSpenders: TopSpenderItem[]
  stockLimits: StockLimitItem[]
  generated_at?: string
}
