import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import BomDetailPage from '@/modules/production/pages/BomDetailPage.vue'
import { bomService } from '@/modules/production/services/bom.service'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/production/bom', component: { template: '<div>BoM List</div>' } },
    { path: '/production/bom/:id', component: BomDetailPage },
    { path: '/production/bom/:id/edit', component: { template: '<div>BoM Edit</div>' } }
  ]
})

describe('Sprint 6 — Task 4 & 6: BoM Detail View, Workflow & RBAC Integration', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    bomService.reset()
    await router.push('/production/bom/1')
  })

  it('4.1 renders Detail Page with recipe specifications and KPI metrics', async () => {
    const wrapper = mount(BomDetailPage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 80))

    expect(wrapper.text()).toContain('Detail Template: TPL-IC74')
    expect(wrapper.text()).toContain('Standar Perakitan Kursi Kantor Mesh')
    expect(wrapper.text()).toContain('Produk Furniture')
    expect(wrapper.text()).toContain('Rincian Komposisi Bahan Baku')
    expect(wrapper.text()).toContain('Simulasi Kebutuhan Bahan Baku')
  })

  it('4.2 displays action buttons: Edit, Duplikasi, Cetak, PDF, and Nonaktifkan', async () => {
    const wrapper = mount(BomDetailPage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 80))

    const buttons = wrapper.findAll('button')
    const buttonTexts = buttons.map(b => b.text().toLowerCase())

    expect(buttonTexts.some(t => t.includes('edit'))).toBe(true)
    expect(buttonTexts.some(t => t.includes('duplikasi'))).toBe(true)
    expect(buttonTexts.some(t => t.includes('cetak'))).toBe(true)
    expect(buttonTexts.some(t => t.includes('pdf'))).toBe(true)
    expect(buttonTexts.some(t => t.includes('nonaktifkan'))).toBe(true)
  })

  it('4.3 integrates real-time material requirements simulation inside detail page', async () => {
    const wrapper = mount(BomDetailPage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 80))

    // Interactive target production input
    const targetInput = wrapper.find('input[type="number"]')
    expect(targetInput.exists()).toBe(true)

    // Check simulation section labels
    expect(wrapper.text()).toContain('Simulasi Kebutuhan Bahan Baku')
    expect(wrapper.text()).toContain('Status Kelayakan')
  })

  it('4.4 executes duplicate template workflow and generates valid new copy', async () => {
    const original = await bomService.getTemplateById(1)
    expect(original).not.toBeNull()

    const duplicate = await bomService.duplicateTemplate(1)
    expect(duplicate.id).not.toBe(1)
    expect(duplicate.nama).toBe(`${original!.nama} (Salinan)`)

    const duplicateDetail = await bomService.getTemplateById(duplicate.id)
    expect(duplicateDetail).not.toBeNull()
    expect(duplicateDetail!.items.length).toBe(original!.items.length)
  })
})
