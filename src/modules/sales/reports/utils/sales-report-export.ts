import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type {
  SalesReportType,
  SalesReportSummaryTotals
} from '../types/sales-report.types'
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

export function getReportTypeLabel(reportType: SalesReportType): string {
  switch (reportType) {
    case 'summary':
      return 'Ringkasan Penjualan'
    case 'detail':
      return 'Detail Penjualan'
    case 'customer':
      return 'Penjualan per Customer'
    case 'product':
      return 'Penjualan per Produk'
    case 'status':
      return 'Status Sales Order'
    case 'so_vs_delivery':
      return 'Penjualan vs Pengiriman'
    case 'invoice':
      return 'Invoice Penjualan'
    case 'payment_receivable':
      return 'Pembayaran & Piutang'
    default:
      return 'Laporan Penjualan'
  }
}

/**
 * EXPORT EXCEL
 */
export function exportSalesReportToExcel(
  reportType: SalesReportType,
  items: any[],
  filterInfo?: string,
  summaryTotals?: SalesReportSummaryTotals
): void {
  void filterInfo
  const rows: Record<string, unknown>[] = []

  if (reportType === 'summary') {
    items.forEach((item, idx) => {
      rows.push({
        'No': idx + 1,
        'Tanggal SO': formatDateIndo(item.tanggal),
        'Nomor SO': sanitizeExcelCell(item.kode || '-'),
        'Customer': sanitizeExcelCell(item.customer_name || '-'),
        'Jumlah Item': item.item_count,
        'Total Qty': item.total_qty,
        'Subtotal (Rp)': Number(item.subtotal) || 0,
        'Diskon (Rp)': Number(item.diskon) || 0,
        'PPN (Rp)': Number(item.total_ppn) || 0,
        'Total SO (Rp)': Number(item.total) || 0,
        'Status SO': item.status === 1 ? 'Disetujui' : (item.status_aktif === 0 ? 'Dibatalkan' : 'Draft'),
        'Tipe Order': item.order_type || '-'
      })
    })
    if (summaryTotals) {
      rows.push({
        'No': '',
        'Tanggal SO': 'TOTAL KESELURUHAN',
        'Nomor SO': '',
        'Customer': `${summaryTotals.total_rows} SO`,
        'Jumlah Item': '',
        'Total Qty': summaryTotals.total_qty || 0,
        'Subtotal (Rp)': summaryTotals.total_subtotal || 0,
        'Diskon (Rp)': summaryTotals.total_diskon || 0,
        'PPN (Rp)': summaryTotals.total_ppn || 0,
        'Total SO (Rp)': summaryTotals.total_amount || 0,
        'Status SO': '',
        'Tipe Order': ''
      })
    }
  } else if (reportType === 'detail') {
    items.forEach((item, idx) => {
      rows.push({
        'No': idx + 1,
        'Tanggal SO': formatDateIndo(item.tanggal),
        'Nomor SO': sanitizeExcelCell(item.kode_so || '-'),
        'Customer': sanitizeExcelCell(item.customer_name || '-'),
        'Kode Produk': sanitizeExcelCell(item.kode_produk || '-'),
        'Nama Produk': sanitizeExcelCell(item.nama_produk || '-'),
        'Satuan': item.satuan || '-',
        'Qty Pesan': Number(item.qty) || 0,
        'Harga Satuan (Rp)': Number(item.harga) || 0,
        'Diskon (%)': Number(item.diskon) || 0,
        'Subtotal (Rp)': Number(item.subtotal) || 0,
        'Status SO': item.status_so === 1 ? 'Disetujui' : 'Draft'
      })
    })
    if (summaryTotals) {
      rows.push({
        'No': '',
        'Tanggal SO': 'TOTAL KESELURUHAN',
        'Nomor SO': '',
        'Customer': `${summaryTotals.total_rows} Baris`,
        'Kode Produk': '',
        'Nama Produk': '',
        'Satuan': '',
        'Qty Pesan': summaryTotals.total_qty || 0,
        'Harga Satuan (Rp)': '',
        'Diskon (%)': '',
        'Subtotal (Rp)': summaryTotals.total_subtotal || 0,
        'Status SO': ''
      })
    }
  } else if (reportType === 'customer') {
    items.forEach((item, idx) => {
      rows.push({
        'No': idx + 1,
        'Kode Customer': sanitizeExcelCell(item.kode_customer || '-'),
        'Nama Customer': sanitizeExcelCell(item.nama_customer || '-'),
        'Jumlah SO': Number(item.jumlah_so) || 0,
        'Total Qty Produk': Number(item.total_qty) || 0,
        'Subtotal Pesanan (Rp)': Number(item.subtotal_pesanan) || 0,
        'Total Diskon (Rp)': Number(item.total_diskon) || 0,
        'Total PPN (Rp)': Number(item.total_ppn) || 0,
        'Total Nilai SO (Rp)': Number(item.total_nilai_so) || 0
      })
    })
    if (summaryTotals) {
      rows.push({
        'No': '',
        'Kode Customer': 'TOTAL KESELURUHAN',
        'Nama Customer': `${summaryTotals.total_rows} Customer`,
        'Jumlah SO': '',
        'Total Qty Produk': '',
        'Subtotal Pesanan (Rp)': summaryTotals.total_subtotal || 0,
        'Total Diskon (Rp)': summaryTotals.total_diskon || 0,
        'Total PPN (Rp)': summaryTotals.total_ppn || 0,
        'Total Nilai SO (Rp)': summaryTotals.total_amount || 0
      })
    }
  } else if (reportType === 'product') {
    items.forEach((item, idx) => {
      rows.push({
        'No': idx + 1,
        'Kode Produk': sanitizeExcelCell(item.kode_produk || '-'),
        'Nama Produk': sanitizeExcelCell(item.nama_produk || '-'),
        'Satuan': item.satuan || '-',
        'Jumlah SO': Number(item.jumlah_so) || 0,
        'Total Qty Dipesan': Number(item.total_qty_dipesan) || 0,
        'Total Penjualan (Rp)': Number(item.total_nilai_penjualan) || 0,
        'Harga Rata-rata (Rp)': Number(item.harga_rata_rata) || 0
      })
    })
    if (summaryTotals) {
      rows.push({
        'No': '',
        'Kode Produk': 'TOTAL KESELURUHAN',
        'Nama Produk': `${summaryTotals.total_rows} Produk`,
        'Satuan': '',
        'Jumlah SO': '',
        'Total Qty Dipesan': summaryTotals.total_qty || 0,
        'Total Penjualan (Rp)': summaryTotals.total_amount || 0,
        'Harga Rata-rata (Rp)': ''
      })
    }
  } else if (reportType === 'status') {
    items.forEach((item, idx) => {
      rows.push({
        'No': idx + 1,
        'Nomor SO': sanitizeExcelCell(item.nomor_so || '-'),
        'Tanggal SO': formatDateIndo(item.tanggal),
        'Customer': sanitizeExcelCell(item.customer_name || '-'),
        'Total SO (Rp)': Number(item.total_so) || 0,
        'Status SO': item.status_so === 1 ? 'Disetujui' : (item.status_aktif === 0 ? 'Dibatalkan' : 'Draft'),
        'Status Produksi': item.status_produksi === 1 ? 'Selesai/Dalam' : 'Belum',
        'Status Pengiriman': item.status_pengiriman,
        'Keterangan': sanitizeExcelCell(item.keterangan || '-')
      })
    })
    if (summaryTotals) {
      rows.push({
        'No': '',
        'Nomor SO': 'TOTAL KESELURUHAN',
        'Tanggal SO': '',
        'Customer': `${summaryTotals.total_rows} SO`,
        'Total SO (Rp)': summaryTotals.total_amount || 0,
        'Status SO': '',
        'Status Produksi': '',
        'Status Pengiriman': '',
        'Keterangan': ''
      })
    }
  } else if (reportType === 'so_vs_delivery') {
    items.forEach((item, idx) => {
      rows.push({
        'No': idx + 1,
        'Nomor SO': sanitizeExcelCell(item.nomor_so || '-'),
        'Tanggal SO': formatDateIndo(item.tanggal_so),
        'Customer': sanitizeExcelCell(item.customer_name || '-'),
        'Kode Produk': sanitizeExcelCell(item.kode_produk || '-'),
        'Nama Produk': sanitizeExcelCell(item.nama_produk || '-'),
        'Satuan': item.satuan || '-',
        'Qty Pesanan': Number(item.qty_pesanan) || 0,
        'Qty Terkirim': Number(item.qty_terkirim) || 0,
        'Sisa Qty': Number(item.sisa_qty) || 0,
        'Realisasi (%)': Number(item.persentase_pengiriman) || 0,
        'Status Pengiriman': item.status_pengiriman
      })
    })
    if (summaryTotals) {
      rows.push({
        'No': '',
        'Nomor SO': 'TOTAL KESELURUHAN',
        'Tanggal SO': '',
        'Customer': '',
        'Kode Produk': '',
        'Nama Produk': '',
        'Satuan': '',
        'Qty Pesanan': summaryTotals.total_qty || 0,
        'Qty Terkirim': '',
        'Sisa Qty': '',
        'Realisasi (%)': '',
        'Status Pengiriman': ''
      })
    }
  } else if (reportType === 'invoice') {
    items.forEach((item, idx) => {
      rows.push({
        'No': idx + 1,
        'Tanggal Invoice': formatDateIndo(item.tanggal_invoice),
        'Nomor Invoice': sanitizeExcelCell(item.nomor_invoice || '-'),
        'Nomor SO': sanitizeExcelCell(item.nomor_so || '-'),
        'Customer': sanitizeExcelCell(item.customer_name || '-'),
        'Jenis Invoice': item.jenis_invoice,
        'Subtotal (Rp)': Number(item.subtotal) || 0,
        'Diskon (Rp)': Number(item.diskon) || 0,
        'PPN (Rp)': Number(item.total_ppn) || 0,
        'Total Invoice (Rp)': Number(item.total_invoice) || 0,
        'Status': item.status_invoice === 1 ? 'Valid' : 'Draft'
      })
    })
    if (summaryTotals) {
      rows.push({
        'No': '',
        'Tanggal Invoice': 'TOTAL KESELURUHAN',
        'Nomor Invoice': '',
        'Nomor SO': '',
        'Customer': `${summaryTotals.total_rows} Invoice`,
        'Jenis Invoice': '',
        'Subtotal (Rp)': summaryTotals.total_subtotal || 0,
        'Diskon (Rp)': summaryTotals.total_diskon || 0,
        'PPN (Rp)': summaryTotals.total_ppn || 0,
        'Total Invoice (Rp)': summaryTotals.total_amount || 0,
        'Status': ''
      })
    }
  } else if (reportType === 'payment_receivable') {
    items.forEach((item, idx) => {
      rows.push({
        'No': idx + 1,
        'Nomor Invoice': sanitizeExcelCell(item.nomor_invoice || '-'),
        'Tanggal Invoice': formatDateIndo(item.tanggal_invoice),
        'Nomor SO': sanitizeExcelCell(item.nomor_so || '-'),
        'Customer': sanitizeExcelCell(item.customer_name || '-'),
        'Jenis Invoice': item.jenis_invoice,
        'Total Invoice (Rp)': Number(item.total_invoice) || 0,
        'Total Pembayaran (Rp)': Number(item.total_pembayaran) || 0,
        'Sisa Tagihan (Rp)': Number(item.sisa_tagihan) || 0,
        'Status Pembayaran': item.status_pembayaran
      })
    })
    if (summaryTotals) {
      rows.push({
        'No': '',
        'Nomor Invoice': 'TOTAL KESELURUHAN',
        'Tanggal Invoice': '',
        'Nomor SO': '',
        'Customer': '',
        'Jenis Invoice': '',
        'Total Invoice (Rp)': summaryTotals.total_amount || 0,
        'Total Pembayaran (Rp)': summaryTotals.total_pembayaran || 0,
        'Sisa Tagihan (Rp)': summaryTotals.total_sisa_tagihan || 0,
        'Status Pembayaran': ''
      })
    }
  }

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Penjualan')
  const dateStr = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `Laporan_Penjualan_${reportType}_${dateStr}.xlsx`)
}

