import * as XLSX from 'xlsx'
import { exportToExcel } from '@/shared/utils/excel-export'
import { exportToPdf } from '@/shared/utils/pdf-export'
import type { CoaAccount, CoaTreeNodeGroup, CoaParent } from '../types/coa.types'

export function exportCoaTableToExcel(
  accounts: CoaAccount[],
  _filterInfo?: string,
  _username?: string
): void {
  const dateStr = new Date().toISOString().slice(0, 10)
  exportToExcel({
    filename: `Chart_of_Accounts_${dateStr}`,
    title: 'Chart of Accounts (COA)',
    columns: [
      { key: 'no_ref', label: 'Kode Rekening' },
      { key: 'nama', label: 'Nama Rekening' },
      { key: 'coa_name', label: 'Kelompok' },
      { key: 'induk_nama', label: 'Induk Akun' },
      {
        key: 'saldo_normal',
        label: 'Saldo Normal',
        formatter: (val) => (val === 'D' ? 'Debit (D)' : 'Kredit (K)')
      },
      {
        key: 'is_active',
        label: 'Status',
        formatter: (val) => (val === 1 ? 'Aktif' : 'Nonaktif')
      },
      {
        key: 'is_used',
        label: 'Digunakan',
        formatter: (val, item: any) =>
          val ? `Terpakai (${item.transaction_count || 0} transaksi)` : 'Belum Digunakan'
      }
    ],
    data: accounts
  })
}

export function exportCoaTreeToExcel(
  tree: CoaTreeNodeGroup[],
  _filterInfo?: string
): void {
  const rows: any[] = []
  let no = 1

  for (const group of tree) {
    rows.push({
      Tipe: 'KELOMPOK',
      'Kode Rekening': `[${group.id}]`,
      'Nama Rekening': group.name.toUpperCase(),
      Kelompok: group.name,
      'Induk Akun': '-',
      'Saldo Normal': '-',
      Status: group.is_active === 1 ? 'Aktif' : 'Nonaktif',
      'Status Transaksi': `${group.account_count} Rekening`
    })

    for (const parent of group.parents) {
      rows.push({
        Tipe: 'INDUK',
        'Kode Rekening': `  ${parent.no_akun}`,
        'Nama Rekening': `  ${parent.nama}`,
        Kelompok: group.name,
        'Induk Akun': parent.nama,
        'Saldo Normal': '-',
        Status: parent.is_active === 1 ? 'Aktif' : 'Nonaktif',
        'Status Transaksi': `${parent.account_count} Rekening`
      })

      for (const acct of parent.accounts) {
        rows.push({
          Tipe: 'REKENING',
          'Kode Rekening': `    ${acct.no_ref}`,
          'Nama Rekening': `    ${acct.nama}`,
          Kelompok: group.name,
          'Induk Akun': parent.nama,
          'Saldo Normal': acct.saldo_normal === 'D' ? 'Debit' : 'Kredit',
          Status: acct.is_active === 1 ? 'Aktif' : 'Nonaktif',
          'Status Transaksi': acct.is_used ? `Terpakai (${acct.transaction_count} tx)` : 'Belum Digunakan'
        })
        no++
      }
    }
  }

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Hierarki COA')

  worksheet['!cols'] = [
    { wch: 12 },
    { wch: 18 },
    { wch: 35 },
    { wch: 20 },
    { wch: 25 },
    { wch: 15 },
    { wch: 12 },
    { wch: 22 }
  ]

  const dateStr = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(workbook, `COA_Hierarki_${dateStr}.xlsx`)
}

export function exportCoaToPdfFormat(
  accounts: CoaAccount[],
  filterInfo?: string
): void {
  const dateStr = new Date().toISOString().slice(0, 10)
  exportToPdf({
    filename: `Chart_of_Accounts_${dateStr}`,
    title: 'Master Chart of Account (COA)',
    subtitle: 'Daftar Rekening Akuntansi dan Klasifikasi Keuangan',
    filterInfo: filterInfo || 'Semua Data Rekening',
    orientation: 'landscape',
    columns: [
      { key: 'no_ref', label: 'Kode', width: 25 },
      { key: 'nama', label: 'Nama Rekening', width: 60 },
      { key: 'coa_name', label: 'Kelompok', width: 40 },
      { key: 'induk_nama', label: 'Induk Akun', width: 45 },
      {
        key: 'saldo_normal',
        label: 'Saldo Normal',
        width: 30,
        formatter: (val) => (val === 'D' ? 'Debit (D)' : 'Kredit (K)')
      },
      {
        key: 'is_active',
        label: 'Status',
        width: 25,
        formatter: (val) => (val === 1 ? 'Aktif' : 'Nonaktif')
      },
      {
        key: 'is_used',
        label: 'Penggunaan',
        width: 40,
        formatter: (val, item: any) =>
          val ? `Terpakai (${item.transaction_count} tx)` : 'Belum Digunakan'
      }
    ],
    data: accounts
  })
}

/**
 * Membuat dan mendownload template Excel untuk import akun baru
 */
export function generateCoaImportTemplate(parents: CoaParent[]): void {
  const templateRows = [
    {
      'Kode Rekening (Wajib)': '1109',
      'Nama Rekening (Wajib)': 'Kas Kecil Kantor Cabang',
      'Nomor Induk Akun (Wajib)': 11,
      'Nama Induk Akun (Opsional)': 'Aktiva Lancar',
      'Saldo Normal (D/K - Wajib)': 'D'
    },
    {
      'Kode Rekening (Wajib)': '2104',
      'Nama Rekening (Wajib)': 'Utang Biaya Operasional',
      'Nomor Induk Akun (Wajib)': 21,
      'Nama Induk Akun (Opsional)': 'Kewajiban Lancar',
      'Saldo Normal (D/K - Wajib)': 'K'
    },
    {
      'Kode Rekening (Wajib)': '5108',
      'Nama Rekening (Wajib)': 'Beban Internet & Cloud',
      'Nomor Induk Akun (Wajib)': 51,
      'Nama Induk Akun (Opsional)': 'Biaya Administrasi',
      'Saldo Normal (D/K - Wajib)': 'D'
    }
  ]

  const worksheet = XLSX.utils.json_to_sheet(templateRows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Import Akun')

  // Sheet referensi induk akun yang valid
  const refRows = parents.map(p => ({
    'Nomor Induk': p.no_akun,
    'Nama Induk': p.nama,
    'Kelompok (COA)': p.coa_name || '-'
  }))
  const refSheet = XLSX.utils.json_to_sheet(refRows)
  XLSX.utils.book_append_sheet(workbook, refSheet, 'Daftar Induk Akun Valid')

  worksheet['!cols'] = [
    { wch: 25 },
    { wch: 35 },
    { wch: 25 },
    { wch: 28 },
    { wch: 28 }
  ]
  refSheet['!cols'] = [
    { wch: 15 },
    { wch: 30 },
    { wch: 25 }
  ]

  XLSX.writeFile(workbook, 'Template_Import_COA_Impact.xlsx')
}
