import type { SalesOrderSummary } from '../types/sales-order.types'

export const MOCK_SALES_ORDERS: readonly SalesOrderSummary[] = Object.freeze([
  {
    id: 'so-1',
    orderNumber: 'SO-2026-001',
    customerName: 'PT Grand Graha Sentosa',
    orderDate: '2026-10-01',
    status: 'completed',
    totalAmount: 48500000
  },
  {
    id: 'so-2',
    orderNumber: 'SO-2026-002',
    customerName: 'CV Jati Indah Abadi',
    orderDate: '2026-10-03',
    status: 'completed',
    totalAmount: 18200000
  },
  {
    id: 'so-3',
    orderNumber: 'SO-2026-003',
    customerName: 'Hotel Royal Senayan',
    orderDate: '2026-10-05',
    status: 'in_progress',
    totalAmount: 125000000
  },
  {
    id: 'so-4',
    orderNumber: 'SO-2026-004',
    customerName: 'PT Meka Desain Interior',
    orderDate: '2026-10-08',
    status: 'pending',
    totalAmount: 32400000
  },
  {
    id: 'so-5',
    orderNumber: 'SO-2026-005',
    customerName: 'Bapak Hendra (Personal)',
    orderDate: '2026-10-10',
    status: 'draft',
    totalAmount: 8500000
  },
  {
    id: 'so-6',
    orderNumber: 'SO-2026-006',
    customerName: 'Apartemen Green Pramuka',
    orderDate: '2026-10-12',
    status: 'cancelled',
    totalAmount: 22000000
  },
  {
    id: 'so-7',
    orderNumber: 'SO-2026-007',
    customerName: 'PT Mahakarya Perkasa',
    orderDate: '2026-10-15',
    status: 'in_progress',
    totalAmount: 64000000
  },
  {
    id: 'so-8',
    orderNumber: 'SO-2026-008',
    customerName: 'Kantor Cabang Bank Central',
    orderDate: '2026-10-18',
    status: 'completed',
    totalAmount: 95000000
  },
  {
    id: 'so-9',
    orderNumber: 'SO-2026-009',
    customerName: 'Restoran Rasa Nusantara',
    orderDate: '2026-10-20',
    status: 'pending',
    totalAmount: 14700000
  },
  {
    id: 'so-10',
    orderNumber: 'SO-2026-010',
    customerName: 'CV Furnitur Prima Mandiri',
    orderDate: '2026-10-22',
    status: 'draft',
    totalAmount: 29800000
  },
  {
    id: 'so-11',
    orderNumber: 'SO-2026-011',
    customerName: 'Villa Sunset Bali',
    orderDate: '2026-10-25',
    status: 'in_progress',
    totalAmount: 76000000
  },
  {
    id: 'so-12',
    orderNumber: 'SO-2026-012',
    customerName: 'Ibu Ratna Dewi',
    orderDate: '2026-10-28',
    status: 'completed',
    totalAmount: 11200000
  }
])
