import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppCheckbox from '@/shared/components/ui/AppCheckbox.vue'

describe('AppCheckbox.vue', () => {
  it('supports boolean v-model correctly', async () => {
    const wrapper = mount(AppCheckbox, {
      props: {
        modelValue: false,
        label: 'Ingat Saya'
      }
    })

    const input = wrapper.find('input[type="checkbox"]')
    expect((input.element as HTMLInputElement).checked).toBe(false)
    expect(wrapper.text()).toContain('Ingat Saya')

    await input.setValue(true)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    expect(wrapper.emitted('change')).toBeDefined()
  })

  it('supports array v-model for multiple selections', async () => {
    const wrapper = mount(AppCheckbox, {
      props: {
        modelValue: ['option-1'],
        value: 'option-2',
        label: 'Opsi 2'
      }
    })

    const input = wrapper.find('input[type="checkbox"]')
    expect((input.element as HTMLInputElement).checked).toBe(false)

    await input.setValue(true)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['option-1', 'option-2']])
  })

  it('handles disabled state properly and prevents changes', () => {
    const wrapper = mount(AppCheckbox, {
      props: {
        modelValue: false,
        disabled: true,
        label: 'Checkbox Nonaktif'
      }
    })

    const input = wrapper.find('input[type="checkbox"]')
    expect(input.attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('cursor-not-allowed')
  })
})
