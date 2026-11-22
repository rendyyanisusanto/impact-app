import type { ImportTemplateDefinition } from '@/shared/types/crud.types'

export interface PurchaseOrderImportRow {
  kode: string
  suplier_id: number
  tanggal: string
  status_transaksi_id: number
  is_ppn: number
  keterangan?: string | null
  bahan_id: number
  qty: number
  satuan_beli_id?: number | null
  harga: number
  diskon?: number
}

export const PURCHASE_ORDER_IMPORT_TEMPLATE: ImportTemplateDefinition = {
  sheetName: 'Purchase_Orders',
  title: 'Purchase Order Import Template',
  columns: [
    {
      key: 'kode',
      label: 'Kode PO',
      required: true,
      type: 'string',
      example: 'PO/26-01-15-1001'
    },
    {
      key: 'suplier_id',
      label: 'ID Supplier',
      required: true,
      type: 'number',
      example: 1
    },
    {
      key: 'tanggal',
      label: 'Tanggal (YYYY-MM-DD)',
      required: true,
      type: 'date',
      example: '2026-01-15'
    },
    {
      key: 'status_transaksi_id',
      label: 'Status Transaksi (1=CASH, 2=JATUH TEMPO)',
      required: true,
      type: 'number',
      example: 1
    },
    {
      key: 'is_ppn',
      label: 'PPN (1=Ya, 0=Tidak)',
      required: true,
      type: 'number',
      example: 0
    },
    {
      key: 'bahan_id',
      label: 'ID Bahan',
      required: true,
      type: 'number',
      example: 1
    },
    {
      key: 'qty',
      label: 'Qty',
      required: true,
      type: 'number',
      example: 10
    },
    {
      key: 'harga',
      label: 'Harga Satuan (Rp)',
      required: true,
      type: 'number',
      example: 450000
    },
    {
      key: 'diskon',
      label: 'Diskon (%)',
      required: false,
      type: 'number',
      example: 0
    },
    {
      key: 'keterangan',
      label: 'Keterangan',
      required: false,
      type: 'string',
      example: 'Pengadaan bahan baku kayu'
    }
  ]
}

export function purchaseOrderRowMapper(
  rawRow: Record<string, unknown>,
  rowNumber: number
): { data?: PurchaseOrderImportRow; error?: string } {
  const kode = String(rawRow['kode'] || rawRow['Kode PO'] || '').trim()
  const suplierId = Number(rawRow['suplier_id'] || rawRow['ID Supplier'])
  const tanggal = String(rawRow['tanggal'] || rawRow['Tanggal (YYYY-MM-DD)'] || '').trim()
  const bahanId = Number(rawRow['bahan_id'] || rawRow['ID Bahan'])
  const qty = Number(rawRow['qty'] || rawRow['Qty'])
  const harga = Number(rawRow['harga'] || rawRow['Harga Satuan (Rp)'] || 0)
  const diskon = Number(rawRow['diskon'] || rawRow['Diskon (%)'] || 0)
  const statusTransaksiId = Number(rawRow['status_transaksi_id'] || rawRow['Status Transaksi'] || 1)
  const isPpn = Number(rawRow['is_ppn'] || rawRow['PPN'] || 0)
  const keterangan = String(rawRow['keterangan'] || rawRow['Keterangan'] || '').trim()

  if (!kode) {
    return { error: `Baris ${rowNumber}: Kode PO wajib diisi.` }
  }
  if (!suplierId || isNaN(suplierId)) {
    return { error: `Baris ${rowNumber}: ID Supplier tidak valid.` }
  }
  if (!tanggal) {
    return { error: `Baris ${rowNumber}: Tanggal wajib diisi.` }
  }
  if (!bahanId || isNaN(bahanId)) {
    return { error: `Baris ${rowNumber}: ID Bahan tidak valid.` }
  }
  if (!qty || isNaN(qty) || qty <= 0) {
    return { error: `Baris ${rowNumber}: Qty harus lebih besar dari 0.` }
  }

  return {
    data: {
      kode,
      suplier_id: suplierId,
      tanggal,
      status_transaksi_id: statusTransaksiId === 2 ? 2 : 1,
      is_ppn: isPpn === 1 ? 1 : 0,
      bahan_id: bahanId,
      qty,
      harga,
      diskon: Math.min(100, Math.max(0, diskon)),
      keterangan: keterangan || null
    }
  }
}
