import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { MaterialMutationDetailWithItems } from '../types/material-mutation.types'
import { formatNumber, formatDate } from '@/shared/utils/formatters'

/**
 * Generate and download formatted PDF for a single Material Mutation note
 */
export function exportMutationDetailPdf(mutation: MaterialMutationDetailWithItems): void {
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
  doc.text('BUKTI MUTASI BAHAN', pageWidth - 14, 15, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(`No: ${mutation.kode}`, pageWidth - 14, 20, { align: 'right' })

  // Divider
  doc.setDrawColor(217, 224, 231)
  doc.line(14, 25, pageWidth - 14, 25)

  // 2. Metadata Grid
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)

  // Left column
  doc.text('Tanggal Mutasi', 14, 32)
  doc.text(`: ${formatDate(mutation.tanggal)}`, 45, 32)

  doc.text('Status', 14, 38)
  const statusLabel = mutation.status === 1 ? 'SELESAI / TERVERIFIKASI' : 'DRAFT'
  doc.text(`: ${statusLabel}`, 45, 38)

  doc.text('Dibuat Oleh', 14, 44)
  doc.text(`: ${mutation.created_by_name || 'Administrator'}`, 45, 44)

  // Right column
  doc.text('Keterangan', pageWidth / 2 + 5, 32)
  const keteranganText = mutation.keterangan || '-'
  const splitKeterangan = doc.splitTextToSize(keteranganText, pageWidth / 2 - 20)
  doc.text(`: `, pageWidth / 2 + 28, 32)
  doc.text(splitKeterangan, pageWidth / 2 + 32, 32)

  // 3. Table of materials
  const head = [['No', 'Kode Bahan', 'Nama Bahan Baku', 'Gudang', 'Qty', 'Satuan', 'Keterangan']]
  const body = mutation.items.map((item, idx) => [
    idx + 1,
    item.kode_bahan,
    item.nama_bahan,
    item.nama_gudang,
    formatNumber(item.qty),
    item.nama_satuan,
    item.keterangan_detail || '-'
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
      3: { cellWidth: 32 },
      4: { cellWidth: 20, halign: 'right' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 35 }
    }
  })

  // Table summary
  const lastY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(31, 41, 55)
  doc.text(`Total Jenis Bahan: ${mutation.total_items} item`, 14, lastY)
  doc.text(`Total Jumlah (Qty): ${formatNumber(mutation.total_qty)}`, 80, lastY)

  // 4. Signature Section
  const sigY = Math.min(lastY + 18, pageHeight - 35)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)

  // Dibuat Oleh
  doc.text('Dibuat Oleh,', 25, sigY)
  doc.text('(____________________)', 14, sigY + 22)
  doc.setFontSize(7.5)
  doc.setTextColor(148, 163, 184)
  doc.text('Petugas Gudang', 25, sigY + 26)

  // Disetujui Oleh
  doc.setFontSize(8.5)
  doc.setTextColor(31, 41, 55)
  doc.text('Disetujui Oleh,', pageWidth / 2 - 12, sigY)
  doc.text('(____________________)', pageWidth / 2 - 22, sigY + 22)
  doc.setFontSize(7.5)
  doc.setTextColor(148, 163, 184)
  doc.text('Kepala Produksi / SPV', pageWidth / 2 - 18, sigY + 26)

  // Diterima Oleh
  doc.setFontSize(8.5)
  doc.setTextColor(31, 41, 55)
  doc.text('Diterima Oleh,', pageWidth - 45, sigY)
  doc.text('(____________________)', pageWidth - 55, sigY + 22)
  doc.setFontSize(7.5)
  doc.setTextColor(148, 163, 184)
  doc.text('Pemohon / Bagian Terkait', pageWidth - 52, sigY + 26)

  // Footer
  doc.setFontSize(7.5)
  doc.setTextColor(148, 163, 184)
  doc.text(
    `Dicetak pada ${new Date().toLocaleString('id-ID')} | Impact Furniture ERP v2`,
    14,
    pageHeight - 6
  )

  const safeFilename = `${mutation.kode.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`
  doc.save(safeFilename)
}

/**
 * Trigger print dialog on current window or print-friendly view
 */
export function printMutationDocument(): void {
  window.print()
}
