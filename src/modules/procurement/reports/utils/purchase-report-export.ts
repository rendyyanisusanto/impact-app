import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type {
  PurchaseReportType,
  PurchaseReportSummaryTotals
} from '../types/purchase-report.types'
import { formatCurrency } from '@/shared/utils/formatters'

export function sanitizeExcelCell(value: unknown): unknown {
  if (typeof value === 'string') {
    if (/^[=+\-@\t\r]/.test(value) || /^[=+\-@]/.test(value.trim())) {
      return `'${value}`
    }
  }
  return value
}

export function formatDateIndo(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    const parts = dateStr.slice(0, 10).split('-')
    if (parts.length === 3) {
      const year = parts[0]
      const month = Number(parts[1]) - 1
      const day = Number(parts[2])
      const d = new Date(Number(year), month, day)
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    }
    return dateStr
  } catch {
    return dateStr
  }
}

export function getReportTypeLabel(reportType: PurchaseReportType): string {
  switch (reportType) {
    case 'summary':
      return 'Ringkasan Pembelian'
    case 'detail':
      return 'Detail Pembelian'
    case 'supplier':
      return 'Pembelian per Supplier'
    case 'material':
      return 'Pembelian per Bahan Baku'
    case 'status':
      return 'Status Pembelian'
    case 'po_vs_receipt':
      return 'PO vs Penerimaan Barang'
    case 'purchase_vs_payment':
      return 'Pembelian vs Tagihan & Pembayaran'
    default:
      return 'Laporan Pembelian'
  }
}

/**
 * EXPORT EXCEL
 */
