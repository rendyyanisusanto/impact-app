import type { CrudService, PaginatedResponse } from '@/shared/types/crud.types'
import type {
  EmployeeGroup,
  CreateEmployeeGroupDto,
  UpdateEmployeeGroupDto,
  EmployeeGroupFilterQuery
} from '../types/employee-group.types'
import { validateEmployeeGroup } from '../utils/employee-group-validation'
import { employeeService } from './employee.service'

export const INITIAL_MOCK_EMPLOYEE_GROUPS: EmployeeGroup[] = [
  {
    id: 2,
    kode: 'GRP7',
    nama: 'Group Gudang',
    color: '#000000',
    status_aktif: 1,
    created_at: '2024-12-02 10:23:44',
    created_by: 1,
    updated_at: '2025-04-17 03:15:23',
    updated_by: 1
  },
  {
    id: 3,
    kode: 'GRP2',
    nama: 'Grup Driver Achmad',
    color: '#3b82f6',
    status_aktif: 1,
    created_at: '2024-12-02 10:24:13',
    created_by: 1,
    updated_at: '2025-01-17 08:04:29',
    updated_by: 1
  },
  {
    id: 5,
    kode: 'GRP11',
    nama: 'Group Kursi Lipat',
    color: '#0f766e',
    status_aktif: 1,
    created_at: '2024-12-31 00:57:54',
    created_by: 1,
    updated_at: '2025-04-17 03:15:45',
    updated_by: 1
  },
  {
    id: 6,
    kode: 'GRP3',
    nama: 'Group Driver Soedjai',
    color: '#64748b',
    status_aktif: 1,
    created_at: '2025-01-11 00:49:01',
    created_by: 1,
    updated_at: '2025-01-17 08:05:22',
    updated_by: 1
  },
  {
    id: 7,
    kode: 'GRP4',
    nama: 'Group Driver Tano',
    color: '#64748b',
    status_aktif: 1,
    created_at: '2025-01-11 00:49:29',
    created_by: 1,
    updated_at: '2025-01-17 08:08:44',
    updated_by: 1
  },
  {
    id: 8,
    kode: 'GRP5',
    nama: 'Grup Driver Totok',
    color: '#64748b',
    status_aktif: 1,
    created_at: '2025-01-11 00:49:46',
    created_by: 1,
    updated_at: '2025-01-17 08:09:10',
    updated_by: 1
  },
  {
    id: 9,
    kode: 'GRP8',
    nama: 'Group Kursi Susun',
    color: '#10b981',
    status_aktif: 1,
    created_at: '2025-01-11 00:50:14',
    created_by: 1,
    updated_at: '2025-04-17 03:16:04',
    updated_by: 1
  },
  {
    id: 10,
    kode: 'GRP9',
    nama: 'Group Jok Susun',
    color: '#8b5cf6',
    status_aktif: 1,
    created_at: '2025-01-11 00:50:28',
    created_by: 1,
    updated_at: '2025-04-17 03:16:20',
    updated_by: 1
  },
  {
    id: 11,
    kode: 'GRP12',
    nama: 'Group Kursi Kantor',
    color: '#06b6d4',
    status_aktif: 1,
    created_at: '2025-01-11 00:51:50',
    created_by: 1,
    updated_at: '2025-04-17 03:16:29',
    updated_by: 1
  },
  {
    id: 12,
    kode: 'GRP13',
    nama: 'Group Las Susun',
    color: '#f97316',
    status_aktif: 1,
    created_at: '2025-01-11 00:52:03',
    created_by: 1,
    updated_at: '2025-04-17 03:16:37',
    updated_by: 1
  },
  {
    id: 13,
    kode: 'GRP14',
    nama: 'Group Las Custom',
    color: '#ec4899',
    status_aktif: 1,
    created_at: '2025-01-11 00:52:20',
    created_by: 1,
    updated_at: '2025-04-17 03:16:55',
    updated_by: 1
  },
  {
    id: 14,
    kode: 'GRP 6',
    nama: 'Grup Driver Wondo',
    color: '#eab308',
    status_aktif: 1,
    created_at: '2025-04-17 03:18:31',
    created_by: 1,
    updated_at: null,
    updated_by: null
  },
  {
    id: 15,
    kode: 'GRP10',
    nama: 'Group Meja & Kayu',
    color: '#0f766e',
    status_aktif: 1,
    created_at: '2025-04-17 03:19:01',
    created_by: 1,
    updated_at: null,
    updated_by: null
  },
  {
    id: 16,
    kode: 'GRP15',
    nama: 'Group Satpam',
    color: '#475569',
    status_aktif: 1,
    created_at: '2025-04-17 03:19:27',
    created_by: 1,
    updated_at: null,
    updated_by: null
  },
  {
    id: 17,
    kode: 'GRP16',
    nama: 'Group Sales',
    color: '#2563eb',
    status_aktif: 1,
    created_at: '2025-04-17 03:19:38',
    created_by: 1,
    updated_at: null,
    updated_by: null
  },
  {
    id: 18,
    kode: 'GRP17',
    nama: 'Group Nonaktif Arsip',
    color: '#94a3b8',
    status_aktif: 0,
    created_at: '2025-04-17 03:19:50',
    created_by: 1,
    updated_at: null,
    updated_by: null
  }
]

