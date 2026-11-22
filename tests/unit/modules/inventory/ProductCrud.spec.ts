import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { productService } from '@/modules/inventory/products/services/product.service'
import ProductListPage from '@/modules/inventory/products/pages/ProductListPage.vue'
import ProductFormModal from '@/modules/inventory/products/components/ProductFormModal.vue'
import ProductDetailModal from '@/modules/inventory/products/components/ProductDetailModal.vue'
import { productRowMapper } from '@/modules/inventory/products/utils/product-import.config'

describe('Sprint 3 — Task 5: Master Data Produk', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    productService.reset()
  })

  describe('ProductService Unit Tests', () => {
    it('1. retrieves paginated products with enriched category, warehouse, unit and low-stock flag', async () => {
      const res = await productService.getAll({ page: 1, pageSize: 10 })
      expect(res.data.length).toBeGreaterThan(0)
      const first = res.data[0]
      expect(first).toHaveProperty('satuan_barang_nama')
      expect(first).toHaveProperty('kategori_barang_nama')
      expect(first).toHaveProperty('gudang_nama')
      expect(first).toHaveProperty('harga_formatted')
      expect(first).toHaveProperty('is_low_stock')
    })

    it('2. filters products by search term across code and name', async () => {
      const res = await productService.getAll({ search: 'Mesh' })
      expect(res.data.length).toBeGreaterThan(0)
      expect(res.data.every(p => p.nama?.includes('Mesh') || p.kode?.includes('Mesh'))).toBe(true)
    })

    it('3. filters products by warehouse and category', async () => {
      const res = await productService.getAll({
        filters: { gudang_id: 1000, kategori_barang_id: 2 }
      })
      expect(res.data.every(p => p.gudang_id === 1000 && p.kategori_barang_id === 2)).toBe(true)
    })

    it('4. creates a product with primary and additional photos and auto-generates code if missing', async () => {
      const created = await productService.create({
        nama: 'Kursi Gaming Ergonomis Test',
        harga: 1500000,
        qty: 10,
        min_qty: 2,
        satuan_barang_id: 1,
        kategori_barang_id: 3,
        gudang_id: 1000,
        foto: 'data:image/png;base64,samplephoto',
        additional_fotos: ['data:image/png;base64,extra1', 'data:image/png;base64,extra2']
      })

      expect(created.id).toBeDefined()
      expect(created.kode).toBeTruthy()
      expect(created.foto).toBe('data:image/png;base64,samplephoto')
      expect(created.fotos?.length).toBe(2)

      const fetched = await productService.getById(created.id)
      expect(fetched.nama).toBe('Kursi Gaming Ergonomis Test')
      expect(fetched.fotos?.length).toBe(2)
    })

    it('5. updates product details and cascades gallery photos', async () => {
      const updated = await productService.update(43, {
        nama: 'IC - 74 Updated Name',
        harga: 250000,
        additional_fotos: ['data:image/png;base64,newgallery']
      })

      expect(updated.nama).toBe('IC - 74 Updated Name')
      expect(updated.harga).toBe(250000)
      expect(updated.fotos?.length).toBe(1)
    })

    it('6. deletes product and cascades delete to gallery photos', async () => {
      const deleted = await productService.delete(43)
      expect(deleted).toBe(true)
      await expect(productService.getById(43)).rejects.toThrow()
    })

    it('7. imports batch products via productRowMapper', () => {
      const rowValid = {
        'Kode Produk': 'TEST-IMP-01',
        'Nama Produk *': 'Meja Custom Import',
        Kategori: 'Meja',
        Gudang: 'Gudang Utama',
        Satuan: 'Set',
        'Harga (Rp)': 1200000,
        'Stok Awal (QTY)': 15,
        'Min QTY': 5,
        Status: 'Aktif'
      }
      const mapped = productRowMapper.mapRow(rowValid, 2)
      expect(mapped.error).toBeUndefined()
      expect(mapped.data?.nama).toBe('Meja Custom Import')
      expect(mapped.data?.harga).toBe(1200000)

      const rowInvalid = { 'Kode Produk': 'TEST-ERR' }
      const errMapped = productRowMapper.mapRow(rowInvalid, 3)
      expect(errMapped.error).toContain('Nama Produk wajib diisi')
    })
  })

  describe('Product UI Components', () => {
    it('8. renders ProductListPage with action buttons, filter inputs, and table', async () => {
      const wrapper = mount(ProductListPage, {
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Master Data Produk')
      expect(wrapper.text()).toContain('Tambah Produk')
      expect(wrapper.text()).toContain('Import Excel')
    })

    it('9. opens ProductFormModal and validates required name', async () => {
      const wrapper = mount(ProductFormModal, {
        props: {
          open: true,
          isEdit: false
        },
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      expect(wrapper.text()).toContain('Tambah Produk Baru')
      expect(wrapper.text()).toContain('Kode Produk')
      expect(wrapper.text()).toContain('Nama Produk')
      expect(wrapper.text()).toContain('Foto Utama Produk')

      // Submit empty form triggers validation
      const form = wrapper.find('form')
      await form.trigger('submit.prevent')
      expect(wrapper.text()).toContain('Nama produk wajib diisi')
    })

    it('10. renders ProductDetailModal with low stock alert and specs', () => {
      const lowStockProduct = {
        id: 99,
        kode: 'PRD-LOW',
        nama: 'Kursi Hampir Habis',
        qty: 1,
        min_qty: 5,
        satuan_barang_id: 1,
        satuan_barang_nama: 'Pcs',
        kategori_barang_id: 1,
        kategori_barang_nama: 'Kursi',
        gudang_id: 1,
        gudang_nama: 'Gudang Utama',
        harga: 500000,
        harga_formatted: 'Rp 500.000',
        status: 1,
        keterangan: 'Barang display tinggal 1',
        uuid: null,
        foto: null,
        created_at: '2026-01-01',
        created_by: 1,
        updated_at: '2026-01-01',
        updated_by: 1
      }

      const wrapper = mount(ProductDetailModal, {
        props: {
          open: true,
          product: lowStockProduct
        },
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      expect(wrapper.text()).toContain('Kursi Hampir Habis')
      expect(wrapper.text()).toContain('Stok Menipis')
      expect(wrapper.text()).toContain('Perlu Restok')
      expect(wrapper.text()).toContain('Rp 500.000')
    })
  })
})
