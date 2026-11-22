import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type {
  CustomerReportCustomerMeta,
  CustomerReportSummaryTotals,
  CustomerReportItemRow
} from '../types/sales-customer-report.types'
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
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
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

export function getStatusBadgeText(status: number, statusAktif: number): string {
  if (statusAktif === 0) return 'DIBATALKAN'
  if (status === 1) return 'TERTUTUP'
  return 'TERBUKA'
}

/**
 * EXPORT EXCEL (Client-side dengan format lengkap Excel-like)
 */
export function exportCustomerReportToExcel(
  customer: CustomerReportCustomerMeta,
  items: CustomerReportItemRow[],
  dateFrom?: string,
  dateTo?: string,
  statusFilterLabel: string = 'Semua Status',
  summaryTotals?: CustomerReportSummaryTotals
): void {
  const kodeClean = (customer.kode || 'CUST').replace(/[^a-zA-Z0-9]/g, '')
  const year = dateTo ? dateTo.slice(0, 4) : new Date().getFullYear().toString()
  const filename = `Laporan_Per_Customer_${kodeClean}_${year}.xlsx`

  const periodLabel =
    dateFrom && dateTo
      ? `${formatDateIndo(dateFrom)} - ${formatDateIndo(dateTo)}`
      : dateFrom
        ? `Sejak ${formatDateIndo(dateFrom)}`
        : dateTo
          ? `Hingga ${formatDateIndo(dateTo)}`
          : 'Semua Periode'

  const headerAOA: any[][] = [
    ['IMPACT FURNITURE'],
    ['LAPORAN PER CUSTOMER'],
    [''],
    ['Kode Customer', customer.kode],
    ['Nama Customer', customer.nama],
    ['Telepon', customer.no_hp || '-'],
    ['Alamat', customer.alamat || '-'],
    ['Periode', periodLabel],
    ['Status Filter', statusFilterLabel],
    ['Waktu Generate', new Date().toLocaleString('id-ID')],
    [''],
    [
      'No',
      'Tanggal',
      'Nomor SO',
      'Subtotal',
      'PPN',
      'Diskon',
      'Total',
      'Status',
      'Keterangan'
    ]
  ]

  const dataAOA: any[][] = items.map((item, idx) => [
    idx + 1,
    formatDateIndo(item.tanggal),
    sanitizeExcelCell(item.kode),
    item.subtotal,
    item.total_ppn,
    item.diskon,
    item.total,
    getStatusBadgeText(item.status, item.status_aktif),
    sanitizeExcelCell(item.keterangan || '-')
  ])

  const totals = summaryTotals || {
    total_orders: items.length,
    subtotal: items.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0),
    discount: items.reduce((acc, it) => acc + (Number(it.diskon) || 0), 0),
    tax: items.reduce((acc, it) => acc + (Number(it.total_ppn) || 0), 0),
    grand_total: items.reduce((acc, it) => acc + (Number(it.total) || 0), 0)
  }

  const summaryAOA: any[][] = [
    [''],
    [
      'TOTAL',
      '',
      `${totals.total_orders} Transaksi`,
      totals.subtotal,
      totals.tax,
      totals.discount,
      totals.grand_total,
      '',
      ''
    ],
    ['', '', 'TOTAL SUBTOTAL', totals.subtotal],
    ['', '', 'TOTAL PPN', totals.tax],
    ['', '', 'TOTAL DISKON', totals.discount],
    ['', '', 'GRAND TOTAL', totals.grand_total]
  ]

  const fullAOA = [...headerAOA, ...dataAOA, ...summaryAOA]

  const ws = XLSX.utils.aoa_to_sheet(fullAOA)

  // Auto column widths
  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 14 }, // Tanggal
    { wch: 22 }, // Nomor SO
    { wch: 18 }, // Subtotal
    { wch: 16 }, // PPN
    { wch: 16 }, // Diskon
    { wch: 20 }, // Total
    { wch: 14 }, // Status
    { wch: 35 }  // Keterangan
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Per Customer')
  XLSX.writeFile(wb, filename)
}

/**
 * EXPORT PDF (Landscape A4, Professional Typography, AutoTable)
 */
