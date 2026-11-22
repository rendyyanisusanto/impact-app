# Sprint 3 — Task 1 Implementation Report: Master Data CRUD Foundation

## 1. Executive Summary

Task 1 establishes the enterprise-grade foundation for Master Data CRUD across **Impact Furniture v2**. Built strictly with Vue 3 Composition API, TypeScript strict mode, and Tailwind CSS without third-party component libraries, this foundation introduces:

- A standardized CRUD composable (`useCrud.ts`) managing list queries, search, filter, sorting, pagination, modal states, feedback toast, and delete confirmation dialogs.
- High-performance, browser-compatible document processing engines:
  - Excel Export (`excel-export.ts`) via `xlsx` with automated column auto-sizing and formula injection protection.
  - PDF Export (`pdf-export.ts`) via `jspdf` and `jspdf-autotable` with corporate header identity, metadata formatting, and page numbering.
  - Excel Import Engine (`excel-import.ts`) with template generator, client-side validation, error reporting, and all-or-nothing transactional guarantees.
- Reusable UI elements: `AppTableSkeleton.vue`, `AppCrudForm.vue`, `AppExportActions.vue`, `AppImportProgress.vue`, and `AppImportExcelModal.vue`.

---

## 2. Key Deliverables & Architecture

| Deliverable         | Location                                                          | Description                                                                                                                                                               |
| :------------------ | :---------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **CRUD Types**      | `app/src/shared/types/crud.types.ts`                              | Generic interfaces: `BaseEntity`, `ListQuery`, `PaginatedResponse`, `CrudService`, `ExportColumn`, `ExportOptions`, `ImportTemplateDefinition`, `ImportValidationResult`. |
| **Composable**      | `app/src/shared/composables/useCrud.ts`                           | Generic reactive state manager for master data lists, searches, filters, pagination, and modal lifecycles.                                                                |
| **Excel Export**    | `app/src/shared/utils/excel-export.ts`                            | Browser-based `.xlsx` generation with `sanitizeExcelCell` formula injection prevention.                                                                                   |
| **PDF Export**      | `app/src/shared/utils/pdf-export.ts`                              | Corporate tabular PDF generation with landscape orientation, Impact Furniture branding, and pagination.                                                                   |
| **Excel Import**    | `app/src/shared/utils/excel-import.ts`                            | Template builder with reference sheets, file parser, schema validator, and all-or-nothing verification.                                                                   |
| **Skeleton Table**  | `app/src/shared/components/data/AppTableSkeleton.vue`             | Accessible loading rows maintaining column geometry to avoid layout shifts.                                                                                               |
| **Import Modal**    | `app/src/shared/components/import-export/AppImportExcelModal.vue` | 5-step import modal (Download Template, Upload Dropzone, Validation Summary, Error Table, Progress Bar).                                                                  |
| **Export Actions**  | `app/src/shared/components/import-export/AppExportActions.vue`    | Quick action buttons for Excel and PDF downloads with loading indicators.                                                                                                 |
| **Import Progress** | `app/src/shared/components/import-export/AppImportProgress.vue`   | Animated percentage bar (0–100%) with processed row counter.                                                                                                              |
| **Unit Test Suite** | `app/tests/unit/shared/ExcelImportExport.spec.ts`                 | Comprehensive unit tests for sanitization, export, template builder, validation, and all-or-nothing logic.                                                                |

---

## 3. Formula Injection (CSV/Excel Injection) Protection

To prevent remote code execution or formula calculation exploits when exporting user-generated ERP data to spreadsheets, all cell values are sanitized through `sanitizeExcelCell`:

- Any string starting with `=`, `+`, `-`, `@`, `\t`, or `\r` (even after whitespace trimming) is prefixed with a single quote `'`.
- Spreadsheets treat prefixed cells strictly as plain text rather than executable formulas.
- Regular numbers, dates, and safe strings remain untouched.

---

## 4. All-or-Nothing Import Transactional Rule

The import engine guarantees data integrity:

1. File format validation: Only `.xlsx` and `.xls` files under 10 MB are accepted.
2. Required header validation: Confirms that all mandatory columns defined in the template definition exist.
3. Row-by-row validation: Checks required fields, max length, number formats, email patterns, and reference IDs.
4. Intra-file duplicate detection: Detects duplicate entity codes within the uploaded sheet.
5. **All-or-Nothing Rule**: If even 1 row has validation errors (`invalidCount > 0`), the import button is completely disabled. The user is presented with a detailed error breakdown (Row Number, Column Name, Error Description) and instructions to correct the file before retrying.

---

## 5. Verification & Testing

- `npm run typecheck`: Passed with 0 errors.
- `npm run lint`: Passed with 0 errors.
- `npm run format:check`: Passed with 0 errors.
- Vitest unit tests: 9 tests in `ExcelImportExport.spec.ts` passing.