export class EmployeeGroupService implements CrudService<
  EmployeeGroup,
  CreateEmployeeGroupDto,
  UpdateEmployeeGroupDto
> {
  private groups: EmployeeGroup[] = []

  constructor() {
    this.reset()
  }

  reset(): void {
    this.groups = JSON.parse(JSON.stringify(INITIAL_MOCK_EMPLOYEE_GROUPS))
  }

  /**
   * Helper to attach dynamic member count and creator/updater name
   */
  private enrichGroup(group: EmployeeGroup): EmployeeGroup {
    const memberCount = employeeService.getMemberCountByGroupId(group.id)
    return {
      ...group,
      member_count: memberCount,
      creator_name: group.created_by === 1 ? 'Administrator' : `User #${group.created_by ?? '-'}`,
      updater_name:
        group.updated_by === 1
          ? 'Administrator'
          : group.updated_by
            ? `User #${group.updated_by}`
            : 'Belum diupdate'
    }
  }

  getGroupByIdSync(id: number): EmployeeGroup | undefined {
    return this.groups.find(g => g.id === Number(id))
  }

  async getAll(): Promise<EmployeeGroup[]> {
    return this.groups.map(g => this.enrichGroup(g))
  }

  async getActiveGroups(): Promise<EmployeeGroup[]> {
    return this.groups.filter(g => g.status_aktif === 1).map(g => this.enrichGroup(g))
  }

  async list(query?: EmployeeGroupFilterQuery): Promise<PaginatedResponse<EmployeeGroup>> {
    let result = this.groups.map(g => this.enrichGroup(g))

    if (query?.search && query.search.trim()) {
      const q = query.search.trim().toLowerCase()
      result = result.filter(
        g => g.nama.toLowerCase().includes(q) || (g.kode && g.kode.toLowerCase().includes(q))
      )
    }

    if (query?.status_aktif !== undefined && query.status_aktif !== 'all') {
      const statusNum = Number(query.status_aktif)
      result = result.filter(g => g.status_aktif === statusNum)
    }

    const sortBy = query?.sortBy || 'id'
    const sortOrder = query?.sortOrder || 'asc'
    result.sort((a, b) => {
      const valA: unknown = a[sortBy as keyof EmployeeGroup]
      const valB: unknown = b[sortBy as keyof EmployeeGroup]

      if (valA === valB) return 0
      if (valA === null || valA === undefined) return 1
      if (valB === null || valB === undefined) return -1

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA
      }
      return sortOrder === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA))
    })

    const total = result.length
    const page = Math.max(1, query?.page || 1)
    const pageSize = Math.max(1, query?.pageSize || 10)
    const startIndex = (page - 1) * pageSize
    const pagedData = result.slice(startIndex, startIndex + pageSize)

    return {
      data: pagedData,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }

  async getById(id: number): Promise<EmployeeGroup> {
    const group = this.groups.find(g => g.id === Number(id))
    if (!group) throw new Error(`Grup Karyawan #${id} tidak ditemukan`)
    return this.enrichGroup(group)
  }

  async getByKode(kode: string): Promise<EmployeeGroup | null> {
    const group = this.groups.find(g => g.kode?.toLowerCase() === kode.toLowerCase())
    if (!group) return null
    return this.enrichGroup(group)
  }

  async create(dto: CreateEmployeeGroupDto): Promise<EmployeeGroup> {
    const validation = validateEmployeeGroup(dto, this.groups)
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0]
      throw new Error(firstError || 'Validasi data grup karyawan gagal')
    }

    const maxId = this.groups.reduce((max, g) => (g.id > max ? g.id : max), 0)
    const newGroup: EmployeeGroup = {
      id: maxId + 1,
      kode: dto.kode.trim().toUpperCase(),
      nama: dto.nama.trim(),
      color: dto.color?.trim() || '#0F766E',
      status_aktif: dto.status_aktif !== undefined ? Number(dto.status_aktif) : 1,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      created_by: dto.created_by ?? 1,
      updated_at: null,
      updated_by: null
    }

    this.groups.push(newGroup)
    return this.enrichGroup(newGroup)
  }

  async update(id: number, dto: UpdateEmployeeGroupDto): Promise<EmployeeGroup> {
    const index = this.groups.findIndex(g => g.id === Number(id))
    if (index === -1) {
      throw new Error(`Grup Karyawan dengan ID ${id} tidak ditemukan`)
    }

    const existing = this.groups[index]
    const merged = { ...existing, ...dto }
    const validation = validateEmployeeGroup(merged, this.groups, Number(id))
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0]
      throw new Error(firstError || 'Validasi update grup karyawan gagal')
    }

    const updated: EmployeeGroup = {
      ...existing,
      kode: dto.kode !== undefined ? dto.kode.trim().toUpperCase() : existing.kode,
      nama: dto.nama !== undefined ? dto.nama.trim() : existing.nama,
      color: dto.color !== undefined ? dto.color : existing.color,
      status_aktif:
        dto.status_aktif !== undefined ? Number(dto.status_aktif) : existing.status_aktif,
      updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      updated_by: dto.updated_by ?? 1
    }

    this.groups[index] = updated
    return this.enrichGroup(updated)
  }

  async toggleStatus(id: number): Promise<EmployeeGroup> {
    const group = await this.getById(id)
    if (!group) throw new Error(`Grup Karyawan #${id} tidak ditemukan`)
    const newStatus = group.status_aktif === 1 ? 0 : 1
    return this.update(id, { status_aktif: newStatus })
  }

  async delete(id: number): Promise<boolean> {
    const targetId = Number(id)
    const index = this.groups.findIndex(g => g.id === targetId)
    if (index === -1) {
      throw new Error(`Grup Karyawan #${id} tidak ditemukan`)
    }

    // Referential integrity check: Cannot hard delete if group currently has active members
    const memberCount = employeeService.getMemberCountByGroupId(targetId)
    if (memberCount > 0) {
      throw new Error(
        `Grup Karyawan '${this.groups[index].nama}' tidak dapat dihapus karena masih memiliki ${memberCount} anggota karyawan aktif. Harap pindahkan anggota terlebih dahulu atau nonaktifkan grup.`
      )
    }

    this.groups.splice(index, 1)
    return true
  }

  async exportAll(query?: EmployeeGroupFilterQuery): Promise<EmployeeGroup[]> {
    const res = await this.list({ ...query, page: 1, pageSize: 99999 })
    return res.data
  }
}

export const employeeGroupService = new EmployeeGroupService()
