import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppButton from '@/shared/components/ui/AppButton.vue'

describe('AppButton.vue', () => {
  it('renders button with default slot content', () => {
    const wrapper = mount(AppButton, {
      slots: {
        default: 'Simpan Data'
      }
    })
    expect(wrapper.text()).toContain('Simpan Data')
    expect(wrapper.classes()).toContain('bg-primary')
  })

  it('renders different visual variants correctly', async () => {
    const wrapper = mount(AppButton, {
      props: { variant: 'danger' }
    })
    expect(wrapper.classes()).toContain('bg-semantic-danger')

    await wrapper.setProps({ variant: 'secondary' })
    expect(wrapper.classes()).toContain('bg-slate-100')

    await wrapper.setProps({ variant: 'outline' })
    expect(wrapper.classes()).toContain('border-primary')

    await wrapper.setProps({ variant: 'ghost' })
    expect(wrapper.classes()).toContain('bg-transparent')
  })

  it('respects disabled prop and prevents clicks', async () => {
    const wrapper = mount(AppButton, {
      props: { disabled: true },
      slots: { default: 'Disabled Button' }
    })

    const button = wrapper.find('button')
    expect(button.attributes('disabled')).toBeDefined()

    await button.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('shows loading state and prevents clicks', async () => {
    const wrapper = mount(AppButton, {
      props: { loading: true },
      slots: { default: 'Loading Button' }
    })

    expect(wrapper.find('[role="status"]').exists()).toBe(true)
    const button = wrapper.find('button')
    await button.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('emits click event when enabled and clicked', async () => {
    const wrapper = mount(AppButton, {
      slots: { default: 'Click Me' }
    })

    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
})
