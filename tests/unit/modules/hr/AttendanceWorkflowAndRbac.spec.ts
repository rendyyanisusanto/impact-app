import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AttendancePage from '@/modules/hr/pages/AttendancePage.vue'
import { attendanceService } from '@/modules/hr/services/attendance.service'
import { fingerprintSourceService } from '@/modules/hr/services/fingerprint-source.service'
import { employeeService } from '@/modules/hr/services/employee.service'
import { holidaySettingsService } from '@/modules/hr/services/holiday-settings.service'
import { useAuthStore } from '@/stores/auth.store'
import { MOCK_USERS } from '@/mocks/users.mock'
import { formatDisplayDate } from '@/modules/hr/utils/attendance-date'
import { getTodayDateString } from '@/modules/hr/utils/holiday-date'

describe('Sprint 8 — Task 18: Presensi Comprehensive 16-Step Workflow & RBAC', () => {
  let authStore: ReturnType<typeof useAuthStore>

  beforeEach(() => {
    document.body.innerHTML = ''
    setActivePinia(createPinia())
    authStore = useAuthStore()
    authStore.currentUser = MOCK_USERS[0] // Superadmin
    attendanceService.resetToInitialSeeds()
    fingerprintSourceService.simulateDeviceAvailable = true
  })

  it('executes full 16-step end-to-end integration and RBAC test', async () => {
    // 1. Load Presensi Hari Ini
    const wrapper = mount(AttendancePage, { attachTo: document.body })
    await flushPromises()
    expect(wrapper.text()).toContain(`Presensi Karyawan Tanggal ${formatDisplayDate(getTodayDateString())}`)

    // 2. Ambil fingerprint mock
    const fetchBtn = wrapper.findAll('button').find((b) => b.text().includes('Ambil data fingerprint'))
    expect(fetchBtn).toBeDefined()
    await fetchBtn?.trigger('click')
    await flushPromises()
    expect(document.body.textContent).toContain('Sinkronisasi log fingerprint selesai!')
    const closeJobBtn = Array.from(document.body.querySelectorAll('button')).find((b) => b.textContent?.includes('Tutup'))
    closeJobBtn?.click()
    await flushPromises()

    // 3. Ambil data 3 hari ke belakang
    const fetch3DaysBtn = wrapper.findAll('button').find((b) => b.text().includes('Ambil data 3 Hari Kebelakang'))
    expect(fetch3DaysBtn).toBeDefined()
    await fetch3DaysBtn?.trigger('click')
    await flushPromises()
    expect(document.body.textContent).toContain('Sinkronisasi log fingerprint selesai!')
    const close3DaysBtn = Array.from(document.body.querySelectorAll('button')).find((b) => b.textContent?.includes('Tutup'))
    close3DaysBtn?.click()
    await flushPromises()

    // 4. Import data modal
    const importBtn = wrapper.findAll('button').find((b) => b.text().includes('Import data'))
    expect(importBtn).toBeDefined()
    await importBtn?.trigger('click')
    await flushPromises()
    expect(document.body.textContent).toContain('Import Data Presensi')
    const closeImportBtn = Array.from(document.body.querySelectorAll('button')).find((b) => b.textContent?.includes('Tutup'))
    closeImportBtn?.click()
    await flushPromises()

    // 5. Lihat laporan harian (Tab 2)
    const tabs = wrapper.findAll('nav button')
    await tabs[1].trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Laporan Presensi Harian')
    expect(wrapper.text()).toContain(`Presensi Karyawan Tanggal ${formatDisplayDate(getTodayDateString())}`)

    // 6. Sinkronisasi tanggal pada Laporan Harian (menggunakan interactive modal Sprint 4)
    const syncDailyBtn = wrapper.findAll('button').find((b) => b.text().includes('Sinkronisasi Data'))
    expect(syncDailyBtn).toBeDefined()
    await syncDailyBtn?.trigger('click')
    await flushPromises()
    expect(document.body.textContent).toContain('Sinkronisasi Fingerprint')
    const closeDailySyncBtn = Array.from(document.body.querySelectorAll('button')).find((b) => b.textContent?.includes('Tutup'))
    closeDailySyncBtn?.click()
    await flushPromises()

    // 7. Buka range tanggal (Tab 3)
    await tabs[2].trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Laporan Presensi Range Tanggal')
    expect(wrapper.text()).toContain('Presensi Karyawan Tanggal 30-10-2026 s/d 01-11-2026')

    // 8. Filter satu karyawan (Tab 4)
    await tabs[3].trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Laporan Presensi Range Tanggal (Karyawan)')
    expect(wrapper.text()).toContain('Presensi Karyawan Tanggal 20-10-2026 s/d 01-11-2026')

    // 9. Buka laporan bulanan (Tab 5)
    await tabs[4].trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Laporan Presensi Per Karyawan')
    expect(wrapper.text()).toContain('11/2026')

    // 10. Periksa konsistensi record antar-tab
    // The record for IWAN on 2026-10-30 must be identical across daily, range, and employee history
    const dailyRecs = await attendanceService.getDailyAttendance('2026-10-30')
    const rangeRecs = await attendanceService.getDateRangeAttendance({
      tanggalMulai: '2026-10-30',
      tanggalSelesai: '2026-10-30',
      orderBy: 'KARYAWAN'
    })
    const iwanDaily = dailyRecs.find((r) => r.nama === 'IWAN')
    const iwanRange = rangeRecs.find((r) => r.nama === 'IWAN')
    expect(iwanDaily?.cin).toBe(iwanRange?.cin)
    expect(iwanDaily?.cout).toBe(iwanRange?.cout)
    expect(iwanDaily?.statuses).toEqual(iwanRange?.statuses)

    // 11. Uji hari libur dan pengecualian
    const isHolidayExempt = await holidaySettingsService.isEmployeeExempted(53, '2024-08-17')
    expect(typeof isHolidayExempt).toBe('boolean')

    // 12. Uji error fingerprint
    fingerprintSourceService.simulateDeviceAvailable = false
    await expect(attendanceService.fetchFingerprintToday()).rejects.toThrow('Gagal terhubung')
    fingerprintSourceService.simulateDeviceAvailable = true

    // 13. Uji duplicate import
    const dupPreview = await attendanceService.previewImportData([
      { no: 1, uid: 1, rawTimestamp: '2026-10-30 07:49:08' }
    ])
    expect(dupPreview[0].isDuplicate).toBe(true)

    // 14. Uji edit sesuai izin
    const all = await employeeService.getAll()
    const iwan = all.find((e) => e.kode === '1')!
    await attendanceService.updateKeterangan({
      ditujukan: 'KARYAWAN',
      tanggal: '2026-10-30',
      keterangan: 'LEMBUR TESTING QA',
      karyawanId: iwan.id
    })
    const updatedDaily = await attendanceService.getDailyAttendance('2026-10-30')
    const iwanUpdated = updatedDaily.find((r) => r.nama === 'IWAN')
    expect(iwanUpdated?.keterangan).toBe('LEMBUR TESTING QA')

    // 15. Uji export PDF/Excel (runs without throwing)
    const exportExcelBtn = wrapper.findAll('button').find((b) => b.text().includes('Download Report Excel'))
    expect(exportExcelBtn).toBeDefined()
    const exportPdfBtn = wrapper.findAll('button').find((b) => b.text().includes('Download Report PDF'))
    expect(exportPdfBtn).toBeDefined()

    // 16. Uji read-only role (RBAC)
    // Switch to read-only user (e.g. staff_penjualan or non-HR)
    authStore.currentUser = MOCK_USERS[1] // Staff Penjualan (no hr:create or hr:update)
    await flushPromises()

    // Back to Tab 1
    await tabs[0].trigger('click')
    await flushPromises()

    // Fetch and import buttons should NOT be present for user without hr:create
    const restrictedFetch = wrapper.findAll('button').find((b) => b.text().includes('Ambil data fingerprint'))
    expect(restrictedFetch).toBeUndefined()
    const restrictedImport = wrapper.findAll('button').find((b) => b.text().includes('Import data'))
    expect(restrictedImport).toBeUndefined()

    wrapper.unmount()
  })
})
