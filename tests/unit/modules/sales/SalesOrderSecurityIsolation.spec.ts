import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { salesOrderTransactionService } from '@/modules/sales/services/sales-order-transaction.service'

describe('Sprint 7 — Sales Order Security & Cross-Variant Isolation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    salesOrderTransactionService.reset()
  })

  it('1. rejects accessing an Impact SO when requested from Pola variant context', async () => {
    // ID 1 is an Impact order ('PPN')
    await expect(salesOrderTransactionService.getOrderById(1, 'pola')).rejects.toThrow(
      'Pelanggaran Isolasi Dokumen'
    )
  })

  it('2. rejects accessing an Impact SO when requested from KS variant context', async () => {
    await expect(salesOrderTransactionService.getOrderById(1, 'ks')).rejects.toThrow(
      'Pelanggaran Isolasi Dokumen'
    )
  })

  it('3. rejects accessing a Pola SO when requested from Impact variant context', async () => {
    // ID 3 is a Pola order ('NON_PPN')
    await expect(salesOrderTransactionService.getOrderById(3, 'impact')).rejects.toThrow(
      'Pelanggaran Isolasi Dokumen'
    )
  })

  it('4. rejects accessing a KS SO when requested from Pola variant context', async () => {
    // ID 5 is a KS order ('NON_PPN_2')
    await expect(salesOrderTransactionService.getOrderById(5, 'pola')).rejects.toThrow(
      'Pelanggaran Isolasi Dokumen'
    )
  })

  it('5. allows access when order variant matches the requested variant context', async () => {
    const impactOrder = await salesOrderTransactionService.getOrderById(1, 'impact')
    expect(impactOrder.variant).toBe('impact')

    const polaOrder = await salesOrderTransactionService.getOrderById(3, 'pola')
    expect(polaOrder.variant).toBe('pola')

    const ksOrder = await salesOrderTransactionService.getOrderById(5, 'ks')
    expect(ksOrder.variant).toBe('ks')
  })

  it('6. updates KS order successfully with variant: "ks" without document isolation error', async () => {
    // Create a draft KS order
    const ksCreated = await salesOrderTransactionService.create(
      'ks',
      {
        kode: 'SO/N2/26/11/9999',
        customer_id: 1,
        tanggal: '2026-11-18',
        sales_id: 0,
        keterangan: 'Test KS Order',
        no_faktur_pajak: '',
        is_ppn: 0,
        ppn_id: null,
        ppn_rate: 0,
        status: 0
      },
      [
        {
          rowId: 'row-1',
          produk_id: 1,
          qty: 5,
          harga: 100000,
          diskon: 0,
          subtotal: 500000,
          status_produksi: 0,
          satuan_nama: 'Pcs',
          stok_saat_ini: 10,
          kode_produk: 'PRD-1',
          nama_produk: 'Item KS',
          keterangan: ''
        }
      ]
    )

    expect(ksCreated.variant).toBe('ks')

    // Update with variant: 'ks'
    const updated = await salesOrderTransactionService.update(
      ksCreated.id,
      {
        kode: ksCreated.kode,
        customer_id: ksCreated.customer_id,
        tanggal: ksCreated.tanggal,
        sales_id: 0,
        keterangan: 'Updated KS Order',
        no_faktur_pajak: '',
        is_ppn: 0,
        ppn_id: null,
        ppn_rate: 0,
        status: 0
      },
      [
        {
          rowId: 'row-1',
          produk_id: 1,
          qty: 6,
          harga: 100000,
          diskon: 0,
          subtotal: 600000,
          status_produksi: 0,
          satuan_nama: 'Pcs',
          stok_saat_ini: 10,
          kode_produk: 'PRD-1',
          nama_produk: 'Item KS',
          keterangan: ''
        }
      ],
      [],
      'ks'
    )

    expect(updated.variant).toBe('ks')
    expect(updated.keterangan).toBe('Updated KS Order')
  })
})
