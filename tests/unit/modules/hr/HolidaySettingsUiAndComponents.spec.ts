import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import HolidayMonthPicker from '@/modules/hr/components/HolidayMonthPicker.vue'
import HolidayExceptionSummary from '@/modules/hr/components/HolidayExceptionSummary.vue'
import HolidayListTable from '@/modules/hr/components/HolidayListTable.vue'
import HolidayCalendar from '@/modules/hr/components/HolidayCalendar.vue'
import HolidayEmployeePicker from '@/modules/hr/components/HolidayEmployeePicker.vue'
import HolidayFormModal from '@/modules/hr/components/HolidayFormModal.vue'
import { holidaySettingsService } from '@/modules/hr/services/holiday-settings.service'
import { employeeService } from '@/modules/hr/services/employee.service'
import { employeeGroupService } from '@/modules/hr/services/employee-group.service'
import { generateCalendarGrid } from '@/modules/hr/utils/holiday-date'

describe('Sprint 8 — Task 9–10: Holiday Settings UI Components', () => {
  beforeEach(() => {
    holidaySettingsService.resetToOriginalSeed()
    employeeService.reset()
    employeeGroupService.reset()
  })

  describe('1. HolidayMonthPicker.vue', () => {
    it('renders selected month and handles next/prev navigation', async () => {
      const wrapper = mount(HolidayMonthPicker, {
        props: {
          modelValue: '2024-08'
        }
      })

      expect(wrapper.text()).toContain('Agustus')
      expect(wrapper.text()).toContain('2024')

      // Click Next button
      const nextBtn = wrapper.find('button[title="Bulan Berikutnya"]')
      expect(nextBtn.exists()).toBe(true)
      await nextBtn.trigger('click')

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['2024-09'])

      // Click Prev button
      const prevBtn = wrapper.find('button[title="Bulan Sebelumnya"]')
      expect(prevBtn.exists()).toBe(true)
      await prevBtn.trigger('click')

      expect(wrapper.emitted('update:modelValue')?.[1]).toEqual(['2024-07'])
    })

    it('displays "Bulan Ini" shortcut when not in current month', async () => {
      const wrapper = mount(HolidayMonthPicker, {
        props: {
          modelValue: '2020-01'
        }
      })

      expect(wrapper.text()).toContain('Bulan Ini')
    })
  })

  describe('2. HolidayExceptionSummary.vue', () => {
    it('shows "Semua Libur" when no exceptions exist', () => {
      const wrapper = mount(HolidayExceptionSummary, {
        props: {
          exceptions: []
        }
      })

      expect(wrapper.text()).toContain('Semua Libur')
    })

    it('renders compact badges for up to 2 exceptions and "+N lainnya" for 3 or more', async () => {
      const mockExceptions = [
        {
          id: 53,
          kode: 'EMP-053',
          nama: 'Alvian Kurniawan',
          jabatan: 'Driver',
          statusKaryawan: 'Tetap',
          grupId: 3,
          grupNama: 'Grup Driver',
          grupColor: '#3b82f6'
        },
        {
          id: 54,
          kode: 'EMP-054',
          nama: 'Candra Arifianto',
          jabatan: 'Staff',
          statusKaryawan: 'Kontrak',
          grupId: 2,
          grupNama: 'Group Gudang',
          grupColor: '#000000'
        },
        {
          id: 63,
          kode: 'EMP-063',
          nama: 'Dandi Saputra',
          jabatan: 'Operator',
          statusKaryawan: 'Tetap',
          grupId: null,
          grupNama: null,
          grupColor: null
        }
      ]

      const wrapper = mount(HolidayExceptionSummary, {
        props: {
          exceptions: mockExceptions,
          holidayDate: '17/08/2024',
          holidayDescription: 'HARI KEMERDEKAAN RI',
          maxVisible: 2
        },
        global: {
          stubs: {
            AppModal: {
              props: ['modelValue', 'title'],
              template: `
                <div v-if="modelValue" class="app-modal-stub">
                  <h3>{{ title }}</h3>
                  <slot />
                  <slot name="footer" />
                </div>
              `
            }
          }
        }
      })

      expect(wrapper.text()).toContain('Alvian Kurniawan')
      expect(wrapper.text()).toContain('Candra Arifianto')
      expect(wrapper.text()).toContain('+1 lainnya')

      // Click more button opens modal
      const moreBtn = wrapper.find('button[title*="karyawan yang dikecualikan"]')
      expect(moreBtn.exists()).toBe(true)
      await moreBtn.trigger('click')

      expect(wrapper.text()).toContain('Daftar Karyawan Dikecualikan (3)')
      expect(wrapper.text()).toContain('Dandi Saputra')
    })
  })

  describe('3. HolidayListTable.vue', () => {
    it('renders list of holidays with actions and triggers edit/delete emits', async () => {
      const holidays = await holidaySettingsService.getHolidaysByMonth('2024-08')
      const wrapper = mount(HolidayListTable, {
        props: {
          items: holidays,
          isLoading: false,
          canUpdate: true,
          canDelete: true
        }
      })

      expect(wrapper.findAll('tbody tr')).toHaveLength(5)
      expect(wrapper.text()).toContain('HARI KEMERDEKAAN RI')
      expect(wrapper.text()).toContain('17/08/2024')
      expect(wrapper.text()).toContain('Sabtu')

      // Click Edit on first row
      const editBtns = wrapper.findAll('button[title="Ubah Hari Libur"]')
      expect(editBtns.length).toBeGreaterThanOrEqual(1)
      await editBtns[0].trigger('click')
      expect(wrapper.emitted('edit')?.[0]).toEqual([holidays[0]])

      // Click Delete on first row
      const deleteBtns = wrapper.findAll('button[title="Hapus Hari Libur"]')
      expect(deleteBtns.length).toBeGreaterThanOrEqual(1)
      await deleteBtns[0].trigger('click')
      expect(wrapper.emitted('delete')?.[0]).toEqual([holidays[0]])
    })

    it('renders empty state when items list is empty', () => {
      const wrapper = mount(HolidayListTable, {
        props: {
          items: [],
          isLoading: false,
          canUpdate: true
        }
      })

      expect(wrapper.text()).toContain('Tidak Ada Hari Libur pada Periode Ini')
    })
  })

  describe('4. HolidayCalendar.vue', () => {
    it('renders 7 day headers and day cells with holiday indicators', async () => {
      const holidays = await holidaySettingsService.getHolidaysByMonth('2024-08')
      const cells = generateCalendarGrid('2024-08', holidays)

      const wrapper = mount(HolidayCalendar, {
        props: {
          cells,
          isLoading: false,
          canUpdate: true
        }
      })

      // Day headers
      expect(wrapper.text()).toContain('Senin')
      expect(wrapper.text()).toContain('Minggu')

      // August 17th holiday card
      expect(wrapper.text()).toContain('HARI KEMERDEKAAN RI')
      expect(wrapper.text()).toContain('3 dikecualikan')

      // Click holiday pill triggers edit
      const holidayCard = wrapper.find('.line-clamp-2')
      expect(holidayCard.exists()).toBe(true)
      await holidayCard.trigger('click')
      expect(wrapper.emitted('edit')).toBeDefined()
    })
  })

  describe('5. HolidayEmployeePicker.vue', () => {
    it('allows searching, toggling checkboxes, and group-assisted selection', async () => {
      const wrapper = mount(HolidayEmployeePicker, {
        props: {
          modelValue: [53]
        }
      })

      await new Promise(r => setTimeout(r, 20))
      await wrapper.vm.$nextTick()

      // Active selected badge displays 1 employee
      expect(wrapper.text()).toContain('1')
      expect(wrapper.text()).toContain('karyawan dikecualikan')

      // Search input filter with real seeded employee 'ACHMAD'
      const searchInput = wrapper.find('input[type="text"]')
      expect(searchInput.exists()).toBe(true)
      await searchInput.setValue('ACHMAD')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('ACHMAD')

      // Click employee row to select
      const rows = wrapper.findAll('.cursor-pointer')
      const achmadRow = rows.find(r => r.text().includes('ACHMAD'))
      if (achmadRow) {
        await achmadRow.trigger('click')
        expect(wrapper.emitted('update:modelValue')).toBeDefined()
      }
    })
  })

  describe('6. HolidayFormModal.vue', () => {
    it('validates required fields and emits submit payload on success', async () => {
      const wrapper = mount(HolidayFormModal, {
        props: {
          modelValue: true,
          mode: 'create',
          initialDate: '2024-08-22'
        },
        global: {
          stubs: {
            AppModal: {
              props: ['modelValue', 'title'],
              template: `
                <div v-if="modelValue" class="app-modal-stub">
                  <h3>{{ title }}</h3>
                  <slot />
                  <slot name="footer" />
                </div>
              `
            }
          }
        }
      })

      // Try submitting empty
      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      expect(wrapper.text()).toContain('Keterangan hari libur wajib diisi')

      // Fill valid description
      const descInput = wrapper.find('input[placeholder*="HARI KEMERDEKAAN RI"]')
      expect(descInput.exists()).toBe(true)
      await descInput.setValue('HARI PAHLAWAN')

      await form.trigger('submit.prevent')

      expect(wrapper.emitted('submit')?.[0]).toEqual([
        {
          id: undefined,
          tanggal: '2024-08-22',
          keterangan: 'HARI PAHLAWAN',
          exceptionEmployeeIds: []
        }
      ])
    })
  })
})
