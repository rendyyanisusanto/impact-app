# Sprint 6 — Bill of Materials (BoM) Testing & Quality Assurance

## 1. Test Suite Coverage

Sebanyak **5 test suite baru** ditambahkan untuk modul Bill of Materials (BoM) / Template Produk di folder `app/tests/unit/modules/production/`, mencakup total **27 unit & integration tests**:

| Test Suite File                  | Modul / Cakupan                                                                                                                      | Jumlah Test | Status |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | :---------: | :----: |
| `BomFoundation.spec.ts`          | Schema audit, CRUD service, validasi input, auto code generator, duplikasi, dan jaminan Zero Stock Movement                          |      8      | PASSED |
| `BomList.spec.ts`                | List page rendering, KPI header, DataTable, filter pencarian multi-field, status filter, scope check (NO Import button), dan export  |      6      | PASSED |
| `BomForm.spec.ts`                | Form Create & Edit full page, interaksi spreadsheet, tambah/hapus baris, sticky action bar dengan total indicator samping Batal      |      4      | PASSED |
| `BomCalculation.spec.ts`         | Simulasi kebutuhan material per target, status CUKUP/KURANG, perhitungan kekurangan, edge case target nol/negatif, zero side effects |      5      | PASSED |
| `BomIntegrationWorkflow.spec.ts` | Detail page document view, tab simulasi MRP, duplikasi template workflow, export PDF & print, dan RBAC permissions                   |      4      | PASSED |

Total pengujian keseluruhan sistem Impact Furniture v2 pasca Sprint 6:

- **76 Test Files**
- **425 Tests**
- **0 Failed / 100% Passed**

---

## 2. Jaminan Integritas Bisnis yang Teruji

1. **Zero Stock Mutation**: Terverifikasi bahwa operasi Simpan, Update, Hapus, Duplikasi, dan Simulasi Kebutuhan BoM tidak mengurangi saldo `master_data_bahan.qty` dan tidak menulis log ke `histori_stok_bahan`.
2. **Kepatuhan Scope No-Import**: Dipastikan secara otomatis bahwa tidak ada tombol `Import` pada halaman BoM List maupun Form.
3. **Sticky Total Bar**: Dipastikan elemen live total ringkasan biaya berada berdampingan dengan tombol `Batalkan` pada sticky action bar.
