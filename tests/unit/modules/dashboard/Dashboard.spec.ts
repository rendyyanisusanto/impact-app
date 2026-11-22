import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DashboardPage from '@/modules/dashboard/pages/DashboardPage.vue'
import DashboardFilters from '@/modules/dashboard/components/DashboardFilters.vue'
import DashboardKpiCard from '@/modules/dashboard/components/DashboardKpiCard.vue'
import DashboardSalesChart from '@/modules/dashboard/components/DashboardSalesChart.vue'
import DashboardProductChart from '@/modules/dashboard/components/DashboardProductChart.vue'
import DashboardRecentTransactions from '@/modules/dashboard/components/DashboardRecentTransactions.vue'
import DashboardTopSpenders from '@/modules/dashboard/components/DashboardTopSpenders.vue'
import DashboardLowStock from '@/modules/dashboard/components/DashboardLowStock.vue'
import DashboardChartPlaceholder from '@/modules/dashboard/components/DashboardChartPlaceholder.vue'
import DashboardWidgetPlaceholder from '@/modules/dashboard/components/DashboardWidgetPlaceholder.vue'
import AppSkeleton from '@/shared/components/ui/AppSkeleton.vue'
import AppEmptyState from '@/shared/components/feedback/AppEmptyState.vue'

describe('Sprint 2 — Dashboard Architecture & Interactive Layout', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('DashboardPage', () => {
    it('1. Renders complete dashboard layout with all interactive modules and widgets', () => {
      const wrapper = mount(DashboardPage)

      // Header
      expect(wrapper.text()).toContain('Dashboard Operasional')

      // Filter Area
      expect(wrapper.findComponent(DashboardFilters).exists()).toBe(true)

      // KPI Cards
      const kpis = wrapper.findAllComponents(DashboardKpiCard)
      expect(kpis.length).toBeGreaterThanOrEqual(2)
      expect(wrapper.text()).toContain('Total Transaksi')
      expect(wrapper.text()).toContain('Transaksi Hari Ini')

      // Interactive Charts
      expect(wrapper.findComponent(DashboardSalesChart).exists()).toBe(true)
      expect(wrapper.findComponent(DashboardProductChart).exists()).toBe(true)
      expect(wrapper.text()).toContain('Grafik Penjualan')
      expect(wrapper.text()).toContain('Grafik Produk Terlaris')

      // Operational Widgets
      expect(wrapper.findComponent(DashboardRecentTransactions).exists()).toBe(true)
      expect(wrapper.findComponent(DashboardTopSpenders).exists()).toBe(true)
      expect(wrapper.findComponent(DashboardLowStock).exists()).toBe(true)
      expect(wrapper.text()).toContain('Transaksi Terakhir')
      expect(wrapper.text()).toContain('Top Spender')
      expect(wrapper.text()).toContain('Stok Limit')
    })

    it('2. Triggers loading state on refresh', async () => {
      const wrapper = mount(DashboardPage)
      const filterComponent = wrapper.findComponent(DashboardFilters)
      expect(filterComponent.exists()).toBe(true)

      // Emit refresh from filters
      await filterComponent.vm.$emit('refresh')
      const vm = wrapper.vm as unknown as { isLoading: boolean }
      expect(vm.isLoading).toBe(true)
    })
  })

  describe('DashboardFilters', () => {
    it('3. Emits update:modelValue and refresh events correctly', async () => {
      const wrapper = mount(DashboardFilters, {
        props: {
          modelValue: { preset: 'this_month' }
        }
      })

      expect(wrapper.text()).toContain('Filter Periode:')
      expect(wrapper.text()).toContain('Simulasi (Mock)')

      // Trigger refresh
      const refreshBtn = wrapper.findAll('button').find(btn => btn.text().includes('Segarkan'))
      expect(refreshBtn).toBeDefined()
      await refreshBtn?.trigger('click')
      expect(wrapper.emitted('refresh')).toBeTruthy()
    })

    it('4. Resets to default preset when reset button is clicked', async () => {
      const wrapper = mount(DashboardFilters, {
        props: {
          modelValue: { preset: 'today' }
        }
      })

      const resetBtn = wrapper.findAll('button').find(btn => btn.text().includes('Reset'))
      expect(resetBtn).toBeDefined()
      await resetBtn?.trigger('click')

      expect(wrapper.emitted('reset')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([{ preset: 'this_month' }])
    })
  })

  describe('DashboardKpiCard', () => {
    it('5. Renders metric title, value, unit, and mock indicator', () => {
      const wrapper = mount(DashboardKpiCard, {
        props: {
          title: 'Total Transaksi',
          value: '128',
          unit: 'Transaksi',
          isMock: true,
          trend: { direction: 'up', text: '+12.4% vs bulan lalu' }
        }
      })

      expect(wrapper.text()).toContain('Total Transaksi')
      expect(wrapper.text()).toContain('128')
      expect(wrapper.text()).toContain('Transaksi')
      expect(wrapper.text()).toContain('Mock')
      expect(wrapper.text()).toContain('+12.4% vs bulan lalu')
    })

    it('6. Shows skeleton loading state when loading is true', () => {
      const wrapper = mount(DashboardKpiCard, {
        props: {
          title: 'Total Transaksi',
          value: '128',
          loading: true
        }
      })

      expect(wrapper.findComponent(AppSkeleton).exists()).toBe(true)
      expect(wrapper.text()).not.toContain('128')
    })
  })

  describe('DashboardChartPlaceholder', () => {
    it('7. Renders chart placeholder with Sprint 2 Scope label and visual skeleton', () => {
      const wrapper = mount(DashboardChartPlaceholder, {
        props: {
          title: 'Grafik Penjualan',
          subtitle: 'Tren penjualan 2026',
          chartType: 'line',
          badgeLabel: 'Sprint 2 Scope'
        }
      })

      expect(wrapper.text()).toContain('Grafik Penjualan')
      expect(wrapper.text()).toContain('Tren penjualan 2026')
      expect(wrapper.text()).toContain('Sprint 2 Scope')
      expect(wrapper.find('svg').exists()).toBe(true)
    })

    it('8. Displays skeleton during loading', () => {
      const wrapper = mount(DashboardChartPlaceholder, {
        props: {
          title: 'Grafik Penjualan',
          loading: true
        }
      })

      expect(wrapper.findAllComponents(AppSkeleton).length).toBeGreaterThan(0)
    })
  })

  describe('DashboardWidgetPlaceholder', () => {
    it('9. Renders recent transactions table with status badges', () => {
      const wrapper = mount(DashboardWidgetPlaceholder, {
        props: {
          type: 'recent-transactions',
          recentTransactions: [
            {
              id: 'SO-001',
              customer: 'PT Meja Bersama',
              date: '31/10/2026',
              total: 'Rp 45.000.000',
              status: 'Selesai'
            }
          ]
        }
      })

      expect(wrapper.text()).toContain('Transaksi Terakhir')
      expect(wrapper.text()).toContain('SO-001')
      expect(wrapper.text()).toContain('PT Meja Bersama')
      expect(wrapper.text()).toContain('Rp 45.000.000')
      expect(wrapper.text()).toContain('Selesai')
    })

    it('10. Renders top spenders ranking', () => {
      const wrapper = mount(DashboardWidgetPlaceholder, {
        props: {
          type: 'top-spenders',
          topSpenders: [
            {
              rank: 1,
              customerName: 'Hotel Grand Pelangi',
              orderCount: 34,
              totalSpentFormatted: 'Rp 348.500.000'
            }
          ]
        }
      })

      expect(wrapper.text()).toContain('Top Spender Pelanggan')
      expect(wrapper.text()).toContain('Hotel Grand Pelangi')
      expect(wrapper.text()).toContain('34 Transaksi')
      expect(wrapper.text()).toContain('Rp 348.500.000')
    })

    it('11. Renders stock limits with alert badge', () => {
      const wrapper = mount(DashboardWidgetPlaceholder, {
        props: {
          type: 'stock-limits',
          stockLimits: [
            {
              id: 'STK-01',
              materialName: 'Kayu Jati Solid',
              warehouse: 'Gudang Kayu',
              currentStock: 12,
              minimumLimit: 25,
              unit: 'Batang'
            }
          ]
        }
      })

      expect(wrapper.text()).toContain('Peringatan Stok Limit')
      expect(wrapper.text()).toContain('Kayu Jati Solid')
      expect(wrapper.text()).toContain('Sisa 12 Batang')
    })

    it('12. Renders empty state when list is empty', () => {
      const wrapper = mount(DashboardWidgetPlaceholder, {
        props: {
          type: 'stock-limits',
          stockLimits: []
        }
      })

      expect(wrapper.findComponent(AppEmptyState).exists()).toBe(true)
      expect(wrapper.text()).toContain('Semua Stok Aman')
    })

    it('13. Renders skeleton rows when loading', () => {
      const wrapper = mount(DashboardWidgetPlaceholder, {
        props: {
          type: 'recent-transactions',
          loading: true
        }
      })

      expect(wrapper.findAllComponents(AppSkeleton).length).toBeGreaterThan(0)
    })
  })
})
