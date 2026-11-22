import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { purchaseOrderService } from '@/modules/procurement/purchase-orders/services/purchase-order.service'
import { goodsReceiptService } from '@/modules/procurement/goods-receipts/services/goods-receipt.service'
import { stockPostingService } from '@/modules/inventory/materials/services/stock-posting.service'
import { billPaymentService } from '@/modules/procurement/bill-payments/services/bill-payment.service'
import { materialService } from '@/modules/inventory/materials/services/material.service'
import { useAuthStore } from '@/stores/auth.store'

describe('Sprint 4 — Task 11: Procurement End-to-End Workflow & Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const auth = useAuthStore()
    auth.currentUser = {
      id: 1,
      name: 'Super Admin',
      username: 'admin',
      role: 'superadmin',
      roleId: 'role-superadmin',
      roleName: 'Super Admin',
      permissions: [{ resource: '*', actions: ['create', 'read', 'update', 'delete'] }]
    }

    materialService.reset()
    purchaseOrderService.reset()
    goodsReceiptService.reset()
    stockPostingService.reset()
    billPaymentService.reset()
  })

  it('11.1 Full Procurement Pipeline: PO -> Approved -> Partial PB 1 -> Stock Mutation -> Partial PB 2 -> Bill Payment', async () => {
    // Step 1: Create Purchase Order for Supplier #1 (CV Kayu Jati Perkasa)
    const po = await purchaseOrderService.create({
      header: {
        kode: 'PO-E2E-2026-001',
        tanggal: '2026-11-01',
        suplier_id: 1,
        status_transaksi_id: 1,
        status: 1, // Approved
        is_ppn: 0,
        ppn_id: null,
        keterangan: '',
        subtotal: 10000000,
        diskon: 0,
        total_ppn: 0,
        total: 10000000
      },
      details: [
        {
          bahan_id: 1,
          qty: 20,
          satuan_beli_id: 1,
          harga: 500000,
          diskon: 0,
          subtotal: 10000000
        }
      ]
    })
    expect(po.header.id).toBeDefined()
    const poId = po.header.id

    // Step 2: Create Partial Receipt 1 (PB 1 receives 8 units out of 20)
    const matBeforePb1 = materialService.getRawItems().find(m => m.id === 1)!
    const stockInitial = matBeforePb1.qty || 0

    const pb1 = await goodsReceiptService.create({
      header: {
        kode: 'PB-E2E-PART-1',
        purchase_order_id: poId,
        no_surat_jalan: 'SJ-E2E-001',
        gudang_id: 1,
        tanggal: '2026-11-02',
        status: 1, // Diterima
        nilai_pb: 4000000,
        is_ppn: 0,
        subtotal: 4000000,
        diskon: 0,
        total: 4000000,
        total_ppn: 0
      },
      details: [
        {
          bahan_id: 1,
          qty_pesan: 20,
          qty_terima: 8,
          satuan_beli_id: 1,
          harga_satuan: 500000,
          diskon: 0
        }
      ]
    })
    expect(pb1.header.id).toBeDefined()

    // Verify stock mutation: 8 units * 25 conversion = 200 units added
    const matAfterPb1 = materialService.getRawItems().find(m => m.id === 1)!
    expect(matAfterPb1.qty).toBe(stockInitial + 8 * 25)

    // Step 3: Check remaining PO quantity for PB 2 (must be 20 - 8 = 12)
    const poDetailsForPb2 = await goodsReceiptService.getPoDetailsForReceipt(poId)
    expect(poDetailsForPb2.rows[0].qty_pesan).toBe(20)
    expect(poDetailsForPb2.rows[0].already_received_qty).toBe(8)
    expect(poDetailsForPb2.rows[0].remaining_qty).toBe(12)

    // Step 4: Create Partial Receipt 2 (PB 2 receives the remaining 12 units)
    const pb2 = await goodsReceiptService.create({
      header: {
        kode: 'PB-E2E-PART-2',
        purchase_order_id: poId,
        no_surat_jalan: 'SJ-E2E-002',
        gudang_id: 1,
        tanggal: '2026-11-03',
        status: 1,
        nilai_pb: 6000000,
        is_ppn: 0,
        subtotal: 6000000,
        diskon: 0,
        total: 6000000,
        total_ppn: 0
      },
      details: [
        {
          bahan_id: 1,
          qty_pesan: 20,
          qty_terima: 12,
          satuan_beli_id: 1,
          harga_satuan: 500000,
          diskon: 0
        }
      ]
    })
    expect(pb2.header.id).toBeDefined()

    // Verify PO is now fully received
    const eligiblePos = await goodsReceiptService.getEligiblePurchaseOrders()
    const thisPo = eligiblePos.find(p => p.id === poId)
    expect(thisPo?.fully_received).toBe(true)

    // Step 5: Create Bill Payment for PB 1 (Termin 1: pays Rp 4,000,000)
    const pt1 = await billPaymentService.create({
      kode: 'PT-E2E-001',
      no_tagihan: 'INV-E2E-001',
      tanggal: '2026-11-04',
      suplier_id: 1,
      pb_ids: [pb1.header.id],
      payment_methods: [
        {
          metode_pembayaran: 'Transfer Bank',
          bank_id: 1,
          jumlah: 4000000
        }
      ]
    })
    expect(pt1.status).toBe(1) // Lunas for PB 1

    // Step 6: Verify PB 1 is no longer eligible for payment (sisa is 0)
    const eligiblePbs = await billPaymentService.getEligibleGoodsReceipts(1)
    expect(eligiblePbs.some(pb => pb.id === pb1.header.id)).toBe(false)

    // But PB 2 is still eligible with outstanding Rp 6,000,000
    const pb2Eligible = eligiblePbs.find(pb => pb.id === pb2.header.id)
    expect(pb2Eligible).toBeDefined()
    expect(pb2Eligible?.sisa_tagihan).toBe(6000000)
  })

  it('11.2 blocks creating Goods Receipt for cancelled Purchase Orders', async () => {
    // Create Draft PO and cancel it
    const po = await purchaseOrderService.create({
      header: {
        kode: 'PO-CANCEL-001',
        tanggal: '2026-11-01',
        suplier_id: 1,
        status_transaksi_id: 1,
        status: 0,
        is_ppn: 0,
        ppn_id: null,
        keterangan: '',
        subtotal: 10000000,
        diskon: 0,
        total_ppn: 0,
        total: 10000000
      },
      details: [
        {
          bahan_id: 1,
          qty: 5,
          satuan_beli_id: 1,
          harga: 200000,
          diskon: 0,
          subtotal: 1000000
        }
      ]
    })
    await purchaseOrderService.delete(po.header.id)

    // Attempting to select this PO should fail because it is not eligible
    const eligible = await goodsReceiptService.getEligiblePurchaseOrders()
    expect(eligible.some(p => p.id === po.header.id)).toBe(false)
  })

  it('11.3 enforces atomic rollback if creating a Bill Payment fails validation', async () => {
    const paymentsBefore = billPaymentService.getRawPayments().length
    const detailsBefore = billPaymentService.getRawDetails().length
    const relsBefore = billPaymentService.getRawRelations().length

    // Attempt invalid create (overpayment)
    await expect(
      billPaymentService.create({
        kode: 'PT-FAIL-001',
        no_tagihan: 'INV-FAIL',
        tanggal: '2026-11-01',
        suplier_id: 1,
        pb_ids: [1],
        payment_methods: [
          {
            metode_pembayaran: 'Transfer Bank',
            bank_id: 1,
            jumlah: 999999999 // Exceeds sisa tagihan
          }
        ]
      })
    ).rejects.toThrow('melebihi sisa tagihan')

    // Repositories must remain pristine
    expect(billPaymentService.getRawPayments().length).toBe(paymentsBefore)
    expect(billPaymentService.getRawDetails().length).toBe(detailsBefore)
    expect(billPaymentService.getRawRelations().length).toBe(relsBefore)
  })

  it('11.4 enforces RBAC permissions: users without procurement:create are rejected at service boundary', async () => {
    const auth = useAuthStore()
    // Switch to a restricted user without procurement permissions
    auth.currentUser = {
      id: 99,
      name: 'Operator Gudang Readonly',
      username: 'op',
      role: 'viewer',
      roleId: 'role-operator',
      roleName: 'Operator',
      permissions: [{ resource: 'procurement', actions: ['read'] }]
    }

    // Try creating Bill Payment
    await expect(
      billPaymentService.create({
        kode: 'PT-FORBIDDEN-001',
        no_tagihan: 'INV-NO',
        tanggal: '2026-11-01',
        suplier_id: 1,
        pb_ids: [1],
        payment_methods: [{ metode_pembayaran: 'Cash', jumlah: 100000 }]
      })
    ).rejects.toThrow('Akses ditolak')
  })
})
