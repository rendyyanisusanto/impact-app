import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'

describe('AppConfirmDialog.vue', () => {
  it('renders title and message when open via v-model', () => {
    const wrapper = mount(AppConfirmDialog, {
      props: {
        modelValue: true,
        title: 'Hapus Master Suplier',
        message: 'Apakah Anda yakin ingin menghapus data suplier ini?',
        confirmText: 'Ya, Hapus',
        cancelText: 'Batalkan',
        variant: 'danger'
      },
      global: {
        stubs: {
          Teleport: true
        }
      }
    })

    expect(wrapper.text()).toContain('Hapus Master Suplier')
    expect(wrapper.text()).toContain('Apakah Anda yakin ingin menghapus data suplier ini?')
    expect(wrapper.text()).toContain('Ya, Hapus')
    expect(wrapper.text()).toContain('Batalkan')
  })

  it('emits confirm event and updates modelValue on confirm button click', async () => {
    const wrapper = mount(AppConfirmDialog, {
      props: {
        modelValue: true,
        title: 'Konfirmasi',
        message: 'Lanjutkan?'
      },
      global: {
        stubs: {
          Teleport: true
        }
      }
    })

    const buttons = wrapper.findAll('button')
    // Find confirm button
    const confirmBtn = buttons.find(
      b => b.text().includes('Ya, Lanjutkan') || b.classes().includes('bg-primary')
    )
    expect(confirmBtn).toBeDefined()

    await confirmBtn?.trigger('click')
    expect(wrapper.emitted('confirm')).toBeDefined()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('emits cancel event and updates modelValue on cancel button click', async () => {
    const wrapper = mount(AppConfirmDialog, {
      props: {
        modelValue: true,
        title: 'Konfirmasi',
        message: 'Lanjutkan?',
        cancelText: 'Batal'
      },
      global: {
        stubs: {
          Teleport: true
        }
      }
    })

    const buttons = wrapper.findAll('button')
    const cancelBtn = buttons.find(b => b.text().includes('Batal'))
    expect(cancelBtn).toBeDefined()

    await cancelBtn?.trigger('click')
    expect(wrapper.emitted('cancel')).toBeDefined()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })
})
