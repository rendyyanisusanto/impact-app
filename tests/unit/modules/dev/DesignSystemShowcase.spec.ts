import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DesignSystemShowcaseView from '@/modules/dev/views/DesignSystemShowcaseView.vue'
import { useToast } from '@/shared/composables/useToast'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppDataTable from '@/shared/components/data/AppDataTable.vue'
import AppTabs from '@/shared/components/navigation/AppTabs.vue'

describe('Sprint 1 — Task 9: Design System Showcase', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('1. Renders the design system showcase component with header and tabs', () => {
    const wrapper = mount(DesignSystemShowcaseView)
    expect(wrapper.text()).toContain('Design System Showcase')
    expect(wrapper.text()).toContain('Buttons & Icons')
    expect(wrapper.text()).toContain('Form Controls')
    expect(wrapper.text()).toContain('Alerts & Feedback')
    expect(wrapper.text()).toContain('Data Table & Badges')
    expect(wrapper.text()).toContain('Colors & Typography')
  })

  it('2. Contains AppTabs and switches between showcase categories', async () => {
    const wrapper = mount(DesignSystemShowcaseView)
    const tabs = wrapper.findComponent(AppTabs)
    expect(tabs.exists()).toBe(true)

    // Switch to Forms tab
    const formTabBtn = wrapper
      .findAll('button[role="tab"]')
      .find(btn => btn.text().includes('Form Controls'))
    expect(formTabBtn).toBeDefined()
    await formTabBtn?.trigger('click')

    expect(wrapper.text()).toContain('Form Fields & Controls')
    expect(wrapper.text()).toContain('Nama Produk')
  })

  it('3. Dispatches global toast notifications on button triggers', async () => {
    const toast = useToast()
    toast.clearAll()

    const wrapper = mount(DesignSystemShowcaseView)
    // Switch to feedback tab
    const feedbackTabBtn = wrapper
      .findAll('button[role="tab"]')
      .find(btn => btn.text().includes('Alerts & Feedback'))
    await feedbackTabBtn?.trigger('click')

    const triggerBtn = wrapper
      .findAll('button')
      .find(btn => btn.text().includes('Trigger Success Toast'))
    expect(triggerBtn).toBeDefined()

    await triggerBtn?.trigger('click')
    expect(toast.toasts.value).toHaveLength(1)
    expect(toast.toasts.value[0].type).toBe('success')
  })

  it('4. Opens and closes AppModal interactively', async () => {
    const wrapper = mount(DesignSystemShowcaseView, { attachTo: document.body })
    // Switch to feedback tab
    const feedbackTabBtn = wrapper
      .findAll('button[role="tab"]')
      .find(btn => btn.text().includes('Alerts & Feedback'))
    await feedbackTabBtn?.trigger('click')

    const modal = wrapper.findComponent(AppModal)
    expect(modal.exists()).toBe(true)
    expect(modal.props('modelValue')).toBe(false)

    // Click trigger to open modal (sm)
    const openBtn = wrapper.findAll('button').find(btn => btn.text().includes('Buka Modal (sm)'))
    expect(openBtn).toBeDefined()
    await openBtn?.trigger('click')

    expect(modal.props('modelValue')).toBe(true)
    wrapper.unmount()
  })

  it('5. Contains and renders interactive AppDataTable with search toolbar and pagination', async () => {
    const wrapper = mount(DesignSystemShowcaseView)
    // Switch to data tab
    const dataTabBtn = wrapper
      .findAll('button[role="tab"]')
      .find(btn => btn.text().includes('Data Table & Badges'))
    await dataTabBtn?.trigger('click')

    const table = wrapper.findComponent(AppDataTable)
    expect(table.exists()).toBe(true)
    expect(wrapper.text()).toContain('Sofa Minimalis 3-Seater Beludru')
    expect(wrapper.text()).toContain('Meja Makan Jati Solid 6 Kursi')
  })
})
