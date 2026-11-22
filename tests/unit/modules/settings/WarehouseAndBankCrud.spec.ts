import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { warehouseService } from '@/modules/settings/warehouses/services/warehouse.service'
import { bankService } from '@/modules/settings/banks/services/bank.service'
import WarehouseListPage from '@/modules/settings/warehouses/pages/WarehouseListPage.vue'
import WarehouseFormModal from '@/modules/settings/warehouses/components/WarehouseFormModal.vue'
import BankListPage from '@/modules/settings/banks/pages/BankListPage.vue'
import BankFormModal from '@/modules/settings/banks/components/BankFormModal.vue'
import { warehouseRowMapper } from '@/modules/settings/warehouses/utils/warehouse-import.config'
import { bankRowMapper } from '@/modules/settings/banks/utils/bank-import.config'

describe('Sprint 3 — Task 6: Master Data Gudang & Bank', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    warehouseService.reset()
    bankService.reset()
  })

  describe('WarehouseService & Modals', () => {
    it('1. retrieves warehouses list with colors and status', async () => {
      const res = await warehouseService.getAll({ page: 1, pageSize: 10 })
      expect(res.data.length).toBeGreaterThanOrEqual(4)
      const first = res.data[0]
      expect(first).toHaveProperty('color')
      expect(first).toHaveProperty('alamat')
      expect(first).toHaveProperty('kode')
    })

    it('2. creates warehouse with color code and syncs with reference service', async () => {
      const created = await warehouseService.create({
        nama: 'Gudang Ekspedisi Transit',
        color: '#f59e0b',
        alamat: 'Jl. Kalianak Barat No. 55',
        status: 1
      })

      expect(created.id).toBeDefined()
      expect(created.color).toBe('#f59e0b')
      expect(created.alamat).toBe('Jl. Kalianak Barat No. 55')

      const found = await warehouseService.getById(created.id)
      expect(found.nama).toBe('Gudang Ekspedisi Transit')
    })

    it('3. updates and deletes warehouse successfully', async () => {
      const updated = await warehouseService.update(1001, {
        nama: 'Gudang Bambe Updated',
        color: '#dc2626'
      })
      expect(updated.nama).toBe('Gudang Bambe Updated')
      expect(updated.color).toBe('#dc2626')

      const deleted = await warehouseService.delete(1001)
      expect(deleted).toBe(true)
      await expect(warehouseService.getById(1001)).rejects.toThrow()
    })

    it('4. imports warehouse rows with validation', () => {
      const valid = warehouseRowMapper.mapRow(
        {
          'Nama Gudang *': 'Gudang Perak Baru',
          'Warna Label': '#3b82f6',
          'Alamat Gudang': 'Tanjung Perak',
          Status: 'Aktif'
        },
        2
      )
      expect(valid.error).toBeUndefined()
      expect(valid.data?.nama).toBe('Gudang Perak Baru')
      expect(valid.data?.color).toBe('#3b82f6')

      const invalid = warehouseRowMapper.mapRow({ 'Warna Label': '#000' }, 3)
      expect(invalid.error).toContain('Nama Gudang wajib diisi')
    })

    it('5. renders WarehouseListPage and validates WarehouseFormModal', async () => {
      const pageWrapper = mount(WarehouseListPage, {
        global: { stubs: { teleport: true } }
      })
      await pageWrapper.vm.$nextTick()
      expect(pageWrapper.text()).toContain('Master Data Gudang')
      expect(pageWrapper.text()).toContain('Tambah Gudang')

      const formWrapper = mount(WarehouseFormModal, {
        props: { modelValue: true, isEdit: false },
        global: { stubs: { teleport: true } }
      })
      expect(formWrapper.text()).toContain('Tambah Gudang Baru')
      const form = formWrapper.find('form')
      await form.trigger('submit.prevent')
      expect(formWrapper.text()).toContain('Nama gudang wajib diisi')
    })
  })

  describe('BankService & Modals', () => {
    it('6. retrieves banks and preserves string leading zeros in rekening', async () => {
      const res = await bankService.getAll()
      expect(res.data.length).toBeGreaterThan(0)
      // Check that leading zero is preserved as string
      const danamon = res.data.find(b => b.bank?.includes('Danamon'))
      expect(danamon).toBeDefined()
      expect(typeof danamon?.rekening).toBe('string')
      expect(danamon?.rekening).toBe('012312312')
      expect(danamon?.rekening?.startsWith('0')).toBe(true)
    })

    it('7. creates bank preserving exact string rekening', async () => {
      const created = await bankService.create({
        bank: 'BNI PT Impact Furniture',
        rekening: '000123456789'
      })

      expect(created.id).toBeDefined()
      expect(created.rekening).toBe('000123456789')
      expect(created.rekening?.length).toBe(12)

      const fetched = await bankService.getById(created.id)
      expect(fetched.rekening).toBe('000123456789')
    })

    it('8. updates bank details and deletes bank record', async () => {
      const updated = await bankService.update(1, {
        bank: 'Danamon Corporate',
        rekening: '0987654321'
      })
      expect(updated.bank).toBe('Danamon Corporate')
      expect(updated.rekening).toBe('0987654321')

      const deleted = await bankService.delete(1)
      expect(deleted).toBe(true)
      await expect(bankService.getById(1)).rejects.toThrow()
    })

    it('9. imports bank rows and preserves string rekening format', () => {
      const valid = bankRowMapper.mapRow(
        {
          'Nama Bank *': 'Bank Syariah Indonesia (BSI)',
          'Nomor Rekening *': '0712398127'
        },
        2
      )
      expect(valid.error).toBeUndefined()
      expect(valid.data?.bank).toBe('Bank Syariah Indonesia (BSI)')
      expect(valid.data?.rekening).toBe('0712398127')

      const invalid = bankRowMapper.mapRow({ 'Nama Bank *': 'BCA' }, 3)
      expect(invalid.error).toContain('Nomor Rekening wajib diisi')
    })

    it('10. renders BankListPage and validates BankFormModal', async () => {
      const pageWrapper = mount(BankListPage, {
        global: { stubs: { teleport: true } }
      })
      await pageWrapper.vm.$nextTick()
      expect(pageWrapper.text()).toContain('Master Data Bank')
      expect(pageWrapper.text()).toContain('Tambah Bank')

      const formWrapper = mount(BankFormModal, {
        props: { modelValue: true, isEdit: false },
        global: { stubs: { teleport: true } }
      })
      expect(formWrapper.text()).toContain('Tambah Rekening Bank Baru')
      const form = formWrapper.find('form')
      await form.trigger('submit.prevent')
      expect(formWrapper.text()).toContain('Nama bank wajib diisi')
    })
  })
})
