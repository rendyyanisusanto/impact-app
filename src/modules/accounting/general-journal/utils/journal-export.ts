import { exportToExcel } from '@/shared/utils/excel-export'
import { exportToPdf } from '@/shared/utils/pdf-export'
import type { JournalHeader } from '../types/journal.types'
import { formatCurrency } from '@/shared/utils/formatters'

export function exportJournalListToExcel(
  items: JournalHeader[],
  filterInfo?: string
): void {
  const dateStr = new Date().toISOString().slice(0, 10)
  exportToExcel({
    filename: `Jurnal_Umum_${dateStr}`,
    title: 'Daftar Jurnal Umum',
    filterInfo,
    columns: [
      { key: 'journal_number', label: 'Nomor Jurnal' },
      { key: 'journal_date', label: 'Tanggal Jurnal' },
      { key: 'description', label: 'Keterangan' },
      {
        key: 'reference_number',
        label: 'Referensi',
        formatter: (val) => (val ? String(val) : '-')
      },
      {
        key: 'source_type',
        label: 'Sumber',
        formatter: (val, item: any) =>
          item.is_legacy ? 'Otomatis (Legacy)' : val === 'MANUAL' ? 'Manual' : 'Otomatis'
      },
      {
        key: 'total_debit',
        label: 'Total Debit (Rp)',
        formatter: (val) => String(formatCurrency(Number(val) || 0))
      },
      {
        key: 'total_credit',
        label: 'Total Kredit (Rp)',
        formatter: (val) => String(formatCurrency(Number(val) || 0))
      },
      { key: 'status', label: 'Status' },
      {
        key: 'creator_name',
        label: 'Dibuat Oleh',
        formatter: (val) => (val ? String(val) : '-')
      }
    ],
    data: items
  })
}

export function exportJournalListToPdf(
  items: JournalHeader[],
  filterInfo?: string
): void {
  const dateStr = new Date().toISOString().slice(0, 10)
  exportToPdf({
    filename: `Jurnal_Umum_${dateStr}`,
    title: 'LAPORAN DAFTAR JURNAL UMUM',
    subtitle: 'Pencatatan Transaksi Keuangan Debit & Kredit',
    filterInfo,
    orientation: 'landscape',
    columns: [
      { key: 'journal_number', label: 'No Jurnal' },
      { key: 'journal_date', label: 'Tanggal' },
      { key: 'description', label: 'Keterangan' },
      {
        key: 'reference_number',
        label: 'Referensi',
        formatter: (val) => (val ? String(val) : '-')
      },
      {
        key: 'source_type',
        label: 'Sumber',
        formatter: (val, item: any) => (item.is_legacy ? 'Otomatis' : val === 'MANUAL' ? 'Manual' : 'Otomatis')
      },
      {
        key: 'total_debit',
        label: 'Debit (Rp)',
        formatter: (val) => formatCurrency(Number(val) || 0)
      },
      {
        key: 'total_credit',
        label: 'Kredit (Rp)',
        formatter: (val) => formatCurrency(Number(val) || 0)
      },
      { key: 'status', label: 'Status' }
    ],
    data: items
  })
}
