import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { SalesOrderListItem, SalesOrderWithDetails } from '../types/sales-order.types'
import { getVariantConfig, type SalesOrderVariantKey } from '../config/sales-order-variants'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import { formatPaymentStatusLabel } from './sales-order-calculations'

/**
 * Exports Sales Order list to Excel (.xlsx) file.
 */
export function exportSalesOrderListExcel(
  items: SalesOrderListItem[],
  variant: SalesOrderVariantKey
): void {
  const cfg = getVariantConfig(variant)

  const rows = items.map((item, index) => {
    const baseRow: Record<string, string | number> = {
      No: index + 1,
      Tanggal: formatDate(item.tanggal),
      'No. SO': item.kode,
      Customer: item.customer_nama,
      Sales: item.sales_nama,
      Subtotal: item.subtotal
    }

    if (cfg.hasTax) {
      baseRow['PPN'] = item.total_ppn
      baseRow['No. Faktur Pajak'] = item.no_faktur_pajak || '-'
    }

    baseRow['Total'] = item.total
    baseRow['Terbayar'] = item.terbayar
    baseRow['Sisa'] = item.sisa
    baseRow['Status Pembayaran'] = formatPaymentStatusLabel(item.payment_status)
    baseRow['Status Pengiriman'] = item.delivery_status
    baseRow['Status Dokumen'] = item.status === 1 ? 'SUCCEEDED' : 'DRAFT'

    return baseRow
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, cfg.shortLabel)

  const filename = `${cfg.shortLabel.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(workbook, filename)
}

/**
 * Exports Sales Order list to PDF document.
 */
export function exportSalesOrderListPdf(
  items: SalesOrderListItem[],
  variant: SalesOrderVariantKey
): void {
  const cfg = getVariantConfig(variant)
  const doc = new jsPDF('landscape')

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`DAFTAR ${cfg.label.toUpperCase()}`, 14, 15)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`${cfg.companyLetterhead.title} — ${cfg.companyLetterhead.address}`, 14, 21)
  doc.text(`Tanggal Cetak: ${formatDate(new Date().toISOString())}`, 14, 26)

  const headers = [
    'No',
    'Tanggal',
    'No. SO',
    'Customer',
    'Sales',
    'Subtotal',
    ...(cfg.hasTax ? ['PPN'] : []),
    'TOTAL',
    'Terbayar',
    'Sisa',
    'Bayar',
    'Status'
  ]

  const body = items.map((item, index) => {
    return [
      String(index + 1),
      formatDate(item.tanggal),
      item.kode,
      item.customer_nama,
      item.sales_nama,
      formatCurrency(item.subtotal),
      ...(cfg.hasTax ? [formatCurrency(item.total_ppn)] : []),
      formatCurrency(item.total),
      formatCurrency(item.terbayar),
      formatCurrency(item.sisa),
      formatPaymentStatusLabel(item.payment_status),
      item.status === 1 ? 'SUCCEEDED' : 'DRAFT'
    ]
  })

  autoTable(doc, {
    startY: 30,
    head: [headers],
    body: body,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [52, 69, 79], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  })

  doc.save(`${cfg.shortLabel.replace(/\s+/g, '_')}_List.pdf`)
}

/**
 * Exports official Nota Penjualan to PDF document.
 */
export function exportSalesOrderNotaPdf(order: SalesOrderWithDetails): void {
  const cfg = getVariantConfig(order.variant)
  const doc = new jsPDF('portrait')

  // Header Letterhead
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(cfg.companyLetterhead.title, 14, 15)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(cfg.companyLetterhead.address, 14, 20)
  doc.text(`Telp: ${cfg.companyLetterhead.phone}`, 14, 24)

  doc.setLineWidth(0.5)
  doc.line(14, 27, 196, 27)

  // Title
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('NOTA PENJUALAN', 14, 34)

  // Meta Information
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`No. Sales Order : ${order.kode}`, 14, 40)
  if (cfg.hasTax && order.no_faktur_pajak) {
    doc.text(`No. Faktur Pajak: ${order.no_faktur_pajak}`, 14, 45)
  }
  doc.text(`Tanggal         : ${formatDate(order.tanggal)}`, 14, cfg.hasTax ? 50 : 45)

  doc.text(`Kepada Yth      : ${order.customer_nama}`, 120, 40)
  doc.text(`Sales           : ${order.sales_nama}`, 120, 45)

  // Items Table
  const headers = ['No', 'Jumlah', 'Kode', 'Nama Barang', 'Harga', 'Diskon', 'Subtotal']
  const body = order.items.map((item, index) => [
    String(index + 1),
    `${item.qty} ${item.satuan_nama || 'Unit'}`,
    item.kode_produk || '-',
    item.nama_produk || '-',
    formatCurrency(item.harga),
    item.diskon > 0 ? `${item.diskon}%` : '-',
    formatCurrency(item.subtotal)
  ])

  autoTable(doc, {
    startY: 56,
    head: [headers],
    body: body,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [71, 85, 105], textColor: 255 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 20 },
      2: { cellWidth: 25 },
      4: { halign: 'right' },
      5: { halign: 'center', cellWidth: 16 },
      6: { halign: 'right' }
    }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let finalY = (doc as any).lastAutoTable?.finalY || 100

  // Biaya Tambahan Table if present
  if (order.biaya_tambahan && order.biaya_tambahan.length > 0) {
    finalY += 4
    doc.setFont('helvetica', 'bold')
    doc.text('Biaya Tambahan:', 14, finalY)
    finalY += 2

    const compHeaders = ['No', 'Nama Komponen', 'Jumlah']
    const compBody = order.biaya_tambahan.map((c, i) => [
      String(i + 1),
      c.komponen,
      formatCurrency(c.jumlah)
    ])

    autoTable(doc, {
      startY: finalY,
      head: [compHeaders],
      body: compBody,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [148, 163, 184], textColor: 0 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        2: { halign: 'right' }
      }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    finalY = (doc as any).lastAutoTable?.finalY || finalY + 20
  }

  // Summary Totals
  finalY += 6
  doc.setFont('helvetica', 'normal')
  doc.text(`Subtotal Item : ${formatCurrency(order.subtotal)}`, 140, finalY)

  if (cfg.hasTax) {
    finalY += 5
    doc.text(`PPN           : ${formatCurrency(order.total_ppn)}`, 140, finalY)
  }

  finalY += 6
  doc.setFont('helvetica', 'bold')
  doc.text(`TOTAL BAYAR   : ${formatCurrency(order.total)}`, 140, finalY)

  // Signatures
  finalY += 16
  doc.setFont('helvetica', 'normal')
  doc.text('Penerima / Customer', 25, finalY)
  doc.text('Hormat Kami,', 140, finalY)

  finalY += 18
  doc.text('(................................)', 20, finalY)
  doc.text('( Bagian Penjualan )', 135, finalY)

  doc.save(`Nota_${order.kode.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`)
}
