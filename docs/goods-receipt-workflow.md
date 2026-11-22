# GOODS RECEIPT (PENERIMAAN BARANG) WORKFLOW SPECIFICATION

## 1. Overview

The Goods Receipt module manages the physical intake and verification of raw materials delivered by suppliers against previously approved Purchase Orders. It enforces partial receipt rules, prevents over-receipt beyond unreceived balance, maintains document audit trails, and provides a safe boundary for subsequent stock ledger updates.

---

## 2. End-to-End Workflow Diagram

```mermaid
flowchart TD
    Start(["Operator opens /procurement/goods-receipts/create"]) --> SelectPO["Select Approved Purchase Order (PO)"]
    SelectPO --> FetchPO["Service loads PO header, details & prior intake history"]
    FetchPO --> PopulateSpreadsheet["Populate Spreadsheet with PO Items<br/>Qty Pesan, Already Received, Remaining Qty"]
    PopulateSpreadsheet --> FillDelivery["Fill Delivery Note (Surat Jalan), Warehouse & Sender"]
    FillDelivery --> EditQty["Operator inspects shipment & enters Qty Terima per row"]

    EditQty --> ValidateCheck{"Validation:<br/>1. Qty Terima >= 0<br/>2. Qty Terima <= Remaining<br/>3. Mandatory Header Fields"}

    ValidateCheck -- "Invalid" --> ShowErrors["Highlight Cell & Banner Errors"]
    ShowErrors --> EditQty

    ValidateCheck -- "Valid" --> CalcSummary["Real-Time Summary Calculation<br/>Nilai PB, PPN, Grand Total"]
    CalcSummary --> SubmitAction["Click 'Simpan Data'"]
    SubmitAction --> AtomicSave["GoodsReceiptService saves atomically<br/>(Header + Details in 1 transaction)"]
    AtomicSave --> Redirect["Success Toast & Redirect to List/Detail"]
```

---

## 3. Partial Receipts & Remaining Quantity Math

A Purchase Order may be delivered in multiple installments over time. When receiving items for a PO:

1. The service scans all active Penerimaan Barang (`status_aktif === 1`) linked to the selected PO, excluding the current document if editing.
2. For each ordered material:
   $$
   \text{AlreadyReceived} = \sum \text{QtyTerima}_{\text{prior PBs}}
   $$
   $$
   \text{RemainingQty} = \max\left(0, \text{QtyPesan} - \text{AlreadyReceived}\right)
   $$
3. By default, `qty_terima` initializes to $\text{RemainingQty}$ so the operator can receive the remaining balance in 1 click, or adjust it downwards for partial shipments.
4. Validation rule:
   $$
   0 \le \text{QtyTerima} \le \text{RemainingQty}
   $$
   Any input where $\text{QtyTerima} > \text{RemainingQty}$ triggers an immediate per-cell error and blocks submission.

---

## 4. Stock Integration Boundary

- Goods Receipt physical intake verifies incoming materials into the assigned warehouse (`gudang_id`).
- In this phase (Task 6 & 7), mutations to `master_data_bahan.qty` and stock card records (`histori_stok_bahan`) are managed through an explicit service boundary to prevent duplicate stock increments between unverified drafts and approved receipts.
- Stock posting is staged for coordinated execution with inventory ledgers in subsequent tasks.
