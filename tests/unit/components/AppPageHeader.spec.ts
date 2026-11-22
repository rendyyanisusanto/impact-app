import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'

describe('AppPageHeader.vue', () => {
  it('renders title and subtitle', () => {
    const wrapper = mount(AppPageHeader, {
      props: {
        title: 'Master Data Suplier',
        subtitle: 'Daftar vendor dan suplier bahan baku furniture'
      }
    })

    expect(wrapper.find('h1').text()).toBe('Master Data Suplier')
    expect(wrapper.text()).toContain('Daftar vendor dan suplier bahan baku furniture')
  })

  it('renders actions and breadcrumb slots', () => {
    const wrapper = mount(AppPageHeader, {
      props: { title: 'Purchase Order' },
      slots: {
        breadcrumb: '<nav id="custom-bc">Home / PO</nav>',
        actions: '<button id="btn-export">Export PDF</button>'
      }
    })

    expect(wrapper.find('#custom-bc').exists()).toBe(true)
    expect(wrapper.find('#btn-export').exists()).toBe(true)
  })
})
