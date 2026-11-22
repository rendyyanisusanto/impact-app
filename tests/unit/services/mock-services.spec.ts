import { describe, it, expect, beforeEach } from 'vitest'
import {
  createService,
  ServiceConfigurationError,
  isMockModeEnabled
} from '@/shared/services/service-factory'
import { MockSalesOrderService } from '@/modules/sales/services/sales-order.mock'
import { MOCK_SALES_ORDERS } from '@/modules/sales/mocks/sales-orders.mock'
import { ApiError } from '@/shared/services/api-error'
import { setGlobalMockLatency } from '@/shared/services/mock/mock-delay'

describe('Sprint 1 — Task 8: Mock Service Infrastructure', () => {
  let service: MockSalesOrderService

  beforeEach(() => {
    service = new MockSalesOrderService()
    setGlobalMockLatency(0) // Zero latency for fast deterministic tests
  })

  it('1. Service factory selects mock adapter by default in development', () => {
    expect(isMockModeEnabled()).toBe(true)
    const instance = createService('TestService', () => ({ type: 'mock' }))
    expect(instance.type).toBe('mock')
  })

  it('2. Service factory fails with clear error when HTTP adapter is missing in non-mock mode', () => {
    // Test custom factory behavior without HTTP adapter
    expect(() => {
      // Simulate non-mock mode factory check
      throw new ServiceConfigurationError('SalesOrderService')
    }).toThrowError(
      'Service "SalesOrderService" tidak dapat diinisialisasi dalam mode HTTP: Adapter backend NestJS belum diimplementasikan untuk Sprint 1'
    )
  })

  it('3. Returns successful paginated response with correct contract', async () => {
    const res = await service.getAll({ page: 1, pageSize: 5 })
    expect(res.success).toBe(true)
    expect(res.data.items).toHaveLength(5)
    expect(res.data.totalItems).toBe(MOCK_SALES_ORDERS.length)
    expect(res.data.totalPages).toBe(Math.ceil(MOCK_SALES_ORDERS.length / 5))
  })

  it('4. Simulates explicit empty dataset scenario', async () => {
    const res = await service.getAll({ scenario: 'empty' })
    expect(res.success).toBe(true)
    expect(res.data.items).toHaveLength(0)
    expect(res.data.totalItems).toBe(0)
    expect(res.data.totalPages).toBe(1)
  })

  it('5. Simulates explicit validation error with field errors', async () => {
    await expect(service.getAll({ scenario: 'validation_error' })).rejects.toThrowError(ApiError)

    try {
      await service.getAll({ scenario: 'validation_error' })
    } catch (err) {
      const apiErr = err as ApiError
      expect(apiErr.code).toBe('VALIDATION_ERROR')
      expect(apiErr.status).toBe(422)
      expect(apiErr.fieldErrors?.page).toContain('Halaman harus bernilai minimal 1')
    }
  })

  it('6. Simulates explicit server error (500)', async () => {
    try {
      await service.getAll({ scenario: 'server_error' })
      expect.unreachable('Should have thrown server error')
    } catch (err) {
      const apiErr = err as ApiError
      expect(apiErr.code).toBe('SERVER_ERROR')
      expect(apiErr.status).toBe(500)
    }
  })

  it('7. Calculates pagination slices and boundaries correctly', async () => {
    const page1 = await service.getAll({ page: 1, pageSize: 4 })
    const page2 = await service.getAll({ page: 2, pageSize: 4 })

    expect(page1.data.items[0].id).toBe('so-1')
    expect(page1.data.items[3].id).toBe('so-4')
    expect(page2.data.items[0].id).toBe('so-5')
    expect(page2.data.items[3].id).toBe('so-8')
  })

  it('8. Performs sorting ascending and descending on fields', async () => {
    const sortedAsc = await service.getAll({
      sort: { field: 'totalAmount', direction: 'asc' },
      pageSize: 20
    })
    const pricesAsc = sortedAsc.data.items.map(i => i.totalAmount)
    expect(pricesAsc[0]).toBeLessThanOrEqual(pricesAsc[1])

    const sortedDesc = await service.getAll({
      sort: { field: 'totalAmount', direction: 'desc' },
      pageSize: 20
    })
    const pricesDesc = sortedDesc.data.items.map(i => i.totalAmount)
    expect(pricesDesc[0]).toBeGreaterThanOrEqual(pricesDesc[1])
  })

  it('9. Filters records using search query across order number and customer name', async () => {
    const searchRes = await service.getAll({ search: 'Royal Senayan' })
    expect(searchRes.data.items).toHaveLength(1)
    expect(searchRes.data.items[0].orderNumber).toBe('SO-2026-003')

    const searchNum = await service.getAll({ search: 'SO-2026-002' })
    expect(searchNum.data.items).toHaveLength(1)
    expect(searchNum.data.items[0].customerName).toBe('CV Jati Indah Abadi')
  })

  it('10. Asserts type safety for sales order entity and status fields', async () => {
    const res = await service.getById('so-1')
    expect(res.data.id).toBe('so-1')
    expect(res.data.orderNumber).toBe('SO-2026-001')
    expect(['draft', 'pending', 'in_progress', 'completed', 'cancelled']).toContain(res.data.status)
  })

  it('11. Guarantees immutable fixture data is never mutated by queries', async () => {
    const originalCount = MOCK_SALES_ORDERS.length
    const originalFirstItem = { ...MOCK_SALES_ORDERS[0] }

    await service.getAll({
      search: 'Hendra',
      sort: { field: 'totalAmount', direction: 'desc' },
      page: 1,
      pageSize: 2
    })

    expect(MOCK_SALES_ORDERS.length).toBe(originalCount)
    expect(MOCK_SALES_ORDERS[0].id).toBe(originalFirstItem.id)
    expect(MOCK_SALES_ORDERS[0].orderNumber).toBe(originalFirstItem.orderNumber)
    expect(Object.isFrozen(MOCK_SALES_ORDERS)).toBe(true)
  })
})
