import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppStatusBadge from '@/shared/components/data/AppStatusBadge.vue'

describe('AppStatusBadge.vue', () => {
  it('maps known status keys to appropriate semantic variants and localized labels', () => {
    const active = mount(AppStatusBadge, { props: { status: 'active' } })
    expect(active.text()).toBe('Aktif')
    expect(active.classes()).toContain('text-semantic-success')

    const pending = mount(AppStatusBadge, { props: { status: 'pending' } })
    expect(pending.text()).toBe('Menunggu')
    expect(pending.classes()).toContain('text-semantic-warning')

    const cancelled = mount(AppStatusBadge, { props: { status: 'cancelled' } })
    expect(cancelled.text()).toBe('Dibatalkan')
    expect(cancelled.classes()).toContain('text-semantic-danger')

    const draft = mount(AppStatusBadge, { props: { status: 'draft' } })
    expect(draft.text()).toBe('Draft')
    expect(draft.classes()).toContain('bg-slate-100')
  })

  it('allows overriding the label with a custom label prop', () => {
    const wrapper = mount(AppStatusBadge, {
      props: {
        status: 'active',
        label: 'Terverifikasi'
      }
    })
    expect(wrapper.text()).toBe('Terverifikasi')
  })
})
