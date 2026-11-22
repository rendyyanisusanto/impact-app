import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AttendanceDateRangeTab from '@/modules/hr/components/AttendanceDateRangeTab.vue'
import AttendanceEmployeeRangeTab from '@/modules/hr/components/AttendanceEmployeeRangeTab.vue'
import AttendanceEmployeeMonthlyTab from '@/modules/hr/components/AttendanceEmployeeMonthlyTab.vue'
import { attendanceService } from '@/modules/hr/services/attendance.service'
import { employeeService } from '@/modules/hr/services/employee.service'
import { useAuthStore } from '@/stores/auth.store'
import { MOCK_USERS } from '@/mocks/users.mock'
import * as exportUtils from '@/modules/hr/utils/attendance-export'

describe('HR Presensi Sprints 5, 6 & 7 UI Tabs Integration', () => {
  let authStore: ReturnType<typeof useAuthStore>

  const mockEmployees = [
    {
      id: 53,
      kode: '1',
      nama: 'IWAN',
      status: 1,
      uid_fingerprint: 1,
      grup_karyawan_id: 1,
      jabatan_id: 1
    },
    {
      id: 54,
      kode: '2',
      nama: 'ACHMAD',
      status: 1,
      uid_fingerprint: 2,
      grup_karyawan_id: 2,
      jabatan_id: 2
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    authStore = useAuthStore()
    authStore.currentUser = MOCK_USERS[0]
    vi.spyOn(employeeService, 'getAll').mockResolvedValue(mockEmployees as any)
    vi.spyOn(employeeService, 'getById').mockImplementation(async (id: number) => {
      return mockEmployees.find((e) => e.id === id) as any || null
    })
    vi.spyOn(attendanceService, 'recordReportExportAudit').mockResolvedValue(undefined)
  })

  describe('Sprint 5 — AttendanceDateRangeTab (Laporan Presensi Range Tanggal)', () => {
    it('1.1. renders form with Tanggal Mulai, Tanggal Sampai, Urut Berdasarkan and Proses button', async () => {
      const wrapper = mount(AttendanceDateRangeTab)
      await flushPromises()

      expect(wrapper.text()).toContain('Tanggal Mulai :')
      expect(wrapper.text()).toContain('Tanggal Sampai :')
      expect(wrapper.text()).toContain('Urut Berdasarkan :')
      expect(wrapper.text()).toContain('Proses')

      // STRICT SCOPE: TIDAK boleh ada tombol sinkronisasi
      expect(wrapper.text()).not.toContain('Sinkronisasi Data')

      wrapper.unmount()
    })

    it('1.2. validates that Tanggal Mulai cannot exceed Tanggal Sampai', async () => {
      const wrapper = mount(AttendanceDateRangeTab)
      await flushPromises()

      const inputs = wrapper.findAll('input[type="date"]')
      expect(inputs.length).toBeGreaterThanOrEqual(2)

      // Set startDate > endDate
      await inputs[0].setValue('2026-11-05')
      await inputs[1].setValue('2026-11-01')

      await wrapper.find('form').trigger('submit.prevent')
      await flushPromises()

      expect(wrapper.text()).toContain('Tanggal Mulai tidak boleh lebih besar dari Tanggal Sampai.')

      wrapper.unmount()
    })

    it('1.3. displays filter changed alert when draft date inputs differ from active report', async () => {
      const wrapper = mount(AttendanceDateRangeTab)
      await flushPromises()

      const inputs = wrapper.findAll('input[type="date"]')
      await inputs[0].setValue('2026-10-25')
      await flushPromises()

      expect(wrapper.text()).toContain('Filter berubah. Klik Proses untuk memperbarui laporan.')

      wrapper.unmount()
    })

    it('1.4. triggers Excel and PDF exports with audit logging', async () => {
      const exportExcelSpy = vi.spyOn(exportUtils, 'exportAttendanceReportExcel').mockImplementation(() => {})
      const exportPdfSpy = vi.spyOn(exportUtils, 'exportAttendanceReportPdf').mockImplementation(() => {})

      const wrapper = mount(AttendanceDateRangeTab)
      await flushPromises()

      const buttons = wrapper.findAll('button')
      const excelBtn = buttons.find((b) => b.text().includes('Download Report Excel'))
      const pdfBtn = buttons.find((b) => b.text().includes('Download Report PDF'))

      expect(excelBtn).toBeDefined()
      expect(pdfBtn).toBeDefined()

      await excelBtn!.trigger('click')
      await flushPromises()
      expect(exportExcelSpy).toHaveBeenCalled()
      expect(attendanceService.recordReportExportAudit).toHaveBeenCalledWith(
        expect.objectContaining({ reportType: 'RANGE', type: 'EXCEL' })
      )

      await pdfBtn!.trigger('click')
      await flushPromises()
      expect(exportPdfSpy).toHaveBeenCalled()
      expect(attendanceService.recordReportExportAudit).toHaveBeenCalledWith(
        expect.objectContaining({ reportType: 'RANGE', type: 'PDF' })
      )

      wrapper.unmount()
    })
  })

  describe('Sprint 6 — AttendanceEmployeeRangeTab (Laporan Presensi Range Tanggal Karyawan)', () => {
    it('2.1. renders dropdown Karyawan, dates and does NOT contain sync button', async () => {
      const wrapper = mount(AttendanceEmployeeRangeTab)
      await flushPromises()

      expect(wrapper.text()).toContain('Karyawan :')
      expect(wrapper.text()).toContain('Tanggal Mulai :')
      expect(wrapper.text()).toContain('Tanggal Sampai :')
      expect(wrapper.text()).not.toContain('Sinkronisasi Data')

      wrapper.unmount()
    })

    it('2.2. shows filter changed banner when employee or dates are modified', async () => {
      const wrapper = mount(AttendanceEmployeeRangeTab)
      await flushPromises()

      const inputs = wrapper.findAll('input[type="date"]')
      await inputs[0].setValue('2026-10-15')
      await flushPromises()

      expect(wrapper.text()).toContain('Filter berubah. Klik Proses untuk memperbarui laporan.')

      wrapper.unmount()
    })

    it('2.3. triggers Excel and PDF exports for single employee with audit', async () => {
      const exportExcelSpy = vi.spyOn(exportUtils, 'exportAttendanceReportExcel').mockImplementation(() => {})

      const wrapper = mount(AttendanceEmployeeRangeTab)
      await flushPromises()

      const excelBtn = wrapper.findAll('button').find((b) => b.text().includes('Download Report Excel'))
      expect(excelBtn).toBeDefined()

      await excelBtn!.trigger('click')
      await flushPromises()

      expect(exportExcelSpy).toHaveBeenCalled()
      expect(attendanceService.recordReportExportAudit).toHaveBeenCalledWith(
        expect.objectContaining({ reportType: 'EMPLOYEE_RANGE', type: 'EXCEL' })
      )

      wrapper.unmount()
    })
  })

  describe('Sprint 7 — AttendanceEmployeeMonthlyTab (Laporan Presensi Per Karyawan Bulanan)', () => {
    it('3.1. renders Karyawan, Bulan, Tahun and displays full calendar month report', async () => {
      const wrapper = mount(AttendanceEmployeeMonthlyTab)
      await flushPromises()

      expect(wrapper.text()).toContain('Karyawan :')
      expect(wrapper.text()).toContain('Bulan :')
      expect(wrapper.text()).toContain('Tahun :')
      expect(wrapper.text()).not.toContain('Sinkronisasi Data')

      // Matches dynamic title format: Presensi Karyawan ( 1 - IWAN ) 11/2026
      expect(wrapper.text()).toContain('11/2026')

      // All 30 rows generated for November
      const rows = wrapper.findAll('tbody tr')
      expect(rows.length).toBe(30)

      wrapper.unmount()
    })

    it('3.2. detects filter modification in month or year', async () => {
      const wrapper = mount(AttendanceEmployeeMonthlyTab)
      await flushPromises()

      const yearInput = wrapper.find('input[type="number"]')
      await yearInput.setValue(2027)
      await flushPromises()

      expect(wrapper.text()).toContain('Filter berubah. Klik Proses untuk memperbarui laporan.')

      wrapper.unmount()
    })

    it('3.3. triggers Excel and PDF exports for monthly report with audit', async () => {
      const exportPdfSpy = vi.spyOn(exportUtils, 'exportAttendanceReportPdf').mockImplementation(() => {})

      const wrapper = mount(AttendanceEmployeeMonthlyTab)
      await flushPromises()

      const pdfBtn = wrapper.findAll('button').find((b) => b.text().includes('Download Report PDF'))
      expect(pdfBtn).toBeDefined()

      await pdfBtn!.trigger('click')
      await flushPromises()

      expect(exportPdfSpy).toHaveBeenCalled()
      expect(attendanceService.recordReportExportAudit).toHaveBeenCalledWith(
        expect.objectContaining({ reportType: 'EMPLOYEE_MONTHLY', type: 'PDF' })
      )

      wrapper.unmount()
    })
  })
})
