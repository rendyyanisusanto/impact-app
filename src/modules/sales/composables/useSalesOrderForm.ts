import { ref, reactive, computed } from 'vue'
import type {
  SalesOrderFormValues,
  SalesOrderProductRow,
  SalesOrderWithDetails
} from '../types/sales-order.types'
import type { SalesOrderVariantKey } from '../config/sales-order-variants'
import { getVariantConfig } from '../config/sales-order-variants'
import { calculateOrderTotals, calculateItemSubtotal } from '../utils/sales-order-calculations'
import { validateSalesOrderForm, type ValidationResult } from '../utils/sales-order-validation'
import { salesOrderTransactionService } from '../services/sales-order-transaction.service'
import type { Produk } from '@/modules/inventory/products/types/product.types'

export function useSalesOrderForm(variant: SalesOrderVariantKey, isEdit = false) {
  const cfg = getVariantConfig(variant)

  const form = reactive<SalesOrderFormValues>({
    kode: '',
    customer_id: null,
    tanggal: new Date().toISOString().slice(0, 10),
    sales_id: null,
    keterangan: '',
    no_faktur_pajak: '',
    is_ppn: cfg.hasTax ? 1 : 0,
    ppn_id: cfg.hasTax ? 1 : null,
    ppn_rate: cfg.hasTax ? salesOrderTransactionService.getActivePpnRate() : 0,
    status: 0, // Draft default
    diskon: 0
  })

  const rows = ref<SalesOrderProductRow[]>([])
  const additionalCosts = ref<Array<{ komponen: string; jumlah: number }>>([])
  const activeCell = ref<{ rowIndex: number; colKey: string } | null>(null)
  const isDirty = ref(false)
  const isSubmitting = ref(false)
  let initialSnapshot = ''

  function createEmptyRow(): SalesOrderProductRow {
    return {
      rowId: `so-row-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      produk_id: null,
      kode_produk: '',
      nama_produk: '',
      stok_saat_ini: 0,
      satuan_nama: 'Pcs',
      qty: 0,
      status_produksi: 0,
      harga: 0,
      diskon: 0,
      subtotal: 0,
      keterangan: ''
    }
  }

  function initEmptyRows(count = 10) {
    const list: SalesOrderProductRow[] = []
    for (let i = 0; i < count; i++) {
      list.push(createEmptyRow())
    }
    rows.value = list
  }

  if (!isEdit) {
    initEmptyRows(10)
  }

  function recordSnapshot() {
    initialSnapshot = JSON.stringify({
      form,
      rows: rows.value,
      additionalCosts: additionalCosts.value
    })
    isDirty.value = false
  }

  function checkDirty() {
    const current = JSON.stringify({
      form,
      rows: rows.value,
      additionalCosts: additionalCosts.value
    })
    isDirty.value = current !== initialSnapshot
  }

  function addRow(count = 1) {
    for (let i = 0; i < count; i++) {
      rows.value.push(createEmptyRow())
    }
    checkDirty()
  }

  function removeRow(index: number) {
    if (rows.value.length > 1) {
      rows.value.splice(index, 1)
      recalculateStockClassification()
      checkDirty()
    }
  }

  function setActiveCell(rowIndex: number, colKey: string) {
    activeCell.value = { rowIndex, colKey }
  }

  function recalculateStockClassification() {
    const cumulativeUsage: Record<number, number> = {}
    rows.value.forEach(row => {
      if (!row.produk_id) return
      const currentCum = cumulativeUsage[row.produk_id] || 0
      const newCum = currentCum + (Number(row.qty) || 0)
      cumulativeUsage[row.produk_id] = newCum
      const stock = row.stok_saat_ini ?? 0
      row.status_produksi = newCum <= stock ? 0 : 1
    })

    // Hanya saat pembuatan baru (!isEdit): ketika ada produk yang diproduksi, status dokumen otomatis Draft (0)
    if (!isEdit && rows.value.some(r => (r.produk_id || 0) > 0 && Number(r.status_produksi) === 1)) {
      form.status = 0
    }
  }

  function updateCell(rowIndex: number, colKey: keyof SalesOrderProductRow, value: unknown) {
    const target = rows.value[rowIndex]
    if (!target) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(target as any)[colKey] = value

    // If qty, harga, or diskon changed, recalculate subtotal immediately
    if (colKey === 'qty' || colKey === 'harga' || colKey === 'diskon') {
      target.subtotal = calculateItemSubtotal(target.qty, target.harga, target.diskon)
    }

    if (colKey === 'qty' || colKey === 'status_produksi') {
      recalculateStockClassification()
      if (!isEdit && rows.value.some(r => (r.produk_id || 0) > 0 && Number(r.status_produksi) === 1)) {
        form.status = 0
      }
    }

    checkDirty()
  }

  function selectProduct(rowIndex: number, product: Produk) {
    const target = rows.value[rowIndex]
    if (!target) return

    target.produk_id = product.id
    target.kode_produk = product.kode || ''
    target.nama_produk = product.nama || ''
    target.satuan_nama = 'Pcs'
    target.stok_saat_ini = product.qty ?? 0
    target.harga = product.harga ?? 0

    if (target.qty === 0) {
      target.qty = 1
    }

    target.subtotal = calculateItemSubtotal(target.qty, target.harga, target.diskon)
    recalculateStockClassification()
    activeCell.value = { rowIndex, colKey: 'qty' }
    checkDirty()
  }

  function handleCellKeydown(event: KeyboardEvent, rowIndex: number, colKey: string) {
    const cols = ['nama_produk', 'qty', 'status_produksi', 'harga', 'diskon', 'keterangan']
    const currentColIdx = cols.indexOf(colKey)

    if (event.key === 'Tab') {
      event.preventDefault()
      if (event.shiftKey) {
        if (currentColIdx > 0) {
          activeCell.value = { rowIndex, colKey: cols[currentColIdx - 1] }
        } else if (rowIndex > 0) {
          activeCell.value = { rowIndex: rowIndex - 1, colKey: cols[cols.length - 1] }
        }
      } else {
        if (currentColIdx < cols.length - 1) {
          activeCell.value = { rowIndex, colKey: cols[currentColIdx + 1] }
        } else if (rowIndex < rows.value.length - 1) {
          activeCell.value = { rowIndex: rowIndex + 1, colKey: cols[0] }
        } else {
          addRow(1)
          activeCell.value = { rowIndex: rowIndex + 1, colKey: cols[0] }
        }
      }
    } else if (event.key === 'ArrowDown') {
      if (rowIndex < rows.value.length - 1) {
        activeCell.value = { rowIndex: rowIndex + 1, colKey }
      }
    } else if (event.key === 'ArrowUp') {
      if (rowIndex > 0) {
        activeCell.value = { rowIndex: rowIndex - 1, colKey }
      }
    }
  }

  // Biaya Tambahan methods
  function addCost() {
    additionalCosts.value.push({ komponen: '', jumlah: 0 })
    checkDirty()
  }

  function removeCost(index: number) {
    additionalCosts.value.splice(index, 1)
    checkDirty()
  }

  function updateCost(index: number, field: 'komponen' | 'jumlah', value: unknown) {
    const cost = additionalCosts.value[index]
    if (cost) {
      if (field === 'jumlah') {
        cost.jumlah = Math.max(0, Number(value) || 0)
      } else {
        cost.komponen = String(value)
      }
      checkDirty()
    }
  }

  function updateDiscount(val: number) {
    form.diskon = Math.max(0, Number(val) || 0)
    checkDirty()
  }

  // Computed Totals
  const totals = computed(() => {
    return calculateOrderTotals(
      variant,
      rows.value,
      additionalCosts.value,
      form.ppn_rate,
      form.diskon || 0
    )
  })

  const distinctProductsCount = computed(() => {
    const ids = new Set(rows.value.filter(r => (r.produk_id || 0) > 0).map(r => r.produk_id))
    return ids.size
  })

  const hasProductionItems = computed(() => {
    return rows.value.some(r => (r.produk_id || 0) > 0 && Number(r.status_produksi) === 1)
  })

  const totalQty = computed(() => {
    return rows.value.reduce((sum, r) => sum + (Number(r.qty) || 0), 0)
  })

  function validate(options?: { isProductionCompleted?: boolean }): ValidationResult {
    return validateSalesOrderForm(variant, form, rows.value, {
      isEdit,
      isProductionCompleted: options?.isProductionCompleted
    })
  }

  function populateFromExisting(order: SalesOrderWithDetails) {
    form.id = order.id
    form.kode = order.kode
    form.customer_id = order.customer_id
    form.tanggal = order.tanggal
    form.sales_id = order.sales_id ?? 0
    form.keterangan = order.keterangan || ''
    form.no_faktur_pajak = order.no_faktur_pajak || ''
    form.is_ppn = order.is_ppn
    form.ppn_id = order.ppn_id
    form.status = order.status
    form.diskon = order.diskon || 0

    rows.value = order.items.map((item, idx) => ({
      rowId: `so-row-loaded-${item.id || idx}`,
      id: item.id,
      produk_id: item.produk_id,
      kode_produk: item.kode_produk || '',
      nama_produk: item.nama_produk || '',
      stok_saat_ini: item.stok_saat_ini || 0,
      satuan_nama: item.satuan_nama || 'Pcs',
      qty: item.qty,
      status_produksi: item.status_produksi || 0,
      harga: item.harga,
      diskon: item.diskon,
      subtotal: item.subtotal,
      keterangan: item.keterangan || ''
    }))

    if (order.biaya_tambahan && order.biaya_tambahan.length > 0) {
      additionalCosts.value = order.biaya_tambahan.map(b => ({
        komponen: b.komponen,
        jumlah: b.jumlah
      }))
    } else {
      additionalCosts.value = []
    }

    recordSnapshot()
  }

  return {
    form,
    rows,
    additionalCosts,
    activeCell,
    isDirty,
    isSubmitting,
    totals,
    distinctProductsCount,
    hasProductionItems,
    totalQty,
    recordSnapshot,
    checkDirty,
    initEmptyRows,
    addRow,
    removeRow,
    setActiveCell,
    updateCell,
    selectProduct,
    handleCellKeydown,
    addCost,
    removeCost,
    updateCost,
    updateDiscount,
    validate,
    populateFromExisting
  }
}
