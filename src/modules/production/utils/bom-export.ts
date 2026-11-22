import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { BomTemplateWithItems } from '../types/bom.types'
import { formatNumber, formatCurrency } from '@/shared/utils/formatters'

/**
 * Generate and download formatted PDF for a single Bill of Materials (BoM)
 */
export function exportBomDetailPdf(bom: BomTemplateWithItems): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // 1. Company Identity Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(15, 118, 110) // Primary Teal
  doc.text('IMPACT FURNITURE', 14, 15)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text('Enterprise Management Information System', 14, 19)

  // Document Title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(31, 41, 55)
  doc.text('BILL OF MATERIALS (BOM)', pageWidth - 14, 15, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(`Kode Template: ${bom.kode}`, pageWidth - 14, 20, { align: 'right' })

  // Divider
  doc.setDrawColor(217, 224, 231)
  doc.line(14, 25, pageWidth - 14, 25)

  // 2. Metadata Grid
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)

  // Left column
  doc.text('Nama Template', 14, 32)
  doc.text(`: ${bom.nama}`, 45, 32)

  doc.text('Produk Furniture', 14, 38)
  doc.text(`: [${bom.kode_produk}] ${bom.nama_produk}`, 45, 38)

  doc.text('Satuan Produk', 14, 44)
  doc.text(`: ${bom.satuan_produk || 'Pcs'}`, 45, 44)

  // Right column
  doc.text('Status Template', pageWidth / 2 + 5, 32)
  const statusLabel = bom.status_aktif === 1 ? 'AKTIF' : 'NONAKTIF'
  doc.text(`: ${statusLabel}`, pageWidth / 2 + 35, 32)

  doc.text('Total Jenis Bahan', pageWidth / 2 + 5, 38)
  doc.text(`: ${bom.total_items} jenis bahan`, pageWidth / 2 + 35, 38)

  doc.text('Est. Biaya Bahan', pageWidth / 2 + 5, 44)
  doc.text(`: ${formatCurrency(bom.total_estimasi_biaya)} / unit`, pageWidth / 2 + 35, 44)

  // 3. Table of BoM materials
  const head = [
    [
      'No',
      'Kode Bahan',
      'Nama Bahan Baku',
      'Satuan Pakai',
      'Qty per Unit',
      'Harga Satuan',
      'Subtotal Biaya'
    ]
  ]
  const body = bom.items.map((item, idx) => [
    idx + 1,
    item.kode_bahan,
    item.nama_bahan,
    item.nama_satuan,
    formatNumber(item.qty),
    formatCurrency(item.harga_satuan),
    formatCurrency(item.estimasi_biaya)
  ])

  autoTable(doc, {
    startY: 52,
    head,
    body,
    margin: { left: 14, right: 14, bottom: 40 },
    theme: 'grid',
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [31, 41, 55],
      lineColor: [226, 232, 240]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 24, halign: 'center' },
      4: { cellWidth: 24, halign: 'right' },
      5: { cellWidth: 28, halign: 'right' },
      6: { cellWidth: 32, halign: 'right' }
    }
  })

  // Table summary
  const lastY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(31, 41, 55)
  doc.text(`Total Komposisi: ${bom.total_items} jenis bahan`, 14, lastY)
  doc.text(
    `Total Estimasi Biaya Bahan: ${formatCurrency(bom.total_estimasi_biaya)} / unit`,
    pageWidth - 14,
    lastY,
    { align: 'right' }
  )

  // 4. Signature Section
  const sigY = Math.min(lastY + 18, pageHeight - 35)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)

  // Disusun Oleh (R&D)
  doc.text('Disusun Oleh,', 25, sigY)
  doc.text('(____________________)', 14, sigY + 22)
  doc.setFontSize(7.5)
  doc.setTextColor(148, 163, 184)
  doc.text('R&D / Desain Produk', 20, sigY + 26)

  // Diperiksa Oleh (Kepala Produksi)
  doc.setFontSize(8.5)
  doc.setTextColor(31, 41, 55)
  doc.text('Diperiksa Oleh,', pageWidth / 2 - 12, sigY)
  doc.text('(____________________)', pageWidth / 2 - 22, sigY + 22)
  doc.setFontSize(7.5)
  doc.setTextColor(148, 163, 184)
  doc.text('Kepala Produksi', pageWidth / 2 - 14, sigY + 26)

  // Disetujui Oleh (Factory Manager / Direktur)
  doc.setFontSize(8.5)
  doc.setTextColor(31, 41, 55)
  doc.text('Disetujui Oleh,', pageWidth - 45, sigY)
  doc.text('(____________________)', pageWidth - 55, sigY + 22)
  doc.setFontSize(7.5)
  doc.setTextColor(148, 163, 184)
  doc.text('Factory Manager / Direktur', pageWidth - 55, sigY + 26)

  // Footer
  doc.setFontSize(7.5)
  doc.setTextColor(148, 163, 184)
  doc.text(
    `Dicetak pada ${new Date().toLocaleString('id-ID')} | Impact Furniture ERP v2`,
    14,
    pageHeight - 6
  )

  const safeFilename = `${bom.kode.replace(/[/\\?%*:|"<>]/g, '_')}_BOM.pdf`
  doc.save(safeFilename)
}

/**
 * Trigger print dialog
 */
export function printBomDocument(): void {
  window.print()
}
