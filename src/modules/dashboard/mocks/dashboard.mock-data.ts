export interface MockTransactionProduct {
  productId: string
  productName: string
  category: string
  quantity: number
  unitPrice: number
}

export interface MockTransaction {
  id: string
  date: string // ISO 'YYYY-MM-DD'
  customer: string
  status: 'Selesai' | 'Diproses' | 'Menunggu' | 'Dibatalkan'
  items: MockTransactionProduct[]
  totalAmount: number
}

export interface MockStockItem {
  id: string
  materialName: string
  warehouse: string
  currentStock: number
  minimumLimit: number
  unit: string
}

export const MOCK_BASE_DATE = '2026-10-31'

export const MOCK_STOCK_ITEMS: MockStockItem[] = [
  {
    id: 'STK-01',
    materialName: 'Kayu Jati Solid Grade A',
    warehouse: 'Gudang Kayu Utama',
    currentStock: 12,
    minimumLimit: 25,
    unit: 'Batang'
  },
  {
    id: 'STK-02',
    materialName: 'Busa Density 32 (Super Yellow)',
    warehouse: 'Gudang Busa & Upholstery',
    currentStock: 8,
    minimumLimit: 20,
    unit: 'Lembar'
  },
  {
    id: 'STK-03',
    materialName: 'Cat Finishing Melamine Gloss',
    warehouse: 'Gudang Finishing',
    currentStock: 5,
    minimumLimit: 15,
    unit: 'Kaleng'
  },
  {
    id: 'STK-04',
    materialName: 'Engsel Slow Motion Soft Close',
    warehouse: 'Gudang Hardware',
    currentStock: 18,
    minimumLimit: 50,
    unit: 'Set'
  },
  {
    id: 'STK-05',
    materialName: 'Plywood 18mm Meranti',
    warehouse: 'Gudang Panel & Lembaran',
    currentStock: 4,
    minimumLimit: 12,
    unit: 'Lembar'
  },
  {
    id: 'STK-06',
    materialName: 'Sekrup Gipsum 1.5 Inch',
    warehouse: 'Gudang Hardware',
    currentStock: 120,
    minimumLimit: 100,
    unit: 'Kotak'
  }
]

