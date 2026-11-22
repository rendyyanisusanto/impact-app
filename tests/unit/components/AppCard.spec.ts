import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppCard from '@/shared/components/ui/AppCard.vue'
import AppDivider from '@/shared/components/ui/AppDivider.vue'

describe('AppCard.vue & AppDivider.vue', () => {
  it('renders card with title and subtitle header', () => {
    const wrapper = mount(AppCard, {
      props: {
        title: 'Detail Pengadaan',
        subtitle: 'Informasi surat pesanan dan vendor'
      },
      slots: {
        default: '<div class="content">Konten Form</div>'
      }
    })

    expect(wrapper.text()).toContain('Detail Pengadaan')
    expect(wrapper.text()).toContain('Informasi surat pesanan dan vendor')
    expect(wrapper.find('.content').exists()).toBe(true)
  })

  it('renders footer slot and handles padding variants', () => {
    const wrapper = mount(AppCard, {
      props: { padding: 'lg' },
      slots: {
        default: 'Body Content',
        footer: '<button>Simpan</button>'
      }
    })

    expect(wrapper.find('button').text()).toBe('Simpan')
    expect(wrapper.html()).toContain('p-6')
  })

  it('renders AppDivider horizontally and vertically', () => {
    const horizontal = mount(AppDivider)
    expect(horizontal.find('hr').exists()).toBe(true)

    const withLabel = mount(AppDivider, {
      props: { label: 'ATAU' }
    })
    expect(withLabel.text()).toContain('ATAU')

    const vertical = mount(AppDivider, {
      props: { vertical: true }
    })
    expect(vertical.attributes('aria-orientation')).toBe('vertical')
  })
})
