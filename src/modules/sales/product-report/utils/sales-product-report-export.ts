import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type {
  ProductReportMode,
  ProductReportProductMeta,
  ProductReportCustomerMeta,
  ProductReportSummaryTotals,
  ProductReportSummaryRow,
  ProductReportDetailRow
} from '../types/sales-product-report.types'
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

export function formatNumberIndo(val: number | string | null | undefined): string {
  const num = Number(val) || 0
  return new Intl.NumberFormat('id-ID').format(num)
}

/**
 * EXPORT EXCEL (Client-side dengan format lengkap)
 */
export function exportProductReportToExcel(
  mode: ProductReportMode,
  product: ProductReportProductMeta,
  items: any[],
  dateFrom: string,
  dateTo: string,
  summaryTotals?: ProductReportSummaryTotals,
  customer?: ProductReportCustomerMeta | null
): void {
  const kodeClean = (product.kode || 'PROD').replace(/[^a-zA-Z0-9]/g, '')
  const year = dateTo.slice(0, 4) || new Date().getFullYear().toString()
  let filename = ''
  let modeTitle = ''
  const rows: Record<string, unknown>[] = []

  if (mode === 'summary') {
    filename = `Penjualan_Produk_Ringkasan_${kodeClean}_${year}.xlsx`
    modeTitle = 'RINGKASAN PEMBELIAN PRODUK BERDASARKAN CUSTOMER'

      ; (items as ProductReportSummaryRow[]).forEach((item, idx) => {
        rows.push({
          'No': idx + 1,
          'Kode Customer': sanitizeExcelCell(item.customer_code),
          'Nama Customer': sanitizeExcelCell(item.customer_name),
          'Jumlah SO': item.so_count,
          'Total Qty': item.total_qty,
          'Kontribusi Qty (%)': `${item.qty_percentage}%`,
          'Total Nilai (Rp)': item.total_amount,
          'Tanggal Pembelian Terakhir': formatDateIndo(item.last_purchase_date)
        })
      })

    if (summaryTotals) {
      rows.push({
        'No': '',
        'Kode Customer': 'TOTAL KESELURUHAN',
        'Nama Customer': `${summaryTotals.total_customers} Customer`,
        'Jumlah SO': summaryTotals.total_so,
        'Total Qty': summaryTotals.total_qty,
        'Kontribusi Qty (%)': '100%',
        'Total Nilai (Rp)': summaryTotals.total_amount,
        'Tanggal Pembelian Terakhir': ''
      })
    }
  } else if (mode === 'chronological') {
    filename = `Penjualan_Produk_Urut_Tanggal_${kodeClean}_${year}.xlsx`
    modeTitle = 'DETAIL TRANSAKSI PRODUK URUT TANGGAL'

      ; (items as ProductReportDetailRow[]).forEach((item, idx) => {
        rows.push({
          'No': idx + 1,
          'Tanggal SO': formatDateIndo(item.tanggal),
          'Nomor SO': sanitizeExcelCell(item.nomor_so),
          'Kode Produk': sanitizeExcelCell(item.kode_produk || '-'),
          'Nama Produk': sanitizeExcelCell(item.nama_produk),
          'Customer': sanitizeExcelCell(item.customer_name),
          'Keterangan Item': sanitizeExcelCell(item.item_keterangan || '-'),
          'Qty': item.qty,
          'Satuan': item.satuan || 'PCS',
          'Harga Satuan (Rp)': item.harga,
          'Diskon (%)': item.diskon,
          'Subtotal (Rp)': item.subtotal,
          'Status SO': item.so_status_aktif === 0 ? 'Dibatalkan' : (item.so_status === 1 ? 'Disetujui' : 'Draft')
        })
      })

    if (summaryTotals) {
      rows.push({
        'No': '',
        'Tanggal SO': 'TOTAL KESELURUHAN',
        'Nomor SO': `${summaryTotals.total_so} SO`,
        'Kode Produk': '',
        'Nama Produk': '',
        'Customer': `${summaryTotals.total_customers} Customer`,
        'Keterangan Item': '',
        'Qty': summaryTotals.total_qty,
        'Satuan': '',
        'Harga Satuan (Rp)': '',
        'Diskon (%)': '',
        'Subtotal (Rp)': summaryTotals.total_amount,
        'Status SO': ''
      })
    }
  } else {
    filename = `Penjualan_Produk_Customer_${kodeClean}_${year}.xlsx`
    modeTitle = `DETAIL TRANSAKSI PRODUK — ${customer ? customer.nama : 'CUSTOMER'}`

      ; (items as ProductReportDetailRow[]).forEach((item, idx) => {
        rows.push({
          'No': idx + 1,
          'Tanggal SO': formatDateIndo(item.tanggal),
          'Nomor SO': sanitizeExcelCell(item.nomor_so),
          'Customer': sanitizeExcelCell(item.customer_name),
          'Keterangan Item': sanitizeExcelCell(item.item_keterangan || '-'),
          'Qty': item.qty,
          'Satuan': item.satuan || 'PCS',
          'Harga Satuan (Rp)': item.harga,
          'Diskon (%)': item.diskon,
          'Subtotal (Rp)': item.subtotal,
          'Status SO': item.so_status_aktif === 0 ? 'Dibatalkan' : (item.so_status === 1 ? 'Disetujui' : 'Draft')
        })
      })

    if (summaryTotals) {
      rows.push({
        'No': '',
        'Tanggal SO': 'TOTAL TRANSAKSI',
        'Nomor SO': `${summaryTotals.total_so} SO`,
        'Customer': '',
        'Keterangan Item': '',
        'Qty': summaryTotals.total_qty,
        'Satuan': '',
        'Harga Satuan (Rp)': '',
        'Diskon (%)': '',
        'Subtotal (Rp)': summaryTotals.total_amount,
        'Status SO': ''
      })
    }
  }

  // Header Metadata
  const metadataRows = [
    ['IMPACT FURNITURE'],
    [`LAPORAN PENJUALAN PER PRODUK — ${modeTitle}`],
    [`Produk: ${product.kode} - ${product.nama}`],
    ...(customer ? [[`Customer: ${customer.kode} - ${customer.nama}`]] : []),
    [`Periode: ${formatDateIndo(dateFrom)} s/d ${formatDateIndo(dateTo)}`],
    []
  ]

  const ws = XLSX.utils.aoa_to_sheet(metadataRows)
  XLSX.utils.sheet_add_json(ws, rows, { origin: -1 })

  // Auto column widths
  const maxCols = 12
  const colWidths = []
  for (let i = 0; i < maxCols; i++) {
    colWidths.push({ wch: 18 })
  }
  colWidths[0] = { wch: 6 } // No
  colWidths[1] = { wch: 14 } // Tanggal / Kode
  colWidths[2] = { wch: 22 } // Nomor / Nama
  colWidths[3] = { wch: 28 } // Customer / Nama
  ws['!cols'] = colWidths

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Penjualan Produk')
  XLSX.writeFile(wb, filename)
}

