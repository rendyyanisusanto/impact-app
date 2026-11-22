import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppFormField from '@/shared/components/forms/AppFormField.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'

describe('AppFormField.vue & Form Components', () => {
  it('renders label with forId matching control slot', () => {
    const wrapper = mount(AppFormField, {
      props: {
        id: 'customer-name',
        label: 'Nama Customer',
        required: true
      },
      slots: {
        default: `<template #default="{ id }"><input :id="id" /></template>`
      }
    })

    const label = wrapper.find('label')
    expect(label.exists()).toBe(true)
    expect(label.attributes('for')).toBe('customer-name')
    expect(label.text()).toContain('Nama Customer')
    expect(label.text()).toContain('*')

    const input = wrapper.find('input')
    expect(input.attributes('id')).toBe('customer-name')
  })

  it('renders accessible error message with role="alert"', () => {
    const wrapper = mount(AppFormField, {
      props: {
        label: 'Email',
        error: 'Format email tidak valid'
      }
    })

    const error = wrapper.find('[role="alert"]')
    expect(error.exists()).toBe(true)
    expect(error.text()).toContain('Format email tidak valid')
  })

  it('renders helper text when no error is present', () => {
    const wrapper = mount(AppFormField, {
      props: {
        label: 'Password',
        helperText: 'Minimal 8 karakter'
      }
    })

    expect(wrapper.text()).toContain('Minimal 8 karakter')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('integrates seamlessly with AppInput', () => {
    const wrapper = mount(AppFormField, {
      props: {
        id: 'username',
        label: 'Username',
        error: 'Wajib diisi'
      },
      slots: {
        default: `<template #default="{ id, isError }"><AppInput :id="id" :error="isError" /></template>`
      },
      global: {
        components: { AppInput }
      }
    })

    const input = wrapper.findComponent(AppInput)
    expect(input.exists()).toBe(true)
    expect(input.props('id')).toBe('username')
    expect(input.props('error')).toBe(true)
  })
})
