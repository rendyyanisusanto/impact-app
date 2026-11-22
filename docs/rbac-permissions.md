# Role-Based Access Control (RBAC) Specification — Impact Furniture v2

## 1. Overview

This document details the Role-Based Access Control (RBAC) architecture for Impact Furniture v2. Permissions follow a resource-action model with granular dot-notation identifiers and hierarchical inheritance.

---

## 2. Permission Model

Each permission is defined as:

```ts
export type PermissionAction = 'create' | 'read' | 'update' | 'delete'

export interface Permission {
  resource: string
  actions: PermissionAction[]
}
```

### Resource Identifiers

| Module         | Resource Identifier            | Description                           |
| :------------- | :----------------------------- | :------------------------------------ |
| **Dashboard**  | `dashboard`                    | Beranda operasional & KPI widgets     |
| **Pengadaan**  | `procurement.suppliers`        | Master data suplier                   |
|                | `procurement.purchase-orders`  | Purchase order bahan baku             |
|                | `procurement.goods-receipts`   | Penerimaan barang suplier             |
|                | `procurement.bill-payments`    | Pembayaran tagihan suplier            |
| **Persediaan** | `inventory.materials`          | Master data bahan baku kayu/busa/kain |
|                | `inventory.products`           | Master data produk furniture          |
|                | `inventory.stock-adjustments`  | Penyesuaian stok opname               |
|                | `inventory.material-mutations` | Mutasi antar gudang                   |
| **Produksi**   | `production.orders`            | Surat Perintah Kerja (SPK) produksi   |
|                | `production.bom`               | Bill of Materials (BoM) template      |
| **Penjualan**  | `sales.customers`              | Master data pelanggan                 |
|                | `sales.orders.impact`          | Sales order lini Impact               |
|                | `sales.orders.pola`            | Sales order lini Pola                 |
|                | `sales.orders.ks`              | Sales order lini KS                   |
|                | `sales.invoice-payments`       | Pembayaran invoice pelanggan          |
|                | `sales.other-income`           | Pendapatan lain-lain                  |
| **Pengiriman** | `delivery.notes`               | Surat Jalan pengiriman furniture      |
| **Keuangan**   | `accounting.accounts`          | Bagan akun (CoA)                      |
|                | `accounting.journals`          | Jurnal umum dan penyesuaian           |
| **Sistem**     | `system.users`                 | Manajemen pengguna ERP                |
|                | `system.roles`                 | Manajemen wewenang peran              |

---

## 3. Role Fixtures

### 1. Super Administrator (`superadmin`)

- **Permissions**: `{ resource: '*', actions: ['create', 'read', 'update', 'delete'] }`
- **Scope**: Full access to all 11 modules and submenus.

### 2. Staff Penjualan (`staff.penjualan`)

- **Permissions**:
  - `dashboard:read`
  - `sales.*`: `create`, `read`, `update`, `delete`
  - `sales.customers`: `create`, `read`, `update`, `delete`
  - `sales.orders.impact`: `create`, `read`, `update`, `delete`
  - `sales.orders.pola`: `create`, `read`, `update`, `delete`
  - `sales.orders.ks`: `create`, `read`, `update`, `delete`
  - `sales.invoice-payments`: `read`, `create`
  - `sales.other-income`: `read`, `create`
- **Scope**: Can access Dashboard and Penjualan modules. All other modules hidden.

### 3. Staff Gudang & Logistik (`staff.gudang`)

- **Permissions**:
  - `dashboard:read`
  - `inventory.*`: `create`, `read`, `update`, `delete`
  - `inventory.materials`: `create`, `read`, `update`, `delete`
  - `inventory.products`: `create`, `read`, `update`, `delete`
  - `inventory.stock-adjustments`: `create`, `read`
  - `inventory.material-mutations`: `create`, `read`
  - `delivery.notes`: `create`, `read`, `update`
- **Scope**: Can access Dashboard, Persediaan, and Pengiriman modules. All other modules hidden.

---

## 4. Helper Utilities

- `hasPermission(user, resource, action)`
- `hasAnyPermission(user, permissions)`
- `hasAllPermissions(user, permissions)`
- `canAccessRoute(user, permission)`
- `filterNavigationByPermissions(items, user)`

---

## 5. UI Integration

Use the composable `usePermission()` in any view to conditionally show action buttons or view elements:

```vue
<script setup lang="ts">
import { usePermission } from '@/shared/composables/usePermission'

const { canCreate, canDelete } = usePermission()
</script>

<template>
  <AppButton v-if="canCreate('sales.orders.impact')" variant="primary">
    Buat Sales Order
  </AppButton>
  <AppButton v-if="canDelete('sales.orders.impact')" variant="danger"> Hapus </AppButton>
</template>
```
