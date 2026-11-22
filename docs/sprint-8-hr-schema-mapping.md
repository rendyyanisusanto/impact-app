# HR Management Database Schema Mapping — IMPACT FURNITURE V2

## Sprint 8 — Tasks 1–5: Master Data Karyawan & Master Data Grup Karyawan

---

### 1. Executive Summary & Verification Sources

Dokumen ini mendefinisikan pemetaan skema database aktual antara SQL dump MariaDB legacy (`u1573701_smm.sql` dan `smm-polaris.sql`) dengan implementasi domain models TypeScript pada IMPACT FURNITURE V2.

Sumber verifikasi:

1. **Verified from SQL**: Berasal langsung dari definisi `CREATE TABLE \`karyawan\``dan`CREATE TABLE \`grup_karyawan\`` pada dump MariaDB legacy.
2. **Verified from Legacy Source**: Diverifikasi dari Controller `Karyawan.php` & `Grup_karyawan.php`, serta Views CodeIgniter legacy (`application/views/role/admin/page/karyawan/` dan `grup_karyawan/`).
3. **Existing Frontend Contract**: Terintegrasi langsung dengan Master Jabatan (`jabatan`), Master Status Karyawan (`status_karyawan`), Master Wilayah (`provinces`, `cities`), dan RBAC permissions.
4. **UI-only Derived Value**: Field komputasi runtime (seperti `jabatan_nama`, `status_karyawan_nama`, `grup_karyawan_nama`, `member_count`) yang **tidak disimpan** sebagai kolom database redundan.

---

### 2. Table `karyawan` (Master Karyawan)

#### SQL Definition

```sql
CREATE TABLE `karyawan` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `kode` int(11) DEFAULT NULL,
  `nik` varchar(255) DEFAULT NULL,
  `nama` varchar(255) DEFAULT NULL,
  `jk` varchar(255) DEFAULT NULL,
  `no_hp` varchar(255) DEFAULT NULL,
  `alamat` varchar(255) DEFAULT NULL,
  `province_id` int(11) DEFAULT NULL,
  `city_id` int(11) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `jabatan_id` int(10) UNSIGNED DEFAULT NULL,
  `tanggal_masuk` date DEFAULT NULL,
  `status` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `updated_by` int(10) UNSIGNED DEFAULT NULL,
  `status_karyawan_id` int(11) DEFAULT NULL,
  `uid_fingerprint` int(11) DEFAULT NULL,
  `grup_karyawan_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
```

#### Field Mapping Matrix

| MariaDB Column       | Type             | Nullable | TS Model Property                    | Source Verification        | Description / UI Mapping                                                       |
| :------------------- | :--------------- | :------- | :----------------------------------- | :------------------------- | :----------------------------------------------------------------------------- |
| `id`                 | int(10) unsigned | NO (PK)  | `id: number`                         | Verified from SQL          | Primary key auto-increment                                                     |
| `kode`               | int(11) / text   | YES      | `kode: string \| null`               | Verified from SQL & Source | Kode internal karyawan (unik, required di UI)                                  |
| `uid_fingerprint`    | int(11)          | YES      | `uid_fingerprint: number \| null`    | Verified from SQL & Source | Nomor ID terminal biometrik mesin absensi (unik, required di UI)               |
| `nik`                | varchar(255)     | YES      | `nik: string \| null`                | Verified from SQL          | Nomor Induk Kependudukan / Karyawan (opsional)                                 |
| `nama`               | varchar(255)     | YES      | `nama: string`                       | Verified from SQL & Source | Nama lengkap karyawan (required)                                               |
| `jk`                 | varchar(255)     | YES      | `jk: string \| null`                 | Verified from SQL & Source | Jenis Kelamin (`Laki-Laki` / `Perempuan`)                                      |
| `no_hp`              | varchar(255)     | YES      | `no_hp: string \| null`              | Verified from SQL          | Nomor telepon seluler / WhatsApp                                               |
| `email`              | varchar(255)     | YES      | `email: string \| null`              | Verified from SQL          | Alamat email resmi / pribadi                                                   |
| `alamat`             | varchar(255)     | YES      | `alamat: string \| null`             | Verified from SQL          | Alamat tempat tinggal domisili                                                 |
| `province_id`        | int(11)          | YES      | `province_id: number \| null`        | Verified from SQL          | Foreign key ke tabel `provinces.id`                                            |
| `city_id`            | int(11)          | YES      | `city_id: number \| null`            | Verified from SQL          | Foreign key ke tabel `cities.id`                                               |
| `tanggal_masuk`      | date             | YES      | `tanggal_masuk: string \| null`      | Verified from SQL          | Tanggal mulai bekerja (format YYYY-MM-DD)                                      |
| `jabatan_id`         | int(10) unsigned | YES      | `jabatan_id: number \| null`         | Verified from SQL          | Foreign key ke tabel `jabatan.id` (Master Jabatan)                             |
| `status_karyawan_id` | int(11)          | YES      | `status_karyawan_id: number \| null` | Verified from SQL          | Foreign key ke tabel `status_karyawan.id` (Harian, Borongan, Bulanan, Kontrak) |
| `grup_karyawan_id`   | int(11)          | YES      | `grup_karyawan_id: number \| null`   | Verified from SQL          | Foreign key ke tabel `grup_karyawan.id` (null = Tanpa Grup)                    |
| `status`             | tinyint(1)       | YES      | `status: number`                     | Verified from SQL          | Status record (1 = Aktif, 0 = Nonaktif)                                        |
| `created_at`         | timestamp        | YES      | `created_at?: string \| null`        | Verified from SQL          | Waktu pembuatan record                                                         |
| `created_by`         | int(10) unsigned | YES      | `created_by?: number \| null`        | Verified from SQL          | ID pengguna pembuat record                                                     |
| `updated_at`         | timestamp        | YES      | `updated_at?: string \| null`        | Verified from SQL          | Waktu perubahan terakhir record                                                |
| `updated_by`         | int(10) unsigned | YES      | `updated_by?: number \| null`        | Verified from SQL          | ID pengguna pengubah record                                                    |

---

### 3. Table `grup_karyawan` (Master Grup Karyawan)

#### SQL Definition

```sql
CREATE TABLE `grup_karyawan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `kode` text DEFAULT NULL,
  `nama` varchar(255) DEFAULT NULL,
  `color` varchar(255) DEFAULT NULL,
  `status_aktif` tinyint(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `updated_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### Field Mapping Matrix