export function exportPurchaseReportToExcel(
  reportType: PurchaseReportType,
  items: any[],
  filterInfo?: string,
  summaryTotals?: PurchaseReportSummaryTotals
): void {
  void filterInfo
  const rows: Record<string, unknown>[] = []

  if (reportType === 'summary') {
    items.forEach((item, idx) => {
      rows.push({
        'No': idx + 1,
        'Tanggal PO': formatDateIndo(item.tanggal),
        'Nomor PO': sanitizeExcelCell(item.kode || '-'),
        'Supplier': sanitizeExcelCell(item.supplier_name || '-'),
        'Jumlah Item': item.item_count,
        'Total Qty': item.total_qty,
        'Subtotal (Rp)': Number(item.subtotal) || 0,
        'PPN (Rp)': Number(item.total_ppn) || 0,
        'Total PO (Rp)': Number(item.total) || 0,
        'Status PO': item.status === 1 ? 'Disetujui' : (item.status_aktif === 0 ? 'Dibatalkan' : 'Draft'),
        'Status Transaksi': item.status_transaksi_nama || '-'
      })
    })
    if (summaryTotals) {
      rows.push({
        'No': '',
        'Tanggal PO': 'TOTAL KESELURUHAN',
        'Nomor PO': '',
        'Supplier': `${summaryTotals.total_rows} PO`,
        'Jumlah Item': '',
        'Total Qty': summaryTotals.total_qty_pesan || 0,
        'Subtotal (Rp)': summaryTotals.total_item_subtotal || 0,
        'PPN (Rp)': '',
        'Total PO (Rp)': summaryTotals.total_po_amount || 0,
        'Status PO': '',
        'Status Transaksi': ''
      })
    }
  } else if (reportType === 'detail') {
    items.forEach((item, idx) => {
      rows.push({
        'No': idx + 1,
        'Tanggal PO': formatDateIndo(item.tanggal),
        'Nomor PO': sanitizeExcelCell(item.kode_po || '-'),
        'Supplier': sanitizeExcelCell(item.supplier_name || '-'),
        'Kode Bahan': sanitizeExcelCell(item.kode_bahan || '-'),
        'Nama Bahan': sanitizeExcelCell(item.nama_bahan || '-'),
        'Satuan': item.satuan || '-',
        'Qty Pesan': Number(item.qty) || 0,
        'Harga Satuan (Rp)': Number(item.harga) || 0,
        'Diskon (%)': Number(item.diskon) || 0,
        'Subtotal (Rp)': Number(item.subtotal) || 0,
        'Status PO': item.status_po === 1 ? 'Disetujui' : 'Draft'
      })
    })
    if (summaryTotals) {
      rows.push({
        'No': '',
        'Tanggal PO': 'TOTAL DETAIL',
        'Nomor PO': '',
        'Supplier': '',
        'Kode Bahan': '',
        'Nama Bahan': '',
        'Satuan': '',
        'Qty Pesan': summaryTotals.total_qty_pesan || 0,
        'Harga Satuan (Rp)': '',
        'Diskon (%)': '',
        'Subtotal (Rp)': summaryTotals.total_item_subtotal || 0,
        'Status PO': ''
      })
    }
  } else if (reportType === 'supplier') {
    items.forEach((item, idx) => {
      rows.push({
        'No': idx + 1,
        'Kode Supplier': sanitizeExcelCell(item.kode_supplier || '-'),
        'Nama Supplier': sanitizeExcelCell(item.nama_supplier || '-'),
        'Jumlah PO': Number(item.jumlah_po) || 0,
        'Total Nilai PO (Rp)': Number(item.total_nilai_po) || 0,
        'Total Nilai Diterima (Rp)': Number(item.total_nilai_diterima) || 0,
        'Total Tagihan (Rp)': Number(item.total_tagihan) || 0
      })
    })
    if (summaryTotals) {
      rows.push({
        'No': '',
        'Kode Supplier': 'TOTAL KESELURUHAN',
        'Nama Supplier': '',
        'Jumlah PO': '',
        'Total Nilai PO (Rp)': summaryTotals.total_po_amount || 0,
        'Total Nilai Diterima (Rp)': summaryTotals.total_received_amount || 0,
        'Total Tagihan (Rp)': summaryTotals.total_billed_amount || 0
      })
    }
  } else if (reportType === 'material') {
    items.forEach((item, idx) => {
      rows.push({
        'No': idx + 1,
        'Kode Bahan': sanitizeExcelCell(item.kode_bahan || '-'),
        'Nama Bahan': sanitizeExcelCell(item.nama_bahan || '-'),
        'Satuan': item.satuan || '-',
        'Total Qty Pesan': Number(item.total_qty_pesan) || 0,
        'Total Nilai Pesan (Rp)': Number(item.total_nilai_pesan) || 0,
        'Total Qty Terima': Number(item.total_qty_terima) || 0,
        'Total Nilai Terima (Rp)': Number(item.total_nilai_terima) || 0
      })
    })
    if (summaryTotals) {
      rows.push({
        'No': '',
        'Kode Bahan': 'TOTAL KESELURUHAN',
        'Nama Bahan': '',
        'Satuan': '',
        'Total Qty Pesan': summaryTotals.total_qty_pesan || 0,
        'Total Nilai Pesan (Rp)': summaryTotals.total_po_amount || 0,
        'Total Qty Terima': summaryTotals.total_qty_terima || 0,
        'Total Nilai Terima (Rp)': summaryTotals.total_received_amount || 0
      })
    }
  } else if (reportType === 'status') {
    items.forEach((item, idx) => {
      rows.push({
        'No': idx + 1,
        'Nomor PO': sanitizeExcelCell(item.nomor_po || '-'),
        'Tanggal': formatDateIndo(item.tanggal),
        'Supplier': sanitizeExcelCell(item.supplier_name || '-'),
        'Total PO (Rp)': Number(item.total_po) || 0,
        'Qty Pesan': Number(item.qty_pesan) || 0,
        'Qty Diterima': Number(item.qty_terima) || 0,
        'Sisa Qty': Number(item.sisa_qty) || 0,
        'Status Penerimaan': item.status_penerimaan,
        'Status PO': item.status_po === 1 ? 'Disetujui' : (item.status_aktif === 0 ? 'Dibatalkan' : 'Draft')
      })
    })
    if (summaryTotals) {
      rows.push({
        'No': '',
        'Nomor PO': 'TOTAL KESELURUHAN',
        'Tanggal': '',
        'Supplier': '',
        'Total PO (Rp)': summaryTotals.total_po_amount || 0,
        'Qty Pesan': summaryTotals.total_qty_pesan || 0,
        'Qty Diterima': summaryTotals.total_qty_terima || 0,
        'Sisa Qty': summaryTotals.total_sisa_qty || 0,
        'Status Penerimaan': '',
        'Status PO': ''
      })
    }
  } else if (reportType === 'po_vs_receipt') {
    items.forEach((item, idx) => {
      rows.push({
        'No': idx + 1,
        'Nomor PO': sanitizeExcelCell(item.nomor_po || '-'),
        'Tanggal PO': formatDateIndo(item.tanggal_po),
        'Supplier': sanitizeExcelCell(item.supplier_name || '-'),
        'Kode Bahan': sanitizeExcelCell(item.kode_bahan || '-'),
        'Nama Bahan': sanitizeExcelCell(item.nama_bahan || '-'),
        'Satuan': item.satuan || '-',
        'Qty PO': Number(item.qty_po) || 0,
        'Qty Terima': Number(item.qty_terima) || 0,
        'Sisa Qty': Number(item.sisa_qty) || 0,
        'Persentase (%)': Number(item.persentase) || 0,
        'Status Penerimaan': item.status_penerimaan
      })
    })
    if (summaryTotals) {
      rows.push({
        'No': '',
        'Nomor PO': 'TOTAL KESELURUHAN',
        'Tanggal PO': '',
        'Supplier': '',
        'Kode Bahan': '',
        'Nama Bahan': '',
        'Satuan': '',
        'Qty PO': summaryTotals.total_qty_pesan || 0,
        'Qty Terima': summaryTotals.total_qty_terima || 0,
        'Sisa Qty': summaryTotals.total_sisa_qty || 0,
        'Persentase (%)': '',
        'Status Penerimaan': ''
      })
    }
  } else if (reportType === 'purchase_vs_payment') {
    items.forEach((item, idx) => {
      rows.push({
        'No': idx + 1,
        'Nomor PO': sanitizeExcelCell(item.nomor_po || '-'),
        'Tanggal PO': formatDateIndo(item.tanggal_po),
        'Supplier': sanitizeExcelCell(item.supplier_name || '-'),
        'Nilai PO (Rp)': Number(item.nilai_po) || 0,
        'Nilai Penerimaan (Rp)': Number(item.nilai_penerimaan) || 0,
        'Nomor Tagihan': sanitizeExcelCell(item.nomor_tagihan || '-'),
        'Nilai Tagihan (Rp)': Number(item.nilai_tagihan) || 0,
        'Nilai Dibayar (Rp)': Number(item.nilai_dibayar) || 0,
        'Sisa Tagihan (Rp)': Number(item.sisa_tagihan) || 0,
        'Status Pembayaran': item.status_pembayaran
      })
    })
    if (summaryTotals) {
      rows.push({
        'No': '',
        'Nomor PO': 'TOTAL KESELURUHAN',
        'Tanggal PO': '',
        'Supplier': '',
        'Nilai PO (Rp)': summaryTotals.total_po_amount || 0,
        'Nilai Penerimaan (Rp)': summaryTotals.total_received_amount || 0,
        'Nomor Tagihan': '',
        'Nilai Tagihan (Rp)': summaryTotals.total_billed_amount || 0,
        'Nilai Dibayar (Rp)': summaryTotals.total_paid_amount || 0,
        'Sisa Tagihan (Rp)': summaryTotals.total_remaining_bill || 0,
        'Status Pembayaran': ''
      })
    }
  }

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan')

  // Auto-size columns
  if (rows.length > 0) {
    const colKeys = Object.keys(rows[0])
    worksheet['!cols'] = colKeys.map(k => {
      const maxLen = Math.max(k.length, ...rows.map(r => String(r[k] ?? '').length))
      return { wch: Math.min(Math.max(maxLen + 3, 10), 40) }
    })
  }

  const dateNow = new Date().toISOString().slice(0, 10)
  const filename = `Laporan_Pembelian_${reportType}_${dateNow}.xlsx`
  XLSX.writeFile(workbook, filename)
}

