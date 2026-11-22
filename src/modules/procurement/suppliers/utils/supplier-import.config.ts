import type { ImportTemplateDefinition } from '@/shared/types/crud.types'
import type { CreateSupplierDto } from '../types/supplier.types'
import { referenceService } from '@/shared/services/reference.service'
import { MOCK_PROVINCES, MOCK_CITIES } from '@/mocks/references/master-references.mock'

export const SUPPLIER_IMPORT_TEMPLATE: ImportTemplateDefinition = {
  sheetName: 'Master Supplier',
  title: 'Master Data Supplier',
  columns: [
    {
      key: 'kode',
      label: 'Kode',
      required: true,
      type: 'string',
      maxLength: 50,
      example: 'SUP-010'
    },
    {
      key: 'nama',
      label: 'Nama Supplier',
      required: true,
      type: 'string',
      maxLength: 255,
      example: 'PT Mitra Furniture Jaya'
    },
    {
      key: 'no_hp',
      label: 'No. HP',
      required: true,
      type: 'string',
      maxLength: 50,
      example: '081234567890'
    },
    {
      key: 'email',
      label: 'Email',
      required: true,
      type: 'email',
      maxLength: 255,
      example: 'contact@mitrafurniture.com'
    },
    { key: 'provinsi', label: 'Provinsi', required: false, type: 'string', example: 'Jawa Tengah' },
    { key: 'kota', label: 'Kota', required: false, type: 'string', example: 'Kab. Jepara' },
    {
      key: 'alamat',
      label: 'Alamat',
      required: false,
      type: 'string',
      example: 'Jl. Raya Tahunan KM 5, Jepara'
    },
    {
      key: 'deskripsi',
      label: 'Deskripsi',
      required: false,
      type: 'string',
      example: 'Supplier spesialis aksesoris kuningan'
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

export function supplierRowMapper(
  rawRow: Record<string, unknown>,
  rowNumber: number
): { data?: CreateSupplierDto; error?: string } {
  const kode = String(rawRow['kode'] || '').trim()
  const nama = String(rawRow['nama'] || '').trim()
  const no_hp = String(rawRow['no_hp'] || '').trim()
  const email = String(rawRow['email'] || '').trim()

  if (!kode || !nama || !no_hp || !email) {
    return { error: `Baris ${rowNumber}: Field wajib (Kode, Nama, No. HP, Email) belum lengkap.` }
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
      kode,
      nama,
      no_hp,
      email,
      province_id,
      city_id,
      alamat: String(rawRow['alamat'] || '').trim() || null,
      deskripsi: String(rawRow['deskripsi'] || '').trim() || null,
      status
    }
  }
}
