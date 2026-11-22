import type { ImportTemplateDefinition } from '@/shared/types/crud.types'
import type { CreateEmployeeDto } from '../types/employee.types'
import { INITIAL_MOCK_POSITIONS } from '@/modules/settings/positions/services/position.service'
import { INITIAL_MOCK_EMPLOYEE_STATUSES } from '@/modules/settings/employee-statuses/services/employee-status.service'
import { INITIAL_MOCK_EMPLOYEE_GROUPS } from '../services/employee-group.service'
import { referenceService } from '@/shared/services/reference.service'
import { MOCK_PROVINCES, MOCK_CITIES } from '@/mocks/references/master-references.mock'

export const EMPLOYEE_IMPORT_TEMPLATE: ImportTemplateDefinition = {
  sheetName: 'Master Karyawan',
  title: 'Master Data Karyawan',
  columns: [
    {
      key: 'kode',
      label: 'Kode',
      required: true,
      type: 'string',
      maxLength: 50,
      example: 'EMP-080'
    },
    {
      key: 'uid_fingerprint',
      label: 'UID Fingerprint',
      required: true,
      type: 'number',
      example: 80
    },
    {
      key: 'nik',
      label: 'NIK',
      required: false,
      type: 'string',
      maxLength: 50,
      example: '3578010101950001'
    },
    {
      key: 'nama',
      label: 'Nama Karyawan',
      required: true,
      type: 'string',
      maxLength: 255,
      example: 'Bambang Sudiro'
    },
    {
      key: 'jk',
      label: 'Jenis Kelamin',
      required: false,
      type: 'string',
      example: 'Laki-Laki'
    },
    {
      key: 'no_hp',
      label: 'No. HP',
      required: false,
      type: 'string',
      maxLength: 50,
      example: '081234567899'
    },
    {
      key: 'email',
      label: 'Email',
      required: false,
      type: 'email',
      maxLength: 255,
      example: 'bambang@impactfurniture.co.id'
    },
    {
      key: 'alamat',
      label: 'Alamat',
      required: false,
      type: 'string',
      example: 'Jl. Ahmad Yani No. 120, Surabaya'
    },
    {
      key: 'provinsi',
      label: 'Provinsi',
      required: false,
      type: 'string',
      example: 'Jawa Timur'
    },
    {
      key: 'kota',
      label: 'Kota',
      required: false,
      type: 'string',
      example: 'Kota Surabaya'
    },
    {
      key: 'tanggal_masuk',
      label: 'Tanggal Masuk',
      required: false,
      type: 'date',
      example: '2024-05-01'
    },
    {
      key: 'jabatan',
      label: 'Jabatan',
      required: true,
      type: 'string',
      example: 'GUDANG'
    },
    {
      key: 'status_karyawan',
      label: 'Status Karyawan',
      required: true,
      type: 'string',
      example: 'Harian'
    },
    {
      key: 'grup',
      label: 'Grup Karyawan',
      required: false,
      type: 'string',
      example: 'Group Gudang'
    },
    {
      key: 'status',
      label: 'Status Aktif',
      required: false,
      type: 'string',
      example: 'Aktif'
    }
  ],
  referenceSheets: [
    {
      name: 'Daftar Jabatan',
      headers: ['ID', 'Kode Jabatan', 'Nama Jabatan'],
      rows: INITIAL_MOCK_POSITIONS.filter(j => (j.is_deleted ?? 1) === 1).map(j => [
        j.id,
        j.kode || '',
        j.nama || ''
      ])
    },
    {
      name: 'Daftar Status Karyawan',
      headers: ['ID', 'Kode Status', 'Nama Status'],
      rows: INITIAL_MOCK_EMPLOYEE_STATUSES.map(s => [s.id, s.kode || '', s.nama || ''])
    },
    {
      name: 'Daftar Grup Karyawan',
      headers: ['ID', 'Kode Grup', 'Nama Grup'],
      rows: INITIAL_MOCK_EMPLOYEE_GROUPS.filter(g => g.status_aktif === 1).map(g => [
        g.id,
        g.kode || '',
        g.nama
      ])
    },
    {
      name: 'Daftar Provinsi & Kota',
      headers: ['ID Provinsi', 'Nama Provinsi', 'ID Kota', 'Nama Kota'],
      rows: MOCK_CITIES.map(c => {
        const prov = MOCK_PROVINCES.find(p => p.id === c.province_id)
        return [c.province_id, prov?.name || '', c.id, c.name]
      })
    }
  ]
}

