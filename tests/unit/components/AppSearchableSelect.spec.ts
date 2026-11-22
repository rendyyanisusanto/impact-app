import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppSearchableSelect from '@/shared/components/ui/AppSearchableSelect.vue'

describe('AppSearchableSelect.vue', () => {
  const sampleOptions = Array.from({ length: 100 }, (_, i) => ({
    label: `Karyawan ${i + 1}`,
    value: i + 1,
    description: `karyawan${i + 1}@example.com`
  }))

  it('renders trigger button with placeholder when no value is selected', () => {
    const wrapper = mount(AppSearchableSelect, {
      props: {
        options: sampleOptions,
        placeholder: '-- Pilih Karyawan --'
      }
    })

    expect(wrapper.text()).toContain('-- Pilih Karyawan --')
  })

  it('renders selected option label and allows clearing when allowClear is true', async () => {
    const wrapper = mount(AppSearchableSelect, {
      props: {
        modelValue: 5,
        options: sampleOptions,
        allowClear: true
      }
    })

    expect(wrapper.text()).toContain('Karyawan 5')

    const clearBtn = wrapper.find('[title="Hapus pilihan"]')
    expect(clearBtn.exists()).toBe(true)

    await clearBtn.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([null])
  })

  it('opens dropdown, displays search input, and applies limit', async () => {
    const wrapper = mount(AppSearchableSelect, {
      props: {
        options: sampleOptions,
        limit: 20
      }
    })

    // Click trigger to open
    await wrapper.find('button').trigger('click')

    // Dropdown input exists
    const searchInput = wrapper.find('input[type="text"]')
    expect(searchInput.exists()).toBe(true)

    // Option items rendered should be limited to 20
    const listItems = wrapper.findAll('ul > li')
    // 20 items + 1 footer info
    expect(listItems.length).toBe(21)
    expect(wrapper.text()).toContain('Menampilkan 20 dari 100 data')
  })

  it('filters options based on search query with limit', async () => {
    const wrapper = mount(AppSearchableSelect, {
      props: {
        options: sampleOptions,
        limit: 5
      }
    })

    await wrapper.find('button').trigger('click')

    const searchInput = wrapper.find('input[type="text"]')
    await searchInput.setValue('Karyawan 1') // matches 1, 10, 11...19, 100

    expect(wrapper.text()).toContain('Menampilkan 5 dari')
    expect(wrapper.text()).toContain('Karyawan 1')
  })

  it('emits update:modelValue when an option is clicked', async () => {
    const wrapper = mount(AppSearchableSelect, {
      props: {
        options: sampleOptions,
        limit: 10
      }
    })

    await wrapper.find('button').trigger('click')
    const firstOption = wrapper.findAll('ul > li')[0]
    await firstOption.trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([1])
    expect(wrapper.emitted('change')?.[0]).toEqual([1])
  })
})

