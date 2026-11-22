import { describe, it, expect, beforeEach } from 'vitest'
import {
  employeeRowMapper,
  EMPLOYEE_IMPORT_TEMPLATE
} from '@/modules/hr/utils/employee-import.config'
import { employeeService } from '@/modules/hr/services/employee.service'
import { employeeGroupService } from '@/modules/hr/services/employee-group.service'
import { hasPermission } from '@/shared/utils/permissions'
import { MOCK_USERS } from '@/mocks/users.mock'

describe('Sprint 8 — Task 2 & Task 5: Import, Export, RBAC & End-to-End Workflow', () => {
  beforeEach(() => {
    employeeService.reset()
    employeeGroupService.reset()
  })

  it('2.1 defines comprehensive Excel Import template with reference sheets for Jabatan, Status, Grup, and Wilayah', () => {
    expect(EMPLOYEE_IMPORT_TEMPLATE.sheetName).toBe('Master Karyawan')
    expect(EMPLOYEE_IMPORT_TEMPLATE.columns.length).toBeGreaterThanOrEqual(10)

    const referenceSheetNames = EMPLOYEE_IMPORT_TEMPLATE.referenceSheets?.map(s => s.name)
    expect(referenceSheetNames).toContain('Daftar Jabatan')
    expect(referenceSheetNames).toContain('Daftar Status Karyawan')
    expect(referenceSheetNames).toContain('Daftar Grup Karyawan')
    expect(referenceSheetNames).toContain('Daftar Provinsi & Kota')
  })

  it('2.2 successfully parses and maps a valid Excel row into CreateEmployeeDto with foreign key resolution', () => {
    const rawRow = {
      kode: 'EMP-777',
      uid_fingerprint: 777,
      nik: '3578017777770001',
      nama: 'Wahyudi Kusuma',
      jk: 'Laki-Laki',
      no_hp: '081277778888',
      email: 'wahyudi@impactfurniture.co.id',
      alamat: 'Jl. Rungkut Mejoyo No. 45',
      provinsi: 'Jawa Timur',
      kota: 'Kota Surabaya',
      jabatan: 'GUDANG', // matches position 1001
      status_karyawan: 'Harian', // matches status 1
      grup: 'Group Gudang', // matches group 2
      status: 'Aktif'
    }

    const result = employeeRowMapper(rawRow, 2)
    expect(result.error).toBeUndefined()
    expect(result.data).toBeDefined()
    expect(result.data?.kode).toBe('EMP-777')
    expect(result.data?.uid_fingerprint).toBe(777)
    expect(result.data?.nama).toBe('Wahyudi Kusuma')
    expect(result.data?.jabatan_id).toBe(1001)
    expect(result.data?.status_karyawan_id).toBe(1)
    expect(result.data?.grup_karyawan_id).toBe(2)
    expect(result.data?.status).toBe(1)
  })

  it('2.3 rejects row with invalid / non-existent Jabatan reference', () => {
    const rawRow = {
      kode: 'EMP-778',
      uid_fingerprint: 778,
      nama: 'Row Invalid Jabatan',
      jabatan: 'DIREKTUR UTAMA HAYALAN', // non-existent position
      status_karyawan: 'Harian'
    }

    const result = employeeRowMapper(rawRow, 3)
    expect(result.data).toBeUndefined()
    expect(result.error).toContain('tidak valid atau tidak ditemukan di Master Jabatan')
  })

  it('2.4 rejects row with invalid / non-existent Status Karyawan reference', () => {
    const rawRow = {
      kode: 'EMP-779',
      uid_fingerprint: 779,
      nama: 'Row Invalid Status',
      jabatan: 'GUDANG',
      status_karyawan: 'Freelance Fiktif' // non-existent status
    }

    const result = employeeRowMapper(rawRow, 4)
    expect(result.data).toBeUndefined()
    expect(result.error).toContain('tidak valid atau tidak ditemukan di Master Status')
  })

  it('2.5 validates RBAC permissions for Superadmin, Staff HR, and Viewer/Auditor', () => {
    const superadmin = MOCK_USERS.find(u => u.username === 'superadmin') ?? null
    const staffHr = MOCK_USERS.find(u => u.username === 'staff.hr') ?? null
    const auditor = MOCK_USERS.find(u => u.username === 'auditor') ?? null

    // Superadmin has full access wildcard
    expect(hasPermission(superadmin, 'hr', 'read')).toBe(true)
    expect(hasPermission(superadmin, 'hr', 'create')).toBe(true)
    expect(hasPermission(superadmin, 'hr', 'update')).toBe(true)
    expect(hasPermission(superadmin, 'hr', 'delete')).toBe(true)

    // Staff HR has full HR access
    expect(hasPermission(staffHr, 'hr', 'read')).toBe(true)
    expect(hasPermission(staffHr, 'hr', 'create')).toBe(true)
    expect(hasPermission(staffHr, 'hr', 'update')).toBe(true)
    expect(hasPermission(staffHr, 'hr', 'delete')).toBe(true)

    // Auditor has read-only access to HR
    expect(hasPermission(auditor, 'hr', 'read')).toBe(true)
    expect(hasPermission(auditor, 'hr', 'create')).toBe(false)
    expect(hasPermission(auditor, 'hr', 'update')).toBe(false)
    expect(hasPermission(auditor, 'hr', 'delete')).toBe(false)
  })

  it('2.6 Comprehensive Integration Scenario (16 Steps per Section 48)', async () => {
    // 1. Buat karyawan dengan jabatan valid
    const emp1 = await employeeService.create({
      kode: 'SCEN-01',
      nama: 'Karyawan Skenario 1',
      uid_fingerprint: 801,
      jabatan_id: 1001, // GUDANG
      status_karyawan_id: 1, // Harian
      status: 1
    })
    expect(emp1.id).toBeDefined()

    // 2. Edit karyawan
    const updatedEmp1 = await employeeService.update(emp1.id, {
      nama: 'Karyawan Skenario 1 (Updated)',
      no_hp: '081233334444'
    })
    expect(updatedEmp1.nama).toBe('Karyawan Skenario 1 (Updated)')

    // 3. Nonaktifkan karyawan
    const toggledOff = await employeeService.toggleStatus(emp1.id)
    expect(toggledOff.status).toBe(0)

    // 4. Buat grup
    const newGroup = await employeeGroupService.create({
      kode: 'GRP-SCEN',
      nama: 'Grup Skenario Uji',
      color: '#0F766E',
      status_aktif: 1
    })
    expect(newGroup.id).toBeDefined()
    expect(newGroup.member_count).toBe(0)

    // 5. Tambahkan karyawan ke grup (mengaktifkan kembali terlebih dahulu agar dihitung sebagai active member)
    await employeeService.update(emp1.id, { status: 1 })
    await employeeService.assignGroup(emp1.id, newGroup.id)

    // 6. Cegah duplicate membership (karyawan memiliki single grup_karyawan_id)
    const empInGroup = await employeeService.getById(emp1.id)
    expect(empInGroup.grup_karyawan_id).toBe(newGroup.id)

    // 7. Lihat grup dari detail karyawan
    expect(empInGroup.grup_karyawan_nama).toBe('Grup Skenario Uji')

    // 8. Hapus karyawan dari grup
    const removedFromGroup = await employeeService.removeMemberFromGroup(emp1.id)
    expect(removedFromGroup.grup_karyawan_id).toBeNull()

    // 9. Pastikan karyawan tetap ada
    const empStillAlive = await employeeService.getById(emp1.id)
    expect(empStillAlive).toBeDefined()
    expect(empStillAlive.nama).toBe('Karyawan Skenario 1 (Updated)')

    // 10. Coba hapus grup yang masih digunakan
    // Assign emp1 to group again
    await employeeService.assignGroup(emp1.id, newGroup.id)
    await expect(employeeGroupService.delete(newGroup.id)).rejects.toThrow(/tidak dapat dihapus/)

    // Remove emp1, then delete group succeeds
    await employeeService.removeMemberFromGroup(emp1.id)
    const deletedGroup = await employeeGroupService.delete(newGroup.id)
    expect(deletedGroup).toBe(true)

    // 11. Import Excel karyawan valid
    const validImportRow = employeeRowMapper(
      {
        kode: 'SCEN-IMP-01',
        uid_fingerprint: 802,
        nama: 'Karyawan Import Sukses',
        jabatan: 'GUDANG',
        status_karyawan: 'Harian',
        status: 'Aktif'
      },
      2
    )
    expect(validImportRow.error).toBeUndefined()
    if (validImportRow.data) {
      const imported = await employeeService.create(validImportRow.data)
      expect(imported.nama).toBe('Karyawan Import Sukses')
    }

    // 12. Import Excel dengan referensi jabatan invalid
    const invalidImportRow = employeeRowMapper(
      {
        kode: 'SCEN-IMP-02',
        uid_fingerprint: 803,
        nama: 'Karyawan Import Gagal',
        jabatan: 'JABATAN SALAH TOTAL',
        status_karyawan: 'Harian'
      },
      3
    )
    expect(invalidImportRow.error).toBeDefined()

    // 13. Export data All
    const allEmployeesExport = await employeeService.exportAll()
    expect(allEmployeesExport.length).toBeGreaterThan(0)
    const allGroupsExport = await employeeGroupService.exportAll()
    expect(allGroupsExport.length).toBeGreaterThan(0)

    // 14. Search / filter / pagination
    const paged = await employeeService.list({ page: 1, pageSize: 5 })
    expect(paged.data.length).toBe(5)
    expect(paged.total).toBeGreaterThanOrEqual(14)

    // 15. Unauthorized create / update check
    const auditor = MOCK_USERS.find(u => u.username === 'auditor') ?? null
    expect(hasPermission(auditor, 'hr', 'create')).toBe(false)
    expect(hasPermission(auditor, 'hr', 'delete')).toBe(false)

    // 16. Reload mock data dan periksa konsistensi
    employeeService.reset()
    employeeGroupService.reset()
    const reloadedEmps = await employeeService.getAll()
    const reloadedGroups = await employeeGroupService.getAll()
    expect(reloadedEmps.length).toBeGreaterThanOrEqual(14)
    expect(reloadedGroups.length).toBeGreaterThanOrEqual(14)
  })
})
