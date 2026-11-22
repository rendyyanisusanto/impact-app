import { ref } from 'vue'
import type { GoodsReceiptDetailRow } from '../types/goods-receipt.types'
import { calculateGoodsReceiptRowSubtotal } from '../utils/goods-receipt-calculations'

export function useGoodsReceiptSpreadsheet() {
  const rows = ref<GoodsReceiptDetailRow[]>([])
  const activeCell = ref<{ rowIndex: number; colKey: string } | null>(null)
  const selectedRowIndex = ref<number | null>(null)

  function setRows(newRows: GoodsReceiptDetailRow[]) {
    rows.value = newRows.map(r => ({
      ...r,
      subtotal: calculateGoodsReceiptRowSubtotal(r.qty_terima, r.harga_satuan, r.diskon)
    }))
  }

  function setActiveCell(rowIndex: number, colKey: string) {
    if (rowIndex >= 0 && rowIndex < rows.value.length) {
      activeCell.value = { rowIndex, colKey }
      selectedRowIndex.value = rowIndex
    }
  }

  function updateCell(rowIndex: number, colKey: keyof GoodsReceiptDetailRow, value: unknown) {
    if (rowIndex < 0 || rowIndex >= rows.value.length) return
    const row = rows.value[rowIndex]
    ;(row as Record<string, unknown>)[colKey] = value

    // Recalculate subtotal
    row.subtotal = calculateGoodsReceiptRowSubtotal(row.qty_terima, row.harga_satuan, row.diskon)

    // Clear error for that cell if resolved
    if (row.errors && row.errors[colKey as keyof typeof row.errors]) {
      delete row.errors[colKey as keyof typeof row.errors]
    }
  }

  function handleCellKeyDown(event: KeyboardEvent, rowIndex: number, colKey: string) {
    const editableCols = ['qty_terima']
    const currentColIdx = editableCols.indexOf(colKey)

    if (event.key === 'Tab') {
      event.preventDefault()
      if (event.shiftKey) {
        // Shift+Tab backwards
        if (currentColIdx > 0) {
          setActiveCell(rowIndex, editableCols[currentColIdx - 1])
        } else if (rowIndex > 0) {
          setActiveCell(rowIndex - 1, editableCols[editableCols.length - 1])
        }
      } else {
        // Tab forwards
        if (currentColIdx < editableCols.length - 1) {
          setActiveCell(rowIndex, editableCols[currentColIdx + 1])
        } else if (rowIndex < rows.value.length - 1) {
          setActiveCell(rowIndex + 1, editableCols[0])
        }
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (rowIndex > 0) {
        setActiveCell(rowIndex - 1, colKey)
      }
    } else if (event.key === 'ArrowDown' || event.key === 'Enter') {
      event.preventDefault()
      if (rowIndex < rows.value.length - 1) {
        setActiveCell(rowIndex + 1, colKey)
      }
    }
  }

  return {
    rows,
    activeCell,
    selectedRowIndex,
    setRows,
    setActiveCell,
    updateCell,
    handleCellKeyDown
  }
}
