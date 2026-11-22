import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppSelect from '@/shared/components/ui/AppSelect.vue'

describe('AppSelect.vue', () => {
  const sampleOptions = [
    { label: 'Gudang Jepara', value: 'jepara' },
    { label: 'Gudang Semarang', value: 'semarang' },
    { label: 'Gudang Surabaya', value: 'surabaya' }
  ]

  it('renders select with options and placeholder', () => {
    const wrapper = mount(AppSelect, {
      props: {
        placeholder: '-- Pilih Gudang --',
        options: sampleOptions,
        modelValue: ''
      }
    })

    const select = wrapper.find('select')
    expect(select.exists()).toBe(true)

    const options = wrapper.findAll('option')
    expect(options).toHaveLength(4) // placeholder + 3 options
    expect(options[0].text()).toBe('-- Pilih Gudang --')
  })

  it('emits update:modelValue and change when an option is selected', async () => {
    const wrapper = mount(AppSelect, {
      props: {
        options: sampleOptions,
        modelValue: ''
      }
    })

    const select = wrapper.find('select')
    await select.setValue('semarang')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['semarang'])
    expect(wrapper.emitted('change')).toBeDefined()
  })

  it('applies error styling when error is present', () => {
    const wrapper = mount(AppSelect, {
      props: {
        options: sampleOptions,
        error: true
      }
    })

    const select = wrapper.find('select')
    expect(select.classes()).toContain('border-semantic-danger')
  })

  it('disables select when disabled prop is set', () => {
    const wrapper = mount(AppSelect, {
      props: {
        options: sampleOptions,
        disabled: true
      }
    })

    const select = wrapper.find('select')
    expect(select.attributes('disabled')).toBeDefined()
  })
})
