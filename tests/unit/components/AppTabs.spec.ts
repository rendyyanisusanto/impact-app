import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppTabs, { type TabItem } from '@/shared/components/navigation/AppTabs.vue'

describe('AppTabs.vue', () => {
  const tabs: TabItem[] = [
    { id: 'tab1', label: 'Informasi Umum' },
    { id: 'tab2', label: 'Item Produk', badge: 5 },
    { id: 'tab3', label: 'Riwayat Log', disabled: true }
  ]

  it('renders tab list with proper ARIA semantics and active selection', () => {
    const wrapper = mount(AppTabs, {
      props: {
        tabs,
        modelValue: 'tab1'
      }
    })

    expect(wrapper.find('[role="tablist"]').exists()).toBe(true)
    const tabButtons = wrapper.findAll('[role="tab"]')
    expect(tabButtons).toHaveLength(3)

    expect(tabButtons[0].attributes('aria-selected')).toBe('true')
    expect(tabButtons[1].attributes('aria-selected')).toBe('false')
    expect(tabButtons[2].attributes('disabled')).toBeDefined()
    expect(tabButtons[1].text()).toContain('5')
  })

  it('emits update:modelValue and change when an enabled tab is clicked', async () => {
    const wrapper = mount(AppTabs, {
      props: {
        tabs,
        modelValue: 'tab1'
      }
    })

    const tabButtons = wrapper.findAll('[role="tab"]')
    await tabButtons[1].trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['tab2'])
    expect(wrapper.emitted('change')?.[0]).toEqual(['tab2'])
  })

  it('ignores clicks on disabled tabs', async () => {
    const wrapper = mount(AppTabs, {
      props: {
        tabs,
        modelValue: 'tab1'
      }
    })

    const tabButtons = wrapper.findAll('[role="tab"]')
    await tabButtons[2].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('supports keyboard navigation via ArrowRight and ArrowLeft keys', async () => {
    const wrapper = mount(AppTabs, {
      props: {
        tabs,
        modelValue: 'tab1'
      }
    })

    await wrapper.trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['tab2'])
  })
})
