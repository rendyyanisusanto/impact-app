# IMPACT FURNITURE V2 — SPRINT 9 (TASK 5–9)
## MASTER DATA USER — TEST STRATEGY & VERIFICATION MATRIX

### 1. Overview & Test Scope

Pengujian modul **Master Data User** mencakup verifikasi unit, validasi keamanan, simulasi integrasi komponen, audit RBAC, hingga alur kerja komprehensif end-to-end 17-step.

Total pengujian modul User: **43 Unit & Integration Tests**, dengan hasil **100% Passed (43/43)** dan **Zero Regressions** pada seluruh suite repositori (Total **797/797 tests passed** pada 124 test files).

---

### 2. Test Suites Summary

#### 2.1 `UserValidationAndSecurity.spec.ts` (24 Tests)
Fokus pada integritas data, aturan bisnis schema legacy, dan pertahanan keamanan kredensial:
1. Validasi username wajib diisi.
2. Validasi panjang minimum username (3 karakter).
3. Validasi panjang maksimum username (50 karakter).
4. Validasi format karakter username (alfanumerik, titik, minus, underscore).
5. Pencegahan duplikasi username saat registrasi baru.
6. Pencegahan duplikasi username saat update akun lain.
7. Mengizinkan username tetap sama saat mengedit profil diri sendiri.
8. Validasi email wajib diisi.
9. Validasi format alamat email standar RFC.
10. Pencegahan duplikasi email case-insensitive.
11. Mengizinkan email tetap sama saat update user bersangkutan.
12. Password wajib diisi pada saat Create.
13. Password minimal 6 karakter.
14. Validasi kecocokan konfirmasi password.
15. Password bersifat opsional pada saat Update (mempertahankan hash existing jika kosong).
16. PIN otorisasi wajib diisi pada saat Create.
17. PIN wajib numerik murni (menolak huruf dan simbol).
18. PIN wajib 4-8 digit angka.
19. PIN bersifat opsional pada saat Update (mempertahankan PIN lama jika kosong).
20. Wajib memilih role/group saat registrasi akun.
21. Validasi keterpautan karyawan (opsional atau format valid ID karyawan).
22. Proteksi Superadmin root (ID 1) tidak dapat dinonaktifkan (`active = 0`).
23. Proteksi Superadmin root (ID 1) tidak dapat diubah group/role-nya ke non-admin.
24. Password dan PIN tidak pernah diekspos dalam payload listing atau detail.

#### 2.2 `UserServiceAndSync.spec.ts` (12 Tests)
Fokus pada operasi data mock repository, filter data, paginasi, proteksi akun, dan sinkronisasi sesi:
1. Mengambil daftar pengguna terpaginasi dengan sorting dan metadata yang akurat.
2. Filter pencarian berdasarkan nama lengkap, username, dan email.
3. Filter berdasarkan Group/Role ID tertentu.
4. Filter berdasarkan status akun (`AKTIF` vs `NON AKTIF`).
5. Mengambil `UserDetail` lengkap dengan resolusi nama karyawan HR dan permission matrix group.
6. Pembuatan user baru dengan hashing mock dan auto-enrichment.
7. Update profil user yang mempertahankan password dan PIN lama jika input kosong.
8. Toggle status aktif/non-aktif akun dengan feedback pesan Bahasa Indonesia.
9. Reset password yang aman melalui service khusus.
10. Reset PIN transaksi otorisasi melalui service khusus.
11. Single deletion yang memproteksi Superadmin (ID 1) dan akun sesi aktif.
12. Bulk deletion yang menghapus ID terpilih dan secara otomatis melewati akun terlindungi (Superadmin).

#### 2.3 `UserComponentsAndPreview.spec.ts` (6 Tests)
Fokus pada perilaku antarmuka pengguna dan visualisasi matriks izin:
1. `UserRoleAccessPreview`: Merender KPI badges (Total Submenu, Create, Read, Update, Delete, Dashboard).
2. `UserRoleAccessPreview`: Merender 3 kartu akses widget dashboard dan grafik sesuai ID yang diizinkan.
3. `UserRoleAccessPreview`: Menampilkan accordion 10 kategori modul dengan checklist hijau (`✔`) dan silang abu-abu (`✘`).
4. `UserRoleAccessPreview`: Menjalankan live search filter submenu dalam modal/preview role.
5. `UserResetPasswordModal`: Validasi form reset password, indikator keamanan, dan pencegahan submit data tidak valid.
6. `UserResetPinModal`: Validasi form reset PIN numerik 4-8 digit dan emit event payload yang aman.

#### 2.4 `UserWorkflowAndRbac.spec.ts` (1 Comprehensive 17-Step E2E Test)
Mensimulasikan siklus hidup penuh pengelolaan pengguna:
- **Step 1**: Render `UserListPage` dan verifikasi data awal legacy (Administrator, Staff Penjualan, Staff Gudang, dsb).
- **Step 2**: Eksekusi pencarian dengan debounce filter (misal: `"staff.gudang"`).
- **Step 3**: Filter berdasarkan Group/Role (GUDANG).
- **Step 4**: Pendaftaran akun baru melalui `userService.create` terpaut dengan data karyawan HR.
- **Step 5**: Verifikasi kemunculan user baru pada listing DataTable.
- **Step 6**: Navigasi dan render form `UserCreatePage` dengan auto-fill nama karyawan saat dropdown karyawan dipilih.
- **Step 7**: Live preview perubahan hak akses saat dropdown Group/Role diubah pada form pembuatan.
- **Step 8**: Render halaman `UserDetailPage` (`look_page`) dengan verifikasi mask PIN dan hero banner status.
- **Step 9**: Render dan submit form `UserEditPage` dengan membiarkan password/PIN kosong.
- **Step 10**: Eksekusi reset password aman dari modal dialog.
- **Step 11**: Eksekusi reset PIN otorisasi transaksi dari modal dialog.
- **Step 12**: Deaktivasi user (toggle status ke `NON AKTIF`).
- **Step 13**: Verifikasi penolakan login pengguna yang dinonaktifkan pada `mockAuthService.login`.
- **Step 14**: Reaktivasi user kembali ke status `AKTIF`.
- **Step 15**: Verifikasi proteksi Superadmin root (penolakan deaktivasi dan penolakan delete).
- **Step 16**: Penghapusan data user uji coba dan verifikasi pembersihan.
- **Step 17**: Audit route registration dan permission guard RBAC (`system:read`, `system:create`, `system:update`).
