import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { supplierService } from '@/modules/procurement/suppliers/services/supplier.service'
import SupplierListPage from '@/modules/procurement/suppliers/pages/SupplierListPage.vue'
import SupplierFormModal from '@/modules/procurement/suppliers/components/SupplierFormModal.vue'
import SupplierDetailModal from '@/modules/procurement/suppliers/components/SupplierDetailModal.vue'
import AppTableSkeleton from '@/shared/components/data/AppTableSkeleton.vue'
import type { MasterDataSuplier } from '@/modules/procurement/suppliers/types/supplier.types'

describe('Sprint 3 — Task 2: Master Data Supplier', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  describe('MockSupplierService CRUD & Data Isolation', () => {
    it('1. fetches initial suppliers with pagination and list metadata', async () => {
      const result = await supplierService.list({ page: 1, limit: 5 })
      expect(result.data.length).toBeLessThanOrEqual(5)
      expect(result.page).toBe(1)
      expect(result.total).toBeGreaterThan(0)
    })

    it('2. filters suppliers by search query (kode, nama, email)', async () => {
      const searchResult = await supplierService.list({ search: 'Kayu' })
      expect(searchResult.data.length).toBeGreaterThan(0)
      const allContain = searchResult.data.every(
        s => s.nama.toLowerCase().includes('kayu') || s.kode.toLowerCase().includes('kayu')
      )
      expect(allContain).toBe(true)
    })

    it('3. filters suppliers by status', async () => {
      const activeResult = await supplierService.list({ status: 1 })
      expect(activeResult.data.every(s => s.status === 1)).toBe(true)
    })

    it('4. creates a new supplier with additional contact data', async () => {
      const created = await supplierService.create({
        kode: 'SPL-TEST-001',
        nama: 'PT Test Kayu Abadi',
        no_hp: '081234567890',
        email: 'test@kayuabadi.co.id',
        alamat: 'Jl. Industri Kayu No. 10',
        city_id: 1,
        deskripsi: 'Supplier uji coba',
        status: 1,
        additional_data: [
          {
            name: 'Budi Santoso (Sales Manager)',
            value: '081299998888'
          }
        ]
      })

      expect(created.id).toBeDefined()
      expect(created.kode).toBe('SPL-TEST-001')
      expect(created.additional_data?.length).toBe(1)

      const fetched = await supplierService.getById(created.id)
      expect(fetched).not.toBeNull()
      expect(fetched?.nama).toBe('PT Test Kayu Abadi')
    })

    it('5. updates supplier information and replaces additional contacts', async () => {
      const created = await supplierService.create({
        kode: 'SPL-UPD-001',
        nama: 'CV Sebelum Update',
        no_hp: '0811111111',
        email: 'sebelum@update.com',
        status: 1,
        additional_data: []
      })

      const updated = await supplierService.update(created.id, {
        nama: 'CV Sesudah Update',
        no_hp: '0822222222',
        additional_data: [
          {
            name: 'Dewi (Finance)',
            value: '0833333333'
          }
        ]
      })

      expect(updated.nama).toBe('CV Sesudah Update')
      expect(updated.no_hp).toBe('0822222222')
      expect(updated.additional_data?.length).toBe(1)
      expect(updated.additional_data?.[0].name).toBe('Dewi (Finance)')
    })

    it('6. deletes supplier and cascades delete to additional contact records', async () => {
      const created = await supplierService.create({
        kode: 'SPL-DEL-001',
        nama: 'PT Hapus Bersama',
        no_hp: '0899999999',
        email: 'hapus@bersama.com',
        status: 1,
        additional_data: [{ name: 'Kontak 1', value: 'Staff' }]
      })

      await supplierService.delete(created.id)
      await expect(supplierService.getById(created.id)).rejects.toThrow()
    })

    it('7. batch imports multiple suppliers', async () => {
      const items = [
        {
          kode: 'SPL-BATCH-01',
          nama: 'Batch 1',
          no_hp: '081111',
          email: 'b1@batch.com',
          status: 1
        },
        {
          kode: 'SPL-BATCH-02',
          nama: 'Batch 2',
          no_hp: '082222',
          email: 'b2@batch.com',
          status: 1
        }
      ]

      const res = await supplierService.importBatch(items)
      expect(res.importedCount).toBe(2)
    })
  })

  describe('SupplierListPage Component & UI Interaction', () => {
    it('8. renders page header, action buttons, search, and table skeleton when loading', () => {
      const wrapper = mount(SupplierListPage)
      expect(wrapper.text()).toContain('Master Data Supplier')
      expect(wrapper.findComponent(AppTableSkeleton).exists()).toBe(true)
      expect(wrapper.text()).toContain('Tambah Supplier')
      expect(wrapper.text()).toContain('Excel')
      expect(wrapper.text()).toContain('PDF')
      expect(wrapper.text()).toContain('Import Excel')
    })

    it('9. opens form modal when clicking Tambah Supplier', async () => {
      const wrapper = mount(SupplierListPage, { attachTo: document.body })
      const tambahBtn = wrapper.findAll('button').find(b => b.text().includes('Tambah Supplier'))
      expect(tambahBtn).toBeDefined()
      await tambahBtn?.trigger('click')

      const modal = wrapper.findComponent(SupplierFormModal)
      expect(modal.exists()).toBe(true)
      expect(modal.props('modelValue')).toBe(true)
      wrapper.unmount()
    })
  })

  describe('SupplierDetailModal Component', () => {
    it('10. renders supplier details and additional contacts table', () => {
      const mockSupplier: MasterDataSuplier = {
        id: 999,
        kode: 'SPL-VIEW-01',
        nama: 'PT Kayu Makmur Lestari',
        no_hp: '08123456789',
        email: 'info@kayumakmur.id',
        alamat: 'Kawasan Industri Candi Blok A',
        province_id: 1,
        city_id: 1,
        city_name: 'Kota Semarang',
        province_name: 'Jawa Tengah',
        deskripsi: 'Supplier kayu jati terpercaya',
        status: 1,
        created_at: '2026-01-01 10:00:00',
        created_by: 1,
        updated_at: '2026-01-02 11:00:00',
        updated_by: 1,
        additional_data: [
          {
            id: 101,
            supplier_id: 999,
            name: 'Irwan Setiawan',
            value: '081288887777'
          }
        ]
      }

      const wrapper = mount(SupplierDetailModal, {
        props: {
          modelValue: true,
          supplier: mockSupplier
        },
        attachTo: document.body
      })

      expect(document.body.textContent).toContain('SPL-VIEW-01')
      expect(document.body.textContent).toContain('PT Kayu Makmur Lestari')
      expect(document.body.textContent).toContain('Kota Semarang')
      expect(document.body.textContent).toContain('Irwan Setiawan')
      expect(document.body.textContent).toContain('081288887777')

      wrapper.unmount()
    })
  })
})
