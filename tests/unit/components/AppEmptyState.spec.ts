import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppEmptyState from '@/shared/components/feedback/AppEmptyState.vue'

describe('AppEmptyState.vue', () => {
  it('renders default empty state text', () => {
    const wrapper = mount(AppEmptyState)
    expect(wrapper.text()).toContain('Tidak Ada Data')
    expect(wrapper.text()).toContain('Belum ada data yang tersedia pada tabel atau modul ini.')
  })

  it('renders custom title, description, and action button via slot', () => {
    const wrapper = mount(AppEmptyState, {
      props: {
        title: 'Belum Ada Transaksi PO',
        description: 'Mulai buat Purchase Order baru untuk pengadaan bahan.'
      },
      slots: {
        action: '<button class="btn-create">Buat PO Baru</button>'
      }
    })

    expect(wrapper.text()).toContain('Belum Ada Transaksi PO')
    expect(wrapper.text()).toContain('Mulai buat Purchase Order baru untuk pengadaan bahan.')
    const btn = wrapper.find('.btn-create')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toBe('Buat PO Baru')
  })
})
