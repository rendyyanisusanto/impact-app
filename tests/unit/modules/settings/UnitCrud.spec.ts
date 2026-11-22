import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import {
  satuanBeliService,
  satuanPakaiService,
  satuanBarangService
} from '@/modules/settings/units/services/unit.service'
import MaterialUnitsPage from '@/modules/settings/units/pages/MaterialUnitsPage.vue'
import ProductUnitsPage from '@/modules/settings/units/pages/ProductUnitsPage.vue'
import SatuanPakaiFormModal from '@/modules/settings/units/components/SatuanPakaiFormModal.vue'
import SatuanBarangFormModal from '@/modules/settings/units/components/SatuanBarangFormModal.vue'
import {
  satuanBeliRowMapper,
  satuanPakaiRowMapper,
  satuanBarangRowMapper
} from '@/modules/settings/units/utils/unit-import.config'

describe('Sprint 3 — Task 8: Master Data Satuan (Beli, Pakai, Barang)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    satuanBeliService.reset()
    satuanPakaiService.reset()
    satuanBarangService.reset()
  })

  describe('Satuan Beli Service & Modals', () => {
    it('1. retrieves satuan beli and sets default exclusively', async () => {
      const res = await satuanBeliService.getAll()
      expect(res.data.length).toBeGreaterThanOrEqual(6)

      // create new default
      const created = await satuanBeliService.create({
        nama: 'Kontainer 20ft',
        kode: 'CTR',
        default: 1
      })
      expect(created.default).toBe(1)

      const all = await satuanBeliService.getAll({ pageSize: 100 })
      const defaults = all.data.filter(s => s.default === 1)
      expect(defaults.length).toBe(1)
      expect(defaults[0].id).toBe(created.id)
    })

    it('2. imports and validates satuan beli row', () => {
      const valid = satuanBeliRowMapper.mapRow(
        {
          'Kode Satuan': 'RIM',
          'Nama Satuan *': 'Rim HPL',
          Default: 'Tidak',
          Status: 'Aktif'
        },
        2
      )
      expect(valid.error).toBeUndefined()
      expect(valid.data?.nama).toBe('Rim HPL')

      const invalid = satuanBeliRowMapper.mapRow({}, 3)
      expect(invalid.error).toContain('Nama Satuan Beli wajib diisi')
    })
  })

  describe('Satuan Pakai Service & Precision / Division by zero prevention', () => {
    it('3. rejects pembagi <= 0 or invalid decimal', async () => {
      await expect(
        satuanPakaiService.create({
          nama: 'Pcs Test',
          pembagi: 0
        })
      ).rejects.toThrow('Nilai pembagi harus lebih besar dari 0')

      await expect(
        satuanPakaiService.create({
          nama: 'Pcs Test',
          pembagi: -5
        })
      ).rejects.toThrow('Nilai pembagi harus lebih besar dari 0')
    })

    it('4. creates and enriches satuan pakai with parent satuan beli and decimal precision', async () => {
      const created = await satuanPakaiService.create({
        nama: 'Sentimeter Kubik',
        satuan_beli_id: 1, // Kubik (m3)
        pembagi: 1000000.123456
      })
      expect(created.id).toBeDefined()
      expect(created.satuan_beli_nama).toBe('Kubik (m3)')
      expect(created.pembagi).toBe(1000000.123456)
    })

    it('5. imports and validates satuan pakai row mapper', () => {
      const valid = satuanPakaiRowMapper.mapRow(
        {
          'Kode Satuan': 'CM',
          'Nama Satuan Pakai *': 'Centimeter Kayu',
          'Satuan Beli Terkait': 'Kubik (m3)',
          'Nilai Pembagi *': 100.5
        },
        2
      )
      expect(valid.error).toBeUndefined()
      expect(valid.data?.pembagi).toBe(100.5)

      const invalidZero = satuanPakaiRowMapper.mapRow(
        {
          'Nama Satuan Pakai *': 'Lembar',
          'Nilai Pembagi *': 0
        },
        3
      )
      expect(invalidZero.error).toContain('harus angka lebih besar dari 0')
    })
  })

  describe('Satuan Barang (Produk) Service', () => {
    it('6. creates, updates, and deletes satuan produk', async () => {
      const created = await satuanBarangService.create({
        nama: 'Kodi',
        kode: 'KD',
        status: 1
      })
      expect(created.id).toBeDefined()

      const updated = await satuanBarangService.update(created.id, {
        nama: 'Kodi Standar'
      })
      expect(updated.nama).toBe('Kodi Standar')

      const deleted = await satuanBarangService.delete(created.id)
      expect(deleted).toBe(true)
    })

    it('7. imports and validates satuan produk row mapper', () => {
      const valid = satuanBarangRowMapper.mapRow(
        {
          'Nama Satuan Produk *': 'Pasang Meja',
          Status: 'Aktif'
        },
        2
      )
      expect(valid.error).toBeUndefined()
      expect(valid.data?.nama).toBe('Pasang Meja')
    })
  })

  describe('Units UI Components & Tab Navigation', () => {
    it('8. renders MaterialUnitsPage with tabs and switches between Satuan Beli and Satuan Pakai', async () => {
      const wrapper = mount(MaterialUnitsPage, {
        global: { stubs: { teleport: true } }
      })
      await flushPromises()

      expect(wrapper.text()).toContain('Master Data Satuan Bahan')
      expect(wrapper.text()).toContain('Satuan Beli')
      expect(wrapper.text()).toContain('Satuan Pakai (Konversi Produksi)')

      // Initially on Satuan Beli tab
      expect(wrapper.text()).toContain('Kubik (m3)')

      // Switch to Satuan Pakai tab
      const tabButtons = wrapper.findAll('button')
      const pakaiTabBtn = tabButtons.find(b => b.text().includes('Satuan Pakai'))
      expect(pakaiTabBtn).toBeDefined()
      await pakaiTabBtn?.trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('Faktor Pembagi (Konversi)')
      expect(wrapper.text()).toContain('Batang')
    })

    it('9. renders ProductUnitsPage and validates SatuanBarangFormModal', async () => {
      const pageWrapper = mount(ProductUnitsPage, {
        global: { stubs: { teleport: true } }
      })
      await pageWrapper.vm.$nextTick()
      expect(pageWrapper.text()).toContain('Master Data Satuan Produk')
      expect(pageWrapper.text()).toContain('Tambah Satuan')

      const modalWrapper = mount(SatuanBarangFormModal, {
        props: { modelValue: true, isEdit: false },
        global: { stubs: { teleport: true } }
      })
      const form = modalWrapper.find('form')
      await form.trigger('submit.prevent')
      expect(modalWrapper.text()).toContain('Nama satuan produk wajib diisi')
    })

    it('10. validates SatuanPakaiFormModal requiring non-zero pembagi', async () => {
      const modalWrapper = mount(SatuanPakaiFormModal, {
        props: { modelValue: true, isEdit: false },
        global: { stubs: { teleport: true } }
      })
      await modalWrapper.vm.$nextTick()

      const nameInput = modalWrapper.find('#sp-nama')
      await nameInput.setValue('Centimeter')
      const pembagiInput = modalWrapper.find('#sp-pembagi')
      await pembagiInput.setValue(0)

      const form = modalWrapper.find('form')
      await form.trigger('submit.prevent')
      expect(modalWrapper.text()).toContain('Nilai pembagi harus lebih besar dari 0')
    })
  })
})
