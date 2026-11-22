# Procurement Test Architecture & Strategy

## Impact Furniture v2 ERP

---

### Test Suites Structure

| Test File                                | Focus                                                              |   Tests Passed   |
| ---------------------------------------- | ------------------------------------------------------------------ | :--------------: |
| `PurchaseOrderFoundation.spec.ts`        | Schema mapping, calculations, DTOs                                 |      11/11       |
| `PurchaseOrderSpreadsheet.spec.ts`       | Material grid interaction, keyboard navigation, inline calculation |       7/7        |
| `PurchaseOrderList.spec.ts`              | List page, filtering, no import check, export PDF/Excel            |       4/4        |
| `PurchaseOrderForm.spec.ts`              | Create & edit full page workflow, validation                       |       3/3        |
| `GoodsReceiptList.spec.ts`               | PB list page, filters, export PDF/Excel, no import check           |       4/4        |
| `GoodsReceiptForm.spec.ts`               | PB create & edit form, PO detail loader, spreadsheet               |       5/5        |
| `GoodsReceiptStockIntegration.spec.ts`   | Stock mutation, `histori_stok_bahan`, idempotency, reversal        |       5/5        |
| `BillPaymentList.spec.ts`                | PT list page, filters, export PDF/Excel, delete confirmation       |       4/4        |
| `BillPaymentForm.spec.ts`                | PT create & edit form, allocation grid, overpayment check          |       5/5        |
| `ProcurementIntegrationWorkflow.spec.ts` | Cross-module PO -> PB -> Stock -> PT end-to-end integration, RBAC  |       4/4        |
| **Total Procurement Unit Tests**         | **All 10 Procurement Test Suites**                                 | **52/52 Passed** |
