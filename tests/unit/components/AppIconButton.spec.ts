import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppIconButton from '@/shared/components/ui/AppIconButton.vue'

describe('AppIconButton.vue', () => {
  it('requires accessible label and sets aria-label & title', () => {
    const wrapper = mount(AppIconButton, {
      props: {
        label: 'Hapus Transaksi',
        variant: 'danger'
      },
      slots: {
        default: '<span>icon</span>'
      }
    })

    const button = wrapper.find('button')
    expect(button.attributes('aria-label')).toBe('Hapus Transaksi')
    expect(button.attributes('title')).toBe('Hapus Transaksi')
    expect(button.classes()).toContain('bg-semantic-danger')
  })

  it('renders loading spinner and disables click', async () => {
    const wrapper = mount(AppIconButton, {
      props: {
        label: 'Refresh Data',
        loading: true
      }
    })

    expect(wrapper.find('[role="status"]').exists()).toBe(true)
    const button = wrapper.find('button')
    await button.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('emits click when clicked and enabled', async () => {
    const wrapper = mount(AppIconButton, {
      props: { label: 'Edit' }
    })

    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
})
