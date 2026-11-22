import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { taxService } from '@/modules/settings/tax/services/tax.service'
import { appSettingService } from '@/modules/settings/app/services/app-setting.service'
import TaxListPage from '@/modules/settings/tax/pages/TaxListPage.vue'
import TaxFormModal from '@/modules/settings/tax/components/TaxFormModal.vue'
import AppSettingListPage from '@/modules/settings/app/pages/AppSettingListPage.vue'
import AppSettingFormModal from '@/modules/settings/app/components/AppSettingFormModal.vue'
import { taxRowMapper } from '@/modules/settings/tax/utils/tax-import.config'
import { appSettingRowMapper } from '@/modules/settings/app/utils/app-setting-import.config'

describe('Sprint 3 — Task 9: Master Data PPN & Setting Aplikasi', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    taxService.reset()
    appSettingService.reset()
  })

  describe('TaxService (PPN) & UI', () => {
    it('1. retrieves tax rates with integer percentage nama and formatted percentage', async () => {
      const res = await taxService.getAll()
      expect(res.data.length).toBeGreaterThanOrEqual(3)
      const ppn11 = res.data.find(t => t.nama === 11)
      expect(ppn11).toBeDefined()
      expect(typeof ppn11?.nama).toBe('number')
      expect(ppn11?.percentage_formatted).toBe('11%')
      expect(ppn11?.is_active).toBe(1)
    })

    it('2. creates new tax rate and validates integer range 0-100', async () => {
      await expect(
        taxService.create({
          nama: 150
        })
      ).rejects.toThrow('Persentase PPN harus berupa bilangan bulat antara 0 hingga 100%')

      const created = await taxService.create({
        nama: 12,
        is_active: 1
      })
      expect(created.id).toBeDefined()
      expect(created.nama).toBe(12)
      expect(created.is_active).toBe(1)

      // Ensure other rates become inactive
      const all = await taxService.getAll({ pageSize: 100 })
      const activeRates = all.data.filter(t => t.is_active === 1)
      expect(activeRates.length).toBe(1)
      expect(activeRates[0].id).toBe(created.id)
    })

    it('3. updates and deletes tax rate', async () => {
      const updated = await taxService.update(2, {
        nama: 5
      })
      expect(updated.nama).toBe(5)

      const deleted = await taxService.delete(2)
      expect(deleted).toBe(true)
      await expect(taxService.getById(2)).rejects.toThrow()
    })

    it('4. imports tax rows and validates integer percentage', () => {
      const valid = taxRowMapper.mapRow(
        {
          'Kode PPN': 'PPN-05',
          'Tarif PPN (%) *': '5',
          'Status Aktif Digunakan': 'Ya',
          'Status Rekord': 'Aktif'
        },
        2
      )
      expect(valid.error).toBeUndefined()
      expect(valid.data?.nama).toBe(5)
      expect(valid.data?.is_active).toBe(1)

      const invalid = taxRowMapper.mapRow(
        {
          'Tarif PPN (%) *': 200
        },
        3
      )
      expect(invalid.error).toContain('antara 0 - 100%')
    })

    it('5. renders TaxListPage and validates TaxFormModal', async () => {
      const pageWrapper = mount(TaxListPage, {
        global: { stubs: { teleport: true } }
      })
      await flushPromises()
      expect(pageWrapper.text()).toContain('Master Data PPN')
      expect(pageWrapper.text()).toContain('11%')
      expect(pageWrapper.text()).toContain('Aktif Digunakan')

      const formWrapper = mount(TaxFormModal, {
        props: { modelValue: true, isEdit: false },
        global: { stubs: { teleport: true } }
      })
      expect(formWrapper.text()).toContain('Tambah Tarif PPN Baru')
    })
  })

  describe('AppSettingService & UI', () => {
    it('6. retrieves application settings loaded from SQL seed', async () => {
      const res = await appSettingService.getAll()
      expect(res.data.length).toBeGreaterThanOrEqual(10)
      const bahanFormat = res.data.find(s => s.table === 'master_data_bahan' && s.name === 'kode')
      expect(bahanFormat).toBeDefined()
      expect(bahanFormat?.value).toBe('Bahan/{year}{month}-{rand}')
    })

    it('7. creates, updates, and deletes setting record', async () => {
      const created = await appSettingService.create({
        table: 'sales_order',
        name: 'prefix_code',
        value: 'SO/{year}/{month}-{rand}',
        keterangan: 'Format nomor sales order'
      })
      expect(created.id).toBeDefined()
      expect(created.table).toBe('sales_order')

      const updated = await appSettingService.update(created.id, {
        value: 'SO-IMPACT/{year}/{rand}'
      })
      expect(updated.value).toBe('SO-IMPACT/{year}/{rand}')

      const deleted = await appSettingService.delete(created.id)
      expect(deleted).toBe(true)
      await expect(appSettingService.getById(created.id)).rejects.toThrow()
    })

    it('8. imports application settings with row validation', () => {
      const valid = appSettingRowMapper.mapRow(
        {
          'Modul / Tabel *': 'delivery_order',
          'Kunci Pengaturan (Name) *': 'prefix',
          'Nilai (Value) *': 'SJ/{year}/{month}/{rand}',
          Keterangan: 'Nomor surat jalan pengiriman'
        },
        2
      )
      expect(valid.error).toBeUndefined()
      expect(valid.data?.table).toBe('delivery_order')
      expect(valid.data?.name).toBe('prefix')

      const invalid = appSettingRowMapper.mapRow(
        {
          'Modul / Tabel *': 'delivery_order'
        },
        3
      )
      expect(invalid.error).toContain('Kunci Pengaturan (Name) wajib diisi')
    })

    it('9. renders AppSettingListPage and validates AppSettingFormModal', async () => {
      const pageWrapper = mount(AppSettingListPage, {
        global: { stubs: { teleport: true } }
      })
      await flushPromises()
      expect(pageWrapper.text()).toContain('Setting Aplikasi')
      expect(pageWrapper.text()).toContain('master_data_suplier')
      expect(pageWrapper.text()).toContain('template_excel')

      const formWrapper = mount(AppSettingFormModal, {
        props: { modelValue: true, isEdit: false },
        global: { stubs: { teleport: true } }
      })
      expect(formWrapper.text()).toContain('Tambah Setting Baru')
      const form = formWrapper.find('form')
      await form.trigger('submit.prevent')
      expect(formWrapper.text()).toContain('Modul / tabel target wajib diisi')
    })
  })
})
