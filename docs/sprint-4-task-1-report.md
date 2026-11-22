# SPRINT 4 — TASK 1 REPORT

## PROCUREMENT FOUNDATION, DATABASE MAPPING & MOCK SERVICES

**Impact Furniture v2 — Frontend Modernization**  
**Sprint 4: Task 1 — Procurement Foundation**  
**Date:** 2026-10-31  
**Status:** Completed & Verified

---

### 1. Executive Summary

Task 1 establishes the architectural foundation for the Procurement (Pengadaan) subsystem in Impact Furniture v2. Mapped directly against `u1573701_smm(2).sql`, this foundation implements typed domain models, decimal-safe arithmetic calculation utilities, atomic transaction simulations, and mock repositories integrated with Master Data from Sprint 3.

---

### 2. Database Mapping & Source of Truth Alignment

The implementation strictly reflects the legacy schema without inventing fields:

#### A. Table `purchase_order` (Header)

- `id`: `int(10) unsigned`, primary key
- `kode`: `varchar(255)`, nullable
- `suplier_id`: `int(11)`, nullable (legacy spelling preserved: `suplier_id`)
- `tanggal`: `date`, nullable
- `keterangan`: `text`, nullable
- `is_ppn`: `tinyint(1)`, default `0`
- `ppn_id`: `int(11)`, foreign reference to `ppn.id`
- `subtotal`: `decimal(20,2)`, sum of active detail item subtotals
- `diskon`: `decimal(20,2)`, nominal global discount
- `total`: `decimal(20,2)`, grand total payable
- `status`: `tinyint(1)` (0 = Draft / Menunggu, 1 = Disetujui)
- `total_ppn`: `decimal(20,2)`, tax amount
- `status_aktif`: `tinyint(1)`, default `1` (1 = Aktif, 0 = Dibatalkan)
- `status_transaksi_id`: `int(11)` (1 = CASH, 2 = JATUH TEMPO)
- `uuid`: `text`, unique tracking identifier

#### B. Table `detail_purchase_order` (Line Items)

- `id`: `int(10) unsigned`, primary key
- `purchase_order_id`: `int(10) unsigned`, foreign key to `purchase_order.id`
- `bahan_id`: `int(11)`, foreign reference to `master_data_bahan.id`
- `qty`: `int(11)`, positive integer quantity
- `satuan_beli_id`: `int(11)`, foreign reference to `satuan_beli.id`
- `harga`: `decimal(20,2)`, unit purchase price
- `diskon`: `int(11)`, percentage discount on line item (0–100)
- `subtotal`: `decimal(20,2)`, calculated line subtotal
- `keterangan`: `varchar(255)`, optional line item remark

#### C. Referensi & Status

- **Supplier**: Resolved from `master_data_suplier`.
- **Bahan**: Resolved from `master_data_bahan` (displaying read-only live stock `qty`).
- **Satuan**: Resolved from `satuan_beli`.
- **PPN**: Resolved from `ppn` table; `ppn.nama` is an integer representing percentage rate (11 = 11%).
- **Status Transaksi**: Resolved from `status_transaksi` (1 = `CASH`, 2 = `JATUH TEMPO`).

---

### 3. Service Contracts & Atomic Persistence

The `PurchaseOrderService` provides:

- `list(filters?: PurchaseOrderFilters)`
- `getById(id: number)`
- `create(payload: PurchaseOrderCreatePayload)`
- `update(id: number, payload: PurchaseOrderUpdatePayload)`
- `delete(id: number)`: Enforces business safeguard that approved POs (`status: 1`) cannot be deleted.
- `generateCode(dateStr?: string)`: Generates legacy format `PO/DD-MM-YY-xxxx`.
- `importBatch(rows)`: Atomic multi-PO import supporting parent headers and child line items.

All create/update operations are atomic: if validation fails on any row or header property, in-memory state rolls back to a deep snapshot, preventing corrupt partial saves.

---

### 4. Verification

All foundation tests in `tests/unit/modules/procurement/PurchaseOrderFoundation.spec.ts` (11 tests) passed with 0 errors.
