import { describe, it, expect } from 'vitest'
import { MockDashboardService } from '@/modules/dashboard/services/dashboard.mock'
import { useDashboard } from '@/modules/dashboard/composables/useDashboard'

describe('Dashboard Service & Data Consistency (Task 9)', () => {
  const service = new MockDashboardService(0) // 0 latency for instant test execution

  it('maintains strict mathematical consistency across summary, sales trend, and top spenders', async () => {
    const data = await service.getDashboardData({ preset: '7d' })

    // Total transactions amount in summary
    const totalFromSummary = data.summary.totalTransactionsAmount
    const totalTransactionsCount = data.summary.totalTransactionsCount

    // Sum from sales trend
    const sumFromTrend = data.salesTrend.reduce((sum, pt) => sum + pt.amount, 0)
    const countFromTrend = data.salesTrend.reduce((sum, pt) => sum + pt.count, 0)

    // Sum from top spenders
    const sumFromSpenders = data.topSpenders.reduce((sum, sp) => sum + (sp.totalSpent ?? 0), 0)

    // Recent transactions sum
    const sumFromRecent = data.recentTransactions.reduce((sum, tx) => sum + Number(tx.total), 0)

    // Sum from sales trend equals summary total
    expect(sumFromTrend).toBe(totalFromSummary)
    expect(countFromTrend).toBe(totalTransactionsCount)

    // Recent transactions sum (all 9 transactions in 7d fit in the 10 limit)
    expect(sumFromRecent).toBe(totalFromSummary)

    // Top spenders takes top 5 customers (so sum of top 5 <= total)
    expect(sumFromSpenders).toBeLessThanOrEqual(totalFromSummary)
    expect(sumFromSpenders).toBe(460750000)

    // For preset 'today' with 2 transactions from 2 customers, top spenders exactly equals summary total
    const todayData = await service.getDashboardData({ preset: 'today' })
    const todaySpendersSum = todayData.topSpenders.reduce(
      (sum, sp) => sum + (sp.totalSpent ?? 0),
      0
    )
    expect(todaySpendersSum).toBe(todayData.summary.totalTransactionsAmount)
  })

  it('filters accurately for preset: today', async () => {
    const data = await service.getDashboardData({ preset: 'today' })

    expect(data.summary.totalTransactionsCount).toBe(2)
    expect(data.summary.totalTransactionsAmount).toBe(63950000)
    expect(data.salesTrend.length).toBe(1)
    expect(data.salesTrend[0].fullDate).toBe('2026-10-31')
  })

  it('filters accurately for preset: 7d', async () => {
    const data = await service.getDashboardData({ preset: '7d' })

    // 7 days from 2026-10-25 to 2026-10-31
    expect(data.salesTrend.length).toBe(7)
    for (const point of data.salesTrend) {
      expect(point.fullDate >= '2026-10-25').toBe(true)
      expect(point.fullDate <= '2026-10-31').toBe(true)
    }
  })

  it('identifies critical low stock items correctly', async () => {
    const items = await service.getLowStockItems()
    expect(items.length).toBe(5)

    const criticalItems = items.filter(i => i.isCritical)
    for (const item of criticalItems) {
      expect(item.currentStock).toBeLessThanOrEqual(item.minimumLimit / 2)
    }
  })

  it('useDashboard handles state reactivity and filter preset changes', async () => {
    const dashboard = useDashboard(service)
    await dashboard.fetchDashboard()

    expect(dashboard.isLoading.value).toBe(false)
    expect(dashboard.data.value).not.toBeNull()

    // Switch to today
    dashboard.setPreset('today')
    await dashboard.fetchDashboard()

    expect(dashboard.filterState.value.preset).toBe('today')
    expect(dashboard.data.value?.summary.totalTransactionsCount).toBe(2)
  })
})
