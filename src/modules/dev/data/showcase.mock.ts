export interface ShowcaseItem {
  id: number
  code: string
  name: string
  category: string
  price: number
  status: string
}

export const SHOWCASE_PRODUCTS: ShowcaseItem[] = [
  {
    id: 1,
    code: 'PRD-001',
    name: 'Sofa Minimalis 3-Seater Beludru',
    category: 'Sofa',
    price: 4500000,
    status: 'active'
  },
  {
    id: 2,
    code: 'PRD-002',
    name: 'Meja Makan Jati Solid 6 Kursi',
    category: 'Meja',
    price: 8200000,
    status: 'active'
  },
  {
    id: 3,
    code: 'PRD-003',
    name: 'Lemari Pakaian 4 Pintu Sliding',
    category: 'Lemari',
    price: 6100000,
    status: 'pending'
  },
  {
    id: 4,
    code: 'PRD-004',
    name: 'Kursi Kerja Ergonomis Mesh',
    category: 'Kursi',
    price: 1850000,
    status: 'completed'
  },
  {
    id: 5,
    code: 'PRD-005',
    name: 'Credenza Bufet TV Kayu Mahoni',
    category: 'Bufet',
    price: 3400000,
    status: 'cancelled'
  },
  {
    id: 6,
    code: 'PRD-006',
    name: 'Rak Buku Tingkat Modular Kayu Mahoni',
    category: 'Rak',
    price: 2750000,
    status: 'active'
  }
]
