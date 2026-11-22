import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AttendanceFingerprintTab from '@/modules/hr/components/AttendanceFingerprintTab.vue'
import AttendanceFingerprintSyncModal from '@/modules/hr/components/AttendanceFingerprintSyncModal.vue'
import { attendanceService } from '@/modules/hr/services/attendance.service'
import { useAuthStore } from '@/stores/auth.store'
import { MOCK_USERS } from '@/mocks/users.mock'
import type { FingerprintPreviewResponse, FingerprintSyncJobDto } from '@/modules/hr/types/attendance.types'

describe('HR Presensi Sprint 8 — Data Fingerprint Preview & Sync Modal Integration', () => {
  let authStore: ReturnType<typeof useAuthStore>

  const mockPreviewResponse: FingerprintPreviewResponse = {
    snapshot_id: 'snap-test-uuid-1234',
    date: '2026-11-20',
    kpi: {
      total_raw: 5,
      valid_mapped: 3,
      unmapped: 2,
      new_records: 2,
      existing_records: 1
    },
    items: [
      {
        id: 'item-1',
        no: 1,
        uid: 1,
        kodeKaryawan: 'EMP001',
        nama: 'IWAN',
        karyawanId: 53,
        timeFormatted: '07:49:08',
        timestamp: '2026-11-20 07:49:08',
        state: 0,
        isMapped: true,
        statusMapping: 'MAPPED',
        statusDatabase: 'EXISTS',
        reason: 'Sudah tersimpan di database check_log'
      },
      {
        id: 'item-2',
        no: 2,
        uid: 1,
        kodeKaryawan: 'EMP001',
        nama: 'IWAN',
        karyawanId: 53,
        timeFormatted: '16:05:12',
        timestamp: '2026-11-20 16:05:12',
        state: 0,
        isMapped: true,
        statusMapping: 'MAPPED',
        statusDatabase: 'NEW',
        reason: null
      },
      {
        id: 'item-3',
        no: 3,
        uid: 2,
        kodeKaryawan: 'EMP002',
        nama: 'ACHMAD',
        karyawanId: 54,
        timeFormatted: '07:55:00',
        timestamp: '2026-11-20 07:55:00',
        state: 0,
        isMapped: true,
        statusMapping: 'MAPPED',
        statusDatabase: 'NEW',
        reason: null
      },
      {
        id: 'item-4',
        no: 4,
        uid: 3,
        kodeKaryawan: 'EMP003',
        nama: 'KARYAWAN NONAKTIF',
        karyawanId: 55,
        timeFormatted: '08:00:00',
        timestamp: '2026-11-20 08:00:00',
        state: 0,
        isMapped: false,
        statusMapping: 'INACTIVE_EMPLOYEE',
        statusDatabase: 'NOT_ELIGIBLE',
        reason: 'Karyawan nonaktif'
      },
      {
        id: 'item-5',
        no: 5,
        uid: 999,
        kodeKaryawan: null,
        nama: 'Tidak terbaca',
        karyawanId: null,
        timeFormatted: '08:10:00',
        timestamp: '2026-11-20 08:10:00',
        state: 0,
        isMapped: false,
        statusMapping: 'UID_NOT_FOUND',
        statusDatabase: 'NOT_ELIGIBLE',
        reason: 'UID 999 belum terdaftar'
      }
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    authStore = useAuthStore()
    authStore.currentUser = MOCK_USERS[0]
  })

  describe('1. AttendanceFingerprintTab.vue', () => {
    it('1.1. renders form with Tanggal and Ambil data fingerprint button', async () => {
      const wrapper = mount(AttendanceFingerprintTab)
      await flushPromises()

      expect(wrapper.text()).toContain('Tanggal :')
      expect(wrapper.text()).toContain('Ambil data fingerprint')
      // Preview section not shown before fetch
      expect(wrapper.text()).not.toContain('Total Raw Records')
    })

    it('1.2. fetches preview data on submit, renders KPI cards and table with mapping and database badges', async () => {
      vi.spyOn(attendanceService, 'fetchFingerprintPreview').mockResolvedValue(mockPreviewResponse)

      const wrapper = mount(AttendanceFingerprintTab)
      await flushPromises()

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')
      await flushPromises()

      expect(attendanceService.fetchFingerprintPreview).toHaveBeenCalled()

      // KPI verification
      expect(wrapper.text()).toContain('Total Raw Records')
      expect(wrapper.text()).toContain('Valid Terpetakan')
      expect(wrapper.text()).toContain('Tidak Terbaca / Unmapped')
      expect(wrapper.text()).toContain('5') // total raw
      expect(wrapper.text()).toContain('3') // valid mapped
      expect(wrapper.text()).toContain('2') // unmapped

      // Table columns
      expect(wrapper.text()).toContain('No')
      expect(wrapper.text()).toContain('UID')
      expect(wrapper.text()).toContain('Kode')
      expect(wrapper.text()).toContain('Nama')
      expect(wrapper.text()).toContain('Time')
      expect(wrapper.text()).toContain('Status Mapping')
      expect(wrapper.text()).toContain('Status Database')

      // Employee names & codes
      expect(wrapper.text()).toContain('IWAN')
      expect(wrapper.text()).toContain('ACHMAD')
      expect(wrapper.text()).toContain('EMP001')
      expect(wrapper.text()).toContain('EMP002')

      // Badges
      expect(wrapper.text()).toContain('Terpetakan')
      expect(wrapper.text()).toContain('Sudah Tersimpan')
      expect(wrapper.text()).toContain('Belum Tersimpan')
      expect(wrapper.text()).toContain('Nonaktif')
      expect(wrapper.text()).toContain('Tidak Ditemukan')

      // Sinkronisasi Data button is enabled because new_records > 0
      const syncBtn = wrapper.findAll('button').find((b) => b.text().includes('Sinkronisasi Data'))
      expect(syncBtn?.exists()).toBe(true)
      expect(syncBtn?.attributes('disabled')).toBeUndefined()
    })

    it('1.3. detects stale date when user modifies date picker after fetch, displaying warning and disabling sync', async () => {
      vi.spyOn(attendanceService, 'fetchFingerprintPreview').mockResolvedValue(mockPreviewResponse)

      const wrapper = mount(AttendanceFingerprintTab)
      await flushPromises()

      await wrapper.find('form').trigger('submit.prevent')
      await flushPromises()

      // Change date input
      const dateInput = wrapper.find('input[type="date"]')
      await dateInput.setValue('2026-11-25')
      await flushPromises()

      expect(wrapper.text()).toContain('Tanggal filter telah diubah')

      const syncBtn = wrapper.findAll('button').find((b) => b.text().includes('Sinkronisasi Data'))
      expect(syncBtn?.attributes('disabled')).toBeDefined()
    })

    it('1.4. disables sync button and indicates all logs are stored when new_records is 0', async () => {
      const allStoredResponse: FingerprintPreviewResponse = {
        ...mockPreviewResponse,
        kpi: {
          total_raw: 3,
          valid_mapped: 3,
          unmapped: 0,
          new_records: 0,
          existing_records: 3
        },
        items: mockPreviewResponse.items.slice(0, 3).map((item) => ({
          ...item,
          statusDatabase: 'EXISTS'
        }))
      }

      vi.spyOn(attendanceService, 'fetchFingerprintPreview').mockResolvedValue(allStoredResponse)

      const wrapper = mount(AttendanceFingerprintTab)
      await flushPromises()

      await wrapper.find('form').trigger('submit.prevent')
      await flushPromises()

      expect(wrapper.text()).toContain('Semua log valid sudah tersimpan di database')

      const syncBtn = wrapper.findAll('button').find((b) => b.text().includes('Sinkronisasi Data'))
      expect(syncBtn?.attributes('disabled')).toBeDefined()
    })

    it('1.5. clicking Sinkronisasi Data opens sync modal and refreshes preview upon completion', async () => {
      vi.spyOn(attendanceService, 'fetchFingerprintPreview').mockResolvedValue(mockPreviewResponse)

      const wrapper = mount(AttendanceFingerprintTab)
      await flushPromises()

      await wrapper.find('form').trigger('submit.prevent')
      await flushPromises()

      const syncBtn = wrapper.findAll('button').find((b) => b.text().includes('Sinkronisasi Data'))
      expect(syncBtn).toBeDefined()
      await syncBtn!.trigger('click')
      await flushPromises()

      const modal = wrapper.findComponent(AttendanceFingerprintSyncModal)
      expect(modal.exists()).toBe(true)
      expect(modal.props('snapshotId')).toBe('snap-test-uuid-1234')
      expect(modal.props('modelValue')).toBe(true)

      // Simulate completion event
      const mockJob: FingerprintSyncJobDto = {
        id: 'job-1',
        mode: 'single',
        date_from: '2026-11-20',
        date_to: '2026-11-20',
        status: 'SUCCESS',
        stage: 'COMPLETED',
        total_device: 0,
        total_received: 5,
        total_inserted: 2,
        total_duplicates: 1,
        total_unmatched: 1,
        total_conflicts: 0,
        total_failed: 1,
        unique_employees: 2,
        start_time: '2026-11-20T08:00:00Z',
        end_time: '2026-11-20T08:00:01Z',
        duration_ms: 1000,
        created_at: '2026-11-20T08:00:00Z',
        updated_at: '2026-11-20T08:00:01Z'
      }

      await modal.vm.$emit('syncCompleted', mockJob)
      await flushPromises()

      // Verified re-fetch was called
      expect(attendanceService.fetchFingerprintPreview).toHaveBeenCalledTimes(2)
    })
  })

  describe('2. AttendanceFingerprintSyncModal.vue Snapshot Import Integration', () => {
    it('2.1. invokes importFingerprintSnapshot when snapshotId prop is provided', async () => {
      const mockJob: FingerprintSyncJobDto = {
        id: 'job-snapshot-123',
        mode: 'single',
        date_from: '2026-11-20',
        date_to: '2026-11-20',
        status: 'SUCCESS',
        stage: 'COMPLETED',
        total_device: 0,
        total_received: 5,
        total_inserted: 2,
        total_duplicates: 1,
        total_unmatched: 1,
        total_conflicts: 0,
        total_failed: 1,
        unique_employees: 2,
        start_time: '2026-11-20T08:00:00Z',
        end_time: '2026-11-20T08:00:01Z',
        duration_ms: 1000,
        created_at: '2026-11-20T08:00:00Z',
        updated_at: '2026-11-20T08:00:01Z'
      }

      vi.spyOn(attendanceService, 'getActiveSyncJob').mockResolvedValue(null)
      vi.spyOn(attendanceService, 'importFingerprintSnapshot').mockResolvedValue(mockJob)
      vi.spyOn(attendanceService, 'getSyncJobRecords').mockResolvedValue({
        data: [],
        meta: {
          page: 1,
          pageSize: 20,
          totalItems: 0,
          totalPages: 1,
          counts: { all: 0, success: 0, duplicate: 0, problem: 0 }
        }
      })

      const wrapper = mount(AttendanceFingerprintSyncModal, {
        props: {
          modelValue: true,
          snapshotId: 'snap-test-uuid-1234',
          targetDate: '2026-11-20'
        }
      })
      await flushPromises()

      expect(attendanceService.importFingerprintSnapshot).toHaveBeenCalledWith('snap-test-uuid-1234')
      expect(wrapper.emitted('syncCompleted')).toBeTruthy()
      expect(wrapper.emitted('syncCompleted')![0]![0]).toEqual(mockJob)
    })
  })
})