/**
 * EXPORT PDF
 */
export function exportPurchaseReportToPdf(
  reportType: PurchaseReportType,
  items: any[],
  filterInfo?: string,
  summaryTotals?: PurchaseReportSummaryTotals
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const title = `LAPORAN ${getReportTypeLabel(reportType).toUpperCase()}`
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  // 1. Header & Company
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(15, 118, 110) // Primary Teal #0F766E
  doc.text('IMPACT FURNITURE', 14, 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text('Enterprise Management Information System', 14, 18)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(30, 41, 59)
  doc.text(title, 14, 25)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text(`Dicetak: ${dateStr} ${filterInfo ? `| ${filterInfo}` : ''}`, 14, 29)

  doc.setDrawColor(203, 213, 225)
  doc.line(14, 32, pageWidth - 14, 32)

  // 2. Table Definition per report type
  let head: string[][] = []
  let body: (string | number)[][] = []
  let foot: (string | number)[][] = []
  let columnStyles: Record<number, any> = {}

  if (reportType === 'summary') {
    head = [['No', 'Tanggal', 'Nomor PO', 'Supplier', 'Item', 'Qty', 'Subtotal (Rp)', 'PPN (Rp)', 'Total PO (Rp)', 'Status']]
    columnStyles = {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 22 },
      2: { cellWidth: 32 },
      3: { cellWidth: 40 },
      4: { cellWidth: 14, halign: 'right' },
      5: { cellWidth: 16, halign: 'right' },
      6: { cellWidth: 30, halign: 'right' },
      7: { cellWidth: 24, halign: 'right' },
      8: { cellWidth: 32, halign: 'right' },
      9: { cellWidth: 22, halign: 'center' }
    }
    body = items.map((it, idx) => [
      idx + 1,
      formatDateIndo(it.tanggal),
      it.kode || '-',
      it.supplier_name || '-',
      it.item_count,
      it.total_qty,
      formatCurrency(it.subtotal),
      formatCurrency(it.total_ppn),
      formatCurrency(it.total),
      it.status === 1 ? 'Disetujui' : (it.status_aktif === 0 ? 'Dibatalkan' : 'Draft')
    ])
    if (summaryTotals) {
      foot = [[
        '',
        'TOTAL',
        '',
        `${summaryTotals.total_rows} PO`,
        '',
        summaryTotals.total_qty_pesan || 0,
        formatCurrency(summaryTotals.total_item_subtotal || 0),
        '',
        formatCurrency(summaryTotals.total_po_amount || 0),
        ''
      ]]
    }
  } else if (reportType === 'detail') {
    head = [['No', 'Tanggal', 'Nomor PO', 'Supplier', 'Kode Bahan', 'Nama Bahan', 'Satuan', 'Qty', 'Harga (Rp)', 'Diskon', 'Subtotal (Rp)']]
    columnStyles = {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 20 },
      2: { cellWidth: 28 },
      3: { cellWidth: 35 },
      4: { cellWidth: 24 },
      5: { cellWidth: 45 },
      6: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 14, halign: 'right' },
      8: { cellWidth: 24, halign: 'right' },
      9: { cellWidth: 14, halign: 'right' },
      10: { cellWidth: 28, halign: 'right' }
    }
    body = items.map((it, idx) => [
      idx + 1,
      formatDateIndo(it.tanggal),
      it.kode_po || '-',
      it.supplier_name || '-',
      it.kode_bahan || '-',
      it.nama_bahan || '-',
      it.satuan || '-',
      it.qty,
      formatCurrency(it.harga),
      `${it.diskon}%`,
      formatCurrency(it.subtotal)
    ])
    if (summaryTotals) {
      foot = [[
        '',
        'TOTAL',
        '',
        '',
        '',
        '',
        '',
        summaryTotals.total_qty_pesan || 0,
        '',
        '',
        formatCurrency(summaryTotals.total_item_subtotal || 0)
      ]]
    }
  } else if (reportType === 'supplier') {
    head = [['No', 'Kode Supplier', 'Nama Supplier', 'Jumlah PO', 'Total Nilai PO (Rp)', 'Total Diterima (Rp)', 'Total Tagihan (Rp)']]
    columnStyles = {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 35 },
      2: { cellWidth: 65 },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 45, halign: 'right' },
      5: { cellWidth: 45, halign: 'right' },
      6: { cellWidth: 42, halign: 'right' }
    }
    body = items.map((it, idx) => [
      idx + 1,
      it.kode_supplier || '-',
      it.nama_supplier || '-',
      it.jumlah_po,
      formatCurrency(it.total_nilai_po),
      formatCurrency(it.total_nilai_diterima),
      formatCurrency(it.total_tagihan)
    ])
    if (summaryTotals) {
      foot = [[
        '',
        'TOTAL',
        '',
        '',
        formatCurrency(summaryTotals.total_po_amount || 0),
        formatCurrency(summaryTotals.total_received_amount || 0),
        formatCurrency(summaryTotals.total_billed_amount || 0)
      ]]
    }
  } else if (reportType === 'material') {
    head = [['No', 'Kode Bahan', 'Nama Bahan', 'Satuan', 'Qty Pesan', 'Nilai Pesan (Rp)', 'Qty Terima', 'Nilai Terima (Rp)']]
    columnStyles = {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 30 },
      2: { cellWidth: 65 },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 40, halign: 'right' },
      6: { cellWidth: 25, halign: 'right' },
      7: { cellWidth: 40, halign: 'right' }
    }
    body = items.map((it, idx) => [
      idx + 1,
      it.kode_bahan || '-',
      it.nama_bahan || '-',
      it.satuan || '-',
      it.total_qty_pesan,
      formatCurrency(it.total_nilai_pesan),
      it.total_qty_terima,
      formatCurrency(it.total_nilai_terima)
    ])
    if (summaryTotals) {
      foot = [[
        '',
        'TOTAL',
        '',
        '',
        summaryTotals.total_qty_pesan || 0,
        formatCurrency(summaryTotals.total_po_amount || 0),
        summaryTotals.total_qty_terima || 0,
        formatCurrency(summaryTotals.total_received_amount || 0)
      ]]
    }
  } else if (reportType === 'status') {
    head = [['No', 'Nomor PO', 'Tanggal', 'Supplier', 'Total PO (Rp)', 'Qty Pesan', 'Qty Terima', 'Sisa Qty', 'Status Terima', 'Status PO']]
    columnStyles = {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 32 },
      2: { cellWidth: 24 },
      3: { cellWidth: 45 },
      4: { cellWidth: 35, halign: 'right' },
      5: { cellWidth: 20, halign: 'right' },
      6: { cellWidth: 20, halign: 'right' },
      7: { cellWidth: 20, halign: 'right' },
      8: { cellWidth: 28, halign: 'center' },
      9: { cellWidth: 24, halign: 'center' }
    }
    body = items.map((it, idx) => [
      idx + 1,
      it.nomor_po || '-',
      formatDateIndo(it.tanggal),
      it.supplier_name || '-',
      formatCurrency(it.total_po),
      it.qty_pesan,
      it.qty_terima,
      it.sisa_qty,
      it.status_penerimaan,
      it.status_po === 1 ? 'Disetujui' : (it.status_aktif === 0 ? 'Dibatalkan' : 'Draft')
    ])
    if (summaryTotals) {
      foot = [[
        '',
        'TOTAL',
        '',
        '',
        formatCurrency(summaryTotals.total_po_amount || 0),
        summaryTotals.total_qty_pesan || 0,
        summaryTotals.total_qty_terima || 0,
        summaryTotals.total_sisa_qty || 0,
        '',
        ''
      ]]
    }
  } else if (reportType === 'po_vs_receipt') {
    head = [['No', 'Nomor PO', 'Tanggal', 'Supplier', 'Bahan', 'Satuan', 'Qty PO', 'Qty Terima', 'Sisa Qty', '%', 'Status']]
    columnStyles = {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 30 },
      2: { cellWidth: 22 },
      3: { cellWidth: 40 },
      4: { cellWidth: 55 },
      5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 18, halign: 'right' },
      7: { cellWidth: 18, halign: 'right' },
      8: { cellWidth: 18, halign: 'right' },
      9: { cellWidth: 15, halign: 'right' },
      10: { cellWidth: 26, halign: 'center' }
    }
    body = items.map((it, idx) => [
      idx + 1,
      it.nomor_po || '-',
      formatDateIndo(it.tanggal_po),
      it.supplier_name || '-',
      `${it.kode_bahan ? it.kode_bahan + ' - ' : ''}${it.nama_bahan || '-'}`,
      it.satuan || '-',
      it.qty_po,
      it.qty_terima,
      it.sisa_qty,
      `${it.persentase}%`,
      it.status_penerimaan
    ])
    if (summaryTotals) {
      foot = [[
        '',
        'TOTAL',
        '',
        '',
        '',
        '',
        summaryTotals.total_qty_pesan || 0,
        summaryTotals.total_qty_terima || 0,
        summaryTotals.total_sisa_qty || 0,
        '',
        ''
      ]]
    }
  } else if (reportType === 'purchase_vs_payment') {
    head = [['No', 'Nomor PO', 'Tanggal', 'Supplier', 'Nilai PO (Rp)', 'Nilai Terima (Rp)', 'No. Tagihan', 'Nilai Tagihan (Rp)', 'Dibayar (Rp)', 'Sisa (Rp)', 'Status']]
    columnStyles = {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 26 },
      2: { cellWidth: 20 },
      3: { cellWidth: 35 },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 28, halign: 'right' },
      6: { cellWidth: 25 },
      7: { cellWidth: 28, halign: 'right' },
      8: { cellWidth: 28, halign: 'right' },
      9: { cellWidth: 25, halign: 'right' },
      10: { cellWidth: 22, halign: 'center' }
    }
    body = items.map((it, idx) => [
      idx + 1,
      it.nomor_po || '-',
      formatDateIndo(it.tanggal_po),
      it.supplier_name || '-',
      formatCurrency(it.nilai_po),
      formatCurrency(it.nilai_penerimaan),
      it.nomor_tagihan || '-',
      formatCurrency(it.nilai_tagihan),
      formatCurrency(it.nilai_dibayar),
      formatCurrency(it.sisa_tagihan),
      it.status_pembayaran
    ])
    if (summaryTotals) {
      foot = [[
        '',
        'TOTAL',
        '',
        '',
        formatCurrency(summaryTotals.total_po_amount || 0),
        formatCurrency(summaryTotals.total_received_amount || 0),
        '',
        formatCurrency(summaryTotals.total_billed_amount || 0),
        formatCurrency(summaryTotals.total_paid_amount || 0),
        formatCurrency(summaryTotals.total_remaining_bill || 0),
        ''
      ]]
    }
  }

  autoTable(doc, {
    startY: 35,
    head,
    body,
    foot: foot.length > 0 ? foot : undefined,
    columnStyles,
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      font: 'helvetica',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [51, 65, 85],
      fontStyle: 'bold',
      lineColor: [203, 213, 225],
      lineWidth: 0.2
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14, bottom: 15 },
    didDrawPage: (data) => {
      // Footer page number
      const pageCount = (doc.internal as any).getNumberOfPages()
      doc.setFontSize(7.5)
      doc.setTextColor(148, 163, 184)
      doc.text(
        `Halaman ${data.pageNumber} dari ${pageCount}`,
        pageWidth - 30,
        doc.internal.pageSize.getHeight() - 8
      )
    }
  })

  const dateNow = new Date().toISOString().slice(0, 10)
  doc.save(`Laporan_Pembelian_${reportType}_${dateNow}.pdf`)
}
