import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DashboardRecentTransactions from '@/modules/dashboard/components/DashboardRecentTransactions.vue'
import DashboardTopSpenders from '@/modules/dashboard/components/DashboardTopSpenders.vue'
import DashboardLowStock from '@/modules/dashboard/components/DashboardLowStock.vue'

describe('Dashboard Operational Widgets (Task 8)', () => {
  describe('DashboardRecentTransactions', () => {
    it('renders transaction table with correct columns and status badge', () => {
      const wrapper = mount(DashboardRecentTransactions, {
        props: {
          transactions: [
            {
              id: 'SO-2026-001',
              customer: 'PT Meja Bersama',
              date: '31/10/2026',
              rawDate: '2026-10-31',
              total: 45200000,
              totalFormatted: 'Rp 45.200.000',
              status: 'Selesai'
            },
            {
              id: 'SO-2026-002',
              customer: 'CV Interior Estetika',
              date: '31/10/2026',
              rawDate: '2026-10-31',
              total: 18750000,
              totalFormatted: 'Rp 18.750.000',
              status: 'Diproses'
            }
          ]
        }
      })

      expect(wrapper.text()).toContain('Transaksi Terakhir')
      expect(wrapper.text()).toContain('SO-2026-001')
      expect(wrapper.text()).toContain('PT Meja Bersama')
      expect(wrapper.text()).toContain('Rp 45.200.000')
      expect(wrapper.text()).toContain('Selesai')
      expect(wrapper.text()).toContain('Diproses')
    })

    it('renders empty state when transaction list is empty', () => {
      const wrapper = mount(DashboardRecentTransactions, {
        props: { transactions: [] }
      })

      expect(wrapper.text()).toContain('Tidak ada transaksi')
    })
  })

  describe('DashboardTopSpenders', () => {
    it('renders ranked spenders with rank badges', () => {
      const wrapper = mount(DashboardTopSpenders, {
        props: {
          spenders: [
            {
              rank: 1,
              customerName: 'Hotel Grand Pelangi',
              orderCount: 3,
              totalSpent: 346000000,
              totalSpentFormatted: 'Rp 346.000.000'
            },
            {
              rank: 2,
              customerName: 'PT Meja Bersama',
              orderCount: 3,
              totalSpent: 163950000,
              totalSpentFormatted: 'Rp 163.950.000'
            }
          ]
        }
      })

      expect(wrapper.text()).toContain('Top Spender')
      expect(wrapper.text()).toContain('Hotel Grand Pelangi')
      expect(wrapper.text()).toContain('Rp 346.000.000')
      expect(wrapper.text()).toContain('1')
      expect(wrapper.text()).toContain('2')
    })

    it('renders empty state when spenders list is empty', () => {
      const wrapper = mount(DashboardTopSpenders, {
        props: { spenders: [] }
      })

      expect(wrapper.text()).toContain('Belum ada data pelanggan')
    })
  })

  describe('DashboardLowStock', () => {
    it('renders low stock items with critical and warning badges', () => {
      const wrapper = mount(DashboardLowStock, {
        props: {
          items: [
            {
              id: 'STK-01',
              materialName: 'Kayu Jati Solid Grade A',
              warehouse: 'Gudang Kayu Utama',
              currentStock: 12,
              minimumLimit: 25,
              unit: 'Batang',
              isCritical: true // 12 <= 12.5
            },
            {
              id: 'STK-04',
              materialName: 'Engsel Slow Motion Soft Close',
              warehouse: 'Gudang Hardware',
              currentStock: 35,
              minimumLimit: 50,
              unit: 'Set',
              isCritical: false // 35 > 25
            }
          ]
        }
      })

      expect(wrapper.text()).toContain('Stok Limit (Peringatan)')
      expect(wrapper.text()).toContain('Kayu Jati Solid Grade A')
      expect(wrapper.text()).toContain('Kritis')
      expect(wrapper.text()).toContain('Engsel Slow Motion Soft Close')
      expect(wrapper.text()).toContain('Rendah')
    })

    it('renders empty state when all stock is sufficient', () => {
      const wrapper = mount(DashboardLowStock, {
        props: { items: [] }
      })

      expect(wrapper.text()).toContain('Semua Stok Aman')
    })
  })
})
