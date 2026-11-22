import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppRadio from '@/shared/components/ui/AppRadio.vue'

describe('AppRadio.vue', () => {
  it('renders radio input and responds to selection', async () => {
    const wrapper = mount(AppRadio, {
      props: {
        modelValue: 'apple',
        value: 'banana',
        label: 'Pisang',
        name: 'fruits'
      }
    })

    const input = wrapper.find('input[type="radio"]')
    expect((input.element as HTMLInputElement).checked).toBe(false)
    expect(wrapper.text()).toContain('Pisang')

    await input.trigger('change')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['banana'])
    expect(wrapper.emitted('change')?.[0]).toEqual(['banana'])
  })

  it('marks radio as checked when modelValue matches value', () => {
    const wrapper = mount(AppRadio, {
      props: {
        modelValue: 'banana',
        value: 'banana',
        label: 'Pisang'
      }
    })

    const input = wrapper.find('input[type="radio"]')
    expect((input.element as HTMLInputElement).checked).toBe(true)
  })

  it('respects disabled state', () => {
    const wrapper = mount(AppRadio, {
      props: {
        modelValue: 'apple',
        value: 'cherry',
        disabled: true,
        label: 'Ceri'
      }
    })

    const input = wrapper.find('input[type="radio"]')
    expect(input.attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('cursor-not-allowed')
  })
})
