import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { routes } from '@/app/router/routes'
import { setupRouteGuards } from '@/app/router/guards'
import { useAuthStore } from '@/stores/auth.store'
import { referenceService } from '@/shared/services/reference.service'
import { warehouseService } from '@/modules/settings/warehouses/services/warehouse.service'
import { productCategoryService } from '@/modules/settings/product-categories/services/product-category.service'
import {
  satuanBeliService,
  satuanPakaiService,
  satuanBarangService
} from '@/modules/settings/units/services/unit.service'
import { materialService } from '@/modules/inventory/materials/services/material.service'
import { productService } from '@/modules/inventory/products/services/product.service'
import { supplierService } from '@/modules/procurement/suppliers/services/supplier.service'
import { customerService } from '@/modules/sales/customers/services/customer.service'
import { sanitizeExcelCell } from '@/shared/utils/excel-export'

describe('Sprint 3 — Tasks 11 & 12: Master Data Integration & RBAC Test Suite', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    referenceService.reset()
    warehouseService.reset()
    productCategoryService.reset()
    satuanBeliService.reset()
    satuanPakaiService.reset()
    satuanBarangService.reset()
    materialService.reset()
    productService.reset()
    supplierService.reset()
    customerService.reset()
  })

  describe('1. Cross-Module Reference Synchronization', () => {
    it('1.1 reflects warehouse renaming in productService without mutating quantity or price', async () => {
      // Product 43 initially references gudang_id 1000 ('Gudang Utama')
      const before = await productService.getById(43)
      expect(before.gudang_id).toBe(1000)
      expect(before.gudang_nama).toBe('Gudang Utama')
      const originalQty = before.qty
      const originalPrice = before.harga

      // Rename warehouse 1000 via warehouseService
      await warehouseService.update(1000, {
        nama: 'Gudang Pusat Industri Margomulyo'
      })

      // Reference service cache is updated
      expect(referenceService.getWarehouseName(1000)).toBe('Gudang Pusat Industri Margomulyo')

      // Product enrichment automatically displays the updated warehouse name
      const after = await productService.getById(43)
      expect(after.gudang_nama).toBe('Gudang Pusat Industri Margomulyo')
      expect(after.qty).toBe(originalQty)
      expect(after.harga).toBe(originalPrice)
    })

    it('1.2 reflects product category renaming in product listings', async () => {
      // Product category 1 is initially 'Lainnya'
      const before = await productService.getById(43)
      expect(before.kategori_barang_id).toBe(1)
      expect(before.kategori_barang_nama).toBe('Lainnya')

      // Rename category 1 via productCategoryService
      await productCategoryService.update(1, {
        nama: 'Lainnya & Ergonomic Seating'
      })

      expect(referenceService.getProductCategoryName(1)).toBe('Lainnya & Ergonomic Seating')

      const after = await productService.getById(43)
      expect(after.kategori_barang_nama).toBe('Lainnya & Ergonomic Seating')
    })

    it('1.3 provides asynchronous reference options via referenceService contract', async () => {
      const warehouses = await referenceService.getWarehouses()
      expect(warehouses.length).toBeGreaterThanOrEqual(4)
      expect(warehouses[0]).toHaveProperty('value')
      expect(warehouses[0]).toHaveProperty('label')

      const units = await referenceService.getProductUnits()
      expect(units.length).toBeGreaterThanOrEqual(1)

      const categories = await referenceService.getProductCategories()
      expect(categories.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('2. Referential Integrity & Restricted Deletion Safeguards', () => {
    it('2.1 blocks deletion of a warehouse currently referenced by products or materials', async () => {
      // Warehouse 1000 is referenced by Product 43
      await expect(warehouseService.delete(1000)).rejects.toThrow(
        'Gudang tidak dapat dihapus karena masih digunakan oleh data bahan atau produk.'
      )

      // Unreferenced warehouse (e.g. 1001 Gudang Bambe) can be safely deleted
      const deleted = await warehouseService.delete(1001)
      expect(deleted).toBe(true)
    })

    it('2.2 blocks deletion of a purchase unit referenced by usage units or materials', async () => {
      // Satuan Beli 1 (Kubik m3) is referenced by Satuan Pakai (Batang) and Material 1
      await expect(satuanBeliService.delete(1)).rejects.toThrow(
        'Satuan Beli tidak dapat dihapus karena masih digunakan oleh satuan pakai atau data bahan.'
      )

      // Newly created and unreferenced purchase unit can be deleted
      const created = await satuanBeliService.create({
        nama: 'Satuan Temp Unreferenced',
        kode: 'TMP-01'
      })
      const deleted = await satuanBeliService.delete(created.id)
      expect(deleted).toBe(true)
    })

    it('2.3 blocks deletion of a product category referenced by products', async () => {
      // Category 1 is referenced by Product 43
      await expect(productCategoryService.delete(1)).rejects.toThrow(
        'Kategori Produk tidak dapat dihapus karena masih digunakan oleh data produk.'
      )
    })

    it('2.4 blocks deletion of a product unit referenced by products', async () => {
      // Satuan Barang 1 is referenced by Product 43
      await expect(satuanBarangService.delete(1)).rejects.toThrow(
        'Satuan Barang tidak dapat dihapus karena masih digunakan oleh data produk.'
      )
    })
  })

  describe('3. Supplier & Customer Cascading Deletes', () => {
    it('3.1 cascades deletion of supplier additional key-value attributes', async () => {
      const created = await supplierService.create({
        kode: 'SUP-CASCADE-TEST',
        nama: 'Supplier CV Uji Relasi',
        no_hp: '081299990000',
        email: 'supplier@uji.com',
        additional_data: [
          { name: 'NPWP', value: '11.222.333.4-555.000' },
          { name: 'Rekening', value: 'BCA 123456789' }
        ]
      })

      const loaded = await supplierService.getById(created.id)
      expect(loaded.additional_data?.length).toBe(2)

      // Delete supplier
      await supplierService.delete(created.id)

      // Supplier and its additional data are eliminated
      await expect(supplierService.getById(created.id)).rejects.toThrow()
    })

    it('3.2 cascades deletion of customer additional key-value attributes', async () => {
      const created = await customerService.create({
        kode: 'CUST-CASCADE-TEST',
        nama: 'Customer Hotel Grand Uji',
        additional_data: [{ name: 'PIC Proyek', value: 'Ir. Handoko' }]
      })

      const loaded = await customerService.getById(created.id)
      expect(loaded.additional_data?.length).toBe(1)

      await customerService.delete(created.id)
      await expect(customerService.getById(created.id)).rejects.toThrow()
    })
  })

  describe('4. Excel Import Atomicity & Rollback', () => {
    it('4.1 aborts entire product batch and rolls back if any row fails validation', async () => {
      const initialProducts = await productService.getAll()
      const initialCount = initialProducts.total

      // Batch with 1 valid product and 1 invalid product (empty name)
      const batch = [
        {
          kode: 'PRD-VALID-01',
          nama: 'Meja Rapat Kayu Jati',
          harga: 5000000
        },
        {
          kode: 'PRD-INVALID-02',
          nama: '' // Invalid!
        }
      ]

      await expect(productService.importBatch(batch)).rejects.toThrow(
        'Impor produk dibatalkan karena kesalahan validasi'
      )

      // Verify zero partial inserts (atomicity guaranteed)
      const afterProducts = await productService.getAll()
      expect(afterProducts.total).toBe(initialCount)
      expect(afterProducts.data.find(p => p.kode === 'PRD-VALID-01')).toBeUndefined()
    })

    it('4.2 commits all records atomically when all rows are valid', async () => {
      const initialProducts = await productService.getAll()
      const initialCount = initialProducts.total

      const validBatch = [
        {
          kode: 'PRD-BATCH-01',
          nama: 'Kursi Putar Belajar',
          harga: 350000
        },
        {
          kode: 'PRD-BATCH-02',
          nama: 'Meja Komputer Minimalis',
          harga: 750000
        }
      ]

      const res = await productService.importBatch(validBatch)
      expect(res.importedCount).toBe(2)

      const after = await productService.getAll()
      expect(after.total).toBe(initialCount + 2)
    })
  })

  describe('5. RBAC Integration & Route / Service Boundaries', () => {
    it('5.1 grants Superadmin full permissions across all master data operations', async () => {
      const auth = useAuthStore()
      await auth.switchUser('1') // Superadmin
      expect(auth.currentUser?.role).toBe('superadmin')

      // Superadmin can create, update, and read
      const created = await productService.create({
        nama: 'Superadmin Test Product'
      })
      expect(created.id).toBeDefined()
    })

    it('5.2 allows Auditor (Read-Only) to read but blocks create and delete at mock service boundary', async () => {
      const auth = useAuthStore()
      await auth.switchUser('4') // Auditor (Read-Only)
      expect(auth.currentUser?.role).toBe('viewer')

      // Can read list
      const list = await productService.getAll()
      expect(list.data.length).toBeGreaterThan(0)

      // Cannot create -> throws permission denied
      await expect(
        productService.create({
          nama: 'Unauthorized Product Addition'
        })
      ).rejects.toThrow(/Akses ditolak.*create.*inventory\.products/)

      // Cannot delete -> throws permission denied
      await expect(productService.delete(43)).rejects.toThrow(
        /Akses ditolak.*delete.*inventory\.products/
      )
    })

    it('5.3 blocks Staff Penjualan from inventory routes and service actions', async () => {
      const auth = useAuthStore()
      await auth.switchUser('2') // Staff Penjualan
      expect(auth.currentUser?.role).toBe('staff_penjualan')

      // Service boundary check
      await expect(
        productService.create({
          nama: 'Penjualan Cannot Create Product'
        })
      ).rejects.toThrow(/Akses ditolak.*create.*inventory\.products/)

      // Route guard check
      const router = createRouter({
        history: createMemoryHistory(),
        routes
      })
      setupRouteGuards(router)

      await router.push('/inventory/products')
      // Redirected to unauthorized
      expect(router.currentRoute.value.path).toBe('/unauthorized')
    })
  })

  describe('6. Export Formula Injection Prevention', () => {
    it('6.1 sanitizes cell strings starting with formula trigger symbols (=, +, -, @)', () => {
      expect(sanitizeExcelCell('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)")
      expect(sanitizeExcelCell('+123456')).toBe("'+123456")
      expect(sanitizeExcelCell('-987654')).toBe("'-987654")
      expect(sanitizeExcelCell('@cmd|calc')).toBe("'@cmd|calc")
      expect(sanitizeExcelCell('Normal Text 123')).toBe('Normal Text 123')
      expect(sanitizeExcelCell(100000)).toBe(100000)
    })
  })
})
