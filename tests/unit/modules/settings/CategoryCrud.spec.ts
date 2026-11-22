import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { materialCategoryService } from '@/modules/settings/material-categories/services/material-category.service'
import { productCategoryService } from '@/modules/settings/product-categories/services/product-category.service'
import MaterialCategoryListPage from '@/modules/settings/material-categories/pages/MaterialCategoryListPage.vue'
import MaterialCategoryFormModal from '@/modules/settings/material-categories/components/MaterialCategoryFormModal.vue'
import ProductCategoryListPage from '@/modules/settings/product-categories/pages/ProductCategoryListPage.vue'
import ProductCategoryFormModal from '@/modules/settings/product-categories/components/ProductCategoryFormModal.vue'
import { materialCategoryRowMapper } from '@/modules/settings/material-categories/utils/material-category-import.config'
import { productCategoryRowMapper } from '@/modules/settings/product-categories/utils/product-category-import.config'

describe('Sprint 3 — Task 7: Master Data Kategori Bahan & Kategori Barang', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    materialCategoryService.reset()
    productCategoryService.reset()
  })

  describe('MaterialCategoryService & UI', () => {
    it('1. retrieves material categories with color tokens and active status', async () => {
      const res = await materialCategoryService.getAll()
      expect(res.data.length).toBeGreaterThanOrEqual(3)
      const b1 = res.data.find(c => c.kode === 'B1')
      expect(b1).toBeDefined()
      expect(b1?.nama).toBe('Bahan Utama')
      expect(b1?.color).toBe('#2980b9')
    })

    it('2. creates, updates, and deletes material category', async () => {
      const created = await materialCategoryService.create({
        nama: 'Bahan Aksesoris Besi',
        color: '#10b981',
        status: 1
      })
      expect(created.id).toBeDefined()
      expect(created.color).toBe('#10b981')

      const updated = await materialCategoryService.update(created.id, {
        nama: 'Bahan Logam & Besi'
      })
      expect(updated.nama).toBe('Bahan Logam & Besi')

      const deleted = await materialCategoryService.delete(created.id)
      expect(deleted).toBe(true)
      await expect(materialCategoryService.getById(created.id)).rejects.toThrow()
    })

    it('3. validates and imports material category rows', () => {
      const valid = materialCategoryRowMapper.mapRow(
        {
          'Nama Kategori *': 'Bahan Finishing NC',
          'Warna Label': '#f59e0b',
          Status: 'Aktif'
        },
        2
      )
      expect(valid.error).toBeUndefined()
      expect(valid.data?.nama).toBe('Bahan Finishing NC')

      const invalid = materialCategoryRowMapper.mapRow({}, 3)
      expect(invalid.error).toContain('Nama Kategori wajib diisi')
    })

    it('4. renders MaterialCategoryListPage and validates MaterialCategoryFormModal', async () => {
      const pageWrapper = mount(MaterialCategoryListPage, {
        global: { stubs: { teleport: true } }
      })
      await pageWrapper.vm.$nextTick()
      expect(pageWrapper.text()).toContain('Master Data Kategori Bahan')
      expect(pageWrapper.text()).toContain('Tambah Kategori')

      const formWrapper = mount(MaterialCategoryFormModal, {
        props: { modelValue: true, isEdit: false },
        global: { stubs: { teleport: true } }
      })
      const form = formWrapper.find('form')
      await form.trigger('submit.prevent')
      expect(formWrapper.text()).toContain('Nama kategori bahan wajib diisi')
    })
  })

  describe('ProductCategoryService & UI', () => {
    it('5. retrieves product categories from SQL seed', async () => {
      const res = await productCategoryService.getAll()
      expect(res.data.length).toBeGreaterThanOrEqual(4)
      const kursi = res.data.find(c => c.nama === 'Kursi')
      expect(kursi).toBeDefined()
      expect(kursi?.kode).toBe('SB-1')
      expect(kursi?.color).toBe('#811818')
    })

    it('6. creates, updates, and deletes product category', async () => {
      const created = await productCategoryService.create({
        nama: 'Lemari & Rak Partisi',
        color: '#6366f1',
        status: 1
      })
      expect(created.id).toBeDefined()
      expect(created.color).toBe('#6366f1')

      const updated = await productCategoryService.update(created.id, {
        nama: 'Lemari, Rak & Partisi'
      })
      expect(updated.nama).toBe('Lemari, Rak & Partisi')

      const deleted = await productCategoryService.delete(created.id)
      expect(deleted).toBe(true)
      await expect(productCategoryService.getById(created.id)).rejects.toThrow()
    })

    it('7. validates and imports product category rows', () => {
      const valid = productCategoryRowMapper.mapRow(
        {
          'Nama Kategori *': 'Workstation Kantor',
          'Warna Label': '#059669',
          Status: 'Aktif'
        },
        2
      )
      expect(valid.error).toBeUndefined()
      expect(valid.data?.nama).toBe('Workstation Kantor')

      const invalid = productCategoryRowMapper.mapRow({ 'Warna Label': '#000' }, 3)
      expect(invalid.error).toContain('Nama Kategori wajib diisi')
    })

    it('8. renders ProductCategoryListPage and validates ProductCategoryFormModal', async () => {
      const pageWrapper = mount(ProductCategoryListPage, {
        global: { stubs: { teleport: true } }
      })
      await pageWrapper.vm.$nextTick()
      expect(pageWrapper.text()).toContain('Master Data Kategori Produk')
      expect(pageWrapper.text()).toContain('Tambah Kategori')

      const formWrapper = mount(ProductCategoryFormModal, {
        props: { modelValue: true, isEdit: false },
        global: { stubs: { teleport: true } }
      })
      const form = formWrapper.find('form')
      await form.trigger('submit.prevent')
      expect(formWrapper.text()).toContain('Nama kategori produk wajib diisi')
    })
  })
})
