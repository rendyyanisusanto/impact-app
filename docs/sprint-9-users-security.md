# IMPACT FURNITURE V2 — SPRINT 9 (TASK 5–9)
## MASTER DATA USER — SECURITY, CREDENTIAL SAFETY & RBAC

### 1. Zero Plaintext Credential Exposure Principle

Sistem IMPACT FURNITURE V2 menerapkan batasan keamanan ketat terhadap pengelolaan kredensial akun:

1. **Pemisahan Tipe Data Internal vs Eksternal**:
   - `User`: Entity internal penyimpan field mentah termasuk `passwordHash` dan `pin`.
   - `UserListItem`: Data transfer object (DTO) untuk tabel dan listing. Field `passwordHash` dan `pin` **dihapus sama sekali** dari interface ini.
   - `UserDetail`: DTO untuk tampilan detail pengguna. Diganti dengan boolean indicator `isPinSet: boolean`. Tidak memuat password, salt, atau PIN.

2. **Pencegahan Kebocoran pada Export**:
   - Operasi **Export to Excel** (`exportExcel`) hanya menyertakan:
     - `ID User`, `Nama Lengkap`, `Username`, `Email`, `Kode Karyawan`, `Nama Karyawan`, `Role / Group`, `Status Akun`, `Login Terakhir`.
     - Kolom password, hash, salt, PIN, atau secret **sama sekali ditiadakan** dari berkas spreadsheet yang diunduh.
   - Operasi **Export to PDF** (`exportPdf`) dan **Print Preview** mengikuti sanitasi data yang persis sama.

3. **URL & Logging Sanitization**:
   - Tidak ada kredensial yang dilewatkan melalui query parameter URL.
   - Operasi reset password dan reset PIN dieksekusi melalui modal dialog terenkapsulasi (`UserResetPasswordModal.vue` dan `UserResetPinModal.vue`) dengan verifikasi konfirmasi.

---

### 2. Standar Validasi Kredensial

Implementasi di `app/src/modules/system/users/utils/user-validation.ts`:

- **Username**:
  - Panjang: 3 hingga 50 karakter.
  - Karakter diizinkan: Alfabet (`a-z`, `A-Z`), angka (`0-9`), titik (`.`), minus (`-`), dan garis bawah (`_`).
  - Pencegahan duplikasi case-insensitive.
- **Email**:
  - Validasi regex RFC-standard: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`.
  - Pencegahan duplikasi case-insensitive.
- **Password**:
  - Minimal 6 karakter.
  - Konfirmasi password harus identik.
  - Optional pada halaman edit akun untuk menjaga integritas hash lama.
- **PIN Otorisasi Transaksi**:
  - Panjang: 4 hingga 8 digit angka murni (`/^\d{4,8}$/`).
  - Digunakan sebagai PIN second-factor untuk otorisasi transaksi krusial (approval purchase order, void invoice, modifikasi data stok sensitif).

---

### 3. Proteksi Akun Terproteksi (Root Superadmin & Sesi Aktif)

1. **Superadmin Root (`id = 1`)**:
   - ID 1 secara permanen dikunci dari:
     - Deaktivasi status (`active = 0`) -> Melemparkan error *"Akun Superadmin root tidak dapat dinonaktifkan."*
     - Penghapusan tunggal (`delete(1)`) -> Melemparkan error *"Akun Superadmin root tidak dapat dihapus."*
     - Penghapusan massal (`bulkDelete`) -> Akun ID 1 otomatis dilewati dan dikelompokkan ke `failedIds`.
     - Perubahan role (`changeGroup`) -> Melemparkan error *"Group akun Superadmin root tidak dapat diubah."*

2. **Self-Deactivation & Self-Deletion Protection**:
   - Melalui `useAuthStore().currentUser`, sistem mendeteksi jika ID target sama dengan ID pengguna yang sedang melakukan aksi di browser.
   - Mencegah administrator mengunci dirinya sendiri di luar sistem.

---

### 4. Kebijakan Fitur Import User Legacy

Pada sistem legacy CodeIgniter 3, terdapat view `import_page.php` yang mengizinkan unggah file Excel untuk user. Namun demikian:
- Format legacy tidak memiliki protokol aman untuk pendistribusian password awal (plain text password dalam spreadsheet berisiko tinggi).
- Tidak ada mekanisme onboarding token atau force-password-reset saat login pertama.
- Sesuai arahan spesifikasi Task 6.5: Fitur import data dinonaktifkan dengan aman pada antarmuka pengguna (`disabled button` dengan badge informasi jelas dan dialog penjelasan) guna mencegah eskalasi celah keamanan kredensial.
