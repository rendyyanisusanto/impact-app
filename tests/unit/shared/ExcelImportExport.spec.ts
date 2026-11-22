import { describe, it, expect } from 'vitest'
import fs from 'fs'
import * as XLSX from 'xlsx'
import { sanitizeExcelCell, exportToExcel } from '@/shared/utils/excel-export'
import { exportToPdf } from '@/shared/utils/pdf-export'
import { generateImportTemplate, parseAndValidateExcel } from '@/shared/utils/excel-import'
import type { ImportTemplateDefinition, ExportColumn } from '@/shared/types/crud.types'

describe('Sprint 3 — Task 1: Document Processing, Import & Export Foundation', () => {
  describe('Formula Injection Prevention (sanitizeExcelCell)', () => {
    it('1. prefixes formula characters (=, +, -, @) with single quote', () => {
      expect(sanitizeExcelCell('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)")
      expect(sanitizeExcelCell('+12345')).toBe("'+12345")
      expect(sanitizeExcelCell('-500')).toBe("'-500")
      expect(sanitizeExcelCell('@cmd')).toBe("'@cmd")
      expect(sanitizeExcelCell('\tmalicious')).toBe("'\tmalicious")
      expect(sanitizeExcelCell('\rmalicious')).toBe("'\rmalicious")
    })

    it('2. leaves regular strings and numbers intact', () => {
      expect(sanitizeExcelCell('PT Impact Furniture')).toBe('PT Impact Furniture')
      expect(sanitizeExcelCell('SPL-001')).toBe('SPL-001')
      expect(sanitizeExcelCell(150000)).toBe(150000)
      expect(sanitizeExcelCell(null)).toBe(null)
      expect(sanitizeExcelCell(undefined)).toBe(undefined)
    })
  })

  describe('exportToExcel', () => {
    it('3. formats rows and calls XLSX.writeFile without crashing', () => {
      interface SampleRow {
        id: number
        name: string
        price: number
      }

      const columns: ExportColumn<SampleRow>[] = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Nama' },
        {
          key: 'price',
          label: 'Harga',
          formatter: val => `Rp ${Number(val).toLocaleString('id-ID')}`
        }
      ]

      const data: SampleRow[] = [
        { id: 1, name: 'Kursi Jati', price: 250000 },
        { id: 2, name: '=1+1 dangerous', price: 300000 }
      ]

      const filename = 'test-export-temp'
      expect(() => {
        exportToExcel({
          filename,
          title: 'Daftar Sample',
          columns,
          data
        })
      }).not.toThrow()

      if (fs.existsSync(`${filename}.xlsx`)) {
        try {
          fs.unlinkSync(`${filename}.xlsx`)
        } catch {
          // ignore cleanup error
        }
      }
    })
  })

  describe('exportToPdf', () => {
    it('4. builds PDF layout without errors', () => {
      interface SampleRow {
        code: string
        name: string
      }

      const columns: ExportColumn<SampleRow>[] = [
        { key: 'code', label: 'Kode' },
        { key: 'name', label: 'Nama' }
      ]

      const data: SampleRow[] = [
        { code: 'BHN-01', name: 'Kayu Mahoni' },
        { code: 'BHN-02', name: 'Baut 5cm' }
      ]

      expect(() => {
        exportToPdf({
          filename: 'test-report',
          title: 'Laporan Master Data Bahan',
          subtitle: 'Kategori Kayu',
          columns,
          data
        })
      }).not.toThrow()
    })
  })

  describe('generateImportTemplate', () => {
    it('5. builds template with Petunjuk, Template Data, and Referensi sheets', () => {
      const testTemplateDef: ImportTemplateDefinition = {
        sheetName: 'Template Data',
        title: 'Template Data Supplier Test',
        columns: [
          {
            key: 'kode',
            label: 'Kode Supplier',
            required: true,
            type: 'string',
            example: 'SPL-001'
          },
          {
            key: 'nama',
            label: 'Nama Supplier',
            required: true,
            type: 'string',
            example: 'PT Kayu Sejahtera'
          },
          {
            key: 'no_hp',
            label: 'Nomor WhatsApp',
            required: true,
            type: 'string',
            example: '08123456789'
          }
        ],
        referenceSheets: [
          {
            name: 'Daftar Kota',
            headers: ['ID', 'Nama Kota'],
            rows: [
              ['1', 'Kota Semarang'],
              ['2', 'Kota Bandung']
            ]
          }
        ]
      }

      expect(() => {
        generateImportTemplate(testTemplateDef)
      }).not.toThrow()

      const generatedFile = `${testTemplateDef.title.toLowerCase().replace(/\s+/g, '-')}-template.xlsx`
      if (fs.existsSync(generatedFile)) {
        try {
          fs.unlinkSync(generatedFile)
        } catch {
          // ignore cleanup error
        }
      }
    })
  })

  describe('parseAndValidateExcel & All-or-Nothing Rule', () => {
    const testTemplateDef: ImportTemplateDefinition = {
      sheetName: 'Template Data',
      title: 'Validasi',
      columns: [
        { key: 'kode', label: 'Kode', required: true, type: 'string', example: 'KOD-001' },
        { key: 'nama', label: 'Nama', required: true, type: 'string', example: 'Nama Barang' }
      ]
    }

    it('6. rejects non-xlsx files', async () => {
      const invalidFile = new File(['content'], 'sample.txt', { type: 'text/plain' })
      const result = await parseAndValidateExcel(invalidFile, testTemplateDef, raw => ({
        data: raw
      }))

      expect(result.invalidCount).toBeGreaterThan(0)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].message).toContain('.xlsx')
    })

    it('7. parses valid worksheet and passes row mapper', async () => {
      const wb = XLSX.utils.book_new()
      const wsData = [
        ['Kode', 'Nama'],
        ['KOD-001', 'Barang 1'],
        ['KOD-002', 'Barang 2']
      ]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      XLSX.utils.book_append_sheet(wb, ws, 'Template Data')

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as number[]
      const uint8 = new Uint8Array(wbout)
      const excelFile = new File([uint8], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      excelFile.arrayBuffer = async () => uint8.buffer

      const result = await parseAndValidateExcel(
        excelFile,
        testTemplateDef,
        (rawRow, rowNumber) => {
          if (!rawRow['kode']) {
            return { error: `Baris ${rowNumber}: Kode wajib diisi` }
          }
          return { data: { kode: String(rawRow['kode']), nama: String(rawRow['nama']) } }
        }
      )

      expect(result.invalidCount).toBe(0)
      expect(result.totalRows).toBe(2)
      expect(result.validRows.length).toBe(2)
    })

    it('8. detects missing required fields and enforces all-or-nothing rule', async () => {
      const wb = XLSX.utils.book_new()
      const wsData = [
        ['Kode', 'Nama'],
        ['KOD-001', 'Barang 1'],
        ['', 'Barang Tanpa Kode'] // Invalid row
      ]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      XLSX.utils.book_append_sheet(wb, ws, 'Template Data')

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as number[]
      const uint8 = new Uint8Array(wbout)
      const excelFile = new File([uint8], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      excelFile.arrayBuffer = async () => uint8.buffer

      const result = await parseAndValidateExcel(excelFile, testTemplateDef, rawRow => {
        if (!rawRow['kode']) {
          return { error: 'Kode wajib diisi' }
        }
        return { data: rawRow }
      })

      expect(result.invalidCount).toBe(1)
      expect(result.errors.length).toBe(1)
      expect(result.errors[0].rowNumber).toBe(3)
    })

    it('9. detects duplicate codes within the Excel file', async () => {
      const wb = XLSX.utils.book_new()
      const wsData = [
        ['Kode', 'Nama'],
        ['KOD-DUPLIKAT', 'Barang Pertama'],
        ['KOD-DUPLIKAT', 'Barang Kedua'] // Duplicate
      ]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      XLSX.utils.book_append_sheet(wb, ws, 'Template Data')

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as number[]
      const uint8 = new Uint8Array(wbout)
      const excelFile = new File([uint8], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      excelFile.arrayBuffer = async () => uint8.buffer

      const result = await parseAndValidateExcel(excelFile, testTemplateDef, rawRow => ({
        data: rawRow
      }))

      expect(result.invalidCount).toBeGreaterThan(0)
      expect(result.errors.some(e => e.message.includes('terduplikasi'))).toBe(true)
    })
  })
})
