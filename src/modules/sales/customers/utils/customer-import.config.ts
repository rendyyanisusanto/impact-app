import type { ImportTemplateDefinition } from '@/shared/types/crud.types'
import type { CreateCustomerDto } from '../types/customer.types'
import { referenceService } from '@/shared/services/reference.service'
import { MOCK_PROVINCES, MOCK_CITIES } from '@/mocks/references/master-references.mock'

export const CUSTOMER_IMPORT_TEMPLATE: ImportTemplateDefinition = {
  sheetName: 'Master Customer',
  title: 'Master Data Customer',
  columns: [
    {
      key: 'kode',
      label: 'Kode',
      required: false,
      type: 'string',
      maxLength: 50,
      example: 'CUST-010'
    },
    {
      key: 'nama',
      label: 'Nama Customer',
      required: true,
      type: 'string',
      maxLength: 255,
      example: 'PT Graha Pratama'
    },
    {
      key: 'no_hp',
      label: 'No. HP',
      required: false,
      type: 'string',
      maxLength: 50,
      example: '081298765432'
    },
    {
      key: 'email',
      label: 'Email',
      required: false,
      type: 'email',
      maxLength: 255,
      example: 'procurement@graha.co.id'
    },
    { key: 'provinsi', label: 'Provinsi', required: false, type: 'string', example: 'DKI Jakarta' },
    { key: 'kota', label: 'Kota', required: false, type: 'string', example: 'Kota Jakarta Pusat' },
    {
      key: 'alamat',
      label: 'Alamat',
      required: false,
      type: 'string',
      example: 'Jl. Sudirman No. 25, Jakarta Pusat'
    },
    {
      key: 'deskripsi',
      label: 'Deskripsi',
      required: false,
      type: 'string',
      example: 'Instansi rekanan pengadaan interior kantor'
    },
    { key: 'status', label: 'Status', required: false, type: 'string', example: 'Aktif' }
  ],
  referenceSheets: [
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

export function customerRowMapper(
  rawRow: Record<string, unknown>,
  rowNumber: number
): { data?: CreateCustomerDto; error?: string } {
  const nama = String(rawRow['nama'] || '').trim()

  if (!nama) {
    return { error: `Baris ${rowNumber}: Nama customer wajib diisi.` }
  }

  // Lookup province
  let province_id: number | null = null
  const provName = String(rawRow['provinsi'] || '').trim()
  if (provName) {
    const p = referenceService.findProvinceByName(provName)
    if (!p) {
      return {
        error: `Baris ${rowNumber}: Provinsi '${provName}' tidak ditemukan dalam referensi sistem.`
      }
    }
    province_id = p.id
  }

  // Lookup city
  let city_id: number | null = null
  const cityName = String(rawRow['kota'] || '').trim()
  if (cityName) {
    const c = referenceService.findCityByName(cityName, province_id || undefined)
    if (!c) {
      return {
        error: `Baris ${rowNumber}: Kota '${cityName}' tidak valid atau tidak cocok dengan provinsi terpilih.`
      }
    }
    city_id = c.id
  }

  // Status mapping
  const statusRaw = String(rawRow['status'] || 'Aktif')
    .trim()
    .toLowerCase()
  const status = statusRaw === 'nonaktif' || statusRaw === '0' || statusRaw === 'false' ? 0 : 1

  return {
    data: {
      kode: String(rawRow['kode'] || '').trim() || null,
      nama,
      no_hp: String(rawRow['no_hp'] || '').trim() || null,
      email: String(rawRow['email'] || '').trim() || null,
      province_id,
      city_id,
      alamat: String(rawRow['alamat'] || '').trim() || null,
      deskripsi: String(rawRow['deskripsi'] || '').trim() || null,
      status
    }
  }
}
