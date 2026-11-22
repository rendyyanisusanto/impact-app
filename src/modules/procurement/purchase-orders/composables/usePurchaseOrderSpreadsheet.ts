import { ref, nextTick } from 'vue'
import type { PurchaseOrderDetailRow } from '../types/purchase-order.types'
import { calculateRowSubtotal } from '../utils/purchase-order-calculations'

export const EDITABLE_COLUMNS = [
  'nama_bahan',
  'nama_satuan',
  'qty',
  'harga',
  'diskon',
  'keterangan'
] as const

export type EditableColumnKey = (typeof EDITABLE_COLUMNS)[number]

export function createEmptyRow(index = 0): PurchaseOrderDetailRow {
  return {
    row_id: `row-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    bahan_id: null,
    nama_bahan: '',
    satuan_beli_id: null,
    nama_satuan: '',
    stok: 0,
    qty: null,
    harga: null,
    diskon: 0,
    subtotal: 0,
    keterangan: '',
    errors: {}
  }
}

export function usePurchaseOrderSpreadsheet(initialRowsCount = 10) {
  const rows = ref<PurchaseOrderDetailRow[]>([])

  // Initialize with empty rows
  function initRows(existing?: PurchaseOrderDetailRow[]) {
    if (existing && existing.length > 0) {
      rows.value = existing.map(r => ({ ...r }))
    } else {
      const emptyList: PurchaseOrderDetailRow[] = []
      for (let i = 0; i < initialRowsCount; i++) {
        emptyList.push(createEmptyRow(i))
      }
      rows.value = emptyList
    }
  }

  // Active cell and selection state
  const activeCell = ref<{ rowIndex: number; colKey: string } | null>(null)
  const selectedRowIndex = ref<number | null>(null)

  // Material picker state
  const isPickerOpen = ref(false)
  const pickerTargetRowIndex = ref<number | null>(null)
  const pickerAnchorRect = ref<{ top: number; left: number; width: number; height: number } | null>(
    null
  )

  function setActiveCell(rowIndex: number, colKey: string) {
    if (rowIndex < 0 || rowIndex >= rows.value.length) return
    activeCell.value = { rowIndex, colKey }
    selectedRowIndex.value = rowIndex
  }

  function addRow(count = 1) {
    for (let i = 0; i < count; i++) {
      rows.value.push(createEmptyRow(rows.value.length))
    }
    const newIdx = rows.value.length - 1
    setActiveCell(newIdx, 'nama_bahan')
  }

  function removeRow(index?: number) {
    const targetIdx = index !== undefined ? index : selectedRowIndex.value
    if (targetIdx === null || targetIdx < 0 || targetIdx >= rows.value.length) return

    rows.value.splice(targetIdx, 1)

    // Ensure at least 1 empty row remains
    if (rows.value.length === 0) {
      rows.value.push(createEmptyRow(0))
    }

    const nextIdx = Math.min(targetIdx, rows.value.length - 1)
    setActiveCell(nextIdx, 'nama_bahan')
  }

  function openMaterialPicker(rowIndex: number, anchorEl?: HTMLElement | null) {
    pickerTargetRowIndex.value = rowIndex
    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect()
      pickerAnchorRect.value = {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      }
    } else {
      pickerAnchorRect.value = null
    }
    isPickerOpen.value = true
  }

  function closeMaterialPicker() {
    isPickerOpen.value = false
    pickerTargetRowIndex.value = null
  }

  function selectMaterialForActiveRow(material: {
    id: number
    kode: string
    nama: string
    qty: number
    satuan_beli_id: number | null
    satuan_beli_nama?: string
    harga_satuan: number | null
  }) {
    const idx = pickerTargetRowIndex.value
    if (idx === null || idx < 0 || idx >= rows.value.length) return

    const targetRow = rows.value[idx]
    targetRow.bahan_id = material.id
    targetRow.nama_bahan = material.nama
    targetRow.satuan_beli_id = material.satuan_beli_id
    targetRow.nama_satuan = material.satuan_beli_nama || 'Pcs'
    targetRow.stok = material.qty ?? 0

    // If row price is not yet set or 0, default to material's standard price
    if (!targetRow.harga || targetRow.harga === 0) {
      targetRow.harga = material.harga_satuan ?? 0
    }

    // Default qty to 1 if empty
    if (!targetRow.qty || targetRow.qty === 0) {
      targetRow.qty = 1
    }

    // Recalculate subtotal
    targetRow.subtotal = calculateRowSubtotal(targetRow.qty, targetRow.harga, targetRow.diskon)

    // Clear validation error on material
    if (targetRow.errors) {
      delete targetRow.errors.bahan_id
    }

    closeMaterialPicker()

    // Excel-like UX: Automatically shift focus to Qty cell
    nextTick(() => {
      setActiveCell(idx, 'qty')
      const qtyInput = document.querySelector<HTMLInputElement>(`[data-cell-id="${idx}-qty"] input`)
      if (qtyInput) {
        qtyInput.focus()
        qtyInput.select()
      }
    })
  }

  // Keyboard navigation across spreadsheet cells
  function handleCellKeyDown(e: KeyboardEvent, rowIndex: number, colKey: string) {
    const colOrder = [
      'no',
      'nama_bahan',
      'nama_satuan',
      'stok',
      'qty',
      'harga',
      'diskon',
      'subtotal',
      'keterangan'
    ]
    const curColIdx = colOrder.indexOf(colKey)

    if (e.key === 'ArrowUp') {
      if (rowIndex > 0) {
        e.preventDefault()
        setActiveCell(rowIndex - 1, colKey)
      }
    } else if (e.key === 'ArrowDown') {
      if (rowIndex < rows.value.length - 1) {
        e.preventDefault()
        setActiveCell(rowIndex + 1, colKey)
      }
    } else if (e.key === 'ArrowLeft') {
      if (curColIdx > 1) {
        e.preventDefault()
        setActiveCell(rowIndex, colOrder[curColIdx - 1])
      }
    } else if (e.key === 'ArrowRight') {
      if (curColIdx < colOrder.length - 1) {
        e.preventDefault()
        setActiveCell(rowIndex, colOrder[curColIdx + 1])
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      if (e.shiftKey) {
        // Previous editable cell
        if (curColIdx > 1) {
          setActiveCell(rowIndex, colOrder[curColIdx - 1])
        } else if (rowIndex > 0) {
          setActiveCell(rowIndex - 1, colOrder[colOrder.length - 1])
        }
      } else {
        // Next editable cell
        if (curColIdx < colOrder.length - 1) {
          setActiveCell(rowIndex, colOrder[curColIdx + 1])
        } else if (rowIndex < rows.value.length - 1) {
          setActiveCell(rowIndex + 1, colOrder[1])
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      // If pressing enter on nama_bahan, open picker
      if (colKey === 'nama_bahan') {
        openMaterialPicker(rowIndex)
      } else if (rowIndex < rows.value.length - 1) {
        // Move to next row same column or add new row
        setActiveCell(rowIndex + 1, colKey)
      } else {
        addRow(1)
      }
    }
  }

  // Double-click handler: opens material picker on nama_bahan
  function handleCellDoubleClick(rowIndex: number, colKey: string, el?: HTMLElement | null) {
    setActiveCell(rowIndex, colKey)
    if (colKey === 'nama_bahan') {
      openMaterialPicker(rowIndex, el)
    }
  }

  // Update cell value & recalculate
  function updateCell(rowIndex: number, colKey: keyof PurchaseOrderDetailRow, value: unknown) {
    if (rowIndex < 0 || rowIndex >= rows.value.length) return
    const row = rows.value[rowIndex]
    ;(row as Record<string, unknown>)[colKey] = value

    if (colKey === 'qty' || colKey === 'harga' || colKey === 'diskon') {
      row.subtotal = calculateRowSubtotal(row.qty, row.harga, row.diskon)
    }
  }

  return {
    rows,
    initRows,
    activeCell,
    selectedRowIndex,
    isPickerOpen,
    pickerTargetRowIndex,
    pickerAnchorRect,
    setActiveCell,
    addRow,
    removeRow,
    openMaterialPicker,
    closeMaterialPicker,
    selectMaterialForActiveRow,
    handleCellKeyDown,
    handleCellDoubleClick,
    updateCell
  }
}
