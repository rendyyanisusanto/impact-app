import type { CrudService, PaginatedResponse } from '@/shared/types/crud.types'
import type {
  Employee,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  EmployeeFilterQuery
} from '../types/employee.types'
import { validateEmployee } from '../utils/employee-validation'
import { positionService } from '@/modules/settings/positions/services/position.service'
import { employeeStatusService } from '@/modules/settings/employee-statuses/services/employee-status.service'
import { referenceService } from '@/shared/services/reference.service'
import { INITIAL_MOCK_POSITIONS } from '@/modules/settings/positions/services/position.service'
import { INITIAL_MOCK_EMPLOYEE_STATUSES } from '@/modules/settings/employee-statuses/services/employee-status.service'
import { employeeGroupService } from './employee-group.service'

export const INITIAL_MOCK_EMPLOYEES: Employee[] = [
  {
    id: 53,
    kode: '1',
    nik: '1',
    nama: 'IWAN',
    jk: 'Laki-Laki',
    no_hp: '08123456701',
    alamat: 'Jl. Rungkut Industri No. 12',
    province_id: 1,
    city_id: 1,
    email: 'iwan@impactfurniture.co.id',
    jabatan_id: 2, // PENGIRIMAN
    tanggal_masuk: '2024-04-29',
    status: 1,
    status_karyawan_id: 1, // Harian
    uid_fingerprint: 1,
    grup_karyawan_id: null, // Tanpa Grup
    created_at: '2024-04-29 03:25:03',
    created_by: 1,
    updated_at: '2025-08-14 13:07:45',
    updated_by: 1
  },
  {
    id: 54,
    kode: '2',
    nik: '2',
    nama: 'ACHMAD',
    jk: 'Laki-Laki',
    no_hp: '08123456702',
    alamat: 'Jl. Ahmad Yani No. 44',
    province_id: 1,
    city_id: 1,
    email: 'achmad@impactfurniture.co.id',
    jabatan_id: 999, // SUPIR
    tanggal_masuk: '2024-04-29',
    status: 1,
    status_karyawan_id: 1, // Harian
    uid_fingerprint: 2,
    grup_karyawan_id: 3, // Grup Driver Achmad
    created_at: '2024-04-29 03:25:03',
    created_by: 1,
    updated_at: '2025-08-14 13:07:45',
    updated_by: 1
  },
  {
    id: 55,
    kode: '3',
    nik: '3',
    nama: 'SOEDJAI',
    jk: 'Laki-Laki',
    no_hp: '08123456703',
    alamat: 'Jl. Mayjend Sungkono No. 8',
    province_id: 1,
    city_id: 1,
    email: 'soedjai@impactfurniture.co.id',
    jabatan_id: 999, // SUPIR
    tanggal_masuk: '2024-04-29',
    status: 1,
    status_karyawan_id: 1, // Harian
    uid_fingerprint: 3,
    grup_karyawan_id: 6, // Group Driver Soedjai
    created_at: '2024-04-29 03:25:03',
    created_by: 1,
    updated_at: '2025-08-14 13:07:46',
    updated_by: 1
  },
  {
    id: 56,
    kode: '4',
    nik: '4',
    nama: 'TANO/MARKUS',
    jk: 'Laki-Laki',
    no_hp: '08123456704',
    alamat: 'Jl. Kertajaya Indah No. 15',
    province_id: 1,
    city_id: 1,
    email: 'tano@impactfurniture.co.id',
    jabatan_id: 999, // SUPIR
    tanggal_masuk: '2024-04-29',
    status: 1,
    status_karyawan_id: 1, // Harian
    uid_fingerprint: 4,
    grup_karyawan_id: 7, // Group Driver Tano
    created_at: '2024-04-29 03:25:03',
    created_by: 1,
    updated_at: '2025-08-14 13:07:46',
    updated_by: 1
  },
  {
    id: 57,
    kode: '5',
    nik: '5',
    nama: 'SUHARIYANTO/TOTOK',
    jk: 'Laki-Laki',
    no_hp: '08123456705',
    alamat: 'Jl. Darmo Permai No. 20',
    province_id: 1,
    city_id: 1,
    email: 'totok@impactfurniture.co.id',
    jabatan_id: 999, // SUPIR
    tanggal_masuk: '2024-04-29',
    status: 1,
    status_karyawan_id: 1, // Harian
    uid_fingerprint: 5,
    grup_karyawan_id: 8, // Grup Driver Totok
    created_at: '2024-04-29 03:25:03',
    created_by: 1,
    updated_at: '2025-08-14 13:07:47',
    updated_by: 1
  },
  {
    id: 58,
    kode: '71',
    nik: '71',
    nama: 'SUWONDO',
    jk: 'Laki-Laki',
    no_hp: '08123456771',
    alamat: 'Jl. Diponegoro No. 88',
    province_id: 1,
    city_id: 1,
    email: 'suwondo@impactfurniture.co.id',
    jabatan_id: 999, // SUPIR
    tanggal_masuk: '2024-04-29',
    status: 1,
    status_karyawan_id: 1, // Harian
    uid_fingerprint: 71,
    grup_karyawan_id: 14, // Grup Driver Wondo
    created_at: '2024-04-29 03:25:03',
    created_by: 1,
    updated_at: '2025-08-14 13:07:47',
    updated_by: 1
  },
  {
    id: 59,
    kode: '6',
    nik: '6',
    nama: 'RACHMAN',
    jk: 'Laki-Laki',
    no_hp: '08123456706',
    alamat: 'Jl. Basuki Rahmat No. 12',
    province_id: 1,
    city_id: 1,
    email: 'rachman@impactfurniture.co.id',
    jabatan_id: 1000, // KERNET
    tanggal_masuk: '2024-04-29',
    status: 1,
    status_karyawan_id: 1, // Harian
    uid_fingerprint: 6,
    grup_karyawan_id: 3, // Grup Driver Achmad
    created_at: '2024-04-29 03:25:03',
    created_by: 1,
    updated_at: '2025-08-14 13:07:47',
    updated_by: 1
  },
  {
    id: 60,
    kode: '7',
    nik: '7',
    nama: 'ALI BASORI',
    jk: 'Laki-Laki',
    no_hp: '08123456707',
    alamat: 'Jl. Kenjeran No. 56',
    province_id: 1,
    city_id: 1,
    email: 'ali@impactfurniture.co.id',
    jabatan_id: 1000, // KERNET
    tanggal_masuk: '2024-04-29',
    status: 1,
    status_karyawan_id: 1, // Harian
    uid_fingerprint: 7,
    grup_karyawan_id: 6, // Group Driver Soedjai
    created_at: '2024-04-29 03:25:03',
    created_by: 1,
    updated_at: '2025-08-14 13:07:48',
    updated_by: 1
  },
  {
    id: 61,
    kode: '8',
    nik: '8',
    nama: 'SUCIPTO',
    jk: 'Laki-Laki',
    no_hp: '08123456708',
    alamat: 'Jl. Tambaksari No. 23',
    province_id: 1,
    city_id: 1,
    email: 'sucipto@impactfurniture.co.id',
    jabatan_id: 1000, // KERNET
    tanggal_masuk: '2024-04-29',
    status: 0, // Nonaktif
    status_karyawan_id: 1, // Harian
    uid_fingerprint: 8,
    grup_karyawan_id: 8, // Grup Driver Totok
    created_at: '2024-04-29 03:25:03',
    created_by: 1,
    updated_at: '2025-08-14 13:07:48',
    updated_by: 1
  },
  {
    id: 62,
    kode: '9',
    nik: '9',
    nama: 'SAIFUL (KERNET)',
    jk: 'Laki-Laki',
    no_hp: '08123456709',
    alamat: 'Jl. Pahlawan No. 7',
    province_id: 1,
    city_id: 1,
    email: 'saiful.k@impactfurniture.co.id',
    jabatan_id: 1000, // KERNET
    tanggal_masuk: '2024-04-29',
    status: 0, // Nonaktif
    status_karyawan_id: 1, // Harian
    uid_fingerprint: 9,
    grup_karyawan_id: 7, // Group Driver Tano
    created_at: '2024-04-29 03:25:03',
    created_by: 1,
    updated_at: '2026-04-13 01:07:02',
    updated_by: 1
  },
  {
    id: 63,
    kode: '10',
    nik: '10',
    nama: 'RUDI HARTONO',
    jk: 'Laki-Laki',
    no_hp: '08123456710',
    alamat: 'Jl. Perak Timur No. 19',
    province_id: 1,
    city_id: 1,
    email: 'rudi@impactfurniture.co.id',
    jabatan_id: 1001, // GUDANG
    tanggal_masuk: '2024-04-29',
    status: 1,
    status_karyawan_id: 1, // Harian
    uid_fingerprint: 10,
    grup_karyawan_id: 2, // Group Gudang
    created_at: '2024-04-29 03:25:03',
    created_by: 1,
    updated_at: '2025-08-14 13:07:49',
    updated_by: 1
  },
  {
    id: 64,
    kode: '11',
    nik: '11',
    nama: 'AGUS JUNIANTO/ENCEK',
    jk: 'Laki-Laki',
    no_hp: '08123456711',
    alamat: 'Jl. Ngagel Jaya No. 34',
    province_id: 1,
    city_id: 1,
    email: 'agus.j@impactfurniture.co.id',
    jabatan_id: 1001, // GUDANG
    tanggal_masuk: '2024-04-29',
    status: 1,
    status_karyawan_id: 1, // Harian
    uid_fingerprint: 11,
    grup_karyawan_id: 2, // Group Gudang
    created_at: '2024-04-29 03:25:03',
    created_by: 1,
    updated_at: '2025-08-14 13:07:49',
    updated_by: 1
  },
  {
    id: 65,
    kode: '12',
    nik: '12',
    nama: 'AGUS RIYANTO',
    jk: 'Laki-Laki',
    no_hp: '08123456712',
    alamat: 'Jl. Barata Jaya No. 4',
    province_id: 1,
    city_id: 1,
    email: 'agus.r@impactfurniture.co.id',
    jabatan_id: 1002, // TUKANG KURSI SUSUN
    tanggal_masuk: '2024-04-29',
    status: 1,
    status_karyawan_id: 2, // Borongan
    uid_fingerprint: 12,
    grup_karyawan_id: 9, // Group Kursi Susun
    created_at: '2024-04-29 03:25:03',
    created_by: 1,
    updated_at: '2025-08-14 13:07:50',
    updated_by: 1
  },
  {
    id: 66,
    kode: '13',
    nik: '13',
    nama: 'SAIFUL ARIFIN',
    jk: 'Laki-Laki',
    no_hp: '08123456713',
    alamat: 'Jl. Bratang Binangun No. 9',
    province_id: 1,
    city_id: 1,
    email: 'saiful.a@impactfurniture.co.id',
    jabatan_id: 1002, // TUKANG KURSI SUSUN
    tanggal_masuk: '2024-04-29',
    status: 1,
    status_karyawan_id: 2, // Borongan
    uid_fingerprint: 13,
    grup_karyawan_id: 9, // Group Kursi Susun
    created_at: '2024-04-29 03:25:03',
    created_by: 1,
    updated_at: '2025-08-14 13:07:50',
    updated_by: 1
  }
]

