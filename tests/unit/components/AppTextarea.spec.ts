import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppTextarea from '@/shared/components/ui/AppTextarea.vue'

describe('AppTextarea.vue', () => {
  it('supports v-model and emits input events', async () => {
    const wrapper = mount(AppTextarea, {
      props: {
        modelValue: 'Initial notes',
        rows: 4
      }
    })

    const textarea = wrapper.find('textarea')
    expect(textarea.element.value).toBe('Initial notes')
    expect(textarea.attributes('rows')).toBe('4')

    await textarea.setValue('Catatan revisi pesanan sofa')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Catatan revisi pesanan sofa'])
  })

  it('renders invalid and disabled states correctly', () => {
    const wrapper = mount(AppTextarea, {
      props: {
        invalid: true,
        disabled: true
      }
    })

    const textarea = wrapper.find('textarea')
    expect(textarea.attributes('disabled')).toBeDefined()
    expect(textarea.attributes('aria-invalid')).toBe('true')
    expect(textarea.classes()).toContain('border-semantic-danger')
  })
})
