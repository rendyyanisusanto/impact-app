# SPRINT 9 — TASK 1 & 4: GROUPS PERMISSION MAPPING & MATRIX REGISTRY

## 1. Overview
The permission matrix in IMPACT FURNITURE V2 bridges legacy CodeIgniter 3 permission structures (`groups_detail` with `c, r, u, d` flags) and modern enterprise Vue 3 / Pinia RBAC.

This document details the complete 10-category menu hierarchy, submenu mapping, action restrictions, and the bidirectional translation adapter.

---

## 2. Legacy Permission Semantics (CRUD)

| Action Code | Legacy Name | Meaning & Scope |
|---|---|---|
| **C** | Create | Creating new records, drafting transactions, adding items |
| **R** | Read | Viewing records, navigating list pages, inspecting detail views, and **printing/exporting** documents |
| **U** | Update | Modifying existing records, updating form data, changing statuses |
| **D** | Delete | Deleting records, canceling transactions, removing items |

> [!IMPORTANT]
> In legacy CI3, the **Read (R)** flag inherently includes report printing and document export. V2 adheres strictly to this legacy semantic—there is no standalone "Print" flag in the schema.

---

## 3. Menu Category & Submenu Registry

The registry contains **10 top-level modules** directly mapped to the main navigation and legacy menu structure:

```
├── 1. Dashboard (dashboard)
├── 2. Pengadaan (procurement)
├── 3. Persediaan (inventory)
├── 4. Produksi (production)
├── 5. Penjualan (sales)
├── 6. Pengiriman (delivery)
├── 7. Keuangan (finance)
├── 8. Laporan (reporting)
├── 9. Human Resources (hr)
└── 10. System Setting (system)
```

### Granular Submenu Action Rules

| Category | Category ID | Submenu Key | Submenu Label | C | R | U | D | Notes |
|---|---|---|---|---|---|---|---|---|
| **Dashboard** | `dashboard` | `dashboard.overview` | Overview Dashboard | ❌ | ✅ | ❌ | ❌ | Read-only analytic view |
| **Pengadaan** | `procurement` | `procurement.purchase_order` | Purchase Order | ✅ | ✅ | ✅ | ✅ | Full CRUD |
| | | `procurement.goods_receipt` | Penerimaan Barang (GR) | ✅ | ✅ | ✅ | ✅ | Full CRUD |
| | | `procurement.supplier` | Master Supplier | ✅ | ✅ | ✅ | ✅ | Full CRUD |
| **Persediaan** | `inventory` | `inventory.material` | Master Bahan Baku | ✅ | ✅ | ✅ | ✅ | Full CRUD |
| | | `inventory.material_category` | Kategori Bahan Baku | ✅ | ✅ | ✅ | ✅ | Full CRUD |
| | | `inventory.product` | Master Produk Jadi | ✅ | ✅ | ✅ | ✅ | Full CRUD |
| | | `inventory.product_category` | Kategori Produk | ✅ | ✅ | ✅ | ✅ | Full CRUD |
| | | `inventory.warehouse` | Master Gudang | ✅ | ✅ | ✅ | ✅ | Full CRUD |
| | | `inventory.mutation` | Mutasi Stok Bahan | ✅ | ✅ | ✅ | ✅ | Full CRUD |
| | | `inventory.adjustment` | Penyesuaian Stok | ✅ | ✅ | ✅ | ✅ | Full CRUD |
| | | `inventory.units` | Satuan Barang | ✅ | ✅ | ✅ | ✅ | Full CRUD |
| **Produksi** | `production` | `production.transaction` | Transaksi Produksi | ✅ | ✅ | ✅ | ✅ | Full CRUD |
| | | `production.bom` | Bill of Materials (BOM) | ✅ | ✅ | ✅ | ✅ | Full CRUD |
| **Penjualan** | `sales` | `sales.order` | Sales Order | ✅ | ✅ | ✅ | ✅ | Full CRUD |
| | | `sales.customer` | Master Pelanggan | ✅ | ✅ | ✅ | ✅ | Full CRUD |
| | | `sales.tax` | Master Pajak | ✅ | ✅ | ✅ | ✅ | Full CRUD |
| **Pengiriman** | `delivery` | `delivery.note` | Surat Jalan (Delivery Note)| ✅ | ✅ | ✅ | ✅ | Full CRUD |
| **Keuangan** | `finance` | `finance.invoice` | Faktur Penjualan (Invoice) | ✅ | ✅ | ✅ | ✅ | Full CRUD |
| | | `finance.payment` | Pembayaran Piutang | ✅ | ✅ | ✅ | ✅ | Full CRUD |
| | | `finance.bill_payment` | Pembayaran Hutang Supplier | ✅ | ✅ | ✅ | ✅ | Full CRUD |
| **Laporan** | `reporting` | `reporting.procurement` | Laporan Pengadaan | ❌ | ✅ | ❌ | ❌ | Report Read & Export Only |
| | | `reporting.inventory` | Laporan Persediaan | ❌ | ✅ | ❌ | ❌ | Report Read & Export Only |
| | | `reporting.production` | Laporan Produksi | ❌ | ✅ | ❌ | ❌ | Report Read & Export Only |
| | | `reporting.sales` | Laporan Penjualan | ❌ | ✅ | ❌ | ❌ | Report Read & Export Only |
| | | `reporting.delivery` | Laporan Pengiriman | ❌ | ✅ | ❌ | ❌ | Report Read & Export Only |
| | | `reporting.finance` | Laporan Keuangan | ❌ | ✅ | ❌ | ❌ | Report Read & Export Only |
| **HR** | `hr` | `hr.attendance` | Presensi Harian | ✅ | ✅ | ✅ | ✅ | Full CRUD |
| | | `hr.employee` | Master Karyawan | ✅ | ✅ | ✅ | ✅ | Full CRUD |
| | | `hr.employee_group` | Master Grup Karyawan | ✅ | ✅ | ✅ | ✅ | Full CRUD |
| | | `hr.schedule` | Setting Jadwal Kerja | ✅ | ✅ | ✅ | ✅ | Full CRUD |
| | | `hr.holiday` | Setting Hari Libur | ✅ | ✅ | ✅ | ✅ | Full CRUD |
| **System** | `system` | `system.groups` | Master Data Groups | ✅ | ✅ | ✅ | ✅ | Full CRUD |
| | | `system.app_settings` | Pengaturan Aplikasi | ✅ | ✅ | ✅ | ✅ | Full CRUD |

