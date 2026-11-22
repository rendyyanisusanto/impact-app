import { exportToExcel } from '@/shared/utils/excel-export'
import { exportToPdf } from '@/shared/utils/pdf-export'
import type { OtherExpenseHeader } from '../types/other-expense.types'
import { formatCurrency } from '@/shared/utils/formatters'

export function exportOtherExpenseListToExcel(
  items: OtherExpenseHeader[],
  filterInfo?: string
): void {
  const dateStr = new Date().toISOString().slice(0, 10)
  exportToExcel({
    filename: `Pengeluaran_Lain_${dateStr}`,
    title: 'Daftar Pengeluaran Operasional (Pengeluaran Lain)',
    filterInfo,
    columns: [
      { key: 'trans_code', label: 'Kode Pengeluaran' },
      { key: 'tanggal', label: 'Tanggal' },
      { key: 'keterangan', label: 'Keterangan' },
      {
        key: 'nama_akun_beban',
        label: 'Akun Beban',
        formatter: (val, item: any) => `${item.kode_akun_beban || '-'} - ${val || '-'}`
      },
      {
        key: 'nama_akun_kas',
        label: 'Sumber Dana (Kas/Bank)',
        formatter: (val, item: any) => `${item.kode_akun_kas || '-'} - ${val || '-'}`
      },
      {
        key: 'total',
        label: 'Total Nominal (Rp)',
        formatter: (val) => String(formatCurrency(Number(val) || 0))
      },
      { key: 'status', label: 'Status' },
      {
        key: 'payment_method',
        label: 'Metode Pembayaran',
        formatter: (val) => String(val || '-')
      },
      {
        key: 'creator_name',
        label: 'Dibuat Oleh',
        formatter: (val) => String(val || '-')
      },
      {
        key: 'poster_name',
        label: 'Diposting Oleh',
        formatter: (val) => String(val || '-')
      },
      {
        key: 'posted_at',
        label: 'Tanggal Posting',
        formatter: (val) => (val ? new Date(String(val)).toLocaleDateString('id-ID') : '-')
      }
    ],
    data: items
  })
}

export function exportOtherExpenseListToPdf(
  items: OtherExpenseHeader[],
  filterInfo?: string
): void {
  const dateStr = new Date().toISOString().slice(0, 10)
  exportToPdf({
    filename: `Pengeluaran_Lain_${dateStr}`,
    title: 'LAPORAN DAFTAR PENGELUARAN OPERASIONAL',
    subtitle: 'Modul Keuangan — Pengeluaran Lain & Kas/Bank',
    filterInfo,
    columns: [
      { key: 'trans_code', label: 'Kode', width: 25 },
      { key: 'tanggal', label: 'Tanggal', width: 20 },
      { key: 'keterangan', label: 'Keterangan', width: 40 },
      {
        key: 'nama_akun_beban',
        label: 'Akun Beban',
        width: 30,
        formatter: (val) => String(val || '-')
      },
      {
        key: 'nama_akun_kas',
        label: 'Sumber Dana',
        width: 25,
        formatter: (val) => String(val || '-')
      },
      {
        key: 'total',
        label: 'Nominal',
        width: 25,
        align: 'right',
        formatter: (val) => formatCurrency(Number(val) || 0)
      },
      { key: 'status', label: 'Status', width: 18 }
    ],
    data: items
  })
}
