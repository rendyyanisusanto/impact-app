# MASTER DATA REFERENCE INTEGRATION & REFERENTIAL INTEGRITY

**Impact Furniture v2 — Frontend Modernization**  
**Sprint 3 Architecture Documentation**

---

### 1. Overview & Objective

In a complex ERP architecture, master data entities (e.g., Warehouses, Categories, Units of Measure) are heavily referenced by operational entities (Raw Materials, Products, Purchase Orders, Sales Orders). This document describes how Impact Furniture v2 handles:

1. **Dynamic Reference Synchronization** across disparate modules.
2. **Referential Integrity Constraints** preventing orphaned foreign key references.
3. **Cascading Deletions** for child/dependent records.

---

### 2. The Reference Service Hub (`reference.service.ts`)

`ReferenceService` serves as the single source of truth for reference datasets. It provides both reactive caching and an asynchronous contract suitable for future REST / GraphQL backends.

```typescript
export interface ReferenceOption {
  value: number
  label: string
  disabled?: boolean
}

export interface ReferenceServiceContract {
  getWarehouses(): Promise<ReferenceOption[]>
  getProductCategories(): Promise<ReferenceOption[]>
  getMaterialCategories(): Promise<ReferenceOption[]>
  getPurchaseUnits(): Promise<ReferenceOption[]>
  getUsageUnits(): Promise<ReferenceOption[]>
  getProductUnits(): Promise<ReferenceOption[]>
  getProvincesAsOptions(): Promise<ReferenceOption[]>
  getCitiesAsOptions(provinceId?: number): Promise<ReferenceOption[]>
}
```

#### Dynamic Event Propagation

When a user updates a warehouse name via `WarehouseService.update(id, payload)`:

1. `warehouseService` updates its internal state.
2. `warehouseService` calls `referenceService.setWarehouse({ id, nama, color, status })`.
3. In `ProductListPage` and `MaterialListPage`, item rows enriched with `referenceService.getWarehouseName(item.gudang_id)` automatically reflect the newly updated warehouse name on the next render pass without altering `qty`, `harga`, or other physical attributes.

---

### 3. Referential Integrity Deletion Policies

Rather than allowing unrestricted hard-deletes, modules enforce strict checks prior to performing deletion:

```
[User triggers Delete Warehouse]
                │
                ▼
        Is warehouse ID in
        materialService.isWarehouseReferenced(id) OR
        productService.isWarehouseReferenced(id)?
               / \
             YES  NO
             /      \
            /        ▼
           /      Delete Warehouse from repository
          /       Update referenceService.removeWarehouse(id)
         ▼
  Throw Error:
  "Gudang tidak dapat dihapus karena masih digunakan
   oleh data bahan atau produk."
```

#### Matrix of Restricted Deletion Safeguards

| Target Entity          | Dependent Modules / Tables          | Error Message on Blocked Deletion                                                             |
| :--------------------- | :---------------------------------- | :-------------------------------------------------------------------------------------------- |
| **Gudang (Warehouse)** | `master_data_bahan`, `produk`       | `"Gudang tidak dapat dihapus karena masih digunakan oleh data bahan atau produk."`            |
| **Satuan Beli**        | `satuan_pakai`, `master_data_bahan` | `"Satuan Beli tidak dapat dihapus karena masih digunakan oleh satuan pakai atau data bahan."` |
| **Satuan Pakai**       | `master_data_bahan`                 | `"Satuan Pakai tidak dapat dihapus karena masih digunakan oleh data bahan."`                  |
| **Satuan Barang**      | `produk`                            | `"Satuan Barang tidak dapat dihapus karena masih digunakan oleh data produk."`                |
| **Kategori Barang**    | `produk`                            | `"Kategori Barang tidak dapat dihapus karena masih digunakan oleh data produk."`              |

---

### 4. Cascading Deletes

Where the legacy schema designates subordinate one-to-many child records:

- **`master_data_suplier` -> `additional_data_suplier`**: Deleting a supplier immediately removes all key-value entries tied to `suplier_id`.
- **`master_data_customer` -> `additional_data_customer`**: Deleting a customer immediately removes all key-value entries tied to `customer_id`.
- **`produk` -> `produk_foto`**: Deleting a product removes all associated gallery images from cache.
