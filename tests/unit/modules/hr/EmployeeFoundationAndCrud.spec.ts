import { describe, it, expect, beforeEach } from 'vitest'
import { employeeService } from '@/modules/hr/services/employee.service'
import { validateEmployee } from '@/modules/hr/utils/employee-validation'
import { positionService } from '@/modules/settings/positions/services/position.service'
import { employeeStatusService } from '@/modules/settings/employee-statuses/services/employee-status.service'

describe('Sprint 8 — Task 1-3: HR Foundation & Master Data Karyawan CRUD', () => {
  beforeEach(() => {
    employeeService.reset()
    positionService.reset()
    employeeStatusService.reset()
  })

  it('1.1 validates legacy schema fields: id, kode, nik, nama, uid_fingerprint, jabatan_id, status_karyawan_id, grup_karyawan_id', async () => {
    const list = await employeeService.getAll()
    expect(list.length).toBeGreaterThanOrEqual(14)

    const emp = list[0]
    expect(emp).toHaveProperty('id')
    expect(emp).toHaveProperty('kode')
    expect(emp).toHaveProperty('uid_fingerprint')
    expect(emp).toHaveProperty('nik')
    expect(emp).toHaveProperty('nama')
    expect(emp).toHaveProperty('jabatan_id')
    expect(emp).toHaveProperty('status_karyawan_id')
    expect(emp).toHaveProperty('grup_karyawan_id')
    expect(emp).toHaveProperty('status')
    expect(typeof emp.status).toBe('number')
  })

  it('1.2 correctly enriches employee with relational lookups from Master Jabatan and Master Status Karyawan', async () => {
    const emp = await employeeService.getById(53) // IWAN: jabatan 2 (PENGIRIMAN), status_karyawan 1 (Harian)
    expect(emp).not.toBeNull()
    expect(emp.nama).toBe('IWAN')
    expect(emp.jabatan_nama).toBe('PENGIRIMAN')
    expect(emp.status_karyawan_nama).toBe('Harian')
    expect(emp.grup_karyawan_nama).toBe('Tanpa Grup')
  })

  it('1.3 enforces required fields in employee validation (kode, nama, uid_fingerprint, jabatan_id, status_karyawan_id)', () => {
    const emptyValidation = validateEmployee({}, [])
    expect(emptyValidation.isValid).toBe(false)
    expect(emptyValidation.errors.kode).toBeDefined()
    expect(emptyValidation.errors.nama).toBeDefined()
    expect(emptyValidation.errors.uid_fingerprint).toBeDefined()
    expect(emptyValidation.errors.jabatan_id).toBeDefined()
    expect(emptyValidation.errors.status_karyawan_id).toBeDefined()
  })

  it('1.4 rejects duplicate kode and duplicate uid_fingerprint', async () => {
    const existing = await employeeService.getAll()

    // Test duplicate kode
    const dupKodeValidation = validateEmployee(
      {
        kode: '1', // already used by IWAN
        nama: 'Karyawan Baru',
        uid_fingerprint: 9999,
        jabatan_id: 2,
        status_karyawan_id: 1,
        status: 1
      },
      existing
    )
    expect(dupKodeValidation.isValid).toBe(false)
    expect(dupKodeValidation.errors.kode).toContain('sudah digunakan')

    // Test duplicate UID Fingerprint
    const dupUidValidation = validateEmployee(
      {
        kode: 'EMP-999',
        nama: 'Karyawan Baru',
        uid_fingerprint: 1, // already used by IWAN
        jabatan_id: 2,
        status_karyawan_id: 1,
        status: 1
      },
      existing
    )
    expect(dupUidValidation.isValid).toBe(false)
    expect(dupUidValidation.errors.uid_fingerprint).toContain('sudah digunakan')
  })

  it('1.5 successfully creates a new employee with valid references and persists in memory', async () => {
    const created = await employeeService.create({
      kode: 'EMP-099',
      nik: '3578019999990001',
      nama: 'Hendra Gunawan',
      jk: 'Laki-Laki',
      no_hp: '081299998888',
      email: 'hendra@impactfurniture.co.id',
      alamat: 'Jl. Rungkut Asri Timur No. 10',
      province_id: 1,
      city_id: 1,
      jabatan_id: 1001, // GUDANG
      status_karyawan_id: 1, // Harian
      grup_karyawan_id: 2, // Group Gudang
      uid_fingerprint: 99,
      status: 1
    })

    expect(created.id).toBeGreaterThan(0)
    expect(created.nama).toBe('Hendra Gunawan')
    expect(created.jabatan_nama).toBe('GUDANG')
    expect(created.grup_karyawan_nama).toBe('Group Gudang')

    // Verify lookup from service
    const found = await employeeService.getById(created.id)
    expect(found.nama).toBe('Hendra Gunawan')
  })

  it('1.6 rejects creating employee with invalid / non-existent foreign keys', async () => {
    await expect(
      employeeService.create({
        kode: 'EMP-INVALID',
        nama: 'Invalid Employee',
        uid_fingerprint: 9998,
        jabatan_id: 88888, // non-existent position
        status_karyawan_id: 1,
        status: 1
      })
    ).rejects.toThrow('Jabatan dengan ID 88888 tidak valid')

    await expect(
      employeeService.create({
        kode: 'EMP-INVALID-2',
        nama: 'Invalid Employee 2',
        uid_fingerprint: 9997,
        jabatan_id: 2,
        status_karyawan_id: 77777, // non-existent employee status
        status: 1
      })
    ).rejects.toThrow('Status Karyawan dengan ID 77777 tidak valid')
  })

  it('1.7 updates employee details without mutating internal ID or audit integrity', async () => {
    const updated = await employeeService.update(54, {
      nama: 'ACHMAD FAUZI',
      no_hp: '081999887766'
    })

    expect(updated.id).toBe(54)
    expect(updated.nama).toBe('ACHMAD FAUZI')
    expect(updated.no_hp).toBe('081999887766')
    expect(updated.updated_at).toBeDefined()
  })

  it('1.8 toggles employee active status (1 <-> 0) cleanly', async () => {
    const empBefore = await employeeService.getById(54)
    expect(empBefore.status).toBe(1)

    const empToggled = await employeeService.toggleStatus(54)
    expect(empToggled.status).toBe(0)

    const empToggledBack = await employeeService.toggleStatus(54)
    expect(empToggledBack.status).toBe(1)
  })

  it('1.9 filters employees by search keyword, jabatan, status karyawan, and active status', async () => {
    // Search 'ACHMAD'
    const searchRes = await employeeService.list({ search: 'ACHMAD' })
    expect(searchRes.data.some(e => e.nama.includes('ACHMAD'))).toBe(true)

    // Filter jabatan PENGIRIMAN (id 2)
    const posRes = await employeeService.list({ jabatan_id: 2 })
    expect(posRes.data.every(e => e.jabatan_id === 2)).toBe(true)

    // Filter status nonaktif (0)
    const inactiveRes = await employeeService.list({ status: '0' })
    expect(inactiveRes.data.every(e => e.status === 0)).toBe(true)
    expect(inactiveRes.data.length).toBeGreaterThan(0)
  })

  it('1.10 safely deletes employee record', async () => {
    const beforeCount = (await employeeService.getAll()).length
    const deleted = await employeeService.delete(53)
    expect(deleted).toBe(true)

    const afterCount = (await employeeService.getAll()).length
    expect(afterCount).toBe(beforeCount - 1)
  })
})
