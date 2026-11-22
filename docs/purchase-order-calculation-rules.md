# PURCHASE ORDER CALCULATION RULES & DECIMAL PRECISION SPECIFICATION

## 1. Overview

The calculation engine (`app/src/modules/procurement/purchase-orders/utils/purchase-order-calculations.ts`) governs all financial computations within the Purchase Order lifecycle. To prevent JavaScript floating-point errors (e.g. `0.1 + 0.2 = 0.30000000000000004`), calculations enforce round-half-up decimal precision up to 2 decimal places.

---

## 2. Mathematical Formulas

### 2.1 Line Item Subtotal

For each row in `detail_purchase_order`:

$$
\text{GrossLineTotal} = \text{Qty} \times \text{Harga}
$$

$$
\text{LineDiscountNominal} = \text{GrossLineTotal} \times \left( \frac{\text{Diskon}_{\text{line}}}{100} \right)
$$

$$
\text{LineSubtotal} = \text{GrossLineTotal} - \text{LineDiscountNominal}
$$

- `Qty`: must be $\ge 0$
- `Harga`: must be $\ge 0$
- $\text{Diskon}_{\text{line}}$: constrained to the range $[0, 100]$

### 2.2 Document Gross Subtotal (Total Bruto)

The document gross subtotal is the sum of all valid line subtotals:

$$
\text{Subtotal} = \sum_{i=1}^{n} \text{LineSubtotal}_i
$$

### 2.3 Global Discount Nominal

When a document-level global discount percentage is applied:

$$
\text{DiskonNominal} = \text{Subtotal} \times \left( \frac{\text{Diskon}_{\text{global}}}{100} \right)
$$

### 2.4 Total Sebelum PPN (Net Subtotal)

$$
\text{TotalSebelumPPN} = \max\left(0, \text{Subtotal} - \text{DiskonNominal}\right)
$$

### 2.5 PPN Nominal

If PPN is enabled (`ppn === 1`):

$$
\text{PPNNominal} = \text{TotalSebelumPPN} \times \left( \frac{\text{TaxRate}}{100} \right)
$$

If PPN is disabled (`ppn === 0`):

$$
\text{PPNNominal} = 0
$$

_(Note: $\text{TaxRate}$ is derived dynamically from `ppn.nama`, which is an integer storing the rate, e.g., 11 for 11%)_

### 2.6 Total Bayar (Grand Total)

$$
\text{TotalBayar} = \text{TotalSebelumPPN} + \text{PPNNominal}
$$

---

## 3. Decimal Precision & Rounding Algorithm

To guarantee exact accounting precision without floating-point drift:

```typescript
export function roundDecimal(value: number, decimals: number = 2): number {
  if (isNaN(value) || !isFinite(value)) return 0
  const factor = Math.pow(10, decimals)
  return Math.round((value + Number.EPSILON) * factor) / factor
}
```

Every intermediary and final figure (`subtotal`, `diskonNominal`, `totalSebelumPpn`, `ppnNominal`, `totalBayar`) is passed through `roundDecimal` at each calculation stage.

---

## 4. Edge Cases Handled

1. **Zero Quantity or Zero Price**:
   - Subtotal cleanly evaluates to `0`. No `NaN` or `Infinity` propagated.
2. **100% Line Discount**:
   - Subtotal cleanly evaluates to `0`.
3. **100% Global Discount**:
   - `TotalSebelumPPN` becomes `0`, `PPNNominal` becomes `0`, and `TotalBayar` becomes `0`.
4. **Empty Spreadsheet Rows**:
   - Unselected rows (where `bahan_id` is null) are completely bypassed during calculation.
5. **PPN Toggled Off**:
   - PPN nominal is immediately zeroed out; `TotalBayar` equals `TotalSebelumPPN`.
