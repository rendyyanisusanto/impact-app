# Excel & PDF Processing Architecture — Impact Furniture v2

## 1. Overview

**Impact Furniture v2** provides enterprise document processing directly inside the client browser without round-trips to heavy backend document conversion servers. This ensures instant performance, reduced server load, and an offline-capable architecture.

The document processing stack leverages:

- `xlsx` (SheetJS): Fast, lightweight parsing and generation of `.xlsx` workbooks.
- `jspdf` & `jspdf-autotable`: Vector PDF document generation with typography and corporate branding.

---

## 2. Excel Export & Security Hardening

Located in `app/src/shared/utils/excel-export.ts`.

### Formula Injection (CSV/Excel Injection) Mitigation

Exporting untrusted user input to spreadsheets presents security risks where attackers craft cells starting with mathematical or command symbols (`=`, `+`, `-`, `@`, `\t`, `\r`) to execute unauthorized macros or DDE commands when opened by managers in Microsoft Excel or LibreOffice Calc.

The `sanitizeExcelCell` utility enforces:

```ts
export function sanitizeExcelCell(value: unknown): unknown {
  if (typeof value === 'string') {
    if (/^[=+\-@\t\r]/.test(value) || /^[=+\-@]/.test(value.trim())) {
      return `'${value}`
    }
  }
  return value
}
```

Pre-pending a single quote `'` forces spreadsheet applications to treat the cell contents strictly as plain text literal values.

### Automated Column Sizing

The exporter calculates column widths dynamically by taking the maximum string length of the header label versus cell contents, adding padding to prevent text truncation.

---

## 3. PDF Export

Located in `app/src/shared/utils/pdf-export.ts`.

### Visual Features

- **Corporate Branding**: Impact Furniture logo mark, Teal Primary header (#0F766E), and enterprise subtitle.
- **Orientation**: Supports Landscape (`'landscape'`) for dense tabular data and Portrait (`'portrait'`) for narrow reports.
- **Pagination**: Built-in footer rendering `Halaman X dari Y` and export timestamp in Indonesian locale (`DD MMMM YYYY, HH:mm WIB`).
- **Data Formatting**: Customizable column formatters for currency (IDR), status badges, dates, and nested properties.

---

## 4. Excel Import Engine & All-or-Nothing Rule

Located in `app/src/shared/utils/excel-import.ts`.

### 1. Template Generation

- Multi-sheet template builder:
  1. **Sheet 1 ("Petunjuk Pengisian")**: Plain-language guidelines, required indicators, formatting rules.
  2. **Sheet 2 ("Template Data")**: Formatted column headers with sample demonstration rows.
  3. **Sheet 3+ ("Referensi ...")**: Lookup tables (e.g. Daftar ID Kota, Gudang, Satuan) preventing foreign key errors.

### 2. Validation Flow

```text
[ Upload File ]
       |
       v
[ Size <= 10MB & .xlsx Extension Check ]
       |
       v
[ Read ArrayBuffer & Parse Workbook ]
       |
       v
[ Mandatory Header Columns Verification ]
       |
       v
[ Row-by-Row Field Type & Regex Checking ]
       |
       v
[ In-File Entity Code Duplicate Detection ]
       |
       +---> Errors Found (invalidCount > 0) ---> [ Display Error Table & Block Import ]
       |
       +---> All Rows Valid (invalidCount = 0) -> [ Enable Import Button -> Progress Animation -> Batch Service ]
```

### 3. Transactional Integrity (All-or-Nothing)

Partial imports that create orphaned or half-imported data sets are strictly prohibited. If even 1 row fails validation among 1,000 uploaded rows, the system prevents batch submission until the operator corrects the spreadsheet.

### 4. Snapshot Rollback in Services

In addition to client-side pre-flight validation, mock services implementing `importBatch` (such as `productService`, `materialService`, and `warehouseService`) take a deep snapshot of their in-memory items prior to insertion:

```typescript
async importBatch(itemsToImport: CreateProductDto[]): Promise<Product[]> {
  const snapshot = JSON.parse(JSON.stringify(this.items))
  try {
    // 1. Validation pass on all rows
    for (let i = 0; i < itemsToImport.length; i++) {
      if (!itemsToImport[i].nama) {
        throw new Error(`Baris ${i + 1}: Nama produk wajib diisi.`)
      }
    }
    // 2. Insert records
    ...
  } catch (err) {
    this.items = snapshot
    throw err
  }
}
```

If an unhandled exception or constraint failure occurs during insertion, the service automatically rolls back to the snapshot, ensuring zero partial commits.
