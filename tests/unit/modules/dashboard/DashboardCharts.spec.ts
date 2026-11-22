import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DashboardSalesChart from '@/modules/dashboard/components/DashboardSalesChart.vue'
import DashboardProductChart from '@/modules/dashboard/components/DashboardProductChart.vue'
import type { SalesChartPoint, ProductChartPoint } from '@/modules/dashboard/types/dashboard.types'

describe('Dashboard Charts (Task 7)', () => {
  const mockPoints: SalesChartPoint[] = [
    { date: '25 Okt', fullDate: '2026-10-25', amount: 44800000, count: 1 },
    { date: '26 Okt', fullDate: '2026-10-26', amount: 44000000, count: 1 },
    { date: '27 Okt', fullDate: '2026-10-27', amount: 101500000, count: 1 },
    { date: '28 Okt', fullDate: '2026-10-28', amount: 67000000, count: 1 },
    { date: '29 Okt', fullDate: '2026-10-29', amount: 14300000, count: 1 },
    { date: '30 Okt', fullDate: '2026-10-30', amount: 139500000, count: 2 },
    { date: '31 Okt', fullDate: '2026-10-31', amount: 63950000, count: 2 }
  ]

  const mockProducts: ProductChartPoint[] = [
    {
      productId: 'PRD-04',
      productName: 'Sofa Minimalis 3-Seater',
      category: 'Sofa',
      quantity: 49,
      totalRevenue: 269500000,
      percentage: 38,
      color: '#0F766E'
    },
    {
      productId: 'PRD-05',
      productName: 'Meja Samping Kayu Jati',
      category: 'Meja',
      quantity: 41,
      totalRevenue: 57400000,
      percentage: 32,
      color: '#0284C7'
    },
    {
      productId: 'PRD-02',
      productName: 'Kursi Direktur Kulit',
      category: 'Kursi',
      quantity: 30,
      totalRevenue: 57000000,
      percentage: 23,
      color: '#D97706'
    },
    {
      productId: 'PRD-03',
      productName: 'Lemari Arsip Sliding',
      category: 'Lemari',
      quantity: 9,
      totalRevenue: 33750000,
      percentage: 7,
      color: '#059669'
    }
  ]

  describe('DashboardSalesChart', () => {
    it('renders SVG chart line and total sum', () => {
      const wrapper = mount(DashboardSalesChart, {
        props: {
          points: mockPoints
        }
      })

      expect(wrapper.text()).toContain('Grafik Penjualan')
      expect(wrapper.find('svg').exists()).toBe(true)
      expect(wrapper.find('path[stroke="#0F766E"]').exists()).toBe(true)
      expect(wrapper.findAll('circle').length).toBe(mockPoints.length)
      expect(wrapper.text()).toContain('9 transaksi')
    })

    it('toggles accessible table fallback', async () => {
      const wrapper = mount(DashboardSalesChart, {
        props: {
          points: mockPoints
        }
      })

      expect(wrapper.find('table').exists()).toBe(false)
      const toggleBtn = wrapper.find('button')
      await toggleBtn.trigger('click')

      expect(wrapper.find('table').exists()).toBe(true)
      expect(wrapper.text()).toContain('2026-10-31')
      expect(wrapper.text()).toContain('2026-10-25')
    })

    it('shows empty state when no points provided', () => {
      const wrapper = mount(DashboardSalesChart, {
        props: {
          points: []
        }
      })

      expect(wrapper.text()).toContain('Tidak ada data penjualan')
    })

    it('shows error state when error prop is set', () => {
      const wrapper = mount(DashboardSalesChart, {
        props: {
          error: 'Koneksi terputus'
        }
      })

      expect(wrapper.text()).toContain('Gagal memuat grafik penjualan')
      expect(wrapper.text()).toContain('Koneksi terputus')
    })
  })

  describe('DashboardProductChart', () => {
    it('renders SVG donut chart slices and product details', () => {
      const wrapper = mount(DashboardProductChart, {
        props: {
          products: mockProducts
        }
      })

      expect(wrapper.text()).toContain('Grafik Produk Terlaris')
      expect(wrapper.text()).toContain('Sofa Minimalis 3-Seater')
      expect(wrapper.text()).toContain('Meja Samping Kayu Jati')
      expect(wrapper.find('svg').exists()).toBe(true)
      // Background ring + 4 product slices = 5 circles
      expect(wrapper.findAll('circle').length).toBe(5)
      expect(wrapper.text()).toContain('129 Unit')
    })

    it('toggles accessible table for products', async () => {
      const wrapper = mount(DashboardProductChart, {
        props: {
          products: mockProducts
        }
      })

      expect(wrapper.find('table').exists()).toBe(false)
      const toggleBtn = wrapper.find('button')
      await toggleBtn.trigger('click')

      expect(wrapper.find('table').exists()).toBe(true)
      expect(wrapper.text()).toContain('Sofa Minimalis 3-Seater')
      expect(wrapper.text()).toContain('38%')
    })

    it('renders empty state when products array is empty', () => {
      const wrapper = mount(DashboardProductChart, {
        props: {
          products: []
        }
      })

      expect(wrapper.text()).toContain('Tidak ada produk terjual')
    })
  })
})
