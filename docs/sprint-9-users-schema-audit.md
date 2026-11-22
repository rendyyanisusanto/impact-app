# IMPACT FURNITURE V2 — SPRINT 9 (TASK 5–9)
## MASTER DATA USER — DATABASE SCHEMA & DOMAIN AUDIT

### 1. Executive Summary

Modul **Master Data User** pada IMPACT FURNITURE V2 menghubungkan entitas Karyawan (HR Module), User Account (`users`), dan Group/Role (`groups`) untuk mengontrol autentikasi serta otorisasi (RBAC) pada sistem ERP. Audit ini mendokumentasikan skema database legacy (`smm-polaris.sql`, `u1573701_smm(2).sql`), controller CodeIgniter 3 (`application/controllers/admin/Users.php`), view legacy (`add_page.php`, `edit_page.php`, `look_page.php`, `index_page.php`), serta pemetaan domain TypeScript modern di `app/src/modules/system/users/`.

---

### 2. Verified Legacy Database Tables & Fields

#### 2.1 Table `users` (Core Account Entity)
Tabel utama penyimpan akun pengguna berbasis IonAuth CI3:

| Column Name | Data Type | Nullable | Key | Default | Legacy Semantic / V2 Mapping |
|---|---|---|---|---|---|
| `id` | `mediumint(8) unsigned` | NO | PRI | Auto Increment | Primary Key unik pengguna |
| `ip_address` | `varchar(45)` | NO | - | `'127.0.0.1'` | Alamat IP saat registrasi/login terakhir |
| `username` | `varchar(100)` | NO | - | - | Username untuk login (3-50 karakter, alphanumeric + `._-`) |
| `password` | `varchar(255)` | NO | - | - | Bcrypt hash password (Legacy IonAuth). **TIDAK PERNAH dikirim ke client/UI.** |
| `salt` | `varchar(255)` | YES | - | NULL | Legacy salt (deprecated pada PHP password_hash) |
| `email` | `varchar(100)` | NO | - | - | Alamat email unik pengguna |
| `activation_code` | `varchar(40)` | YES | - | NULL | Kode aktivasi akun |
| `forgotten_password_code` | `varchar(40)` | YES | - | NULL | Kode reset password |
| `forgotten_password_time` | `int(11) unsigned` | YES | - | NULL | Timestamp reset password |
| `remember_code` | `varchar(40)` | YES | - | NULL | Token remember me |
| `created_on` | `int(11) unsigned` | NO | - | - | Unix timestamp / formatted datetime saat akun dibuat |
| `last_login` | `int(11) unsigned` | YES | - | NULL | Timestamp login terakhir |
| `active` | `tinyint(1) unsigned` | YES | - | `1` | Status akun: `1` = AKTIF, `0` = NON AKTIF |
| `first_name` | `varchar(50)` | YES | - | NULL | **Nama Lengkap** pengguna (pada form UI legacy dilabeli "Nama Lengkap") |
| `last_name` | `varchar(50)` | YES | - | NULL | Legacy CI3 last name (kosong pada screenshot/database Polaris) |
| `company` | `varchar(100)` | YES | - | NULL | Organisasi / PT |
| `phone` | `varchar(20)` | YES | - | NULL | Nomor kontak |
| `pin` | `varchar(255)` | YES | - | NULL | **PIN Transaksi/Otorisasi** (4-8 digit numeric). Disimpan terlindungi. |
| `anggota_id` | `varchar(255)` | YES | - | NULL | Foreign Key ke tabel `karyawan.id` (ID Karyawan HR) |
| `table` | `varchar(255)` | YES | - | `'karyawan'` | Menandakan relasi tabel asal entitas anggota (`karyawan`) |

#### 2.2 Table `users_groups` (User-to-Role Junction)
Relasi many-to-many atau single-assignment role per user:

