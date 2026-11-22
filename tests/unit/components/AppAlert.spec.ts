import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppAlert from '@/shared/components/feedback/AppAlert.vue'

describe('AppAlert.vue', () => {
  it('renders alert with title and content', () => {
    const wrapper = mount(AppAlert, {
      props: {
        variant: 'success',
        title: 'Berhasil Disimpan'
      },
      slots: {
        default: 'Data produk telah diperbarui di database.'
      }
    })

    expect(wrapper.attributes('role')).toBe('alert')
    expect(wrapper.text()).toContain('Berhasil Disimpan')
    expect(wrapper.text()).toContain('Data produk telah diperbarui di database.')
    expect(wrapper.classes()).toContain('border-green-200')
  })

  it('renders dismiss button and emits dismiss when clicked', async () => {
    const wrapper = mount(AppAlert, {
      props: {
        variant: 'danger',
        dismissible: true
      },
      slots: {
        default: 'Terjadi kegagalan jaringan.'
      }
    })

    const dismissBtn = wrapper.find('button[aria-label="Tutup pemberitahuan"]')
    expect(dismissBtn.exists()).toBe(true)

    await dismissBtn.trigger('click')
    expect(wrapper.emitted('dismiss')).toHaveLength(1)
  })
})
