import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { DeliveryNoteListItem } from '../types/delivery-note.types'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'

/**
 * Exports Delivery Notes list to Excel (.xlsx) file.
 */
export function exportDeliveryNoteListExcel(items: DeliveryNoteListItem[]): void {
  const rows = items.map((item, index) => ({
    No: index + 1,
    Tanggal: formatDate(item.tanggal),
    'No. Surat Jalan': item.kode,
    'No. Sales Order': item.so_kode,
    Customer: item.customer_nama,
    Keterangan: item.keterangan || '-',
    'QTY Pemesanan': item.qty_pemesanan,
    'QTY Pengiriman': item.qty_pengiriman,
    'Total Pembelian': item.total_pembelian,
    'Status Pengiriman': item.status_kirim_label,
    'Bukti Pengiriman': item.has_bukti ? 'Ada' : 'Belum Ada',
    'Status Dokumen': item.status_dokumen_label,
    'Nama Pengirim': item.nama_pengirim || '-'
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Surat Jalan')

  const filename = `Daftar_Surat_Jalan_${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(workbook, filename)
}

/**
 * Exports Delivery Notes list to PDF document.
 */
export function exportDeliveryNoteListPdf(items: DeliveryNoteListItem[]): void {
  const doc = new jsPDF('landscape')

  doc.setFontSize(14)
  doc.text('DAFTAR SURAT JALAN & PENGIRIMAN', 14, 15)
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(
    `Tanggal Cetak: ${formatDate(new Date().toISOString())} | Total Data: ${items.length}`,
    14,
    22
  )

  const head = [
    [
      'No',
      'Tanggal',
      'No. SJ',
      'No. SO',
      'Customer',
      'Keterangan',
      'QTY Pesan',
      'QTY Kirim',
      'Total SO',
      'Status Kirim',
      'Status Dokumen'
    ]
  ]

  const body = items.map((item, index) => [
    index + 1,
    formatDate(item.tanggal),
    item.kode,
    item.so_kode,
    item.customer_nama,
    item.keterangan || '-',
    item.qty_pemesanan,
    item.qty_pengiriman,
    formatCurrency(item.total_pembelian),
    item.status_kirim_label,
    item.status_dokumen_label
  ])

  autoTable(doc, {
    head,
    body,
    startY: 28,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 }
  })

  const filename = `Daftar_Surat_Jalan_${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}
