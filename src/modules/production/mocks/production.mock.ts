import type {
  Produksi,
  DetailProduksiProduk,
  KartuStokProduk,
  DetailBahanProduksi
} from '../types/production.types'

export const INITIAL_MOCK_PRODUKSI: Produksi[] = [
  {
    id: 1,
    kode: 'PD0824-0001',
    tanggal: '2024-08-23',
    keterangan: 'Produksi batch kursi kantor proyek',
    created_at: '2024-08-23 03:32:15',
    created_by: 1,
    updated_at: '2024-10-03 04:12:39',
    updated_by: 1,
    status: 1, // Selesai / Posted
    status_produksi: 2, // Selesai
    so_id: 202,
    customer_id: 1288,
    status_aktif: 1,
    biaya_produksi: 0,
    jenis_produksi: 1, // Pesanan
    uuid: 'uuid-prod-1'
  },
  {
    id: 2,
    kode: 'PD0824-0002',
    tanggal: '2024-08-24',
    keterangan: 'Produksi pesanan kursi pimpinan instansi',
    created_at: '2024-08-24 05:20:13',
    created_by: 1,
    updated_at: null,
    updated_by: null,
    status: 0, // Draft
    status_produksi: 1, // Proses
    so_id: 279,
    customer_id: 1565,
    status_aktif: 1,
    biaya_produksi: 0,
    jenis_produksi: 1, // Pesanan
    uuid: 'uuid-prod-2'
  },
  {
    id: 3,
    kode: 'PD0824-0003',
    tanggal: '2024-08-25',
    keterangan: 'Produksi buffer stok showroom cabang Surabaya',
    created_at: '2024-08-25 08:46:22',
    created_by: 1,
    updated_at: null,
    updated_by: null,
    status: 0, // Draft
    status_produksi: 0, // Pending
    so_id: null,
    customer_id: null,
    status_aktif: 1,
    biaya_produksi: 0,
    jenis_produksi: 0, // Non Pesanan / Stok
    uuid: 'uuid-prod-3'
  },
  {
    id: 4,
    kode: 'PD0824-0004',
    tanggal: '2024-08-26',
    keterangan: 'Pesanan kursi tunggu bandara terminal baru',
    created_at: '2024-08-26 08:48:36',
    created_by: 1,
    updated_at: null,
    updated_by: null,
    status: 0, // Draft
    status_produksi: 0, // Pending
    so_id: 184,
    customer_id: 1629,
    status_aktif: 1,
    biaya_produksi: 0,
    jenis_produksi: 1, // Pesanan
    uuid: 'uuid-prod-4'
  }
]

export const INITIAL_MOCK_DETAIL_PRODUKSI_PRODUK: DetailProduksiProduk[] = [
  // For Production #1 (PD0824-0001)
  {
    id: 1,
    produksi_id: 1,
    produk_id: 43, // IC-74 Kursi Kantor Mesh
    qty: 10,
    keterangan: 'Finishing warna hitam'
  },
  {
    id: 2,
    produksi_id: 1,
    produk_id: 44, // AK-C4 Kursi Tunggu Bandara
    qty: 4,
    keterangan: 'Rangka stainless'
  },

  // For Production #2 (PD0824-0002)
  {
    id: 3,
    produksi_id: 2,
    produk_id: 45, // ATOZ Kursi Pimpinan
    qty: 5,
    keterangan: 'Busa super density 32'
  },

  // For Production #3 (PD0824-0003)
  {
    id: 4,
    produksi_id: 3,
    produk_id: 43, // IC-74 Kursi Kantor Mesh
    qty: 15,
    keterangan: 'Stok showroom utama'
  },

  // For Production #4 (PD0824-0004)
  {
    id: 5,
    produksi_id: 4,
    produk_id: 44, // AK-C4 Kursi Tunggu Bandara
    qty: 8,
    keterangan: 'Heavy duty chrome'
  }
]

export const INITIAL_MOCK_KARTU_STOK_PRODUK: KartuStokProduk[] = [
  {
    id: 1,
    tanggal: '2024-08-23',
    produk_id: 43,
    masuk: 10,
    keluar: 0,
    keterangan: 'Produksi (PD0824-0001) pada tanggal 2024-08-23'
  },
  {
    id: 2,
    tanggal: '2024-08-23',
    produk_id: 44,
    masuk: 4,
    keluar: 0,
    keterangan: 'Produksi (PD0824-0001) pada tanggal 2024-08-23'
  }
]

export const INITIAL_MOCK_DETAIL_BAHAN_PRODUKSI: DetailBahanProduksi[] = [
  // Deducted materials for Production #1 (PD0824-0001)
  {
    id: 1,
    produksi_id: 1,
    produk_id: 43,
    bahan_id: 2, // Busa Density 32
    qty: 10, // 1 * 10
    satuan_id: 2
  },
  {
    id: 2,
    produksi_id: 1,
    produk_id: 43,
    bahan_id: 4, // Kain Upholstery
    qty: 20, // 2 * 10
    satuan_id: 5
  },
  {
    id: 3,
    produksi_id: 1,
    produk_id: 44,
    bahan_id: 5, // Plywood 18mm
    qty: 8, // 2 * 4
    satuan_id: 2
  }
]
