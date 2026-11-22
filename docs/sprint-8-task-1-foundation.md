# Sprint 8 — Task 1: HR Foundation Implementation

## Domain Models, Lookups, & Typed Mock Repositories

---

### 1. Overview & Objective

Task 1 menetapkan fondasi modul HR pada IMPACT FURNITURE V2 yang mencakup audit repository, TypeScript domain models, validasi boundary, lookups integrasi master data, serta seed mock repository yang deterministik dan konsisten dengan SQL dump legacy `u1573701_smm.sql`.

---

### 2. Architecture & Directory Structure

```text
app/src/modules/hr/
├── types/
│   ├── employee.types.ts              # Typed domain models & DTOs Karyawan
│   ├── employee-group.types.ts        # Typed domain models & DTOs Grup Karyawan
│   └── hr-schedule-contract.types.ts  # Future schedule assignment contract (Task 6-8)
├── services/
│   ├── employee.service.ts            # Mock repository & CRUD boundary Karyawan
│   └── employee-group.service.ts      # Mock repository & membership boundary Grup
├── utils/
│   ├── employee-validation.ts         # Boundary validation Karyawan
│   ├── employee-group-validation.ts   # Boundary validation Grup Karyawan
│   └── employee-import.config.ts      # Template & mapper Excel Import
└── components/
    ├── EmployeeStatusBadge.vue
    ├── EmployeeFilters.vue
    ├── EmployeeForm.vue
    ├── EmployeeImportModal.vue
    ├── EmployeeGroupFormModal.vue
    ├── EmployeeGroupMemberPickerModal.vue
    └── EmployeeGroupMembersTable.vue
```

---

### 3. Integration with Master Data References

Modul HR menggunakan referensi master data yang telah diimplementasikan sebelumnya tanpa menduplikasi storage:

1. **Master Jabatan (`positionService`)**:
   - Diambil dari `app/src/modules/settings/positions/services/position.service.ts`.
   - Menghubungkan ID jabatan (misal: 2 = PENGIRIMAN, 999 = SUPIR, 1000 = KERNET, 1001 = GUDANG, 1002 = KURSI SUSUN) ke nama dan warna badge jabatan.
2. **Master Status Karyawan (`employeeStatusService`)**:
   - Diambil dari `app/src/modules/settings/employee-statuses/services/employee-status.service.ts`.
   - Menghubungkan klasifikasi jenis kepegawaian (1 = Harian, 2 = Borongan, 3 = Bulanan/Tetap, 4 = Kontrak/PKWT).
3. **Master Wilayah (`referenceService`)**:
   - Mengambil data provinsi (`MOCK_PROVINCES`) dan kota/kabupaten (`MOCK_CITIES`) secara dinamis.
4. **Master Grup Karyawan (`employeeGroupService`)**:
   - Mengambil data regu kerja aktif dan warna identifikasi tag.

---

### 4. Boundary Validation Rules

1. **Kode Karyawan**: Wajib diisi, unik terhadap seluruh karyawan aktif/nonaktif lainnya.
2. **UID Fingerprint**: Wajib diisi, berupa bilangan bulat positif (`> 0`), dan harus unik di seluruh database (karena merepresentasikan ID fisik pada terminal mesin absensi biometrik).
3. **Nama Karyawan**: Wajib diisi, minimal 2 karakter.
4. **Jabatan**: Wajib dipilih, divalidasi harus eksis pada Master Jabatan aktif (`is_deleted === 1`).
5. **Status Karyawan**: Wajib dipilih, divalidasi harus eksis pada Master Status Karyawan.
6. **Kode Grup**: Wajib diisi, unik pada tabel `grup_karyawan`.
7. **Nama Grup**: Wajib diisi, minimal 2 karakter.
8. **Status Aktif**: Wajib ditentukan (1 = Aktif, 0 = Nonaktif).

---

### 5. Contract Kesiapan Sprint 8 Tasks 6–8 (Setting Jadwal)

Per prompt requirement #39, kontrak typed `hr-schedule-contract.types.ts` disiapkan untuk mendukung penugasan jadwal kerja di masa mendatang tanpa membuat field jadwal fiktif pada tabel `grup_karyawan` maupun `karyawan`.
