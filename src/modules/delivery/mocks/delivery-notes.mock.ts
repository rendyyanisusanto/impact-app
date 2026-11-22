import type { SuratJalan, DetailSuratJalan } from '../types/delivery-note.types'

export const INITIAL_MOCK_DELIVERY_NOTES: SuratJalan[] = [
  {
    id: 1,
    so_id: 1,
    kode: 'SJ/26/03/0312',
    tanggal: '2026-03-06',
    keterangan: 'Pengiriman tahap 1 ke gudang customer',
    status: 1, // SUCCEEDED
    status_kirim: 1, // TERKIRIM
    status_ambil: 0,
    created_at: '2026-03-06 08:30:00',
    created_by: 1,
    updated_at: '2026-03-06 14:15:00',
    updated_by: 1,
    nama_pengirim: 'Budi Santoso (Driver Internal)',
    penerima: 'Pak Hendro (Gudang PT Mitra Jaya)',
    foto_bukti:
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
    alamat: 'Jl. Rungkut Industri III No. 45, Surabaya',
    no_hp: '081234567890',
    karyawan_id: 54,
    note: 'Diterima dalam kondisi prima dan utuh tanpa cacat.',
    status_aktif: 1,
    is_stock_deducted: true
  },
  {
    id: 2,
    so_id: 3,
    kode: 'SJ/26/PL/03/0069',
    tanggal: '2026-03-08',
    keterangan: 'Jadwal muat sore hari via ekspedisi',
    status: 0, // DRAFT
    status_kirim: 0, // BELUM DIKIRIM
    status_ambil: 0,
    created_at: '2026-03-08 09:10:00',
    created_by: 1,
    updated_at: '2026-03-08 09:10:00',
    updated_by: 1,
    nama_pengirim: 'Arman Maulana (Ekspedisi Dakota)',
    penerima: null,
    foto_bukti: null,
    alamat: 'Kawasan Industri Gresik Kav. 12, Gresik',
    no_hp: '082198765432',
    karyawan_id: 55,
    note: null,
    status_aktif: 1,
    is_stock_deducted: false
  },
  {
    id: 3,
    so_id: 5,
    kode: 'SJA/26/III/0015',
    tanggal: '2026-03-10',
    keterangan: 'Barang diambil langsung oleh pihak pemesan',
    status: 1, // SUCCEEDED
    status_kirim: 2, // AMBIL SENDIRI
    status_ambil: 1, // Ambil Sendiri
    created_at: '2026-03-10 10:00:00',
    created_by: 1,
    updated_at: '2026-03-10 11:30:00',
    updated_by: 1,
    nama_pengirim: 'Diambil Sendiri oleh Pelanggan',
    penerima: 'Ibu Ratna (CV Karya Sejahtera)',
    foto_bukti:
      'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&auto=format&fit=crop&q=80',
    alamat: 'Gudang Pusat Impact Furniture (Self Pickup)',
    no_hp: '081377889900',
    karyawan_id: null,
    note: 'Diambil menggunakan armada Pickup L300 Nopol L 9821 AB.',
    status_aktif: 1,
    is_stock_deducted: true
  }
]

export const INITIAL_MOCK_DELIVERY_ITEMS: DetailSuratJalan[] = [
  {
    id: 1,
    surat_jalan_id: 1,
    produk_id: 43,
    qty: 15,
    qty_kirim: 10,
    detail_sales_order_id: 101,
    keterangan: 'Tahap 1 - 10 Unit Kursi Mesh'
  },
  {
    id: 2,
    surat_jalan_id: 2,
    produk_id: 43,
    qty: 16,
    qty_kirim: 8,
    detail_sales_order_id: 104,
    keterangan: 'Pengiriman 8 Unit Kursi'
  },
  {
    id: 3,
    surat_jalan_id: 3,
    produk_id: 44,
    qty: 10,
    qty_kirim: 5,
    detail_sales_order_id: 106,
    keterangan: 'Pengambilan mandiri tahap 1 - 5 Unit Kursi Tunggu'
  }
]
