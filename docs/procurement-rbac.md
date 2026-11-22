# Procurement Role-Based Access Control (RBAC)

## Impact Furniture v2 ERP

---

### 1. Matrix Hak Akses

| Role                | Resource      | Read | Create  | Update  | Delete | Keterangan                                                          |
| ------------------- | ------------- | :--: | :-----: | :-----: | :----: | ------------------------------------------------------------------- |
| **Super Admin**     | `procurement` |  ✅  |   ✅    |   ✅    |   ✅   | Akses tak terbatas ke seluruh siklus pengadaan                      |
| **Staff Pengadaan** | `procurement` |  ✅  |   ✅    |   ✅    |   ❌   | Dapat membuat PO, PB, dan PT; pembatalan memerlukan otorisasi admin |
| **Staff Gudang**    | `procurement` |  ✅  |   ❌    |   ❌    |   ❌   | Read-only untuk melihat jadwal kedatangan barang                    |
| **Staff Keuangan**  | `procurement` |  ✅  | ✅ (PT) | ✅ (PT) |   ❌   | Fokus pada pencatatan pembayaran tagihan                            |
| **Viewer**          | `procurement` |  ✅  |   ❌    |   ❌    |   ❌   | Read-only                                                           |

### 2. Enforcement Layers

1. **Route Guard**: Melindungi perpindahan URL tingkat router via `beforeEach` meta permission check.
2. **UI Component Level**: Menyembunyikan atau menonaktifkan tombol aksi (Create, Edit, Delete) melalui composable `usePermission()`.
3. **Service Boundary**: Setiap operasi service (Create/Update/Delete) memanggil `assertPermission('procurement', action)`, menolak eksekusi jika role aktif tidak memiliki izin terkait.
