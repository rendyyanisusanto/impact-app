import type { ExcelImportTemplate, ImportRowMapper } from '@/shared/types/excel-import.types'
import type { CreateBankDto } from '../types/bank.types'

export const BANK_IMPORT_TEMPLATE: ExcelImportTemplate = {
  sheetName: 'Master Bank',
  columns: [
    {
      key: 'bank',
      header: 'Nama Bank *',
      required: true,
      description: 'Nama bank dan pemilik rekening (cth: BCA PT Impact)'
    },
    {
      key: 'rekening',
      header: 'Nomor Rekening *',
      required: true,
      description: 'Nomor rekening bank (string, menjaga leading zero)'
    }
  ],
  sampleData: [
    {
      bank: 'BCA PT Impact Furniture',
      rekening: '0123984711'
    },
    {
      bank: 'Mandiri Operasional',
      rekening: '0098234123'
    }
  ]
}

export const bankRowMapper: ImportRowMapper<CreateBankDto> = {
  mapRow(
    row: Record<string, unknown>,
    rowNumber: number
  ): { data?: CreateBankDto; error?: string } {
    const bank = String(row['Nama Bank *'] || row['bank'] || row['Bank'] || '').trim()
    if (!bank) {
      return { error: `Baris ${rowNumber}: Nama Bank wajib diisi` }
    }

    const rekening = String(
      row['Nomor Rekening *'] || row['rekening'] || row['Rekening'] || ''
    ).trim()
    if (!rekening) {
      return { error: `Baris ${rowNumber}: Nomor Rekening wajib diisi` }
    }

    return {
      data: {
        bank,
        rekening
      }
    }
  }
}
