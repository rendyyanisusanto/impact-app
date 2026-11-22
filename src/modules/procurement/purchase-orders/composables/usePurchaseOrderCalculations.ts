import { computed, type Ref } from 'vue'
import type { PurchaseOrderDetailRow, PurchaseOrderSummary } from '../types/purchase-order.types'
import { calculateDocumentSummary } from '../utils/purchase-order-calculations'

export function usePurchaseOrderCalculations(
  rows: Ref<PurchaseOrderDetailRow[]>,
  isPpn: Ref<boolean>,
  ppnPersen: Ref<number>,
  diskonPersen: Ref<number>
) {
  const summary = computed<PurchaseOrderSummary>(() => {
    return calculateDocumentSummary(rows.value, isPpn.value, ppnPersen.value, diskonPersen.value)
  })

  return {
    summary
  }
}
