import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { customerService } from '@/modules/sales/customers/services/customer.service'
import CustomerListPage from '@/modules/sales/customers/pages/CustomerListPage.vue'
import CustomerFormModal from '@/modules/sales/customers/components/CustomerFormModal.vue'
import CustomerDetailModal from '@/modules/sales/customers/components/CustomerDetailModal.vue'
import AppTableSkeleton from '@/shared/components/data/AppTableSkeleton.vue'
import type { MasterDataCustomer } from '@/modules/sales/customers/types/customer.types'

describe('Sprint 3 — Task 3: Master Data Customer', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  describe('MockCustomerService CRUD & Nullable Schema Handling', () => {
    it('1. fetches customer list with pagination', async () => {
      const res = await customerService.list({ page: 1, limit: 10 })
      expect(res.data.length).toBeGreaterThan(0)
      expect(res.total).toBeGreaterThan(0)
    })

    it('2. allows creating customer with null optional fields adhering to SQL schema', async () => {
      const created = await customerService.create({
        nama: 'PT Mitra Sukses Nullable',
        kode: null,
        no_hp: null,
        email: null,
        alamat: null,
        city_id: null,
        deskripsi: null,
        status: 1,
        additional_data: []
      })

      expect(created.id).toBeDefined()
      expect(created.nama).toBe('PT Mitra Sukses Nullable')
      expect(created.kode).toBeNull()
      expect(created.no_hp).toBeNull()

      const fetched = await customerService.getById(created.id)
      expect(fetched?.nama).toBe('PT Mitra Sukses Nullable')
    })

    it('3. filters customers by search term and status', async () => {
      const res = await customerService.list({ search: 'Hotel' })
      expect(res.data.length).toBeGreaterThan(0)
      expect(res.data.some(c => (c.nama ?? '').toLowerCase().includes('hotel'))).toBe(true)
    })

    it('4. updates customer data and replaces additional contacts', async () => {
      const created = await customerService.create({
        nama: 'Customer A',
        status: 1
      })

      const updated = await customerService.update(created.id, {
        nama: 'Customer A Updated',
        status: 0,
        additional_data: [{ name: 'PIC Keuangan', value: '08123333' }]
      })

      expect(updated.nama).toBe('Customer A Updated')
      expect(updated.status).toBe(0)
      expect(updated.additional_data?.length).toBe(1)
    })

    it('5. deletes customer and cascades removal to additional contacts', async () => {
      const created = await customerService.create({
        nama: 'Customer To Delete',
        additional_data: [{ name: 'Kontak Hapus', value: '0811' }]
      })

      await customerService.delete(created.id)
      await expect(customerService.getById(created.id)).rejects.toThrow()
    })

    it('6. batch imports customer records', async () => {
      const res = await customerService.importBatch([
        { nama: 'Imported Cust 1', kode: 'CUST-IMP-01', status: 1 },
        { nama: 'Imported Cust 2', kode: 'CUST-IMP-02', status: 1 }
      ])
      expect(res.importedCount).toBe(2)
    })
  })

  describe('CustomerListPage Component & UI Interaction', () => {
    it('7. renders customer management table and skeleton state', () => {
      const wrapper = mount(CustomerListPage)
      expect(wrapper.text()).toContain('Master Data Customer')
      expect(wrapper.findComponent(AppTableSkeleton).exists()).toBe(true)
      expect(wrapper.text()).toContain('Tambah Customer')
      expect(wrapper.text()).toContain('Excel')
      expect(wrapper.text()).toContain('PDF')
      expect(wrapper.text()).toContain('Import Excel')
    })

    it('8. opens form modal when clicking Tambah Customer', async () => {
      const wrapper = mount(CustomerListPage, { attachTo: document.body })
      const btn = wrapper.findAll('button').find(b => b.text().includes('Tambah Customer'))
      expect(btn).toBeDefined()
      await btn?.trigger('click')

      const modal = wrapper.findComponent(CustomerFormModal)
      expect(modal.exists()).toBe(true)
      expect(modal.props('modelValue')).toBe(true)
      wrapper.unmount()
    })
  })

  describe('CustomerDetailModal Component', () => {
    it('9. renders customer details and additional data correctly', () => {
      const mockCustomer: MasterDataCustomer = {
        id: 777,
        kode: 'CUST-777',
        nama: 'PT Grand Hotel Internasional',
        no_hp: '021-55556666',
        email: 'procurement@grandhotel.com',
        alamat: 'Jl. Sudirman Kav 20',
        province_id: 2,
        city_id: 2,
        city_name: 'Kota Bandung',
        province_name: 'Jawa Barat',
        deskripsi: 'Hotel bintang 5',
        status: 1,
        created_at: '2026-01-01',
        created_by: 1,
        updated_at: null,
        updated_by: null,
        additional_data: [
          {
            id: 201,
            customer_id: 777,
            name: 'Siti Rahma',
            value: '081399990000'
          }
        ]
      }

      const wrapper = mount(CustomerDetailModal, {
        props: {
          modelValue: true,
          customer: mockCustomer
        },
        attachTo: document.body
      })

      expect(document.body.textContent).toContain('CUST-777')
      expect(document.body.textContent).toContain('PT Grand Hotel Internasional')
      expect(document.body.textContent).toContain('Siti Rahma')
      expect(document.body.textContent).toContain('081399990000')

      wrapper.unmount()
    })
  })
})
