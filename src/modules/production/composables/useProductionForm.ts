import { ref, reactive, computed, watch } from 'vue'
import type {
  ProductionProductRow,
  SelectableProduct,
  CalculatedMaterialRequirement
} from '../types/production.types'
import { bomService } from '../services/bom.service'
import { materialService } from '@/modules/inventory/materials/services/material.service'
import {
  calculateProductionTotals,
  calculateProductionMaterialRequirements
} from '../utils/production-calculations'
import { validateProductionForm } from '../utils/production-validation'

export function useProductionForm(isEdit = false) {
  let rowIdSeq = 1

  function createEmptyRow(): ProductionProductRow {
    return {
      rowId: `row-${Date.now()}-${rowIdSeq++}`,
      produk_id: null,
      kode_produk: '',
      nama_produk: '',
      stok: 0,
      qty: 1,
      keterangan: '',
      has_bom: false
    }
  }

  // Header form state matching screenshot order:
  // 1. No Produksi
  // 2. Jenis
  // 3. Tanggal
  // 4. Status Produksi
  // 5. Keterangan
  const form = reactive({
    id: 0,
    kode: '',
    jenis_produksi: 1, // Default: Pesanan
    tanggal: new Date().toISOString().slice(0, 10),
    status_produksi: 0, // Default: Pending
    keterangan: ''
  })

  // Initialize spreadsheet with 10 empty rows
  const rows = ref<ProductionProductRow[]>(
    isEdit ? [] : Array.from({ length: 10 }, () => createEmptyRow())
  )

  const activeCell = ref<{ rowIndex: number; colKey: string } | null>(null)
  const isDirty = ref(false)
  const isSubmitting = ref(false)
  const materialRequirements = ref<CalculatedMaterialRequirement[]>([])
  const isCalculatingReqs = ref(false)

  // Track initial state to detect dirty changes
  let initialStateSnapshot = ''

  function recordSnapshot() {
    initialStateSnapshot = JSON.stringify({
      form,
      rows: rows.value.map(r => ({
        produk_id: r.produk_id,
        qty: r.qty,
        keterangan: r.keterangan
      }))
    })
    isDirty.value = false
  }

  function checkDirty() {
    const current = JSON.stringify({
      form,
      rows: rows.value.map(r => ({
        produk_id: r.produk_id,
        qty: r.qty,
        keterangan: r.keterangan
      }))
    })
    isDirty.value = current !== initialStateSnapshot
  }

  watch([form, rows], () => checkDirty(), { deep: true })

  // Spreadsheet Row operations
  function addRow(count = 1) {
    for (let i = 0; i < count; i++) {
      rows.value.push(createEmptyRow())
    }
    isDirty.value = true
  }

  function removeRow(index: number) {
    if (rows.value.length > 1) {
      rows.value.splice(index, 1)
      isDirty.value = true
      if (activeCell.value && activeCell.value.rowIndex >= rows.value.length) {
        activeCell.value = {
          rowIndex: rows.value.length - 1,
          colKey: activeCell.value.colKey
        }
      }
      refreshRequirements()
    }
  }

  function setActiveCell(rowIndex: number, colKey: string) {
    activeCell.value = { rowIndex, colKey }
  }

  function updateCell(rowIndex: number, colKey: keyof ProductionProductRow, value: unknown) {
    const target = rows.value[rowIndex]
    if (!target) return
    ;(target as unknown as Record<string, unknown>)[colKey] = value
    isDirty.value = true

    if (colKey === 'qty' || colKey === 'produk_id') {
      refreshRequirements()
    }
  }

  function selectProduct(rowIndex: number, product: SelectableProduct) {
    const target = rows.value[rowIndex]
    if (!target) return

    target.produk_id = product.id
    target.kode_produk = product.kode
    target.nama_produk = product.nama
    target.stok = product.qty
    target.satuan_nama = product.satuan_nama
    target.has_bom = product.has_bom
    if (!target.qty || target.qty <= 0) {
      target.qty = 1
    }

    isDirty.value = true

    // Move active cell to Qty column
    setActiveCell(rowIndex, 'qty')
    refreshRequirements()
  }

  // Keyboard navigation across cells
  const colOrder = ['nama_produk', 'qty', 'keterangan']

  function handleCellKeydown(event: KeyboardEvent, rowIndex: number, colKey: string) {
    const currentColIdx = colOrder.indexOf(colKey)

    if (event.key === 'Tab') {
      event.preventDefault()
      if (event.shiftKey) {
        if (currentColIdx > 0) {
          setActiveCell(rowIndex, colOrder[currentColIdx - 1])
        } else if (rowIndex > 0) {
          setActiveCell(rowIndex - 1, colOrder[colOrder.length - 1])
        }
      } else {
        if (currentColIdx < colOrder.length - 1) {
          setActiveCell(rowIndex, colOrder[currentColIdx + 1])
        } else {
          if (rowIndex === rows.value.length - 1) {
            addRow(1)
          }
          setActiveCell(rowIndex + 1, colOrder[0])
        }
      }
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (rowIndex === rows.value.length - 1) {
        addRow(1)
      }
      setActiveCell(rowIndex + 1, colKey)
    } else if (event.key === 'ArrowDown') {
      if (rowIndex < rows.value.length - 1) {
        event.preventDefault()
        setActiveCell(rowIndex + 1, colKey)
      }
    } else if (event.key === 'ArrowUp') {
      if (rowIndex > 0) {
        event.preventDefault()
        setActiveCell(rowIndex - 1, colKey)
      }
    } else if (event.key === 'Delete' && (colKey === 'nama_produk' || colKey === 'keterangan')) {
      const target = rows.value[rowIndex]
      if (target) {
        if (colKey === 'nama_produk') {
          target.produk_id = null
          target.kode_produk = ''
          target.nama_produk = ''
          target.stok = 0
          target.has_bom = false
          refreshRequirements()
        } else {
          target.keterangan = ''
        }
      }
    }
  }

  // Live BoM Material Requirements Preview Recalculation
  async function refreshRequirements() {
    isCalculatingReqs.value = true
    try {
      const validItems = rows.value
        .filter(r => (r.produk_id || 0) > 0 && Number(r.qty || 0) > 0)
        .map(r => ({ produk_id: r.produk_id as number, qty: Number(r.qty) }))

      if (validItems.length === 0) {
        materialRequirements.value = []
        return
      }

      // Fetch BoM templates for selected products
      const productBomMap = new Map()
      for (const item of validItems) {
        if (!productBomMap.has(item.produk_id)) {
          const bom = await bomService.getTemplateByProductId(item.produk_id)
          productBomMap.set(item.produk_id, bom)
        }
      }

      const allMaterials = materialService.getRawItems()

      materialRequirements.value = calculateProductionMaterialRequirements(
        validItems,
        productBomMap,
        allMaterials.map(m => ({
          id: m.id,
          kode: m.kode || '',
          nama: m.nama || '',
          satuan_id: m.satuan_pakai_id || 1,
          satuan_nama: m.satuan_pakai_nama || 'Satuan',
          qty: Number(m.qty || 0)
        }))
      )
    } finally {
      isCalculatingReqs.value = false
    }
  }

  const totals = computed(() => {
    return calculateProductionTotals(rows.value)
  })

  const hasUnassignedBom = computed(() => {
    return rows.value.some(r => r.produk_id && !r.has_bom)
  })

  function validate() {
    return validateProductionForm(form, rows.value)
  }

  return {
    form,
    rows,
    activeCell,
    isDirty,
    isSubmitting,
    materialRequirements,
    isCalculatingReqs,
    totals,
    hasUnassignedBom,
    createEmptyRow,
    recordSnapshot,
    addRow,
    removeRow,
    setActiveCell,
    updateCell,
    selectProduct,
    handleCellKeydown,
    refreshRequirements,
    validate
  }
}
