import { describe, it, expect, beforeEach } from 'vitest'
import { attendanceService } from '@/modules/hr/services/attendance.service'
import { fingerprintSourceService } from '@/modules/hr/services/fingerprint-source.service'
import { employeeService } from '@/modules/hr/services/employee.service'

describe('Sprint 8 — Task 11–17: Attendance Service, Synchronization & Import', () => {
  beforeEach(() => {
    attendanceService.resetToInitialSeeds()
    fingerprintSourceService.simulateDeviceAvailable = true
  })

  describe('Attendance Resolution & Legacy Reports', () => {
    it('1. resolves today attendance with employees ordered by group code number', async () => {
      const records = await attendanceService.getTodayAttendance('2026-11-01')
      expect(records.length).toBeGreaterThan(0)
      // IWAN is in GRP1 (or Tanpa Grup) -> first
      expect(records[0].nama).toBe('IWAN')
      expect(records[0].statuses).toContain('ABSENT')
    })

    it('2. resolves daily attendance for 2026-10-30 matching legacy screenshot records', async () => {
      const records = await attendanceService.getDailyAttendance('2026-10-30')
      const iwan = records.find((r) => r.nama === 'IWAN')
      expect(iwan).toBeDefined()
      expect(iwan?.cin).toBe('07:49:08')
      expect(iwan?.cout).toBe('16:01:14')
      expect(iwan?.bstart).toBe('11:31:11')
      expect(iwan?.bend).toBe('12:38:14')
      expect(iwan?.statuses).toContain('EI')
      expect(iwan?.statuses).toContain('LO')
      expect(iwan?.statuses).toContain('EBO')

      const achmad = records.find((r) => r.nama === 'ACHMAD')
      expect(achmad?.keterangan).toBe('LEMBUR 1 JAM 50MNT')
      expect(achmad?.cin).toBe('07:57:04')

      const soedjai = records.find((r) => r.nama === 'SOEDJAI')
      expect(soedjai?.statuses).toContain('NBO')
      expect(soedjai?.statuses).toContain('NBI')
      expect(soedjai?.keterangan).toBe('LEMBUR 1 JAM 56MNT')
    })

    it('3. resolves date range attendance ordered by KARYAWAN', async () => {
      const records = await attendanceService.getDateRangeAttendance({
        tanggalMulai: '2026-10-30',
        tanggalSelesai: '2026-10-31',
        orderBy: 'KARYAWAN'
      })

      // When ordered by KARYAWAN, all dates for employee A appear consecutively
      const firstEmpId = records[0].karyawanId
      const secondRecEmpId = records[1].karyawanId
      expect(secondRecEmpId).toBe(firstEmpId)
      expect(records[0].tanggal).toBe('2026-10-30')
      expect(records[1].tanggal).toBe('2026-10-31')
    })

    it('4. resolves date range attendance ordered by TANGGAL', async () => {
      const records = await attendanceService.getDateRangeAttendance({
        tanggalMulai: '2026-10-30',
        tanggalSelesai: '2026-10-31',
        orderBy: 'TANGGAL'
      })

      // When ordered by TANGGAL, all employees for date 1 appear before date 2
      expect(records[0].tanggal).toBe('2026-10-30')
      expect(records[1].tanggal).toBe('2026-10-30')
    })

    it('5. resolves single employee range attendance history', async () => {
      const all = await employeeService.getAll()
      const iwan = all.find((e) => e.kode === '1')!

      const records = await attendanceService.getEmployeeRangeAttendance({
        karyawanId: iwan.id,
        tanggalMulai: '2026-10-20',
        tanggalSelesai: '2026-10-23'
      })

      expect(records).toHaveLength(4)
      expect(records[0].cin).toBe('08:52:21') // 2026-10-20
      expect(records[1].statuses).toContain('ABSENT') // 2026-10-21
      expect(records[1].keterangan).toBe('IJIN ANTAR ANAK KE DR')
      expect(records[2].cin).toBe('07:45:17') // 2026-10-22
      expect(records[3].cin).toBe('07:51:41') // 2026-10-23
    })

    it('6. resolves monthly employee attendance with full calendar days', async () => {
      const all = await employeeService.getAll()
      const iwan = all.find((e) => e.kode === '1')!

      const records = await attendanceService.getEmployeeMonthlyAttendance({
        karyawanId: iwan.id,
        bulan: 11, // November (30 days)
        tahun: 2026
      })

      expect(records).toHaveLength(30)
      expect(records[0].tanggal).toBe('2026-11-01')
      expect(records[29].tanggal).toBe('2026-11-30')
    })
  })

  describe('Keterangan Updates', () => {
    it('7. updates keterangan for single employee', async () => {
      const all = await employeeService.getAll()
      const iwan = all.find((e) => e.kode === '1')!

      await attendanceService.updateKeterangan({
        ditujukan: 'KARYAWAN',
        tanggal: '2026-11-01',
        keterangan: 'Sakit Surat Dokter',
        karyawanId: iwan.id
      })

      const records = await attendanceService.getTodayAttendance('2026-11-01')
      const iwanRec = records.find((r) => r.karyawanId === iwan.id)
      expect(iwanRec?.keterangan).toBe('Sakit Surat Dokter')
    })

    it('8. updates keterangan for entire group', async () => {
      await attendanceService.updateKeterangan({
        ditujukan: 'GRUP',
        tanggal: '2026-11-01',
        keterangan: 'Tugas Luar Kota',
        grupId: 3 // Group Driver Achmad
      })

      const records = await attendanceService.getTodayAttendance('2026-11-01')
      const achmad = records.find((r) => r.nama === 'ACHMAD')
      expect(achmad?.keterangan).toContain('Tugas Luar Kota')
    })

    it('9. updates keterangan for all employees', async () => {
      await attendanceService.updateKeterangan({
        ditujukan: 'SEMUA',
        tanggal: '2026-11-01',
        keterangan: 'Kerja Bakti Pabrik'
      })

      const records = await attendanceService.getTodayAttendance('2026-11-01')
      for (const r of records) {
        expect(r.keterangan).toContain('Kerja Bakti Pabrik')
      }
    })
  })

  describe('Fingerprint Sync & Deduplication', () => {
    it('10. fetches fingerprint today and prevents duplicate insertions', async () => {
      const firstSync = await attendanceService.fetchFingerprintToday()
      expect(firstSync.totalProcessed).toBeGreaterThan(0)

      // Re-running sync immediately must skip duplicates (idempotent)
      const secondSync = await attendanceService.fetchFingerprintToday()
      expect(secondSync.totalInserted).toBe(0)
      expect(secondSync.totalSkippedDuplicates).toBe(secondSync.totalProcessed - secondSync.totalFailedMapping)
    })

    it('11. fetches fingerprint 3 days back and logs unmapped UIDs gracefully', async () => {
      const res = await attendanceService.fetchFingerprintThreeDaysBack()
      expect(res.totalProcessed).toBeGreaterThan(0)
    })

    it('12. handles device connection failure mock state', async () => {
      fingerprintSourceService.simulateDeviceAvailable = false
      await expect(attendanceService.fetchFingerprintToday()).rejects.toThrow(
        'Gagal terhubung ke mesin fingerprint'
      )
    })

    it('13. gets inspection data for Data Fingerprint tab with unmapped recognition', async () => {
      const inspected = await attendanceService.getFingerprintInspectionData('2026-10-30')
      expect(inspected.length).toBeGreaterThan(0)
      expect(inspected[0].nama).not.toBe('Tidak terbaca')

      // Check date with unmapped record (2026-11-01 has UID 9999)
      const inspectedNov = await attendanceService.getFingerprintInspectionData('2026-11-01')
      const unmapped = inspectedNov.find((i) => i.uid === 9999)
      expect(unmapped).toBeDefined()
      expect(unmapped?.nama).toBe('Tidak terbaca')
      expect(unmapped?.isMapped).toBe(false)
    })
  })

  describe('Import Process & Validation', () => {
    it('14. previews imported rows detecting unmapped and duplicate entries', async () => {
      const rows = [
        { no: 1, uid: 1, rawTimestamp: '2026-10-30 07:49:08' }, // Duplicate existing log
        { no: 2, uid: 1, rawTimestamp: '2026-11-05 07:45:00' }, // New valid entry
        { no: 3, uid: 99999, rawTimestamp: '2026-11-05 07:50:00' } // Unknown UID
      ]

      const preview = await attendanceService.previewImportData(rows)
      expect(preview).toHaveLength(3)

      expect(preview[0].isDuplicate).toBe(true)
      expect(preview[1].isValid).toBe(true)
      expect(preview[1].isDuplicate).toBe(false)
      expect(preview[2].isValid).toBe(false)
      expect(preview[2].errorReason).toContain('tidak ditemukan')
    })

    it('15. commits valid imported rows into check_log without saving duplicates', async () => {
      const rows = [
        { no: 1, uid: 1, rawTimestamp: '2026-10-30 07:49:08' },
        { no: 2, uid: 1, rawTimestamp: '2026-11-05 07:45:00' },
        { no: 3, uid: 99999, rawTimestamp: '2026-11-05 07:50:00' }
      ]

      const preview = await attendanceService.previewImportData(rows)
      const result = await attendanceService.commitImportData(preview)

      expect(result.insertedCount).toBe(1)
      expect(result.duplicateCount).toBe(1)
      expect(result.unmappedCount).toBe(1)
    })
  })
})