| MariaDB Column | Type         | Nullable | TS Model Property             | Source Verification        | Description / UI Mapping                                    |
| :------------- | :----------- | :------- | :---------------------------- | :------------------------- | :---------------------------------------------------------- |
| `id`           | int(11)      | NO (PK)  | `id: number`                  | Verified from SQL          | Primary key auto-increment                                  |
| `kode`         | text         | YES      | `kode: string \| null`        | Verified from SQL & Source | Kode grup (e.g. `GRP1`, `GRP2`, `GRP7`, unik)               |
| `nama`         | varchar(255) | YES      | `nama: string`                | Verified from SQL & Source | Nama regu kerja (e.g. `Group Gudang`, `Grup Driver Achmad`) |
| `color`        | varchar(255) | YES      | `color: string \| null`       | Verified from SQL & Source | Warna heksadesimal penanda regu kerja (e.g. `#0F766E`)      |
| `status_aktif` | tinyint(255) | YES      | `status_aktif: number`        | Verified from SQL & Source | Status operasional grup (1 = Aktif, 0 = Nonaktif)           |
| `created_at`   | timestamp    | YES      | `created_at?: string \| null` | Verified from SQL          | Waktu pembuatan grup                                        |
| `created_by`   | int(11)      | YES      | `created_by?: number \| null` | Verified from SQL          | Pengguna pembuat grup                                       |
| `updated_at`   | timestamp    | YES      | `updated_at?: string \| null` | Verified from SQL          | Waktu pembaruan terakhir                                    |
| `updated_by`   | int(11)      | YES      | `updated_by?: number \| null` | Verified from SQL          | Pengguna pengubah                                           |

---

### 4. Relational Architecture & Membership Semantics

Berdasarkan audit schema SQL dan controller legacy `Karyawan.php` baris 282–298 (`save_change_grup`):

- Relasi Karyawan dan Grup Karyawan adalah **Many-to-One** via foreign key langsung `karyawan.grup_karyawan_id`.
- Setiap karyawan aktif hanya dapat terdaftar pada **satu grup aktif** pada satu waktu (atau bernilai `null` / `0` untuk karyawan "Tanpa Grup").
- **TIDAK TERDAPAT TABEL PIVOT** pada skema database legacy. Menambahkan tabel pivot fiktif dilarang.
- Menghapus anggota dari grup (`removeMemberFromGroup`) dijalankan dengan mengupdate `karyawan.grup_karyawan_id = null`. Hal ini **tidak menghapus data karyawan**.
- Jumlah Anggota (`member_count`) dihitung secara dinamis dari agregasi relasi aktual:
  $$\text{member\_count}(g) = \sum_{\substack{e \in \text{karyawan} \\ e.\text{grup\_karyawan\_id} = g.\text{id} \\ e.\text{status} = 1}} 1$$
- Integritas referensial ditegakkan: Grup yang memiliki anggota karyawan aktif tidak boleh dihapus secara permanen (hard delete) untuk mencegah rusaknya integritas data penugasan.