/**
 * EXPORT PDF (jsPDF + autoTable landscape)
 */
export function exportProductReportToPdf(
  mode: ProductReportMode,
  product: ProductReportProductMeta,
  items: any[],
  dateFrom: string,
  dateTo: string,
  summaryTotals?: ProductReportSummaryTotals,
  customer?: ProductReportCustomerMeta | null
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  })

  const kodeClean = (product.kode || 'PROD').replace(/[^a-zA-Z0-9]/g, '')
  const year = dateTo.slice(0, 4) || new Date().getFullYear().toString()
  let filename = ''
  let title = ''

  // Header Title - Consistent with other ERP reports
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 118, 110) // teal-700 (#0f766e) consistent with sales-report
  doc.text('IMPACT FURNITURE', 14, 15)

  doc.setFontSize(11)
  doc.setTextColor(30, 41, 59)

  if (mode === 'summary') {
    title = 'LAPORAN PENJUALAN PER PRODUK — RINGKASAN CUSTOMER'
    filename = `Penjualan_Produk_Ringkasan_${kodeClean}_${year}.pdf`
  } else if (mode === 'chronological') {
    title = 'LAPORAN PENJUALAN PER PRODUK — DETAIL URUT TANGGAL'
    filename = `Penjualan_Produk_Urut_Tanggal_${kodeClean}_${year}.pdf`
  } else {
    title = `LAPORAN PENJUALAN PER PRODUK — DETAIL TRANSAKSI ${customer ? customer.nama : 'CUSTOMER'}`
    filename = `Penjualan_Produk_Customer_${kodeClean}_${year}.pdf`
  }
  doc.text(title, 14, 21)

  // Metadata consistent with other reports
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  const productInfo = `Produk: ${product.kode} — ${product.nama}`
  const customerInfo = customer ? ` | Customer: ${customer.kode} — ${customer.nama}` : ''
  const periodInfo = ` | Periode: ${formatDateIndo(dateFrom)} s/d ${formatDateIndo(dateTo)}`
  const metaText = `Dicetak: ${printDate} | ${productInfo}${customerInfo}${periodInfo}`
  doc.text(metaText, 14, 26)

  let head: string[][] = []
  let body: (string | number)[][] = []
  let foot: (string | number)[][] = []

  if (mode === 'summary') {
    head = [['No', 'Kode Customer', 'Nama Customer', 'Jml SO', 'Total Qty', 'Kontribusi', 'Total Nilai (Rp)', 'Beli Terakhir']]
    body = (items as ProductReportSummaryRow[]).map((item, idx) => [
      idx + 1,
      item.customer_code || '-',
      item.customer_name,
      formatNumberIndo(item.so_count),
      formatNumberIndo(item.total_qty),
      `${item.qty_percentage}%`,
      formatCurrency(item.total_amount),
      formatDateIndo(item.last_purchase_date)
    ])

    if (summaryTotals) {
      foot = [[
        '',
        'TOTAL KESELURUHAN',
        `${summaryTotals.total_customers} Customer`,
        formatNumberIndo(summaryTotals.total_so),
        formatNumberIndo(summaryTotals.total_qty),
        '100%',
        formatCurrency(summaryTotals.total_amount),
        ''
      ]]
    }
  } else if (mode === 'chronological') {
    head = [['No', 'Tanggal', 'Nomor SO', 'Customer', 'Keterangan Item', 'Qty', 'Harga (Rp)', 'Disc%', 'Subtotal (Rp)', 'Status']]
    body = (items as ProductReportDetailRow[]).map((item, idx) => [
      idx + 1,
      formatDateIndo(item.tanggal),
      item.nomor_so,
      item.customer_name,
      item.item_keterangan || '-',
      formatNumberIndo(item.qty),
      formatCurrency(item.harga),
      `${item.diskon}%`,
      formatCurrency(item.subtotal),
      item.so_status_aktif === 0 ? 'Batal' : (item.so_status === 1 ? 'Disetujui' : 'Draft')
    ])

    if (summaryTotals) {
      foot = [[
        '',
        'TOTAL KESELURUHAN',
        `${summaryTotals.total_so} SO`,
        `${summaryTotals.total_customers} Cust`,
        '',
        formatNumberIndo(summaryTotals.total_qty),
        '',
        '',
        formatCurrency(summaryTotals.total_amount),
        ''
      ]]
    }
  } else {
    head = [['No', 'Tanggal', 'Nomor SO', 'Customer', 'Keterangan Item', 'Qty', 'Harga (Rp)', 'Disc%', 'Subtotal (Rp)', 'Status']]
    body = (items as ProductReportDetailRow[]).map((item, idx) => [
      idx + 1,
      formatDateIndo(item.tanggal),
      item.nomor_so,
      item.customer_name,
      item.item_keterangan || '-',
      formatNumberIndo(item.qty),
      formatCurrency(item.harga),
      `${item.diskon}%`,
      formatCurrency(item.subtotal),
      item.so_status_aktif === 0 ? 'Batal' : (item.so_status === 1 ? 'Disetujui' : 'Draft')
    ])

    if (summaryTotals) {
      foot = [[
        '',
        'TOTAL TRANSAKSI',
        `${summaryTotals.total_so} SO`,
        '',
        '',
        formatNumberIndo(summaryTotals.total_qty),
        '',
        '',
        formatCurrency(summaryTotals.total_amount),
        ''
      ]]
    }
  }

  const startY = 30

  autoTable(doc, {
    startY,
    head,
    body,
    foot,
    theme: 'grid',
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [30, 41, 59],
      fontStyle: 'bold',
      fontSize: 8,
      lineWidth: 0.2,
      lineColor: [203, 213, 225]
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      lineWidth: 0.1,
      lineColor: [226, 232, 240]
    },
    footStyles: {
      fillColor: [248, 250, 252],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8,
      lineWidth: 0.2,
      lineColor: [203, 213, 225]
    },
    styles: {
      cellPadding: 2,
      overflow: 'linebreak'
    },
    didDrawPage: data => {
      // Page numbering footer
      const pageCount = (doc.internal as any).getNumberOfPages()
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      doc.text(
        `Halaman ${data.pageNumber} dari ${pageCount}`,
        280,
        200,
        { align: 'right' }
      )
    }
  })

  doc.save(filename)
}
