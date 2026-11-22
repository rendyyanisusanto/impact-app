import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { useToast } from '@/shared/composables/useToast'
import AppToast from '@/shared/components/feedback/AppToast.vue'
import AppToastContainer from '@/shared/components/feedback/AppToastContainer.vue'

describe('Toast System (useToast, AppToast, AppToastContainer)', () => {
  const { toasts, success, error, warning, info, dismiss, clearAll } = useToast()

  beforeEach(() => {
    clearAll()
    document.body.innerHTML = ''
  })

  it('adds toasts of various types to the reactive queue', () => {
    const id1 = success('PO berhasil dibuat', 'Sukses')
    const id2 = error('Gagal menyimpan perubahan', 'Error')
    const id3 = warning('Stok menipis', 'Peringatan')
    const id4 = info('Pemberitahuan sistem', 'Info')

    expect(toasts.value).toHaveLength(4)
    expect(toasts.value[0].id).toBe(id1)
    expect(toasts.value[0].type).toBe('success')
    expect(toasts.value[1].id).toBe(id2)
    expect(toasts.value[1].type).toBe('danger')
    expect(toasts.value[2].id).toBe(id3)
    expect(toasts.value[2].type).toBe('warning')
    expect(toasts.value[3].id).toBe(id4)
    expect(toasts.value[3].type).toBe('info')
  })

  it('dismisses a toast by id', () => {
    const id = success('Item akan dihapus')
    expect(toasts.value).toHaveLength(1)

    dismiss(id)
    expect(toasts.value).toHaveLength(0)
  })

  it('renders AppToast component with status role and emits dismiss', async () => {
    const wrapper = mount(AppToast, {
      props: {
        id: 'toast-1',
        title: 'Berhasil',
        message: 'Data tersimpan.',
        type: 'success'
      }
    })

    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.text()).toContain('Berhasil')
    expect(wrapper.text()).toContain('Data tersimpan.')

    const btn = wrapper.find('button[aria-label="Tutup notifikasi"]')
    await btn.trigger('click')
    expect(wrapper.emitted('dismiss')?.[0]).toEqual(['toast-1'])
  })

  it('renders AppToastContainer with active toasts in Teleport body', async () => {
    success('Notifikasi Container')

    const wrapper = mount(AppToastContainer, {
      attachTo: document.body
    })

    expect(document.body.textContent).toContain('Notifikasi Container')
    wrapper.unmount()
  })
})