| Column Name | Data Type | Nullable | Key | Default | Legacy Semantic / V2 Mapping |
|---|---|---|---|---|---|
| `id` | `mediumint(8) unsigned` | NO | PRI | Auto Increment | Primary Key relasi |
| `user_id` | `mediumint(8) unsigned` | NO | - | - | Foreign Key ke `users.id` |
| `group_id` | `mediumint(8) unsigned` | NO | - | - | Foreign Key ke `groups.id` |

#### 2.3 Table `groups` (Master Data Groups)
Tabel master role yang dikelola pada Sprint 9 Task 1–4:

| Column Name | Data Type | Nullable | Key | Default | Legacy Semantic / V2 Mapping |
|---|---|---|---|---|---|
| `id` | `mediumint(8) unsigned` | NO | PRI | Auto Increment | ID Role/Group |
| `name` | `varchar(20)` | NO | - | - | Nama unik group (misal: `admin`, `general`, `penjualan`) |
| `description` | `varchar(100)` | NO | - | - | Deskripsi nama group (misal: `Administrator`, `Staff Penjualan`) |

#### 2.4 Table `karyawan` (HR Master Data Karyawan)
Sumber data karyawan yang dipilih saat membuat atau mengedit user:

| Column Name | Data Type | Nullable | Key | Default | V2 Resolution |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | PRI | Auto Increment | `anggota_id` pada `users` |
| `kode` | `varchar(50)` | YES | - | - | NIK / Nomor Induk Karyawan |
| `nama` | `varchar(100)` | NO | - | - | Nama Karyawan (auto-fill ke `first_name`) |
| `jabatan` | `int(11)` / string | YES | - | - | Posisi struktural |
| `status` | `tinyint(1)` | NO | - | `1` | Filter: hanya karyawan aktif (`status = 1`) yang dapat dipilih |

---

### 3. Business Rules & Data Integrity

1. **Relasi Karyawan ke Akun User**:
   - Sumber karyawan difilter secara ketat hanya yang memiliki `status = 1` (Aktif).
   - Saat karyawan dipilih dari dropdown, input `Nama Lengkap` (`first_name`) diisi otomatis dengan nilai `karyawan.nama`.
   - Email disarankan secara otomatis (default domain `@impactfurniture.co.id`), namun tetap dapat disesuaikan bila karyawan memiliki alamat email resmi lain.
2. **Kredensial Login**:
   - `username`: Wajib, 3-50 karakter, alphanumeric, titik, minus, underscore (`/^[a-zA-Z0-9._-]+$/`). Wajib unik di seluruh sistem.
   - `email`: Wajib, format RFC-compliant valid, wajib unik di seluruh sistem.
   - `password`:
     - Pada **Create**: Wajib, minimal 6 karakter.
     - Pada **Edit**: Bersifat **Opsional**. Jika dikosongkan, password hash lama tidak akan diubah.
   - `pin`:
     - Pada **Create**: Wajib, 4-8 karakter numerik murni (`/^\d{4,8}$/`). Digunakan untuk otorisasi transaksi sensitif (approval, void, dsb).
     - Pada **Edit**: Bersifat **Opsional**. Jika dikosongkan, PIN lama dipertahankan.
3. **Proteksi Superadmin Root (`id = 1`)**:
   - Akun Superadmin root (`administrator`, ID 1) tidak boleh dihapus baik via single delete maupun bulk delete.
   - Status Superadmin root tidak boleh dinonaktifkan (`active = 0`).
   - Group Superadmin root tidak boleh diubah ke group lain.
4. **Proteksi Sesi Pengguna Aktif**:
   - Pengguna yang sedang login tidak diizinkan menonaktifkan akun miliknya sendiri.
   - Pengguna yang sedang login tidak diizinkan menghapus akun miliknya sendiri.
5. **Enforcement Status Pengguna**:
   - Pengguna dengan status `active = 0` (Non-Aktif) ditolak saat mencoba login dengan pesan:
     `"Akun pengguna sedang dinonaktifkan. Silakan hubungi Administrator."`
