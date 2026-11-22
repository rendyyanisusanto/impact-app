import type { TemplateProduk, DetailTemplateProduk } from '../types/bom.types'

export const INITIAL_MOCK_BOM_TEMPLATES: TemplateProduk[] = [
  {
    id: 1,
    kode: 'TPL-IC74',
    nama: 'Standar Perakitan Kursi Kantor Mesh',
    produk_id: 43, // IC - 74 Kursi Kantor Mesh
    status_aktif: 1
  },
  {
    id: 2,
    kode: 'TPL-AKC4',
    nama: 'Standar Rangka & Busa Kursi Bandara 4D',
    produk_id: 44, // AK - C4 Kursi Tunggu Bandara 4 Dudukan
    status_aktif: 1
  },
  {
    id: 3,
    kode: 'TPL-MEJA01',
    nama: 'Komposisi Meja Kayu Solid Direktur',
    produk_id: 45, // Meja Meeting Kayu Jati
    status_aktif: 1
  }
]

export const INITIAL_MOCK_BOM_DETAILS: DetailTemplateProduk[] = [
  // Details for Template 1 (Kursi Kantor Mesh, produk_id: 43)
  {
    id: 1,
    template_produk_id: 1,
    produk_id: 43,
    bahan_id: 2, // Busa Density 32 (Super Yellow)
    satuan_id: 2, // Lembar
    qty: 1
  },
  {
    id: 2,
    template_produk_id: 1,
    produk_id: 43,
    bahan_id: 4, // Kain Upholstery Fabric Grey
    satuan_id: 5, // Meter
    qty: 2
  },
  {
    id: 3,
    template_produk_id: 1,
    produk_id: 43,
    bahan_id: 6, // Sekrup Gipsum 1.5 Inch
    satuan_id: 4, // Pcs
    qty: 16
  },

  // Details for Template 2 (Kursi Bandara 4D, produk_id: 44)
  {
    id: 4,
    template_produk_id: 2,
    produk_id: 44,
    bahan_id: 5, // Plywood 18mm Meranti
    satuan_id: 2, // Lembar
    qty: 2
  },
  {
    id: 5,
    template_produk_id: 2,
    produk_id: 44,
    bahan_id: 2, // Busa Density 32
    satuan_id: 2, // Lembar
    qty: 4
  },
  {
    id: 6,
    template_produk_id: 2,
    produk_id: 44,
    bahan_id: 6, // Sekrup Gipsum 1.5 Inch
    satuan_id: 4, // Pcs
    qty: 32
  },

  // Details for Template 3 (Meja Kayu Solid, produk_id: 45)
  {
    id: 7,
    template_produk_id: 3,
    produk_id: 45,
    bahan_id: 1, // Kayu Jati Solid Grade A
    satuan_id: 1, // Batang
    qty: 4
  },
  {
    id: 8,
    template_produk_id: 3,
    produk_id: 45,
    bahan_id: 3, // Cat Finishing Melamine Gloss
    satuan_id: 3, // Kaleng
    qty: 1
  },
  {
    id: 9,
    template_produk_id: 3,
    produk_id: 45,
    bahan_id: 6, // Sekrup Gipsum 1.5 Inch
    satuan_id: 4, // Pcs
    qty: 24
  }
]
