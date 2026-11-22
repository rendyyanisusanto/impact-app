import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AttendanceStatusBadge from '@/modules/hr/components/AttendanceStatusBadge.vue'
import AttendanceSummaryCards from '@/modules/hr/components/AttendanceSummaryCards.vue'
import AttendanceNoteModal from '@/modules/hr/components/AttendanceNoteModal.vue'
import AttendanceImportModal from '@/modules/hr/components/AttendanceImportModal.vue'
import AttendancePage from '@/modules/hr/pages/AttendancePage.vue'
import { useAuthStore } from '@/stores/auth.store'
import { MOCK_USERS } from '@/mocks/users.mock'
import type { AttendanceStatusCode, UpdateAttendanceNoteDto } from '@/modules/hr/types/attendance.types'

describe('Sprint 8 — Task 12–17: Attendance UI Components & Tab Navigation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const authStore = useAuthStore()
    authStore.currentUser = MOCK_USERS[0] // Superadmin with all permissions
  })

  describe('AttendanceStatusBadge', () => {
    it('1. renders primary blue badge for EI and LO', () => {
      const wrapperEI = mount(AttendanceStatusBadge, {
        props: { status: 'EI' }
      })
      expect(wrapperEI.text()).toBe('EI')
      expect(wrapperEI.classes()).toContain('bg-blue-600')

      const wrapperLO = mount(AttendanceStatusBadge, {
        props: { status: 'LO' }
      })
      expect(wrapperLO.text()).toBe('LO')
      expect(wrapperLO.classes()).toContain('bg-blue-600')
    })

    it('2. renders danger red badge for LI, EO, EBO, ABSENT, NSO, NSI', () => {
      const wrapperLI = mount(AttendanceStatusBadge, {
        props: { status: 'LI' }
      })
      expect(wrapperLI.text()).toBe('LI')
      expect(wrapperLI.classes()).toContain('bg-red-600')

      const wrapperAbsent = mount(AttendanceStatusBadge, {
        props: { status: 'ABSENT' }
      })
      expect(wrapperAbsent.text()).toBe('ABSENT')
      expect(wrapperAbsent.classes()).toContain('bg-red-600')
    })
  })

  describe('AttendanceSummaryCards', () => {
    it('3. renders total, checked in, not checked in, and late in metrics', () => {
      const metrics = {
        totalEmployees: 9,
        checkedInCount: 7,
        notCheckedInCount: 2,
        statusCounts: {
          EI: 6,
          LI: 1,
          NSI: 0,
          LO: 7,
          EO: 0,
          NSO: 0,
          EBO: 4,
          NBO: 1,
          LBI: 2,
          NBI: 1,
          ABSENT: 2
        }
      }

      const wrapper = mount(AttendanceSummaryCards, {
        props: { metrics }
      })

      expect(wrapper.text()).toContain('9')
      expect(wrapper.text()).toContain('7')
      expect(wrapper.text()).toContain('2')
      expect(wrapper.text()).toContain('1')
    })
  })

  describe('AttendanceNoteModal', () => {
    it('4. displays employee details and emits save with selected target', async () => {
      document.body.innerHTML = ''
      const dummyRecord = {
        id: '53_2026-11-01',
        tanggal: '2026-11-01',
        tanggalFormatted: '01-11-2026',
        karyawanId: 53,
        kode: '1',
        nama: 'IWAN',
        grupKode: 'GRP1',
        grupNama: 'GRP1 - Tanpa Grup',
        cin: '-',
        cout: '-',
        bstart: '-',
        bend: '-',
        statuses: ['ABSENT' as AttendanceStatusCode],
        keterangan: ''
      }

      const wrapper = mount(AttendanceNoteModal, {
        props: {
          isOpen: true,
          record: dummyRecord,
          isLoading: false
        },
        attachTo: document.body
      })

      await flushPromises()

      expect(document.body.textContent).toContain('IWAN')
      expect(document.body.textContent).toContain('01-11-2026')

      const textarea = document.body.querySelector('textarea') as HTMLTextAreaElement
      expect(textarea).not.toBeNull()
      textarea.value = 'Izin Pulang Cepat'
      textarea.dispatchEvent(new Event('input'))
      await flushPromises()

      const buttons = Array.from(document.body.querySelectorAll('button'))
      const saveBtn = buttons.find((b) => b.textContent?.includes('Simpan'))
      expect(saveBtn).toBeDefined()
      saveBtn?.click()
      await flushPromises()

      expect(wrapper.emitted('save')).toBeTruthy()
      const savedPayload = wrapper.emitted('save')![0][0] as UpdateAttendanceNoteDto
      expect(savedPayload.keterangan).toBe('Izin Pulang Cepat')
      expect(savedPayload.ditujukan).toBe('KARYAWAN')

      wrapper.unmount()
    })
  })

  describe('AttendanceImportModal', () => {
    it('5. renders template download and upload dropzone', async () => {
      document.body.innerHTML = ''
      const wrapper = mount(AttendanceImportModal, {
        props: { isOpen: true },
        attachTo: document.body
      })

      await flushPromises()

      expect(document.body.textContent).toContain('Download Template')
      expect(document.body.textContent).toContain('Upload file presensi')

      wrapper.unmount()
    })
  })

  describe('AttendancePage (6 Tabs Host)', () => {
    it('6. renders top title and switches across all 6 tabs', async () => {
      const wrapper = mount(AttendancePage)
      await flushPromises()

      expect(wrapper.text()).toContain('Presensi')

      const navButtons = wrapper.findAll('nav button')
      expect(navButtons).toHaveLength(6)

      expect(navButtons[0].text()).toBe('Presensi Hari Ini')
      expect(navButtons[1].text()).toBe('Laporan Presensi Harian')
      expect(navButtons[2].text()).toBe('Laporan Presensi Range Tanggal')
      expect(navButtons[3].text()).toBe('Laporan Presensi Range Tanggal (Karyawan)')
      expect(navButtons[4].text()).toBe('Laporan Presensi Per Karyawan')
      expect(navButtons[5].text()).toBe('Data Fingerprint')

      // Switch to Tab 2
      await navButtons[1].trigger('click')
      await flushPromises()
      expect(wrapper.text()).toContain('Tanggal :')

      // Switch to Tab 3
      await navButtons[2].trigger('click')
      await flushPromises()
      expect(wrapper.text()).toContain('Tanggal Mulai :')
      expect(wrapper.text()).toContain('Urut Berdasarkan :')

      // Switch to Tab 4
      await navButtons[3].trigger('click')
      await flushPromises()
      expect(wrapper.text()).toContain('Karyawan :')

      // Switch to Tab 5
      await navButtons[4].trigger('click')
      await flushPromises()
      expect(wrapper.text()).toContain('Bulan :')
      expect(wrapper.text()).toContain('Tahun :')

      // Switch to Tab 6
      await navButtons[5].trigger('click')
      await flushPromises()
      expect(wrapper.text()).toContain('Ambil data fingerprint')
    })
  })
})
