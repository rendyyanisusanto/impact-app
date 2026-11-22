import { describe, it, expect, beforeEach } from 'vitest'
import { deliveryNoteService } from '@/modules/delivery/services/delivery-note.service'
import { salesOrderTransactionService } from '@/modules/sales/services/sales-order-transaction.service'
import { productService } from '@/modules/inventory/products/services/product.service'

describe('Sprint 7 — Delivery Note Stock & Inventory Integration', () => {
  beforeEach(() => {
    deliveryNoteService.resetMockData()
  })

  it('1. deducts product inventory stock when Surat Jalan is created with status SUCCEEDED', async () => {
    const rawProducts = productService.getRawItems()
    const targetProduct = rawProducts.find(p => p.id === 43)
    expect(targetProduct).toBeDefined()
    const initialQty = targetProduct?.qty ?? 0

    const qtyToShip = 3
    const note = await deliveryNoteService.createDeliveryNote({
      so_id: 1,
      kode: 'SJ/26/03/STOCK-01',
      tanggal: '2026-03-27',
      status: 1, // SUCCEEDED
      is_pickup: false,
      items: [
        {
          produk_id: 43,
          qty: 15,
          qty_kirim: qtyToShip,
          sisa_qty: 5,
          detail_sales_order_id: 101
        }
      ]
    })

    expect(note.is_stock_deducted).toBe(true)
    const afterProduct = rawProducts.find(p => p.id === 43)
    expect(afterProduct?.qty).toBe(initialQty - qtyToShip)
  })

  it('2. does NOT deduct product inventory stock when Surat Jalan is saved as DRAFT', async () => {
    const rawProducts = productService.getRawItems()
    const targetProduct = rawProducts.find(p => p.id === 43)
    const initialQty = targetProduct?.qty ?? 0

    const note = await deliveryNoteService.createDeliveryNote({
      so_id: 1,
      kode: 'SJ/26/03/STOCK-DRAFT',
      tanggal: '2026-03-27',
      status: 0, // DRAFT
      is_pickup: false,
      items: [
        {
          produk_id: 43,
          qty: 15,
          qty_kirim: 2,
          sisa_qty: 5,
          detail_sales_order_id: 101
        }
      ]
    })

    expect(note.is_stock_deducted).toBe(false)
    const afterProduct = rawProducts.find(p => p.id === 43)
    expect(afterProduct?.qty).toBe(initialQty)
  })

  it('3. deducts product stock when a DRAFT note is confirmed as TERKIRIM', async () => {
    const rawProducts = productService.getRawItems()
    const targetProduct = rawProducts.find(p => p.id === 43)
    const initialQty = targetProduct?.qty ?? 0

    const draftNote = await deliveryNoteService.createDeliveryNote({
      so_id: 1,
      kode: 'SJ/26/03/STOCK-CONFIRM',
      tanggal: '2026-03-27',
      status: 0, // DRAFT
      is_pickup: false,
      items: [
        {
          produk_id: 43,
          qty: 15,
          qty_kirim: 2,
          sisa_qty: 5,
          detail_sales_order_id: 101
        }
      ]
    })

    expect(draftNote.is_stock_deducted).toBe(false)

    // Confirm delivery
    const confirmed = await deliveryNoteService.confirmDelivery(draftNote.id, {
      penerima: 'Security Mas Yono',
      tanggal_terima: '2026-03-28',
      foto_bukti: 'https://images.unsplash.com/proof'
    })

    expect(confirmed.status).toBe(1) // Promoted to SUCCEEDED
    expect(confirmed.is_stock_deducted).toBe(true)
    const afterProduct = rawProducts.find(p => p.id === 43)
    expect(afterProduct?.qty).toBe(initialQty - 2)
  })

  it('4. reverses / refunds product inventory stock when a delivery note is cancelled', async () => {
    const rawProducts = productService.getRawItems()
    const targetProduct = rawProducts.find(p => p.id === 43)
    const initialQty = targetProduct?.qty ?? 0

    // Create succeeded delivery note
    const note = await deliveryNoteService.createDeliveryNote({
      so_id: 1,
      kode: 'SJ/26/03/STOCK-CANCEL',
      tanggal: '2026-03-27',
      status: 1,
      is_pickup: false,
      items: [
        {
          produk_id: 43,
          qty: 15,
          qty_kirim: 4,
          sisa_qty: 5,
          detail_sales_order_id: 101
        }
      ]
    })

    const afterDeductQty = rawProducts.find(p => p.id === 43)?.qty ?? 0
    expect(afterDeductQty).toBe(initialQty - 4)

    // Cancel delivery note
    await deliveryNoteService.cancelDeliveryNote(
      note.id,
      'Customer membatalkan pengiriman karena barang salah spesifikasi'
    )

    const restoredProduct = rawProducts.find(p => p.id === 43)
    expect(restoredProduct?.qty).toBe(initialQty)
  })

  it('5. synchronizes Sales Order delivery_status between BELUM_KIRIM and TERKIRIM', async () => {
    // SO 2 has total ordered 40 of product 43 and starts with BELUM_KIRIM
    let order = await salesOrderTransactionService.getOrderById(2)
    expect(order.delivery_status).toBe('BELUM_KIRIM')

    // Create complete 40 units delivery note with status SUCCEEDED
    const noteRemaining = await deliveryNoteService.createDeliveryNote({
      so_id: 2,
      kode: 'SJ/26/03/COMPLETE-SO2',
      tanggal: '2026-03-28',
      status: 1, // SUCCEEDED
      is_pickup: false,
      items: [
        {
          produk_id: 43,
          qty: 40,
          qty_kirim: 40,
          sisa_qty: 40,
          detail_sales_order_id: 103
        }
      ]
    })

    // SO 2 should now be completely delivered ('TERKIRIM')
    order = await salesOrderTransactionService.getOrderById(2)
    expect(order.delivery_status).toBe('TERKIRIM')

    // If that complete delivery note is cancelled, SO reverts to 'BELUM_KIRIM'
    await deliveryNoteService.cancelDeliveryNote(noteRemaining.id, 'Salah kirim barang')
    order = await salesOrderTransactionService.getOrderById(2)
    expect(order.delivery_status).toBe('BELUM_KIRIM')
  })
})
