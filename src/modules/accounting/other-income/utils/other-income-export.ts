import { exportToExcel } from '@/shared/utils/excel-export'
import { exportToPdf } from '@/shared/utils/pdf-export'
import type { OtherIncomeHeader } from '../types/other-income.types'
import { formatCurrency } from '@/shared/utils/formatters'

export function exportOtherIncomeListToExcel(
  items: OtherIncomeHeader[],
  filterInfo?: string
): void {
  const dateStr = new Date().toISOString().slice(0, 10)
  exportToExcel({
    filename: `Pemasukan_Lain_${dateStr}`,
    title: 'Daftar Penerimaan Kas/Bank (Pemasukan Lain)',
    filterInfo,
    columns: [
      { key: 'trans_code', label: 'Kode Pemasukan' },
      { key: 'tanggal', label: 'Tanggal' },
      { key: 'keterangan', label: 'Keterangan' },
      {
        key: 'received_from',
        label: 'Diterima Dari',
        formatter: (val) => String(val || '-')
      },
      {
        key: 'nama_akun_kas',
        label: 'Kas/Bank Penerima',
        formatter: (val, item: any) => `${item.kode_akun_kas || '-'} - ${val || '-'}`
      },
      {
        key: 'nama_akun_sumber',
        label: 'Akun Sumber / Pendapatan',
        formatter: (val, item: any) => `${item.kode_akun_sumber || '-'} - ${val || '-'}`
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

export function exportOtherIncomeListToPdf(
  items: OtherIncomeHeader[],
  filterInfo?: string
): void {
  const dateStr = new Date().toISOString().slice(0, 10)
  exportToPdf({
    filename: `Pemasukan_Lain_${dateStr}`,
    title: 'LAPORAN DAFTAR PENERIMAAN KAS/BANK',
    subtitle: 'Modul Keuangan — Pemasukan Lain & Penerimaan Kas/Bank Non-Penjualan',
    filterInfo,
    columns: [
      { key: 'trans_code', label: 'Kode', width: 25 },
      { key: 'tanggal', label: 'Tanggal', width: 20 },
      { key: 'keterangan', label: 'Keterangan', width: 35 },
      {
        key: 'received_from',
        label: 'Diterima Dari',
        width: 25,
        formatter: (val) => String(val || '-')
      },
      {
        key: 'nama_akun_kas',
        label: 'Kas/Bank Penerima',
        width: 25,
        formatter: (val) => String(val || '-')
      },
      {
        key: 'nama_akun_sumber',
        label: 'Akun Sumber',
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
