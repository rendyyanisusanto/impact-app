import { ref, reactive, computed } from 'vue'
import type {
  PurchaseOrderFormValues,
  PurchaseOrderDetailRow,
  PurchaseOrderCreatePayload,
  PurchaseOrderUpdatePayload
} from '../types/purchase-order.types'
import { purchaseOrderService } from '../services/purchase-order.service'
import { validatePurchaseOrderForm } from '../utils/purchase-order-validation'
import { calculateDocumentSummary } from '../utils/purchase-order-calculations'

export function getTodayDateString(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function usePurchaseOrderForm(initialId?: number) {
  const isEditing = computed(() => !!initialId)
  const isSubmitting = ref(false)
  const generalErrors = ref<Record<string, string>>({})
  const ppnPersen = ref(11)

  const header = reactive<PurchaseOrderFormValues>({
    id: initialId,
    kode: '',
    suplier_id: null,
    tanggal: getTodayDateString(),
    keterangan: '',
    is_ppn: false,
    ppn_id: 1,
    status_transaksi_id: 1, // 1 = CASH, 2 = JATUH TEMPO
    status: 0, // 0 = Draft, 1 = Disetujui
    diskon_persen: 0
  })

  // Snapshot for dirty tracking
  const initialSnapshot = ref<string>('')

  function takeSnapshot(rows: PurchaseOrderDetailRow[]) {
    initialSnapshot.value = JSON.stringify({
      header: { ...header },
      rows: rows.map(r => ({
        bahan_id: r.bahan_id,
        qty: r.qty,
        harga: r.harga,
        diskon: r.diskon,
        keterangan: r.keterangan
      }))
    })
  }

  function isFormDirty(currentRows: PurchaseOrderDetailRow[]): boolean {
    if (!initialSnapshot.value) return false
    const current = JSON.stringify({
      header: { ...header },
      rows: currentRows.map(r => ({
        bahan_id: r.bahan_id,
        qty: r.qty,
        harga: r.harga,
        diskon: r.diskon,
        keterangan: r.keterangan
      }))
    })
    return initialSnapshot.value !== current
  }

  /**
   * Muat tarif PPN dari database: pakai tarif milik PO (preferredId) bila ada, jika tidak tarif aktif.
   */
  async function loadTaxRate(preferredId?: number | null) {
    try {
      const taxes = await purchaseOrderService.getTaxes()
      const chosen =
        (preferredId ? taxes.find(t => t.id === preferredId) : undefined) ??
        taxes.find(t => t.is_active === 1)
      if (chosen && Number(chosen.nama) >= 0) {
        ppnPersen.value = Number(chosen.nama)
        header.ppn_id = chosen.id
      }
    } catch {
      // tetap memakai nilai default
    }
  }

  async function generateNewCode() {
    const code = await purchaseOrderService.generateCode(header.tanggal)
    header.kode = code
  }

  async function submitOrder(rows: PurchaseOrderDetailRow[]) {
    if (isSubmitting.value) return null
    generalErrors.value = {}

    // 1. Validate Form
    const validation = validatePurchaseOrderForm(header, rows)
    if (!validation.isValid) {
      generalErrors.value = validation.errors

      // Mark cell errors onto rows
      for (const row of rows) {
        row.errors = {}
      }
      for (const err of validation.detailErrors) {
        const targetRow = rows.find(r => r.row_id === err.row_id)
        if (targetRow) {
          targetRow.errors = err.errors
        }
      }

      const firstError = Object.values(validation.errors)[0] || 'Periksa kembali data yang diinput.'
      throw new Error(firstError)
    }

    isSubmitting.value = true

    try {
      // 2. Filter active rows
      const activeRows = rows.filter(r => r.bahan_id !== null && r.bahan_id !== undefined)

      // 3. Compute live summary for persistence
      const summary = calculateDocumentSummary(activeRows, header.is_ppn, ppnPersen.value, header.diskon_persen)

      if (isEditing.value && header.id) {
        const payload: PurchaseOrderUpdatePayload = {
          id: header.id,
          header: {
            kode: header.kode,
            suplier_id: Number(header.suplier_id),
            tanggal: header.tanggal,
            keterangan: header.keterangan,
            is_ppn: header.is_ppn ? 1 : 0,
            ppn_id: header.is_ppn ? header.ppn_id || 1 : null,
            subtotal: summary.subtotal,
            diskon: summary.diskon_nominal,
            total_ppn: summary.total_ppn,
            total: summary.total,
            status: header.status,
            status_transaksi_id: Number(header.status_transaksi_id)
          },
          details: activeRows.map(r => ({
            bahan_id: Number(r.bahan_id),
            qty: Number(r.qty),
            satuan_beli_id: Number(r.satuan_beli_id || 1),
            harga: Number(r.harga || 0),
            diskon: Number(r.diskon || 0),
            subtotal: Number(r.subtotal || 0),
            keterangan: r.keterangan || null
          }))
        }
        const result = await purchaseOrderService.update(header.id, payload)
        return result
      } else {
        const payload: PurchaseOrderCreatePayload = {
          header: {
            kode: header.kode,
            suplier_id: Number(header.suplier_id),
            tanggal: header.tanggal,
            keterangan: header.keterangan,
            is_ppn: header.is_ppn ? 1 : 0,
            ppn_id: header.is_ppn ? header.ppn_id || 1 : null,
            subtotal: summary.subtotal,
            diskon: summary.diskon_nominal,
            total_ppn: summary.total_ppn,
            total: summary.total,
            status: header.status,
            status_transaksi_id: Number(header.status_transaksi_id)
          },
          details: activeRows.map(r => ({
            bahan_id: Number(r.bahan_id),
            qty: Number(r.qty),
            satuan_beli_id: Number(r.satuan_beli_id || 1),
            harga: Number(r.harga || 0),
            diskon: Number(r.diskon || 0),
            subtotal: Number(r.subtotal || 0),
            keterangan: r.keterangan || null
          }))
        }
        const result = await purchaseOrderService.create(payload)
        return result
      }
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    header,
    isEditing,
    isSubmitting,
    generalErrors,
    ppnPersen,
    loadTaxRate,
    generateNewCode,
    takeSnapshot,
    isFormDirty,
    submitOrder
  }
}