export function employeeRowMapper(
  rawRow: Record<string, unknown>,
  rowNumber: number
): { data?: CreateEmployeeDto; error?: string } {
  const kode = String(rawRow['kode'] || '').trim()
  const nama = String(rawRow['nama'] || '').trim()
  const rawUid = rawRow['uid_fingerprint']

  if (!kode) {
    return { error: `Baris ${rowNumber}: Kode Karyawan wajib diisi.` }
  }
  if (!nama) {
    return { error: `Baris ${rowNumber}: Nama Karyawan wajib diisi.` }
  }
  if (rawUid === undefined || rawUid === null || rawUid === '') {
    return { error: `Baris ${rowNumber}: UID Fingerprint wajib diisi.` }
  }

  const uid_fingerprint = Number(rawUid)
  if (Number.isNaN(uid_fingerprint) || uid_fingerprint <= 0) {
    return { error: `Baris ${rowNumber}: UID Fingerprint harus bilangan bulat positif.` }
  }

  // Lookup Jabatan
  const rawJabatan = String(rawRow['jabatan'] || '')
    .trim()
    .toLowerCase()
  if (!rawJabatan) {
    return { error: `Baris ${rowNumber}: Jabatan wajib diisi.` }
  }
  const matchedPosition = INITIAL_MOCK_POSITIONS.find(
    j =>
      (j.nama?.toLowerCase() === rawJabatan ||
        j.kode?.toLowerCase() === rawJabatan ||
        String(j.id) === rawJabatan) &&
      (j.is_deleted ?? 1) === 1
  )
  if (!matchedPosition) {
    return {
      error: `Baris ${rowNumber}: Jabatan '${rawRow['jabatan']}' tidak valid atau tidak ditemukan di Master Jabatan.`
    }
  }

  // Lookup Status Karyawan
  const rawStatusKaryawan = String(rawRow['status_karyawan'] || '')
    .trim()
    .toLowerCase()
  if (!rawStatusKaryawan) {
    return { error: `Baris ${rowNumber}: Status Karyawan wajib diisi.` }
  }
  const matchedStatus = INITIAL_MOCK_EMPLOYEE_STATUSES.find(
    s =>
      s.nama?.toLowerCase() === rawStatusKaryawan ||
      s.kode?.toLowerCase() === rawStatusKaryawan ||
      String(s.id) === rawStatusKaryawan
  )
  if (!matchedStatus) {
    return {
      error: `Baris ${rowNumber}: Status Karyawan '${rawRow['status_karyawan']}' tidak valid atau tidak ditemukan di Master Status.`
    }
  }

  // Lookup Grup Karyawan (optional)
  let grup_karyawan_id: number | null = null
  const rawGrup = String(rawRow['grup'] || '')
    .trim()
    .toLowerCase()
  if (rawGrup && rawGrup !== '-' && rawGrup !== 'tanpa grup') {
    const matchedGroup = INITIAL_MOCK_EMPLOYEE_GROUPS.find(
      g =>
        g.nama.toLowerCase() === rawGrup ||
        g.kode?.toLowerCase() === rawGrup ||
        String(g.id) === rawGrup
    )
    if (!matchedGroup) {
      return {
        error: `Baris ${rowNumber}: Grup Karyawan '${rawRow['grup']}' tidak ditemukan di Master Grup.`
      }
    }
    grup_karyawan_id = matchedGroup.id
  }

  // Lookup Provinsi & Kota (optional)
  let province_id: number | null = null
  let city_id: number | null = null
  const rawProv = String(rawRow['provinsi'] || '').trim()
  if (rawProv) {
    const p = referenceService.findProvinceByName(rawProv)
    if (p) province_id = p.id
  }

  const rawKota = String(rawRow['kota'] || '').trim()
  if (rawKota) {
    const c = referenceService.findCityByName(rawKota, province_id ?? undefined)
    if (c) city_id = c.id
  }

  // Normalize Gender
  let jk = String(rawRow['jk'] || 'Laki-Laki').trim()
  if (/^p(erempuan)?$/i.test(jk) || /^w(anita)?$/i.test(jk) || /^f(emale)?$/i.test(jk)) {
    jk = 'Perempuan'
  } else {
    jk = 'Laki-Laki'
  }

  // Normalize Status Aktif
  const rawAktif = String(rawRow['status'] || '1')
    .trim()
    .toLowerCase()
  const status = rawAktif === '0' || rawAktif === 'nonaktif' || rawAktif === 'tidak aktif' ? 0 : 1

  return {
    data: {
      kode,
      uid_fingerprint,
      nik: rawRow['nik'] ? String(rawRow['nik']).trim() : null,
      nama,
      jk,
      no_hp: rawRow['no_hp'] ? String(rawRow['no_hp']).trim() : '-',
      email: rawRow['email'] ? String(rawRow['email']).trim() : null,
      alamat: rawRow['alamat'] ? String(rawRow['alamat']).trim() : '-',
      province_id,
      city_id,
      tanggal_masuk: rawRow['tanggal_masuk'] ? String(rawRow['tanggal_masuk']).trim() : null,
      jabatan_id: matchedPosition.id,
      status_karyawan_id: matchedStatus.id,
      grup_karyawan_id,
      status
    }
  }
}
