import type { ExcelImportTemplate, ImportRowMapper } from '@/shared/types/excel-import.types'
import type { CreateAppSettingDto } from '../types/app-setting.types'

export const APP_SETTING_IMPORT_TEMPLATE: ExcelImportTemplate = {
  sheetName: 'Setting Aplikasi',
  columns: [
    {
      key: 'table',
      header: 'Modul / Tabel *',
      required: true,
      description: 'Nama modul entitas (cth: master_data_bahan, produk)'
    },
    {
      key: 'name',
      header: 'Kunci Pengaturan (Name) *',
      required: true,
      description: 'Nama parameter (cth: kode, template_excel)'
    },
    { key: 'value', header: 'Nilai (Value) *', required: true, description: 'Nilai pengaturan' },
    {
      key: 'keterangan',
      header: 'Keterangan',
      required: false,
      description: 'Deskripsi maksud pengaturan'
    }
  ],
  sampleData: [
    {
      table: 'master_data_bahan',
      name: 'kode',
      value: 'Bahan/{year}{month}-{rand}',
      keterangan: 'Format nomor otomatis bahan baku'
    },
    {
      table: 'produk',
      name: 'template_excel',
      value: 'produk.xlsx',
      keterangan: 'Nama berkas template impor Excel produk'
    }
  ]
}

export const appSettingRowMapper: ImportRowMapper<CreateAppSettingDto> = {
  mapRow(
    row: Record<string, unknown>,
    rowNumber: number
  ): { data?: CreateAppSettingDto; error?: string } {
    const table = String(row['Modul / Tabel *'] || row['table'] || row['Table'] || '').trim()
    if (!table) {
      return { error: `Baris ${rowNumber}: Modul / Tabel wajib diisi` }
    }

    const name = String(row['Kunci Pengaturan (Name) *'] || row['name'] || row['Name'] || '').trim()
    if (!name) {
      return { error: `Baris ${rowNumber}: Kunci Pengaturan (Name) wajib diisi` }
    }

    const value = String(row['Nilai (Value) *'] ?? row['value'] ?? row['Value'] ?? '').trim()
    if (!value) {
      return { error: `Baris ${rowNumber}: Nilai (Value) wajib diisi` }
    }

    const keterangan = String(row['Keterangan'] || row['keterangan'] || '').trim() || null

    return {
      data: {
        table,
        name,
        value,
        keterangan
      }
    }
  }
}
