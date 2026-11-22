import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AppModal from '@/shared/components/feedback/AppModal.vue'

describe('AppModal.vue', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders modal dialog in body when modelValue is true', async () => {
    const wrapper = mount(AppModal, {
      props: {
        modelValue: true,
        title: 'Tambah Data Suplier',
        description: 'Masukkan informasi vendor baru.'
      },
      slots: {
        default: '<form id="supplier-form">Form Input</form>',
        footer: '<button id="btn-save">Simpan</button>'
      },
      attachTo: document.body
    })

    const dialog = document.body.querySelector('[role="dialog"]')
    expect(dialog).not.toBeNull()
    expect(dialog?.textContent).toContain('Tambah Data Suplier')
    expect(dialog?.textContent).toContain('Masukkan informasi vendor baru.')
    expect(dialog?.textContent).toContain('Form Input')
    expect(dialog?.textContent).toContain('Simpan')

    wrapper.unmount()
  })

  it('emits update:modelValue with false when close button is clicked', async () => {
    const wrapper = mount(AppModal, {
      props: {
        modelValue: true,
        title: 'Konfirmasi Edit'
      },
      attachTo: document.body
    })

    const closeBtn = document.body.querySelector(
      'button[aria-label="Tutup dialog"]'
    ) as HTMLButtonElement
    expect(closeBtn).not.toBeNull()
    closeBtn.click()

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
    expect(wrapper.emitted('close')).toBeDefined()

    wrapper.unmount()
  })

  it('closes on Escape key press when closeOnEscape is true', async () => {
    const wrapper = mount(AppModal, {
      props: {
        modelValue: true,
        closeOnEscape: true
      },
      attachTo: document.body
    })

    const event = new KeyboardEvent('keydown', { key: 'Escape' })
    window.dispatchEvent(event)

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])

    wrapper.unmount()
  })
})
