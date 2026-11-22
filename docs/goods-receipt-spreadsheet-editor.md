# GOODS RECEIPT SPREADSHEET EDITOR SPECIFICATION

## 1. Overview

The Goods Receipt spreadsheet editor (`GoodsReceiptSpreadsheet.vue`) delivers an Excel-like desktop experience for warehouse receiving clerks. It automatically loads line items from the selected Purchase Order, displaying clear comparison between ordered quantities, past receipts, unreceived balance, and currently accepted physical quantities.

---

## 2. Grid Columns & Editable Behaviors

| No  | Column Header     | Data Source             | Behavior                                                                                     |
| :-: | :---------------- | :---------------------- | :------------------------------------------------------------------------------------------- |
|  1  | `No`              | Row index               | Read-only integer badge                                                                      |
|  2  | `Nama Bahan Baku` | `master_data_bahan`     | Read-only item title and code                                                                |
|  3  | `Satuan`          | `satuan_beli`           | Read-only purchasing unit badge                                                              |
|  4  | `Stok Gudang`     | `master_data_bahan.qty` | Read-only current stock                                                                      |
|  5  | `Qty Pesan`       | PO detail `qty`         | Read-only reference quantity                                                                 |
|  6  | `Sdh Terima`      | Prior PBs sum           | Read-only previously accepted quantity                                                       |
|  7  | `Sisa PO`         | Unreceived balance      | Read-only remaining balance (`qty_pesan - already_received`)                                 |
|  8  | `Qty Terima *`    | User entry              | **Editable integer** ($\ge 0$, $\le \text{Sisa PO}$)                                         |
|  9  | `Harga (Rp)`      | PO detail price         | Editable currency unit price                                                                 |
| 10  | `Diskon (%)`      | PO detail discount      | Editable discount percentage ($0 - 100$)                                                     |
| 11  | `Subtotal (Rp)`   | Calculated UI-only      | Read-only line total: $\text{Qty Terima} \times \text{Harga} \times (1 - \text{Diskon}/100)$ |

---

## 3. Desktop Keyboard Navigation

- **`Tab`**: Commits current cell and advances to the next editable cell in the row; advances to next row when at the end.
- **`Shift + Tab`**: Moves focus backwards to the previous editable cell.
- **`Arrow Up / Down`**: Navigates vertically within the same column between consecutive rows.
- **`Enter`**: Commits cell value and advances to the next row.
- **Auto-Select on Focus**: Selecting or clicking a numeric input highlights existing values for rapid overwriting.