export function exportCustomerReportToPdf(
  customer: CustomerReportCustomerMeta,
  items: CustomerReportItemRow[],
  dateFrom?: string,
  dateTo?: string,
  statusFilterLabel: string = 'Semua Status',
  summaryTotals?: CustomerReportSummaryTotals
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  })

  const kodeClean = (customer.kode || 'CUST').replace(/[^a-zA-Z0-9]/g, '')
  const year = dateTo ? dateTo.slice(0, 4) : new Date().getFullYear().toString()
  const filename = `Laporan_Per_Customer_${kodeClean}_${year}.pdf`

  const periodLabel =
    dateFrom && dateTo
      ? `${formatDateIndo(dateFrom)} - ${formatDateIndo(dateTo)}`
      : dateFrom
        ? `Sejak ${formatDateIndo(dateFrom)}`
        : dateTo
          ? `Hingga ${formatDateIndo(dateTo)}`
          : 'Semua Periode'

  // Header Title
  doc.setFontSize(16)
  doc.setTextColor(15, 23, 42) // Slate 900
  doc.setFont('helvetica', 'bold')
  doc.text('IMPACT FURNITURE', 14, 15)

  doc.setFontSize(11)
  doc.setTextColor(13, 148, 136) // Teal 600
  doc.text('LAPORAN PER CUSTOMER', 14, 21)

  // Sub metadata
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105) // Slate 600
  doc.setFont('helvetica', 'normal')

  doc.text(`Kode Customer : ${customer.kode}`, 14, 28)
  doc.text(`Nama Customer : ${customer.nama}`, 14, 33)
  doc.text(`Kontak        : ${customer.no_hp || '-'}`, 14, 38)

  doc.text(`Periode      : ${periodLabel}`, 120, 28)
  doc.text(`Status       : ${statusFilterLabel}`, 120, 33)
  doc.text(`Dicetak Pada : ${new Date().toLocaleString('id-ID')}`, 120, 38)

  const tableRows = items.map((item, idx) => [
    idx + 1,
    formatDateIndo(item.tanggal),
    item.kode,
    formatCurrency(item.subtotal),
    formatCurrency(item.total_ppn),
    formatCurrency(item.diskon),
    formatCurrency(item.total),
    getStatusBadgeText(item.status, item.status_aktif),
    item.keterangan || '-'
  ])

  const totals = summaryTotals || {
    total_orders: items.length,
    subtotal: items.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0),
    discount: items.reduce((acc, it) => acc + (Number(it.diskon) || 0), 0),
    tax: items.reduce((acc, it) => acc + (Number(it.total_ppn) || 0), 0),
    grand_total: items.reduce((acc, it) => acc + (Number(it.total) || 0), 0)
  }

  // Summary Row inside table
  const summaryRow = [
    '',
    'TOTAL',
    `${totals.total_orders} Transaksi`,
    formatCurrency(totals.subtotal),
    formatCurrency(totals.tax),
    formatCurrency(totals.discount),
    formatCurrency(totals.grand_total),
    '',
    ''
  ]

  autoTable(doc, {
    startY: 44,
    head: [[
      'No',
      'Tanggal',
      'Nomor SO',
      'Subtotal',
      'PPN',
      'Diskon',
      'Total',
      'Status',
      'Keterangan'
    ]],
    body: [...tableRows, summaryRow],
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [51, 65, 85],
      fontStyle: 'bold',
      lineColor: [203, 213, 225],
      lineWidth: 0.3
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'left', cellWidth: 35, fontStyle: 'bold' },
      3: { halign: 'right', cellWidth: 28 },
      4: { halign: 'right', cellWidth: 24 },
      5: { halign: 'right', cellWidth: 24 },
      6: { halign: 'right', cellWidth: 30, fontStyle: 'bold' },
      7: { halign: 'center', cellWidth: 22 },
      8: { halign: 'left' }
    },
    didParseCell: (data) => {
      // Highlight summary row
      if (data.row.index === tableRows.length) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [248, 250, 252]
        if (data.column.index === 6) {
          data.cell.styles.textColor = [13, 148, 136] // Teal 600
        }
      }
    },
    didDrawPage: () => {
      // Page numbering footer
      const pageStr = `Halaman ${doc.getNumberOfPages()}`
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      doc.text(
        'SMM-Impact ERP V2 — Laporan Per Customer',
        14,
        doc.internal.pageSize.height - 8
      )
      doc.text(
        pageStr,
        doc.internal.pageSize.width - 25,
        doc.internal.pageSize.height - 8
      )
    }
  })

  doc.save(filename)
}
