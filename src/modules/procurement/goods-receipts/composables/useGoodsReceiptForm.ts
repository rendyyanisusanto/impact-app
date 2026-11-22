import { ref, reactive, computed } from 'vue'
import type {
  GoodsReceiptFormValues,
  GoodsReceiptDetailRow,
  GoodsReceiptCreatePayload,
  GoodsReceiptUpdatePayload,
  GoodsReceiptListItem
} from '../types/goods-receipt.types'
import { goodsReceiptService } from '../services/goods-receipt.service'
import { validateGoodsReceiptForm } from '../utils/goods-receipt-validation'
import { calculateGoodsReceiptSummary } from '../utils/goods-receipt-calculations'

function getTodayDateString(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function useGoodsReceiptForm(initialId?: number) {
  const isEditing = computed(() => !!initialId)
  const isSubmitting = ref(false)
  const generalErrors = ref<Record<string, string>>({})

  // Contextual metadata from selected PO
  const selectedPoInfo = ref<{
    kode_po: string
    suplier_id: number | null
    nama_suplier: string
  }>({
    kode_po: '',
    suplier_id: null,
    nama_suplier: ''
  })

  const header = reactive<GoodsReceiptFormValues>({
    id: initialId,
    kode: '',
    purchase_order_id: null,
    no_surat_jalan: '',
    gudang_id: null as any,
    tanggal: getTodayDateString(),
    nama_pengirim: '',
    keterangan: '',
    is_ppn: false,
    ppn_id: null,
    ppn_persen: 11,
    diskon_persen: 0,
    status: 1 // 1 = Diterima
  })

  // Snapshot for dirty tracking
  const initialSnapshot = ref<string>('')

  function takeSnapshot(rows: GoodsReceiptDetailRow[]) {
    initialSnapshot.value = JSON.stringify({
      header: { ...header },
      rows: rows.map(r => ({
        bahan_id: r.bahan_id,
        qty_terima: r.qty_terima,
        harga_satuan: r.harga_satuan,
        diskon: r.diskon
      }))
    })
  }

  function isFormDirty(currentRows: GoodsReceiptDetailRow[]): boolean {
    if (!initialSnapshot.value) return false
    const current = JSON.stringify({
      header: { ...header },
      rows: currentRows.map(r => ({
        bahan_id: r.bahan_id,
        qty_terima: r.qty_terima,
        harga_satuan: r.harga_satuan,
        diskon: r.diskon
      }))
    })
    return current !== initialSnapshot.value
  }

  async function generateNewCode(): Promise<void> {
    try {
      header.kode = await goodsReceiptService.generateCode(header.tanggal)
    } catch {
      const d = new Date()
      const yearShort = d.getFullYear().toString().slice(-2)
      const monthPadded = String(d.getMonth() + 1).padStart(2, '0')
      header.kode = `PB/${yearShort}${monthPadded}-0001`
    }
  }

  /**
   * Called when a PO is selected: loads PO items and contextual metadata
   */
  async function handlePoSelected(poId: number): Promise<GoodsReceiptDetailRow[]> {
    header.purchase_order_id = poId
    const res = await goodsReceiptService.getPoDetailsForReceipt(poId, initialId)

    selectedPoInfo.value = {
      kode_po: res.poHeader.kode,
      suplier_id: res.poHeader.suplier_id,
      nama_suplier: res.poHeader.nama_suplier
    }

    header.is_ppn = res.poHeader.is_ppn
    header.ppn_id = res.poHeader.ppn_id
    header.ppn_persen = res.poHeader.ppn_persen

    return res.rows
  }

  /**
   * Validates form and submits to service
   */
  async function submitReceipt(
    rows: GoodsReceiptDetailRow[]
  ): Promise<{ header: GoodsReceiptListItem } | null> {
    generalErrors.value = {}

    const validation = validateGoodsReceiptForm(header, rows)
    if (!validation.isValid) {
      generalErrors.value = validation.headerErrors
      // Attach errors to rows
      for (const [idx, errors] of Object.entries(validation.rowErrors)) {
        const row = rows[Number(idx)]
        if (row) row.errors = errors
      }
      return null
    }

    isSubmitting.value = true

    try {
      const summary = calculateGoodsReceiptSummary(
        rows,
        header.is_ppn,
        header.ppn_persen,
        header.diskon_persen
      )

      const activeRows = rows.filter(r => !!r.bahan_id)

      if (isEditing.value && initialId) {
        const updatePayload: GoodsReceiptUpdatePayload = {
          header: {
            kode: header.kode,
            purchase_order_id: header.purchase_order_id!,
            no_surat_jalan: header.no_surat_jalan,
            gudang_id: header.gudang_id!,
            tanggal: header.tanggal,
            nama_pengirim: header.nama_pengirim || null,
            keterangan: header.keterangan || null,
            is_ppn: header.is_ppn ? 1 : 0,
            ppn_id: header.ppn_id,
            subtotal: summary.subtotal,
            diskon: summary.diskon_nominal,
            total: summary.total,
            total_ppn: summary.total_ppn,
            nilai_pb: summary.nilai_pb,
            status: header.status
          },
          details: activeRows.map(r => ({
            id: r.id,
            bahan_id: r.bahan_id!,
            qty_pesan: r.qty_pesan,
            qty_terima: r.qty_terima || 0,
            satuan_beli_id: r.satuan_beli_id || 1,
            harga_satuan: r.harga_satuan || 0,
            diskon: r.diskon || 0
          }))
        }

        const res = await goodsReceiptService.update(initialId, updatePayload)
        takeSnapshot(rows)
        return { header: res.header }
      } else {
        const createPayload: GoodsReceiptCreatePayload = {
          header: {
            kode: header.kode,
            purchase_order_id: header.purchase_order_id!,
            no_surat_jalan: header.no_surat_jalan,
            gudang_id: header.gudang_id!,
            tanggal: header.tanggal,
            nama_pengirim: header.nama_pengirim || null,
            keterangan: header.keterangan || null,
            is_ppn: header.is_ppn ? 1 : 0,
            ppn_id: header.ppn_id,
            subtotal: summary.subtotal,
            diskon: summary.diskon_nominal,
            total: summary.total,
            total_ppn: summary.total_ppn,
            nilai_pb: summary.nilai_pb,
            status: header.status
          },
          details: activeRows.map(r => ({
            bahan_id: r.bahan_id!,
            qty_pesan: r.qty_pesan,
            qty_terima: r.qty_terima || 0,
            satuan_beli_id: r.satuan_beli_id || 1,
            harga_satuan: r.harga_satuan || 0,
            diskon: r.diskon || 0
          }))
        }

        const res = await goodsReceiptService.create(createPayload)
        takeSnapshot(rows)
        return { header: res.header }
      }
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    header,
    selectedPoInfo,
    isSubmitting,
    generalErrors,
    generateNewCode,
    takeSnapshot,
    isFormDirty,
    handlePoSelected,
    submitReceipt
  }
}
