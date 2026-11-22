import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { ProductionListItem, ProductionWithItems } from '../types/production.types'
import { formatNumber } from '@/shared/utils/formatters'

/**
 * Export production list items to Excel (.xlsx)
 */
export function exportProductionListExcel(
  items: ProductionListItem[],
  filename = 'Daftar_Transaksi_Produksi'
): void {
  const data = items.map((item, index) => ({
    No: index + 1,
    'No Produksi': item.kode,
    Tanggal: item.tanggal,
    Jenis: item.jenis_label,
    'Status Produksi': item.status_produksi_label,
    'Status Dokumen': item.status_label,
    'Jumlah Produk': item.jumlah_jenis_produk,
    'Total Qty': item.total_qty,
    Keterangan: item.keterangan || '-'
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Produksi')

  // Auto-fit column widths
  const colWidths = [
    { wch: 6 },
    { wch: 18 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 30 }
  ]
  worksheet['!cols'] = colWidths

  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

/**
 * Export production list table to PDF
 */
export function exportProductionListPdf(
  items: ProductionListItem[],
  filename = 'Daftar_Transaksi_Produksi'
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()

  // Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(52, 69, 79) // Enterprise Dark Slate #34454F
  doc.text('IMPACT FURNITURE', 14, 15)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text('Jl. Pogot No.72, Surabaya | Laporan Transaksi Produksi', 14, 20)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(30, 41, 59)
  doc.text('DAFTAR TRANSAKSI PRODUKSI', pageWidth - 14, 15, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, pageWidth - 14, 20, {
    align: 'right'
  })

  doc.setDrawColor(226, 232, 240)
  doc.line(14, 24, pageWidth - 14, 24)

  const head = [
    [
      'No',
      'No Produksi',
      'Tanggal',
      'Jenis',
      'Status Produksi',
      'Status',
      'Jml Produk',
      'Total Qty',
      'Keterangan'
    ]
  ]

  const body = items.map((item, idx) => [
    idx + 1,
    item.kode,
    item.tanggal,
    item.jenis_label,
    item.status_produksi_label,
    item.status_label,
    item.jumlah_jenis_produk,
    formatNumber(item.total_qty),
    item.keterangan || '-'
  ])

  autoTable(doc, {
    startY: 28,
    head,
    body,
    theme: 'grid',
    headStyles: {
      fillColor: [52, 69, 79],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 28 },
      2: { halign: 'center', cellWidth: 24 },
      3: { halign: 'center', cellWidth: 26 },
      4: { halign: 'center', cellWidth: 26 },
      5: { halign: 'center', cellWidth: 22 },
      6: { halign: 'right', cellWidth: 22 },
      7: { halign: 'right', cellWidth: 22 },
      8: { halign: 'left' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  })

  doc.save(`${filename}_${new Date().toISOString().slice(0, 10)}.pdf`)
}

/**
 * Generate and download formatted Surat Perintah Kerja (SPK) Produksi PDF
 */
export function exportProductionDetailPdf(production: ProductionWithItems): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Company Identity Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(52, 69, 79)
  doc.text('IMPACT FURNITURE', 14, 15)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text(
    'Jl. Pogot No.72, Tanah Kali Kedinding, Kec. Kenjeran, Surabaya, Jawa Timur 60129',
    14,
    20
  )
  doc.text('No. Telp/HP: 081334791464', 14, 24)

  // Document Title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(30, 41, 59)
  doc.text('SURAT PERINTAH KERJA (SPK)', pageWidth - 14, 15, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(`No Produksi: ${production.kode || '-'}`, pageWidth - 14, 20, { align: 'right' })
  doc.text(`Tanggal: ${production.tanggal || '-'}`, pageWidth - 14, 24, { align: 'right' })

  // Divider
  doc.setDrawColor(203, 213, 225)
  doc.line(14, 28, pageWidth - 14, 28)

  // Document Metadata Section
  doc.setFontSize(9)
  doc.setTextColor(51, 65, 85)

  const jenisLabel = production.jenis_produksi === 1 ? 'Pesanan' : 'Non Pesanan / Stok'
  const statusProdLabel =
    production.status_produksi === 2
      ? 'Selesai'
      : production.status_produksi === 1
        ? 'Proses'
        : 'Pending'

  doc.text('Jenis Produksi', 14, 35)
  doc.text(`: ${jenisLabel}`, 45, 35)

  doc.text('Status Produksi', 14, 41)
  doc.text(`: ${statusProdLabel}`, 45, 41)

  doc.text('Keterangan', 14, 47)
  doc.text(`: ${production.keterangan || '-'}`, 45, 47)

  doc.text('Total Produk', pageWidth / 2 + 10, 35)
  doc.text(`: ${production.jumlah_jenis_produk} jenis`, pageWidth / 2 + 45, 35)

  doc.text('Total Qty Target', pageWidth / 2 + 10, 41)
  doc.text(`: ${formatNumber(production.total_qty)} Unit`, pageWidth / 2 + 45, 41)

  doc.text('Status Dokumen', pageWidth / 2 + 10, 47)
  doc.text(`: ${production.is_posted ? 'Posted (Selesai)' : 'Draft'}`, pageWidth / 2 + 45, 47)

  // Products Table
  const prodHead = [
    ['No', 'Kode Produk', 'Nama Produk', 'Stok Saat Ini', 'Qty Target', 'Keterangan']
  ]
  const prodBody = production.items.map((item, idx) => [
    idx + 1,
    item.kode_produk || '-',
    item.nama_produk || '-',
    formatNumber(item.stok),
    formatNumber(item.qty),
    item.keterangan || '-'
  ])

  autoTable(doc, {
    startY: 53,
    head: prodHead,
    body: prodBody,
    theme: 'grid',
    headStyles: {
      fillColor: [52, 69, 79],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 30 },
      2: { halign: 'left' },
      3: { halign: 'right', cellWidth: 25 },
      4: { halign: 'right', cellWidth: 25 },
      5: { halign: 'left', cellWidth: 40 }
    }
  })

  let finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  // Material Requirements Preview Table if available
  if (production.material_requirements && production.material_requirements.length > 0) {
    if (finalY > pageHeight - 70) {
      doc.addPage()
      finalY = 20
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(30, 41, 59)
    doc.text('Estimasi Kebutuhan Bahan Baku (BoM Calculation)', 14, finalY)

    finalY += 3

    const matHead = [
      ['No', 'Kode Bahan', 'Nama Bahan Baku', 'Satuan', 'Kebutuhan Total', 'Stok Gudang', 'Status']
    ]
    const matBody = production.material_requirements.map((m, idx) => [
      idx + 1,
      m.kode_bahan,
      m.nama_bahan,
      m.satuan_nama,
      formatNumber(m.total_kebutuhan),
      formatNumber(m.stok_tersedia),
      m.status
    ])

    autoTable(doc, {
      startY: finalY,
      head: matHead,
      body: matBody,
      theme: 'grid',
      headStyles: {
        fillColor: [71, 85, 105],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [51, 65, 85]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 28 },
        2: { halign: 'left' },
        3: { halign: 'center', cellWidth: 22 },
        4: { halign: 'right', cellWidth: 25 },
        5: { halign: 'right', cellWidth: 25 },
        6: { halign: 'center', cellWidth: 20 }
      }
    })

    finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12
  } else {
    finalY += 8
  }

  // Signatures Section (3 blocks)
  if (finalY > pageHeight - 40) {
    doc.addPage()
    finalY = 25
  }

  const colWidth = (pageWidth - 28) / 3
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)

  doc.text('Dibuat oleh,', 14 + colWidth * 0.15, finalY)
  doc.text('Diperiksa,', 14 + colWidth * 1.25, finalY)
  doc.text('Disetujui,', 14 + colWidth * 2.35, finalY)

  doc.text('( Bag. PPIC )', 14 + colWidth * 0.15, finalY + 22)
  doc.text('( Kepala Produksi )', 14 + colWidth * 1.25, finalY + 22)
  doc.text('( Factory Manager )', 14 + colWidth * 2.35, finalY + 22)

  doc.save(`SPK_${production.kode || 'Produksi'}.pdf`)
}
