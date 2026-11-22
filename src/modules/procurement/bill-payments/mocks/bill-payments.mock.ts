import type { BillPayment, BillPaymentDetail, DetailPbPt } from '../types/bill-payment.types'

export const INITIAL_MOCK_BILL_PAYMENTS: BillPayment[] = [
  {
    id: 1,
    kode: 'PT-202610-0001',
    no_tagihan: 'INV-KJP-1001',
    penagih: 'Bambang Sudiro',
    suplier_id: 1, // CV Kayu Jati Perkasa
    tanggal: '2026-10-20',
    jatuh_tempo: '2026-11-20',
    keterangan: 'Pembayaran termin 1 pengiriman kayu jati',
    status: 0, // Sebagian / Belum Lunas
    status_aktif: 1,
    subtotal: 9000000,
    diskon: 0,
    is_ppn: 1,
    ppn_id: 1,
    total_ppn: 990000,
    total: 9990000,
    total_bayar: 5000000,
    uuid: 'pt-uuid-001',
    created_at: '2026-10-20 09:30:00',
    created_by: 1,
    updated_at: '2026-10-20 09:30:00',
    updated_by: 1
  },
  {
    id: 2,
    kode: 'PT-202610-0002',
    no_tagihan: 'INV-SLP-2022',
    penagih: 'Siti Aminah',
    suplier_id: 2, // PT Busa Foam Mandiri
    tanggal: '2026-10-22',
    jatuh_tempo: '2026-11-05',
    keterangan: 'Pelunasan tagihan busa density 32',
    status: 1, // Lunas
    status_aktif: 1,
    subtotal: 6500000,
    diskon: 0,
    is_ppn: 1,
    ppn_id: 1,
    total_ppn: 715000,
    total: 7215000,
    total_bayar: 7215000,
    uuid: 'pt-uuid-002',
    created_at: '2026-10-22 14:00:00',
    created_by: 1,
    updated_at: '2026-10-22 14:00:00',
    updated_by: 1
  }
]

export const INITIAL_MOCK_BILL_PAYMENT_DETAILS: BillPaymentDetail[] = [
  {
    id: 1,
    pembayaran_tagihan_id: 1,
    metode_pembayaran: 'Transfer Bank',
    bank_id: 1, // Bank Central Asia (BCA)
    jumlah: 5000000,
    keterangan: 'Transfer via BCA KlikBisnis ref #998231'
  },
  {
    id: 2,
    pembayaran_tagihan_id: 2,
    metode_pembayaran: 'Transfer Bank',
    bank_id: 2, // Bank Mandiri
    jumlah: 7215000,
    keterangan: 'Pelunasan penuh via Mandiri Giro #77812'
  }
]

export const INITIAL_MOCK_DETAIL_PB_PT: DetailPbPt[] = [
  {
    id: 1,
    pb_id: 1,
    pt_id: 1,
    nominal_alokasi: 5000000
  },
  {
    id: 2,
    pb_id: 2,
    pt_id: 2,
    nominal_alokasi: 7215000
  }
]