export class EmployeeService implements CrudService<
  Employee,
  CreateEmployeeDto,
  UpdateEmployeeDto
> {
  private employees: Employee[] = []

  constructor() {
    this.reset()
  }

  reset(): void {
    this.employees = JSON.parse(JSON.stringify(INITIAL_MOCK_EMPLOYEES))
  }

  getMemberCountByGroupId(groupId: number): number {
    return this.employees.filter(e => e.grup_karyawan_id === Number(groupId) && e.status === 1)
      .length
  }

  getMembersByGroupId(groupId: number): Employee[] {
    return this.employees
      .filter(e => e.grup_karyawan_id === Number(groupId))
      .map(e => this.enrichEmployee(e))
  }

  getNonMembersByGroupId(groupId: number): Employee[] {
    return this.employees
      .filter(e => e.grup_karyawan_id !== Number(groupId) && e.status === 1)
      .map(e => this.enrichEmployee(e))
  }

  enrichEmployee(emp: Employee): Employee {
    const jabatan = INITIAL_MOCK_POSITIONS.find(j => j.id === emp.jabatan_id)
    const statusKaryawan = INITIAL_MOCK_EMPLOYEE_STATUSES.find(s => s.id === emp.status_karyawan_id)
    const group = emp.grup_karyawan_id
      ? employeeGroupService.getGroupByIdSync(emp.grup_karyawan_id)
      : null

    const provinceName = emp.province_id ? referenceService.getProvinceName(emp.province_id) : null

    const cityName = emp.city_id ? referenceService.getCityName(emp.city_id) : null

    return {
      ...emp,
      jabatan_nama: jabatan?.nama ?? (emp.jabatan_id ? `Jabatan #${emp.jabatan_id}` : '-'),
      jabatan_color: jabatan?.color ?? '#000000',
      status_karyawan_nama:
        statusKaryawan?.nama ??
        (emp.status_karyawan_id ? `Status #${emp.status_karyawan_id}` : '-'),
      status_karyawan_color: statusKaryawan?.color ?? '#64748b',
      grup_karyawan_nama:
        group?.nama ?? (emp.grup_karyawan_id ? `Grup #${emp.grup_karyawan_id}` : 'Tanpa Grup'),
      grup_karyawan_color: group?.color ?? '#94a3b8',
      province_name: provinceName,
      city_name: cityName,
      creator_name: emp.created_by === 1 ? 'Administrator' : `User #${emp.created_by ?? '-'}`,
      updater_name:
        emp.updated_by === 1
          ? 'Administrator'
          : emp.updated_by
            ? `User #${emp.updated_by}`
            : 'Belum diupdate'
    }
  }

  async getAll(): Promise<Employee[]> {
    return this.employees.map(e => this.enrichEmployee(e))
  }

  getAllEmployeesSync(): Employee[] {
    return this.employees.map(e => this.enrichEmployee(e))
  }

  async list(query?: EmployeeFilterQuery): Promise<PaginatedResponse<Employee>> {
    let result = this.employees.map(e => this.enrichEmployee(e))

    // Search query: matches nama, kode, nik, no_hp, email, jabatan, grup
    if (query?.search && query.search.trim()) {
      const q = query.search.trim().toLowerCase()
      result = result.filter(
        e =>
          e.nama.toLowerCase().includes(q) ||
          (e.kode && String(e.kode).toLowerCase().includes(q)) ||
          (e.nik && e.nik.toLowerCase().includes(q)) ||
          (e.no_hp && e.no_hp.toLowerCase().includes(q)) ||
          (e.email && e.email.toLowerCase().includes(q)) ||
          (e.jabatan_nama && e.jabatan_nama.toLowerCase().includes(q)) ||
          (e.grup_karyawan_nama && e.grup_karyawan_nama.toLowerCase().includes(q))
      )
    }

    // Filter: Jabatan
    if (query?.jabatan_id !== undefined && query.jabatan_id !== 'all') {
      const jId = Number(query.jabatan_id)
      result = result.filter(e => e.jabatan_id === jId)
    }

    // Filter: Status Karyawan
    if (query?.status_karyawan_id !== undefined && query.status_karyawan_id !== 'all') {
      const sId = Number(query.status_karyawan_id)
      result = result.filter(e => e.status_karyawan_id === sId)
    }

    // Filter: Grup Karyawan
    if (query?.grup_karyawan_id !== undefined && query.grup_karyawan_id !== 'all') {
      const gId = Number(query.grup_karyawan_id)
      result = result.filter(e => (gId === 0 ? !e.grup_karyawan_id : e.grup_karyawan_id === gId))
    }

    // Filter: Status Aktif (1 / 0)
    if (query?.status !== undefined && query.status !== 'all') {
      const statusNum = Number(query.status)
      result = result.filter(e => e.status === statusNum)
    }

    // Sorting
    const sortBy = query?.sortBy || 'id'
    const sortOrder = query?.sortOrder || 'asc'
    result.sort((a, b) => {
      const valA: unknown = a[sortBy as keyof Employee]
      const valB: unknown = b[sortBy as keyof Employee]

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

  async getById(id: number): Promise<Employee> {
    const emp = this.employees.find(e => e.id === Number(id))
    if (!emp) throw new Error(`Karyawan #${id} tidak ditemukan`)
    return this.enrichEmployee(emp)
  }

  async getByKode(kode: string): Promise<Employee | null> {
    const emp = this.employees.find(e => String(e.kode).toLowerCase() === kode.toLowerCase())
    if (!emp) return null
    return this.enrichEmployee(emp)
  }

  async getByUidFingerprint(uid: number): Promise<Employee | null> {
    const emp = this.employees.find(e => Number(e.uid_fingerprint) === Number(uid))
    if (!emp) return null
    return this.enrichEmployee(emp)
  }

  async create(dto: CreateEmployeeDto): Promise<Employee> {
    const validation = validateEmployee(dto, this.employees)
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0]
      throw new Error(firstError || 'Validasi data karyawan gagal')
    }

    // Validate foreign keys against master services
    const posRes = await positionService.getAll()
    const positions = Array.isArray(posRes) ? posRes : posRes.data
    if (!positions.some(p => p.id === Number(dto.jabatan_id))) {
      throw new Error(
        `Jabatan dengan ID ${dto.jabatan_id} tidak valid atau tidak ditemukan di Master Jabatan`
      )
    }

    const stRes = await employeeStatusService.getAll()
    const statuses = Array.isArray(stRes) ? stRes : stRes.data
    if (!statuses.some(s => s.id === Number(dto.status_karyawan_id))) {
      throw new Error(
        `Status Karyawan dengan ID ${dto.status_karyawan_id} tidak valid atau tidak ditemukan di Master Status`
      )
    }

    if (dto.grup_karyawan_id && Number(dto.grup_karyawan_id) > 0) {
      const group = await employeeGroupService.getById(Number(dto.grup_karyawan_id))
      if (!group) {
        throw new Error(
          `Grup Karyawan dengan ID ${dto.grup_karyawan_id} tidak ditemukan di Master Grup`
        )
      }
    }

    const maxId = this.employees.reduce((max, e) => (e.id > max ? e.id : max), 0)
    const newEmployee: Employee = {
      id: maxId + 1,
      kode: dto.kode.trim(),
      nik: dto.nik?.trim() || null,
      nama: dto.nama.trim(),
      jk: dto.jk || 'Laki-Laki',
      no_hp: dto.no_hp?.trim() || '-',
      alamat: dto.alamat?.trim() || '-',
      province_id: dto.province_id ? Number(dto.province_id) : null,
      city_id: dto.city_id ? Number(dto.city_id) : null,
      email: dto.email?.trim() || null,
      jabatan_id: Number(dto.jabatan_id),
      tanggal_masuk: dto.tanggal_masuk || new Date().toISOString().substring(0, 10),
      status: dto.status !== undefined ? Number(dto.status) : 1,
      status_karyawan_id: Number(dto.status_karyawan_id),
      uid_fingerprint: Number(dto.uid_fingerprint),
      grup_karyawan_id:
        dto.grup_karyawan_id && Number(dto.grup_karyawan_id) > 0
          ? Number(dto.grup_karyawan_id)
          : null,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      created_by: dto.created_by ?? 1,
      updated_at: null,
      updated_by: null
    }

    this.employees.push(newEmployee)
    return this.enrichEmployee(newEmployee)
  }

  async update(id: number, dto: UpdateEmployeeDto): Promise<Employee> {
    const index = this.employees.findIndex(e => e.id === Number(id))
    if (index === -1) {
      throw new Error(`Karyawan #${id} tidak ditemukan`)
    }

    const existing = this.employees[index]
    const merged = { ...existing, ...dto }
    const validation = validateEmployee(merged, this.employees, Number(id))
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0]
      throw new Error(firstError || 'Validasi update karyawan gagal')
    }

    if (dto.jabatan_id !== undefined) {
      const posRes = await positionService.getAll()
      const positions = Array.isArray(posRes) ? posRes : posRes.data
      if (!positions.some(p => p.id === Number(dto.jabatan_id))) {
        throw new Error(`Jabatan dengan ID ${dto.jabatan_id} tidak valid`)
      }
    }

    if (dto.status_karyawan_id !== undefined) {
      const stRes = await employeeStatusService.getAll()
      const statuses = Array.isArray(stRes) ? stRes : stRes.data
      if (!statuses.some(s => s.id === Number(dto.status_karyawan_id))) {
        throw new Error(`Status Karyawan dengan ID ${dto.status_karyawan_id} tidak valid`)
      }
    }

    if (
      dto.grup_karyawan_id !== undefined &&
      dto.grup_karyawan_id !== null &&
      Number(dto.grup_karyawan_id) > 0
    ) {
      const group = await employeeGroupService.getById(Number(dto.grup_karyawan_id))
      if (!group) {
        throw new Error(`Grup Karyawan dengan ID ${dto.grup_karyawan_id} tidak valid`)
      }
    }

    const updated: Employee = {
      ...existing,
      kode: dto.kode !== undefined ? dto.kode.trim() : existing.kode,
      nik: dto.nik !== undefined ? dto.nik?.trim() || null : existing.nik,
      nama: dto.nama !== undefined ? dto.nama.trim() : existing.nama,
      jk: dto.jk !== undefined ? dto.jk : existing.jk,
      no_hp: dto.no_hp !== undefined ? dto.no_hp?.trim() || '-' : existing.no_hp,
      alamat: dto.alamat !== undefined ? dto.alamat?.trim() || '-' : existing.alamat,
      province_id:
        dto.province_id !== undefined
          ? dto.province_id
            ? Number(dto.province_id)
            : null
          : existing.province_id,
      city_id:
        dto.city_id !== undefined ? (dto.city_id ? Number(dto.city_id) : null) : existing.city_id,
      email: dto.email !== undefined ? dto.email?.trim() || null : existing.email,
      jabatan_id: dto.jabatan_id !== undefined ? Number(dto.jabatan_id) : existing.jabatan_id,
      tanggal_masuk: dto.tanggal_masuk !== undefined ? dto.tanggal_masuk : existing.tanggal_masuk,
      status: dto.status !== undefined ? Number(dto.status) : existing.status,
      status_karyawan_id:
        dto.status_karyawan_id !== undefined
          ? Number(dto.status_karyawan_id)
          : existing.status_karyawan_id,
      uid_fingerprint:
        dto.uid_fingerprint !== undefined ? Number(dto.uid_fingerprint) : existing.uid_fingerprint,
      grup_karyawan_id:
        dto.grup_karyawan_id !== undefined
          ? dto.grup_karyawan_id && Number(dto.grup_karyawan_id) > 0
            ? Number(dto.grup_karyawan_id)
            : null
          : existing.grup_karyawan_id,
      updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      updated_by: dto.updated_by ?? 1
    }

    this.employees[index] = updated
    return this.enrichEmployee(updated)
  }

  async toggleStatus(id: number): Promise<Employee> {
    const emp = await this.getById(id)
    if (!emp) throw new Error(`Karyawan #${id} tidak ditemukan`)
    const newStatus = emp.status === 1 ? 0 : 1
    return this.update(id, { status: newStatus })
  }

  async delete(id: number): Promise<boolean> {
    const targetId = Number(id)
    const index = this.employees.findIndex(e => e.id === targetId)
    if (index === -1) {
      throw new Error(`Karyawan #${id} tidak ditemukan`)
    }

    // Safe deletion: remove or deactivate
    this.employees.splice(index, 1)
    return true
  }

  /**
   * Group membership management
   */
  async assignGroup(employeeId: number, groupId: number | null): Promise<Employee> {
    const emp = await this.getById(employeeId)
    if (!emp) throw new Error(`Karyawan #${employeeId} tidak ditemukan`)

    const targetGroupId = groupId && Number(groupId) > 0 ? Number(groupId) : null
    if (targetGroupId) {
      const group = await employeeGroupService.getById(targetGroupId)
      if (!group) throw new Error(`Grup Karyawan #${groupId} tidak ditemukan`)
    }

    return this.update(employeeId, { grup_karyawan_id: targetGroupId })
  }

  async bulkAssignGroup(employeeIds: number[], groupId: number | null): Promise<Employee[]> {
    const targetGroupId = groupId && Number(groupId) > 0 ? Number(groupId) : null
    if (targetGroupId) {
      const group = await employeeGroupService.getById(targetGroupId)
      if (!group) throw new Error(`Grup Karyawan #${groupId} tidak ditemukan`)
    }

    const updatedList: Employee[] = []
    for (const empId of employeeIds) {
      const updated = await this.assignGroup(empId, targetGroupId)
      updatedList.push(updated)
    }
    return updatedList
  }

  async removeMemberFromGroup(employeeId: number): Promise<Employee> {
    return this.assignGroup(employeeId, null)
  }

  async exportAll(query?: EmployeeFilterQuery): Promise<Employee[]> {
    const res = await this.list({ ...query, page: 1, pageSize: 99999 })
    return res.data
  }
}

export const employeeService = new EmployeeService()
