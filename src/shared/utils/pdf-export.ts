import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ExportOptions } from '../types/crud.types'

export function exportToPdf<T = unknown>(options: ExportOptions<T>): void {
  const {
    filename,
    title,
    subtitle,
    columns,
    data,
    orientation = 'landscape',
    filterInfo
  } = options

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // 1. Header & Company Identity
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(15, 118, 110) // #0F766E Primary Teal
  doc.text('IMPACT FURNITURE', 14, 15)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139) // Slate 500
  doc.text('Enterprise Management Information System', 14, 19)

  // 2. Report Title & Meta
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(31, 41, 55) // Slate 800
  doc.text(title, 14, 27)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  const metaText = subtitle ? `${subtitle} | ` : ''
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  doc.text(
    `${metaText}Tanggal Cetak: ${dateStr}${filterInfo ? ` | Filter: ${filterInfo}` : ''}`,
    14,
    32
  )

  // Divider line
  doc.setDrawColor(217, 224, 231) // Border color #D9E0E7
  doc.line(14, 35, pageWidth - 14, 35)

  // 3. Prepare Table Headers and Body
  const head = [columns.map(col => col.label)]
  const body = data.map((item, index) => {
    return columns.map(col => {
      if (col.key === 'no') {
        return index + 1
      }
      const rawVal = (item as Record<string, unknown>)[col.key as string]
      const cellVal = col.formatter ? col.formatter(rawVal, item) : rawVal
      return cellVal !== null && cellVal !== undefined ? String(cellVal) : '-'
    })
  })

  // 4. Render Table with autoTable
  autoTable(doc, {
    startY: 38,
    head,
    body,
    margin: { left: 14, right: 14, top: 38, bottom: 20 },
    theme: 'grid',
    headStyles: {
      fillColor: [15, 118, 110], // #0F766E
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
      cellPadding: 2.5
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [31, 41, 55],
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Slate 50
    },
    didDrawPage: data => {
      // Footer with page numbering
      const pageNumber = data.pageNumber
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      doc.text(
        `Halaman ${pageNumber} dari ${doc.getNumberOfPages()}`,
        pageWidth - 14,
        pageHeight - 10,
        { align: 'right' }
      )
      doc.text('Dokumen ini dicetak otomatis dari Impact Furniture ERP v2', 14, pageHeight - 10)
    }
  })

  // 5. Download file
  const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
  doc.save(safeFilename)
}
