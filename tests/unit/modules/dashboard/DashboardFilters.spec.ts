import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DashboardFilters from '@/modules/dashboard/components/DashboardFilters.vue'

describe('DashboardFilters.vue (Task 6)', () => {
  it('renders all preset options and default selection', () => {
    const wrapper = mount(DashboardFilters, {
      props: {
        modelValue: { preset: 'this_month' }
      }
    })

    expect(wrapper.text()).toContain('Filter Periode:')
    expect(wrapper.text()).toContain('WIB (UTC+7)')
    expect(wrapper.text()).toContain('Simulasi (Mock)')
    expect(wrapper.text()).toContain('Segarkan')
  })

  it('switches preset and emits update:modelValue with corresponding dates', async () => {
    const wrapper = mount(DashboardFilters, {
      props: {
        modelValue: { preset: 'this_month' }
      }
    })

    const select = wrapper.findComponent({ name: 'AppSelect' })
    expect(select.exists()).toBe(true)

    // Select today
    await select.vm.$emit('update:modelValue', 'today')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([
      { preset: 'today', startDate: '2026-10-31', endDate: '2026-10-31' }
    ])

    // Select 7d
    await select.vm.$emit('update:modelValue', '7d')
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([
      { preset: '7d', startDate: '2026-10-25', endDate: '2026-10-31' }
    ])
  })

  it('displays custom date range inputs when preset is custom and validates start > end', async () => {
    const wrapper = mount(DashboardFilters, {
      props: {
        modelValue: { preset: 'custom', startDate: '2026-10-10', endDate: '2026-10-20' }
      }
    })

    // Custom date row should be visible
    expect(wrapper.find('input[type="date"][aria-label="Tanggal Awal"]').exists()).toBe(true)
    expect(wrapper.find('input[type="date"][aria-label="Tanggal Akhir"]').exists()).toBe(true)

    // Set invalid range: start > end
    const startInput = wrapper.find('input[type="date"][aria-label="Tanggal Awal"]')
    const endInput = wrapper.find('input[type="date"][aria-label="Tanggal Akhir"]')

    await startInput.setValue('2026-10-25')
    await endInput.setValue('2026-10-10')

    // Click Terapkan
    const applyBtn = wrapper.findAll('button').find(b => b.text().includes('Terapkan'))
    expect(applyBtn).toBeDefined()
    await applyBtn?.trigger('click')

    // Error alert should be displayed
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Tanggal awal tidak boleh melebihi tanggal akhir')
  })

  it('resets to this_month and emits reset event', async () => {
    const wrapper = mount(DashboardFilters, {
      props: {
        modelValue: { preset: 'today' }
      }
    })

    const resetBtn = wrapper.findAll('button').find(b => b.text().includes('Reset'))
    expect(resetBtn).toBeDefined()
    await resetBtn?.trigger('click')

    expect(wrapper.emitted('reset')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([{ preset: 'this_month' }])
  })
})
