export interface Province {
  id: number
  name: string
}

export interface City {
  id: number
  province_id: number
  name: string
}

export interface Gudang {
  id: number
  nama: string
}

export interface Satuan {
  id: number
  nama: string
}

export const MOCK_PROVINCES: Province[] = [
  { id: 1, name: 'Jawa Timur' },
  { id: 2, name: 'Jawa Tengah' },
  { id: 3, name: 'Jawa Barat' },
  { id: 4, name: 'DKI Jakarta' },
  { id: 5, name: 'DI Yogyakarta' },
  { id: 6, name: 'Banten' },
  { id: 7, name: 'Bali' }
]

export const MOCK_CITIES: City[] = [
  // Jawa Timur (id: 1)
  { id: 101, province_id: 1, name: 'Kota Surabaya' },
  { id: 102, province_id: 1, name: 'Kab. Sidoarjo' },
  { id: 103, province_id: 1, name: 'Kota Malang' },
  { id: 104, province_id: 1, name: 'Kab. Pasuruan' },
  { id: 105, province_id: 1, name: 'Kab. Gresik' },

  // Jawa Tengah (id: 2)
  { id: 201, province_id: 2, name: 'Kota Semarang' },
  { id: 202, province_id: 2, name: 'Kab. Jepara' },
  { id: 203, province_id: 2, name: 'Kota Surakarta (Solo)' },
  { id: 204, province_id: 2, name: 'Kab. Kudus' },

  // Jawa Barat (id: 3)
  { id: 301, province_id: 3, name: 'Kota Bandung' },
  { id: 302, province_id: 3, name: 'Kab. Bekasi' },
  { id: 303, province_id: 3, name: 'Kota Bogor' },
  { id: 304, province_id: 3, name: 'Kota Cirebon' },

  // DKI Jakarta (id: 4)
  { id: 401, province_id: 4, name: 'Kota Jakarta Barat' },
  { id: 402, province_id: 4, name: 'Kota Jakarta Selatan' },
  { id: 403, province_id: 4, name: 'Kota Jakarta Pusat' },
  { id: 404, province_id: 4, name: 'Kota Jakarta Timur' },
  { id: 405, province_id: 4, name: 'Kota Jakarta Utara' },

  // DI Yogyakarta (id: 5)
  { id: 501, province_id: 5, name: 'Kota Yogyakarta' },
  { id: 502, province_id: 5, name: 'Kab. Sleman' },
  { id: 503, province_id: 5, name: 'Kab. Bantul' },

  // Banten (id: 6)
  { id: 601, province_id: 6, name: 'Kota Tangerang' },
  { id: 602, province_id: 6, name: 'Kota Tangerang Selatan' },
  { id: 603, province_id: 6, name: 'Kota Serang' },

  // Bali (id: 7)
  { id: 701, province_id: 7, name: 'Kota Denpasar' },
  { id: 702, province_id: 7, name: 'Kab. Badung' },
  { id: 703, province_id: 7, name: 'Kab. Gianyar' }
]

export const MOCK_GUDANG: Gudang[] = [
  { id: 1, nama: 'Gudang Kayu Utama' },
  { id: 2, nama: 'Gudang Busa & Upholstery' },
  { id: 3, nama: 'Gudang Finishing & Cat' },
  { id: 4, nama: 'Gudang Hardware & Fitting' },
  { id: 5, nama: 'Gudang Panel & Lembaran' },
  { id: 6, nama: 'Gudang Barang Jadi (Showroom)' }
]

export const MOCK_SATUAN_PAKAI: Satuan[] = [
  { id: 1, nama: 'Batang' },
  { id: 2, nama: 'Lembar' },
  { id: 3, nama: 'Kaleng' },
  { id: 4, nama: 'Pcs' },
  { id: 5, nama: 'Meter' },
  { id: 6, nama: 'Set' },
  { id: 7, nama: 'Kg' },
  { id: 8, nama: 'Liter' }
]

export const MOCK_SATUAN_BELI: Satuan[] = [
  { id: 1, nama: 'Kubik (m3)' },
  { id: 2, nama: 'Palet' },
  { id: 3, nama: 'Pail (20L)' },
  { id: 4, nama: 'Drum (200L)' },
  { id: 5, nama: 'Dus / Karton' },
  { id: 6, nama: 'Roll' },
  { id: 7, nama: 'Batang' },
  { id: 8, nama: 'Lembar' },
  { id: 9, nama: 'Pcs' }
]
