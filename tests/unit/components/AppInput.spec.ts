import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppInput from '@/shared/components/ui/AppInput.vue'

describe('AppInput.vue', () => {
  it('renders input with initial modelValue', () => {
    const wrapper = mount(AppInput, {
      props: {
        modelValue: 'Impact Furniture'
      }
    })
    const input = wrapper.find('input')
    expect(input.element.value).toBe('Impact Furniture')
  })

  it('emits update:modelValue on typing', async () => {
    const wrapper = mount(AppInput, {
      props: {
        modelValue: ''
      }
    })

    const input = wrapper.find('input')
    await input.setValue('Meja Jati')

    expect(wrapper.emitted('update:modelValue')).toBeDefined()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Meja Jati'])
  })

  it('renders clearable button and clears input on click', async () => {
    const wrapper = mount(AppInput, {
      props: {
        modelValue: 'Some Text',
        clearable: true
      }
    })

    const clearBtn = wrapper.find('button[title="Hapus teks"]')
    expect(clearBtn.exists()).toBe(true)

    await clearBtn.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([''])
    expect(wrapper.emitted('clear')).toBeDefined()
  })

  it('applies error styling when error prop is provided', () => {
    const wrapper = mount(AppInput, {
      props: {
        error: 'Data tidak valid'
      }
    })
    const input = wrapper.find('input')
    expect(input.classes()).toContain('border-semantic-danger')
  })

  it('disables input when disabled prop is true', () => {
    const wrapper = mount(AppInput, {
      props: {
        disabled: true
      }
    })
    const input = wrapper.find('input')
    expect(input.attributes('disabled')).toBeDefined()
  })
})
