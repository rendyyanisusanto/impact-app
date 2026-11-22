import type { ApiResponse } from '@/shared/types/api.types'
import { simulateApiCall, type MockAdapterOptions } from './mockAdapter'

export interface Supplier {
  id: number
  code: string
  name: string
  contactPerson: string
  phone: string
  city: string
  status: 'active' | 'inactive'
}

export interface SupplierService {
  getAll(options?: MockAdapterOptions): Promise<ApiResponse<Supplier[]>>
  getById(id: number, options?: MockAdapterOptions): Promise<ApiResponse<Supplier | null>>
}

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 1,
    code: 'SUP-001',
    name: 'CV Kayu Jati Perkasa',
    contactPerson: 'H. Sudirman',
    phone: '0812-3456-7890',
    city: 'Jepara',
    status: 'active'
  },
  {
    id: 2,
    code: 'SUP-002',
    name: 'PT Busa Mandiri Abadi',
    contactPerson: 'Bambang Irawan',
    phone: '0813-8899-1122',
    city: 'Semarang',
    status: 'active'
  },
  {
    id: 3,
    code: 'SUP-003',
    name: 'Toko Besi & Engsel Jaya',
    contactPerson: 'Agus Wijaya',
    phone: '0821-4455-6677',
    city: 'Kudus',
    status: 'active'
  },
  {
    id: 4,
    code: 'SUP-004',
    name: 'PT Cat Indah Lestari',
    contactPerson: 'Dewi Lestari',
    phone: '0857-1234-9988',
    city: 'Surabaya',
    status: 'active'
  },
  {
    id: 5,
    code: 'SUP-005',
    name: 'CV Rotan Maju Bersama',
    contactPerson: 'Hendra Setiawan',
    phone: '0878-5544-3322',
    city: 'Cirebon',
    status: 'inactive'
  }
]

class MockSupplierService implements SupplierService {
  private suppliers: Supplier[] = [...INITIAL_SUPPLIERS]

  async getAll(options?: MockAdapterOptions): Promise<ApiResponse<Supplier[]>> {
    return simulateApiCall([...this.suppliers], options)
  }

  async getById(id: number, options?: MockAdapterOptions): Promise<ApiResponse<Supplier | null>> {
    const item = this.suppliers.find(s => s.id === id) || null
    return simulateApiCall(item, options)
  }
}

export const supplierService = new MockSupplierService()
