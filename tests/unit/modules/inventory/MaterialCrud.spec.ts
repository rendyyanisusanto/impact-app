import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { materialService } from '@/modules/inventory/materials/services/material.service'
import MaterialListPage from '@/modules/inventory/materials/pages/MaterialListPage.vue'
import MaterialFormModal from '@/modules/inventory/materials/components/MaterialFormModal.vue'
import MaterialDetailModal from '@/modules/inventory/materials/components/MaterialDetailModal.vue'
import AppTableSkeleton from '@/shared/components/data/AppTableSkeleton.vue'
import type { MasterDataBahan } from '@/modules/inventory/materials/types/material.types'

describe('Sprint 3 — Task 4: Master Data Bahan', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  describe('MockMaterialService CRUD & Unit Conversion', () => {
    it('1. lists materials with pagination and metadata', async () => {
      const res = await materialService.list({ page: 1, limit: 10 })
      expect(res.data.length).toBeGreaterThan(0)
      expect(res.total).toBeGreaterThan(0)
    })

    it('2. filters materials by warehouse (gudang_id) and search term', async () => {
      const res = await materialService.list({ gudang_id: 1, search: 'Kayu' })
      expect(res.data.length).toBeGreaterThan(0)
      expect(res.data.every(m => m.gudang_id === 1)).toBe(true)
    })

    it('3. creates a new material with konversi satuan', async () => {
      const created = await materialService.create({
        kode: 'BHN-TEST-99',
        nama: 'Kain Pelapis Linen',
        gudang_id: 1,
        satuan_pakai_id: 3,
        satuan_beli_id: 3,
        min_qty: 15,
        qty: 50,
        harga_satuan: 75000,
        status: 1,
        konversi_satuan: [
          {
            satuan_id: 4,
            satuan_nama: 'Roll',
            nilai: 50,
            default: 1
          }
        ]
      })

      expect(created.id).toBeDefined()
      expect(created.kode).toBe('BHN-TEST-99')
      expect(created.konversi_satuan?.length).toBe(1)

      const fetched = await materialService.getById(created.id)
      expect(fetched?.nama).toBe('Kain Pelapis Linen')
    })

    it('4. updates material information without mutating stock quantity directly', async () => {
      const created = await materialService.create({
        kode: 'BHN-UP-01',
        nama: 'Sebelum Ganti Nama',
        gudang_id: 1,
        satuan_pakai_id: 1,
        satuan_beli_id: 1,
        min_qty: 10,
        qty: 100,
        harga_satuan: 10000,
        status: 1
      })

      const updated = await materialService.update(created.id, {
        nama: 'Sesudah Ganti Nama',
        harga_satuan: 12500,
        min_qty: 20
      })

      expect(updated.nama).toBe('Sesudah Ganti Nama')
      expect(updated.harga_satuan).toBe(12500)
      expect(updated.min_qty).toBe(20)
      expect(updated.qty).toBe(100) // Qty unchanged
    })

    it('5. deletes material and cascades delete to konversi satuan records', async () => {
      const created = await materialService.create({
        kode: 'BHN-DEL-01',
        nama: 'Bahan Hapus',
        gudang_id: 1,
        satuan_pakai_id: 1,
        satuan_beli_id: 1,
        min_qty: 5,
        qty: 10,
        harga_satuan: 5000,
        status: 1,
        konversi_satuan: [
          {
            satuan_id: 2,
            nilai: 10,
            default: 0
          }
        ]
      })

      await materialService.delete(created.id)
      await expect(materialService.getById(created.id)).rejects.toThrow()
    })

    it('6. batch imports material records', async () => {
      const res = await materialService.importBatch([
        {
          kode: 'BHN-IMP-01',
          nama: 'Bahan Import 1',
          gudang_id: 1,
          satuan_pakai_id: 1,
          satuan_beli_id: 1,
          min_qty: 10,
          qty: 25,
          harga_satuan: 25000,
          status: 1
        }
      ])
      expect(res.importedCount).toBe(1)
    })
  })

  describe('MaterialListPage Component & UI Interaction', () => {
    it('7. renders material management list with skeleton loading state', () => {
      const wrapper = mount(MaterialListPage)
      expect(wrapper.text()).toContain('Master Data Bahan')
      expect(wrapper.findComponent(AppTableSkeleton).exists()).toBe(true)
      expect(wrapper.text()).toContain('Tambah Bahan')
      expect(wrapper.text()).toContain('Excel')
      expect(wrapper.text()).toContain('PDF')
      expect(wrapper.text()).toContain('Import Excel')
    })

    it('8. opens form modal when clicking Tambah Bahan', async () => {
      const wrapper = mount(MaterialListPage, { attachTo: document.body })
      const btn = wrapper.findAll('button').find(b => b.text().includes('Tambah Bahan'))
      expect(btn).toBeDefined()
      await btn?.trigger('click')

      const modal = wrapper.findComponent(MaterialFormModal)
      expect(modal.exists()).toBe(true)
      expect(modal.props('modelValue')).toBe(true)
      wrapper.unmount()
    })
  })

  describe('MaterialDetailModal Component', () => {
    it('9. renders material metrics, stock warning if low, and konversi satuan', () => {
      const mockMaterial: MasterDataBahan = {
        id: 505,
        kode: 'BHN-505',
        nama: 'Busa Density 24 Tebal 10cm',
        gudang_id: 2,
        gudang_nama: 'Gudang Finishing & Aksesoris',
        satuan_pakai_id: 2,
        satuan_pakai_nama: 'Lembar',
        satuan_beli_id: 2,
        satuan_beli_nama: 'Lembar',
        min_qty: 20,
        qty: 5, // Low stock: qty <= min_qty
        harga_satuan: 145000,
        foto: null,
        deskripsi: 'Deskripsi bahan busa',
        status: 1,
        created_at: '2026-01-01',
        created_by: 1,
        updated_at: null,
        updated_by: null,
        konversi_satuan: [
          {
            id: 1,
            bahan_id: 505,
            satuan_id: 1,
            satuan_nama: 'Pcs',
            nilai: 2,
            default: 1
          }
        ]
      }

      const wrapper = mount(MaterialDetailModal, {
        props: {
          modelValue: true,
          material: mockMaterial
        },
        attachTo: document.body
      })

      expect(document.body.textContent).toContain('BHN-505')
      expect(document.body.textContent).toContain('Busa Density 24')
      expect(document.body.textContent).toContain('Stok Limit') // Low stock badge
      expect(document.body.textContent).toContain('Gudang Finishing & Aksesoris')

      wrapper.unmount()
    })
  })
})
