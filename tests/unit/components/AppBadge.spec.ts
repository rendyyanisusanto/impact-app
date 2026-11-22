import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppBadge from '@/shared/components/ui/AppBadge.vue'

describe('AppBadge.vue', () => {
  it('renders default neutral badge with slot text', () => {
    const wrapper = mount(AppBadge, {
      slots: { default: 'Draft' }
    })
    expect(wrapper.text()).toBe('Draft')
    expect(wrapper.classes()).toContain('bg-slate-100')
  })

  it('renders semantic variants correctly', async () => {
    const wrapper = mount(AppBadge, {
      props: { variant: 'success' },
      slots: { default: 'Selesai' }
    })
    expect(wrapper.classes()).toContain('bg-green-50')
    expect(wrapper.classes()).toContain('text-semantic-success')

    await wrapper.setProps({ variant: 'warning' })
    expect(wrapper.classes()).toContain('bg-amber-50')
    expect(wrapper.classes()).toContain('text-semantic-warning')

    await wrapper.setProps({ variant: 'danger' })
    expect(wrapper.classes()).toContain('bg-red-50')
    expect(wrapper.classes()).toContain('text-semantic-danger')

    await wrapper.setProps({ variant: 'info' })
    expect(wrapper.classes()).toContain('bg-blue-50')
    expect(wrapper.classes()).toContain('text-semantic-info')
  })

  it('renders dot indicator when dot prop is enabled', () => {
    const wrapper = mount(AppBadge, {
      props: { variant: 'success', dot: true },
      slots: { default: 'Aktif' }
    })
    const dot = wrapper.find('.rounded-full')
    expect(dot.exists()).toBe(true)
  })
})
