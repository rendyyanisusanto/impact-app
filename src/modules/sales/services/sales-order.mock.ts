import type { ApiResponse } from '@/shared/types/api.types'
import type { PaginatedResponse } from '@/shared/types/pagination.types'
import type { SalesOrderSummary, SalesOrderQueryParams } from '../types/sales-order.types'
import { MOCK_SALES_ORDERS } from '../mocks/sales-orders.mock'
import {
  createSuccessResponse,
  createErrorResponse,
  paginateArray,
  sortArray
} from '@/shared/services/mock/mock-response'
import { simulateDelay } from '@/shared/services/mock/mock-delay'

export interface SalesOrderService {
  getAll(params?: SalesOrderQueryParams): Promise<ApiResponse<PaginatedResponse<SalesOrderSummary>>>
  getById(id: string): Promise<ApiResponse<SalesOrderSummary>>
}

export class MockSalesOrderService implements SalesOrderService {
  async getAll(
    params: SalesOrderQueryParams = {}
  ): Promise<ApiResponse<PaginatedResponse<SalesOrderSummary>>> {
    await simulateDelay()

    // 1. Check Explicit Scenarios for testing
    if (params.scenario === 'empty') {
      const paged = paginateArray<SalesOrderSummary>([], {
        page: 1,
        pageSize: params.pageSize || 10
      })
      return createSuccessResponse(paged)
    }

    if (params.scenario === 'validation_error') {
      createErrorResponse(
        'VALIDATION_ERROR',
        'Parameter pencarian tidak valid',
        { page: ['Halaman harus bernilai minimal 1'] },
        422
      )
    }

    if (params.scenario === 'server_error') {
      createErrorResponse(
        'SERVER_ERROR',
        'Terjadi kegagalan pemrosesan pada basis data',
        undefined,
        500
      )
    }

    if (params.scenario === 'network_error') {
      createErrorResponse(
        'NETWORK_ERROR',
        'Koneksi terputus. Silakan periksa jaringan Anda.',
        undefined,
        0
      )
    }

    // 2. Clone array immutably
    let dataset = [...MOCK_SALES_ORDERS]

    // 3. Search filter
    if (params.search && params.search.trim()) {
      const query = params.search.toLowerCase().trim()
      dataset = dataset.filter(
        item =>
          item.orderNumber.toLowerCase().includes(query) ||
          item.customerName.toLowerCase().includes(query)
      )
    }

    // 4. Status filter
    if (params.status && params.status !== 'all') {
      dataset = dataset.filter(item => item.status === params.status)
    }

    // 5. Sorting
    if (params.sort) {
      dataset = sortArray(dataset, params.sort)
    }

    // 6. Pagination
    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const paginated = paginateArray(dataset, { page, pageSize })

    return createSuccessResponse(paginated)
  }

  async getById(id: string): Promise<ApiResponse<SalesOrderSummary>> {
    await simulateDelay()
    const item = MOCK_SALES_ORDERS.find(o => o.id === id)
    if (!item) {
      createErrorResponse(
        'NOT_FOUND',
        `Sales order dengan ID "${id}" tidak ditemukan.`,
        undefined,
        404
      )
    }
    return createSuccessResponse(item)
  }
}

export const mockSalesOrderService = new MockSalesOrderService()
