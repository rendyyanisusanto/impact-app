import { describe, it, expect, beforeEach } from 'vitest'
import { employeeGroupService } from '@/modules/hr/services/employee-group.service'
import { employeeService } from '@/modules/hr/services/employee.service'
import { validateEmployeeGroup } from '@/modules/hr/utils/employee-group-validation'

describe('Sprint 8 — Task 4-5: Master Data Grup Karyawan & Relasi Keanggotaan', () => {
  beforeEach(() => {
    employeeGroupService.reset()
    employeeService.reset()
  })

  it('4.1 validates legacy schema for grup_karyawan: id, kode, nama, color, status_aktif', async () => {
    const groups = await employeeGroupService.getAll()
    expect(groups.length).toBeGreaterThanOrEqual(14)

    const group = groups.find(g => g.id === 2) // Group Gudang
    expect(group).toBeDefined()
    expect(group?.nama).toBe('Group Gudang')
    expect(group?.kode).toBe('GRP7')
    expect(group?.status_aktif).toBe(1)
    expect(group?.color).toBeDefined()
  })

  it('4.2 correctly calculates dynamic member count from active employees', async () => {
    // In mock data:
    // Group 2 (Group Gudang) has employees: 63 (RUDI HARTONO), 64 (AGUS JUNIANTO) -> 2 members
    // Group 3 (Grup Driver Achmad) has employees: 54 (ACHMAD), 59 (RACHMAN) -> 2 members
    // Group 9 (Group Kursi Susun) has employees: 65 (AGUS RIYANTO), 66 (SAIFUL ARIFIN) -> 2 members
    const group2 = await employeeGroupService.getById(2)
    expect(group2.member_count).toBe(2)

    const group3 = await employeeGroupService.getById(3)
    expect(group3.member_count).toBe(2)
  })

  it('4.3 enforces required fields and unique kode in employee group validation', async () => {
    const existing = await employeeGroupService.getAll()

    // Required fields check
    const emptyVal = validateEmployeeGroup({}, existing)
    expect(emptyVal.isValid).toBe(false)
    expect(emptyVal.errors.kode).toBeDefined()
    expect(emptyVal.errors.nama).toBeDefined()

    // Duplicate kode check
    const dupVal = validateEmployeeGroup(
      { kode: 'GRP7', nama: 'Grup Duplikat', status_aktif: 1 },
      existing
    )
    expect(dupVal.isValid).toBe(false)
    expect(dupVal.errors.kode).toContain('sudah digunakan')
  })

  it('4.4 creates a new employee group and persists in memory', async () => {
    const created = await employeeGroupService.create({
      kode: 'GRP99',
      nama: 'Group Finishing Cat Duco',
      color: '#e11d48',
      status_aktif: 1
    })

    expect(created.id).toBeGreaterThan(0)
    expect(created.kode).toBe('GRP99')
    expect(created.nama).toBe('Group Finishing Cat Duco')
    expect(created.member_count).toBe(0)

    const found = await employeeGroupService.getById(created.id)
    expect(found.nama).toBe('Group Finishing Cat Duco')
  })

  it('4.5 updates group information and toggles status', async () => {
    const updated = await employeeGroupService.update(2, {
      nama: 'Group Gudang Logistik Terpadu',
      color: '#0284c7'
    })

    expect(updated.nama).toBe('Group Gudang Logistik Terpadu')
    expect(updated.color).toBe('#0284c7')

    // Toggle active status
    const toggled = await employeeGroupService.toggleStatus(2)
    expect(toggled.status_aktif).toBe(0)

    const toggledBack = await employeeGroupService.toggleStatus(2)
    expect(toggledBack.status_aktif).toBe(1)
  })

  it('5.1 adds an employee to a group and updates employee grup_karyawan_id', async () => {
    // Employee 53 (IWAN) currently has Tanpa Grup (grup_karyawan_id = null)
    const empBefore = await employeeService.getById(53)
    expect(empBefore.grup_karyawan_id).toBeNull()

    const countBefore = (await employeeGroupService.getById(2)).member_count ?? 0

    // Assign IWAN to Group 2 (Group Gudang)
    await employeeService.assignGroup(53, 2)

    // Verify employee record updated
    const empAfter = await employeeService.getById(53)
    expect(empAfter.grup_karyawan_id).toBe(2)
    expect(empAfter.grup_karyawan_nama).toBe('Group Gudang')

    // Verify group member count incremented
    const countAfter = (await employeeGroupService.getById(2)).member_count
    expect(countAfter).toBe(countBefore + 1)
  })

  it('5.2 removing an employee from group sets grup_karyawan_id to null and DOES NOT delete employee', async () => {
    // Employee 54 (ACHMAD) belongs to Group 3
    const empBefore = await employeeService.getById(54)
    expect(empBefore.grup_karyawan_id).toBe(3)

    // Remove ACHMAD from Group 3
    const removed = await employeeService.removeMemberFromGroup(54)
    expect(removed.grup_karyawan_id).toBeNull()
    expect(removed.grup_karyawan_nama).toBe('Tanpa Grup')

    // Crucial check: employee MUST STILL EXIST in database!
    const stillExists = await employeeService.getById(54)
    expect(stillExists).toBeDefined()
    expect(stillExists.id).toBe(54)
    expect(stillExists.nama).toBe('ACHMAD')
  })

  it('5.3 handles bulk member assignment atomically', async () => {
    // Assign employees 53 (IWAN) and 55 (SOEDJAI) to Group 5 (Group Kursi Lipat)
    await employeeService.bulkAssignGroup([53, 55], 5)

    const emp53 = await employeeService.getById(53)
    const emp55 = await employeeService.getById(55)

    expect(emp53.grup_karyawan_id).toBe(5)
    expect(emp55.grup_karyawan_id).toBe(5)

    const group5Members = employeeService.getMembersByGroupId(5)
    expect(group5Members.some(m => m.id === 53)).toBe(true)
    expect(group5Members.some(m => m.id === 55)).toBe(true)
  })

  it('5.4 referential integrity check: prevents deleting a group that still has active members', async () => {
    // Group 2 (Group Gudang) currently has 2 members
    const group2 = await employeeGroupService.getById(2)
    expect(group2.member_count).toBeGreaterThan(0)

    // Deleting Group 2 must fail with explanatory error
    await expect(employeeGroupService.delete(2)).rejects.toThrow(
      /tidak dapat dihapus karena masih memiliki \d+ anggota/
    )

    // Group 2 still exists
    const stillExists = await employeeGroupService.getById(2)
    expect(stillExists).toBeDefined()
  })

  it('5.5 allows deleting a group that has 0 active members', async () => {
    // Create an empty group
    const emptyGroup = await employeeGroupService.create({
      kode: 'GRP-EMPTY',
      nama: 'Grup Kosong Sementara',
      color: '#94a3b8',
      status_aktif: 1
    })

    expect(emptyGroup.member_count).toBe(0)

    // Deleting empty group succeeds
    const deleted = await employeeGroupService.delete(emptyGroup.id)
    expect(deleted).toBe(true)

    await expect(employeeGroupService.getById(emptyGroup.id)).rejects.toThrow('tidak ditemukan')
  })

  it('5.6 verifies non-members filtering for group member picker', async () => {
    // Non-members of Group 2 must NOT include members already in Group 2
    const nonMembers = employeeService.getNonMembersByGroupId(2)
    expect(nonMembers.every(e => e.grup_karyawan_id !== 2)).toBe(true)
  })
})
