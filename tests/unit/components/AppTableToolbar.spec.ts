import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppTableToolbar from '@/shared/components/data/AppTableToolbar.vue'

describe('AppTableToolbar.vue', () => {
  it('renders search input and emits update:searchQuery', async () => {
    const wrapper = mount(AppTableToolbar, {
      props: {
        searchQuery: '',
        searchPlaceholder: 'Cari suplier...'
      }
    })

    const input = wrapper.find('input')
    expect(input.attributes('placeholder')).toBe('Cari suplier...')

    await input.setValue('PT Kayu Abadi')
    expect(wrapper.emitted('update:searchQuery')?.[0]).toEqual(['PT Kayu Abadi'])
  })

  it('renders filter and action slots', () => {
    const wrapper = mount(AppTableToolbar, {
      slots: {
        filters: '<select id="filter-status"><option>Semua</option></select>',
        actions: '<button id="btn-add">Tambah Data</button>'
      }
    })

    expect(wrapper.find('#filter-status').exists()).toBe(true)
    expect(wrapper.find('#btn-add').exists()).toBe(true)
  })
})