export const MOCK_TRANSACTIONS: MockTransaction[] = [
  // Today (2026-10-31)
  {
    id: 'SO-2026-001',
    date: '2026-10-31',
    customer: 'PT Meja Bersama',
    status: 'Selesai',
    items: [
      {
        productId: 'PRD-01',
        productName: 'Meja Rapat Eksekutif 8-Pax',
        category: 'Meja',
        quantity: 2,
        unitPrice: 15000000
      },
      {
        productId: 'PRD-02',
        productName: 'Kursi Direktur Kulit Sintetis',
        category: 'Kursi',
        quantity: 8,
        unitPrice: 1900000
      }
    ],
    totalAmount: 45200000
  },
  {
    id: 'SO-2026-002',
    date: '2026-10-31',
    customer: 'CV Interior Estetika',
    status: 'Diproses',
    items: [
      {
        productId: 'PRD-03',
        productName: 'Lemari Arsip Sliding 2-Pintu',
        category: 'Lemari',
        quantity: 5,
        unitPrice: 3750000
      }
    ],
    totalAmount: 18750000
  },
  // Yesterday (2026-10-30)
  {
    id: 'SO-2026-003',
    date: '2026-10-30',
    customer: 'Hotel Grand Pelangi',
    status: 'Diproses',
    items: [
      {
        productId: 'PRD-04',
        productName: 'Sofa Minimalis 3-Seater',
        category: 'Sofa',
        quantity: 14,
        unitPrice: 5500000
      },
      {
        productId: 'PRD-05',
        productName: 'Meja Samping Kayu Jati',
        category: 'Meja',
        quantity: 25,
        unitPrice: 1400000
      }
    ],
    totalAmount: 112000000
  },
  {
    id: 'SO-2026-004',
    date: '2026-10-30',
    customer: 'Kantor Cabang Bank Artha',
    status: 'Selesai',
    items: [
      {
        productId: 'PRD-06',
        productName: 'Meja Teller Modular',
        category: 'Meja',
        quantity: 5,
        unitPrice: 5500000
      }
    ],
    totalAmount: 27500000
  },
  // 2 days ago (2026-10-29)
  {
    id: 'SO-2026-005',
    date: '2026-10-29',
    customer: 'Resto Kayu Manis',
    status: 'Menunggu',
    items: [
      {
        productId: 'PRD-05',
        productName: 'Meja Samping Kayu Jati',
        category: 'Meja',
        quantity: 6,
        unitPrice: 1400000
      },
      {
        productId: 'PRD-07',
        productName: 'Kursi Cafe Scandinavian',
        category: 'Kursi',
        quantity: 20,
        unitPrice: 295000
      }
    ],
    totalAmount: 14300000
  },
  // 3 days ago (2026-10-28)
  {
    id: 'SO-2026-006',
    date: '2026-10-28',
    customer: 'PT Graha Cipta',
    status: 'Selesai',
    items: [
      {
        productId: 'PRD-01',
        productName: 'Meja Rapat Eksekutif 8-Pax',
        category: 'Meja',
        quantity: 3,
        unitPrice: 15000000
      },
      {
        productId: 'PRD-04',
        productName: 'Sofa Minimalis 3-Seater',
        category: 'Sofa',
        quantity: 4,
        unitPrice: 5500000
      }
    ],
    totalAmount: 67000000
  },
  // 4 days ago (2026-10-27)
  {
    id: 'SO-2026-007',
    date: '2026-10-27',
    customer: 'Hotel Grand Pelangi',
    status: 'Selesai',
    items: [
      {
        productId: 'PRD-04',
        productName: 'Sofa Minimalis 3-Seater',
        category: 'Sofa',
        quantity: 15,
        unitPrice: 5500000
      },
      {
        productId: 'PRD-02',
        productName: 'Kursi Direktur Kulit Sintetis',
        category: 'Kursi',
        quantity: 10,
        unitPrice: 1900000
      }
    ],
    totalAmount: 101500000
  },
  // 5 days ago (2026-10-26)
  {
    id: 'SO-2026-008',
    date: '2026-10-26',
    customer: 'PT Meja Bersama',
    status: 'Selesai',
    items: [
      {
        productId: 'PRD-03',
        productName: 'Lemari Arsip Sliding 2-Pintu',
        category: 'Lemari',
        quantity: 8,
        unitPrice: 3750000
      },
      {
        productId: 'PRD-05',
        productName: 'Meja Samping Kayu Jati',
        category: 'Meja',
        quantity: 10,
        unitPrice: 1400000
      }
    ],
    totalAmount: 44000000
  },
  // 6 days ago (2026-10-25)
  {
    id: 'SO-2026-009',
    date: '2026-10-25',
    customer: 'Kantor Cabang Bank Artha',
    status: 'Selesai',
    items: [
      {
        productId: 'PRD-02',
        productName: 'Kursi Direktur Kulit Sintetis',
        category: 'Kursi',
        quantity: 12,
        unitPrice: 1900000
      },
      {
        productId: 'PRD-06',
        productName: 'Meja Teller Modular',
        category: 'Meja',
        quantity: 4,
        unitPrice: 5500000
      }
    ],
    totalAmount: 44800000
  },
  // Earlier in October 2026
  {
    id: 'SO-2026-010',
    date: '2026-10-20',
    customer: 'Hotel Grand Pelangi',
    status: 'Selesai',
    items: [
      {
        productId: 'PRD-04',
        productName: 'Sofa Minimalis 3-Seater',
        category: 'Sofa',
        quantity: 20,
        unitPrice: 5500000
      },
      {
        productId: 'PRD-03',
        productName: 'Lemari Arsip Sliding 2-Pintu',
        category: 'Lemari',
        quantity: 6,
        unitPrice: 3750000
      }
    ],
    totalAmount: 132500000
  },
  {
    id: 'SO-2026-011',
    date: '2026-10-15',
    customer: 'PT Meja Bersama',
    status: 'Selesai',
    items: [
      {
        productId: 'PRD-01',
        productName: 'Meja Rapat Eksekutif 8-Pax',
        category: 'Meja',
        quantity: 4,
        unitPrice: 15000000
      },
      {
        productId: 'PRD-07',
        productName: 'Kursi Cafe Scandinavian',
        category: 'Kursi',
        quantity: 50,
        unitPrice: 295000
      }
    ],
    totalAmount: 74750000
  },
  {
    id: 'SO-2026-012',
    date: '2026-10-10',
    customer: 'Kantor Cabang Bank Artha',
    status: 'Selesai',
    items: [
      {
        productId: 'PRD-02',
        productName: 'Kursi Direktur Kulit Sintetis',
        category: 'Kursi',
        quantity: 20,
        unitPrice: 1900000
      },
      {
        productId: 'PRD-06',
        productName: 'Meja Teller Modular',
        category: 'Meja',
        quantity: 6,
        unitPrice: 5500000
      }
    ],
    totalAmount: 71000000
  },
  {
    id: 'SO-2026-013',
    date: '2026-10-05',
    customer: 'CV Sumber Rejeki',
    status: 'Selesai',
    items: [
      {
        productId: 'PRD-05',
        productName: 'Meja Samping Kayu Jati',
        category: 'Meja',
        quantity: 15,
        unitPrice: 1400000
      },
      {
        productId: 'PRD-07',
        productName: 'Kursi Cafe Scandinavian',
        category: 'Kursi',
        quantity: 40,
        unitPrice: 295000
      }
    ],
    totalAmount: 32800000
  },
  {
    id: 'SO-2026-014',
    date: '2026-10-02',
    customer: 'PT Megah Perkasa',
    status: 'Selesai',
    items: [
      {
        productId: 'PRD-01',
        productName: 'Meja Rapat Eksekutif 8-Pax',
        category: 'Meja',
        quantity: 2,
        unitPrice: 15000000
      },
      {
        productId: 'PRD-03',
        productName: 'Lemari Arsip Sliding 2-Pintu',
        category: 'Lemari',
        quantity: 4,
        unitPrice: 3750000
      }
    ],
    totalAmount: 45000000
  }
]