/**
 * EXPORT PDF (jsPDF + autoTable)
 */
export function exportSalesReportToPdf(
  reportType: SalesReportType,
  items: any[],
  filterInfo?: string,
  summaryTotals?: SalesReportSummaryTotals
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  })

  const title = `LAPORAN ${getReportTypeLabel(reportType).toUpperCase()}`
  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  // Header Title
  doc.setFontSize(14)
  doc.setTextColor(15, 118, 110) // teal-700
  doc.text('IMPACT FURNITURE', 14, 15)

  doc.setFontSize(11)
  doc.setTextColor(30, 41, 59)
  doc.text(title, 14, 21)

  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  const metaText = `Dicetak: ${printDate} | ${filterInfo || 'Semua Periode'}`
  doc.text(metaText, 14, 26)

  let head: string[][] = []
  let body: (string | number)[][] = []

  if (reportType === 'summary') {
    head = [['No', 'Tanggal', 'Nomor SO', 'Customer', 'Item', 'Qty', 'Subtotal', 'PPN', 'Total SO', 'Status']]
    body = items.map((it, idx) => [
      idx + 1,
      formatDateIndo(it.tanggal),
      it.kode || '-',
      it.customer_name || '-',
      it.item_count,
      it.total_qty,
      formatCurrency(it.subtotal),
      formatCurrency(it.total_ppn),
      formatCurrency(it.total),
      it.status === 1 ? 'Disetujui' : (it.status_aktif === 0 ? 'Dibatalkan' : 'Draft')
    ])
    if (summaryTotals) {
      body.push([
        '',
        'TOTAL',
        `${summaryTotals.total_rows} SO`,
        '',
        '',
        summaryTotals.total_qty || 0,
        formatCurrency(summaryTotals.total_subtotal || 0),
        formatCurrency(summaryTotals.total_ppn || 0),
        formatCurrency(summaryTotals.total_amount || 0),
        ''
      ])
    }
  } else if (reportType === 'detail') {
    head = [['No', 'Tanggal', 'Nomor SO', 'Customer', 'Nama Produk', 'Satuan', 'Qty', 'Harga Satuan', 'Subtotal', 'Status']]
    body = items.map((it, idx) => [
      idx + 1,
      formatDateIndo(it.tanggal),
      it.kode_so || '-',
      it.customer_name || '-',
      it.nama_produk || '-',
      it.satuan || '-',
      it.qty,
      formatCurrency(it.harga),
      formatCurrency(it.subtotal),
      it.status_so === 1 ? 'Disetujui' : 'Draft'
    ])
    if (summaryTotals) {
      body.push([
        '',
        'TOTAL',
        `${summaryTotals.total_rows} Baris`,
        '',
        '',
        '',
        summaryTotals.total_qty || 0,
        '',
        formatCurrency(summaryTotals.total_subtotal || 0),
        ''
      ])
    }
  } else if (reportType === 'customer') {
    head = [['No', 'Kode', 'Nama Customer', 'Jumlah SO', 'Total Qty', 'Subtotal', 'PPN', 'Total Nilai SO']]
    body = items.map((it, idx) => [
      idx + 1,
      it.kode_customer || '-',
      it.nama_customer || '-',
      it.jumlah_so,
      it.total_qty,
      formatCurrency(it.subtotal_pesanan),
      formatCurrency(it.total_ppn),
      formatCurrency(it.total_nilai_so)
    ])
    if (summaryTotals) {
      body.push([
        '',
        'TOTAL',
        `${summaryTotals.total_rows} Customer`,
        '',
        '',
        formatCurrency(summaryTotals.total_subtotal || 0),
        formatCurrency(summaryTotals.total_ppn || 0),
        formatCurrency(summaryTotals.total_amount || 0)
      ])
    }
  } else if (reportType === 'product') {
    head = [['No', 'Kode', 'Nama Produk', 'Satuan', 'Jumlah SO', 'Total Qty', 'Total Penjualan', 'Harga Rata2']]
    body = items.map((it, idx) => [
      idx + 1,
      it.kode_produk || '-',
      it.nama_produk || '-',
      it.satuan || '-',
      it.jumlah_so,
      it.total_qty_dipesan,
      formatCurrency(it.total_nilai_penjualan),
      formatCurrency(it.harga_rata_rata)
    ])
    if (summaryTotals) {
      body.push([
        '',
        'TOTAL',
        `${summaryTotals.total_rows} Produk`,
        '',
        '',
        summaryTotals.total_qty || 0,
        formatCurrency(summaryTotals.total_amount || 0),
        ''
      ])
    }
  } else if (reportType === 'status') {
    head = [['No', 'Nomor SO', 'Tanggal SO', 'Customer', 'Total SO', 'Status SO', 'Produksi', 'Pengiriman']]
    body = items.map((it, idx) => [
      idx + 1,
      it.nomor_so || '-',
      formatDateIndo(it.tanggal),
      it.customer_name || '-',
      formatCurrency(it.total_so),
      it.status_so === 1 ? 'Disetujui' : (it.status_aktif === 0 ? 'Dibatalkan' : 'Draft'),
      it.status_produksi === 1 ? 'Selesai/Dalam' : 'Belum',
      it.status_pengiriman
    ])
  } else if (reportType === 'so_vs_delivery') {
    head = [['No', 'Nomor SO', 'Customer', 'Nama Produk', 'Qty Pesan', 'Qty Kirim', 'Sisa Qty', 'Realisasi (%)', 'Status']]
    body = items.map((it, idx) => [
      idx + 1,
      it.nomor_so || '-',
      it.customer_name || '-',
      it.nama_produk || '-',
      it.qty_pesanan,
      it.qty_terkirim,
      it.sisa_qty,
      `${it.persentase_pengiriman}%`,
      it.status_pengiriman
    ])
  } else if (reportType === 'invoice') {
    head = [['No', 'Tanggal', 'Nomor Invoice', 'Nomor SO', 'Customer', 'Jenis', 'Subtotal', 'PPN', 'Total Invoice']]
    body = items.map((it, idx) => [
      idx + 1,
      formatDateIndo(it.tanggal_invoice),
      it.nomor_invoice || '-',
      it.nomor_so || '-',
      it.customer_name || '-',
      it.jenis_invoice,
      formatCurrency(it.subtotal),
      formatCurrency(it.total_ppn),
      formatCurrency(it.total_invoice)
    ])
  } else if (reportType === 'payment_receivable') {
    head = [['No', 'Nomor Invoice', 'Tanggal', 'Nomor SO', 'Customer', 'Jenis', 'Total Invoice', 'Total Bayar', 'Sisa Tagihan', 'Status']]
    body = items.map((it, idx) => [
      idx + 1,
      it.nomor_invoice || '-',
      formatDateIndo(it.tanggal_invoice),
      it.nomor_so || '-',
      it.customer_name || '-',
      it.jenis_invoice,
      formatCurrency(it.total_invoice),
      formatCurrency(it.total_pembayaran),
      formatCurrency(it.sisa_tagihan),
      it.status_pembayaran
    ])
  }

  autoTable(doc, {
    head,
    body,
    startY: 30,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [30, 41, 59]
    },
    headStyles: {
      fillColor: [15, 118, 110], // teal-700
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14 }
  })

  const dateStr = new Date().toISOString().slice(0, 10)
  doc.save(`Laporan_Penjualan_${reportType}_${dateStr}.pdf`)
}
