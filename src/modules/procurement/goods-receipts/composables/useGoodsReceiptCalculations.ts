import { computed, type Ref } from 'vue'
import type { GoodsReceiptDetailRow, GoodsReceiptSummary } from '../types/goods-receipt.types'
import { calculateGoodsReceiptSummary } from '../utils/goods-receipt-calculations'

export function useGoodsReceiptCalculations(
  rows: Ref<GoodsReceiptDetailRow[]>,
  isPpn: Ref<boolean>,
  ppnPersen: Ref<number>,
  diskonPersen: Ref<number>
) {
  const summary = computed<GoodsReceiptSummary>(() => {
    return calculateGoodsReceiptSummary(
      rows.value,
      isPpn.value,
      ppnPersen.value,
      diskonPersen.value
    )
  })

  return {
    summary
  }
}
