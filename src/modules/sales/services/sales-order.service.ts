import type { SalesOrderService } from './sales-order.mock'
import { mockSalesOrderService } from './sales-order.mock'
import { createService } from '@/shared/services/service-factory'
import {
  salesOrderTransactionService,
  SalesOrderTransactionService
} from './sales-order-transaction.service'

export type { SalesOrderService }
export { salesOrderTransactionService, SalesOrderTransactionService }

export function getSalesOrderService(): SalesOrderService {
  return createService<SalesOrderService>(
    'SalesOrderService',
    () => mockSalesOrderService
    // HTTP factory will be supplied when NestJS backend is ready
  )
}

export const salesOrderService = getSalesOrderService()
