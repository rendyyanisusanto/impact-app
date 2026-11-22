import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppLoadingState from '@/shared/components/feedback/AppLoadingState.vue'
import AppSpinner from '@/shared/components/ui/AppSpinner.vue'
import AppSkeleton from '@/shared/components/ui/AppSkeleton.vue'

describe('Loading Components (AppSpinner, AppSkeleton, AppLoadingState)', () => {
  it('renders AppSpinner with accessible status role', () => {
    const wrapper = mount(AppSpinner, {
      props: { size: 'lg', color: 'primary' }
    })
    const spinner = wrapper.find('[role="status"]')
    expect(spinner.exists()).toBe(true)
    expect(spinner.attributes('aria-label')).toBe('Memuat...')
    expect(wrapper.text()).toContain('Memuat...')
  })

  it('renders AppSkeleton with pulse animations and dimensions', () => {
    const wrapper = mount(AppSkeleton, {
      props: { count: 3, height: '24px' }
    })
    const bars = wrapper.findAll('.animate-pulse')
    expect(bars).toHaveLength(3)
    expect(bars[0].attributes('style')).toContain('height: 24px')
  })

  it('renders AppLoadingState with default and custom text', async () => {
    const wrapper = mount(AppLoadingState)
    expect(wrapper.text()).toContain('Memuat data...')

    await wrapper.setProps({ text: 'Mengambil daftar transaksi...' })
    expect(wrapper.text()).toContain('Mengambil daftar transaksi...')
  })
})