> [!NOTE]
> For submenus with disabled actions (e.g. `allowedActions: { c: false, r: true, u: false, d: false }` on Laporan and Dashboard), the UI matrix renders a disabled/grayed-out checkbox (`-`) to strictly prevent invalid state selection.

---

## 4. Permission Adapter: Legacy CI3 ⇄ V2 RBAC

V2 application guards and action directives use the standard `Permission` model:
```typescript
export interface Permission {
  resource: string;
  actions: PermissionAction[]; // ('create' | 'read' | 'update' | 'delete')[]
}
```

The adapter function `serializePermissionsToV2(permissions: SubmenuPermissionFlag[])` bridges the legacy representation:
```typescript
export function serializePermissionsToV2(permissions: SubmenuPermissionFlag[]): Permission[] {
  const resourceMap = new Map<string, Set<PermissionAction>>();

  for (const perm of permissions) {
    const resource = perm.resource || perm.submenuKey.split('.')[0];
    if (!resourceMap.has(resource)) {
      resourceMap.set(resource, new Set());
    }
    const actionSet = resourceMap.get(resource)!;
    if (perm.c) actionSet.add('create');
    if (perm.r) actionSet.add('read');
    if (perm.u) actionSet.add('update');
    if (perm.d) actionSet.add('delete');
  }

  return Array.from(resourceMap.entries()).map(([resource, actions]) => ({
    resource,
    actions: Array.from(actions)
  }));
}
```

---

## 5. Summary KPI Calculation
The permission matrix automatically computes dynamic KPI cards (`GroupPermissionSummary.vue`):
- **Total Menu**: 34 Submenus.
- **Akses Create (C)**: Count of submenus with `c = true`.
- **Akses Read (R)**: Count of submenus with `r = true`.
- **Akses Update (U)**: Count of submenus with `u = true`.
- **Akses Delete (D)**: Count of submenus with `d = true`.
- **Akses Dashboard**: Active widget count (0 to 3).

