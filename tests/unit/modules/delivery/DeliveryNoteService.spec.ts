import { describe, it, expect, beforeEach } from 'vitest'
import { deliveryNoteService } from '@/modules/delivery/services/delivery-note.service'

describe('Sprint 7 — DeliveryNoteService Unit & Workflow Tests', () => {
  beforeEach(() => {
    deliveryNoteService.resetMockData()
  })

  it('1. retrieves all active delivery notes enriched with 13-column metadata', async () => {
    const list = await deliveryNoteService.getAllDeliveryNotes()
    expect(list.length).toBeGreaterThanOrEqual(3)

    const first = list[0]
    expect(first).toHaveProperty('id')
    expect(first).toHaveProperty('kode')
    expect(first).toHaveProperty('tanggal')
    expect(first).toHaveProperty('so_id')
    expect(first).toHaveProperty('so_kode')
    expect(first).toHaveProperty('customer_nama')
    expect(first).toHaveProperty('qty_pemesanan')
    expect(first).toHaveProperty('qty_pengiriman')
    expect(first).toHaveProperty('total_pembelian')
    expect(first).toHaveProperty('status_kirim_label')
    expect(first).toHaveProperty('status_dokumen_label')
    expect(first).toHaveProperty('has_bukti')
  })

  it('2. filters delivery notes by search keyword across code and customer', async () => {
    const resCustomer = await deliveryNoteService.getAllDeliveryNotes({
      search: 'Grand Pelangi'
    })
    expect(resCustomer.length).toBe(1)
    expect(resCustomer[0].customer_nama).toContain('Grand Pelangi')

    const resCode = await deliveryNoteService.getAllDeliveryNotes({
      search: 'PL/03/0069'
    })
    expect(resCode.length).toBe(1)
    expect(resCode[0].kode).toBe('SJ/26/PL/03/0069')
  })

  it('3. filters delivery notes by shipping status and pickup status', async () => {
    const terkirimList = await deliveryNoteService.getAllDeliveryNotes({
      status_kirim: 1
    })
    expect(terkirimList.every(d => d.status_kirim === 1)).toBe(true)

    const pickupList = await deliveryNoteService.getAllDeliveryNotes({
      is_pickup: true
    })
    expect(pickupList.every(d => d.status_ambil === 1)).toBe(true)
  })

  it('4. retrieves delivery note by ID with complete enriched details', async () => {
    const detail = await deliveryNoteService.getDeliveryNoteById(1)
    expect(detail.id).toBe(1)
    expect(detail.kode).toBe('SJ/26/03/0312')
    expect(detail.items.length).toBeGreaterThan(0)
    expect(detail.items[0].nama_produk).toBeDefined()
    expect(detail.items[0].qty_kirim).toBe(10)
    expect(detail.customer_nama).toBeDefined()
    expect(detail.sales_nama).toBeDefined()
  })

  it('5. calculates remaining undelivered quantities per product for a Sales Order', async () => {
    // SO 1 has ordered qty 15 of product 43. Delivery Note 1 shipped 10 units.
    const remaining = await deliveryNoteService.getDeliveryRemainingBySoId(1)
    expect(remaining.length).toBeGreaterThan(0)

    const productRow = remaining.find(r => r.produk_id === 43)
    expect(productRow).toBeDefined()
    expect(productRow?.qty_pemesanan).toBe(15)
    expect(productRow?.qty_sudah_dikirim).toBe(10)
    expect(productRow?.sisa_qty).toBe(5)
  })

  it('6. creates a new delivery note with atomic items and unique code check', async () => {
    const uniqueCode = 'SJ/26/03/9999'
    const newNote = await deliveryNoteService.createDeliveryNote({
      so_id: 1,
      kode: uniqueCode,
      tanggal: '2026-03-25',
      nama_pengirim: 'Sopir Cadangan',
      keterangan: 'Pengiriman sisa tahap 2',
      status: 0, // Draft
      is_pickup: false,
      items: [
        {
          produk_id: 60,
          qty: 10,
          qty_kirim: 4,
          sisa_qty: 4,
          detail_sales_order_id: 1,
          keterangan: 'Tahap 2 lunas'
        }
      ]
    })

    expect(newNote.id).toBeDefined()
    expect(newNote.kode).toBe(uniqueCode)
    expect(newNote.status).toBe(0)
    expect(newNote.qty_pengiriman).toBe(4)

    // Uniqueness validation
    await expect(
      deliveryNoteService.createDeliveryNote({
        so_id: 1,
        kode: uniqueCode,
        tanggal: '2026-03-25',
        status: 0,
        items: [{ produk_id: 60, qty: 10, qty_kirim: 1, sisa_qty: 4 }]
      })
    ).rejects.toThrow('sudah digunakan')
  })

  it('7. updates an existing draft delivery note', async () => {
    // Delivery note 2 is draft
    const updated = await deliveryNoteService.updateDeliveryNote(2, {
      id: 2,
      nama_pengirim: 'Driver Pengganti Sukirman',
      keterangan: 'Muat pagi hari pukul 08:00'
    })

    expect(updated.nama_pengirim).toBe('Driver Pengganti Sukirman')
    expect(updated.keterangan).toBe('Muat pagi hari pukul 08:00')
  })

  it('8. cancels a delivery note and records cancellation note', async () => {
    const ok = await deliveryNoteService.cancelDeliveryNote(
      2,
      'Customer minta jadwal ulang pengiriman'
    )
    expect(ok).toBe(true)

    const note = await deliveryNoteService.getDeliveryNoteById(2)
    expect(note.status).toBe(2) // BATAL
    expect(note.note).toContain('Dibatalkan: Customer minta jadwal ulang')
  })

  it('9. confirms delivery receipt with proof payload and promotes to TERKIRIM', async () => {
    const proofPayload = {
      penerima: 'Bpk Joko Santoso (Security Pabrik)',
      tanggal_terima: '2026-03-26',
      foto_bukti: 'https://images.unsplash.com/photo-example',
      note: 'Diterima utuh tanpa komplain'
    }

    const confirmed = await deliveryNoteService.confirmDelivery(2, proofPayload)
    expect(confirmed.status_kirim).toBe(1) // TERKIRIM
    expect(confirmed.penerima).toBe('Bpk Joko Santoso (Security Pabrik)')
    expect(confirmed.foto_bukti).toBe('https://images.unsplash.com/photo-example')
    expect(confirmed.status).toBe(1) // Promoted to SUCCEEDED
  })
})
