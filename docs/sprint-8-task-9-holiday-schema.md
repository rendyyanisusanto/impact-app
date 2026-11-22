# SPRINT 8 — TASK 9: DATABASE SCHEMA AUDIT & HOLIDAY DATA MODEL

## 1. Overview & SQL Source Verification

Audit conducted against the production SQL dump `u1573701_smm.sql` (152,438 lines) in `C:\Users\ASUS\Downloads\u1573701_smm.sql` to identify the authentic relational schema governing holiday management and employee exemptions.

---

## 2. Table Schemas

### 2.1 Table: `hari_libur`

Stores holiday dates and descriptions.

```sql
CREATE TABLE `hari_libur` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tanggal` date NOT NULL,
  `keterangan` varchar(255) NOT NULL,
  `uuid` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
```

#### Field Specifications:

- `id` (`int(11)`, PK, AUTO_INCREMENT): Unique identifier of the holiday record.
- `tanggal` (`date`, NOT NULL): Calendar date of the holiday (format `YYYY-MM-DD`).
- `keterangan` (`varchar(255)`, NOT NULL): Description/name of the holiday (e.g. `'HARI KEMERDEKAAN RI'`, `'MINGGU'`).
- `uuid` (`text`, DEFAULT NULL): System-generated unique string identifier for legacy API synchronization.

---

### 2.2 Table: `pengecualian_hari_libur`

Pivot table storing many-to-many relationships between holidays and employees who are **exempted from the holiday** (i.e. they are scheduled to work normally despite the holiday).

```sql
CREATE TABLE `pengecualian_hari_libur` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `karyawan_id` int(11) NOT NULL,
  `hari_libur_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
```

#### Field Specifications:

- `id` (`int(11)`, PK, AUTO_INCREMENT): Unique surrogate identifier for the exception record.
- `karyawan_id` (`int(11)`, NOT NULL): Foreign key referencing `karyawan.id`.
- `hari_libur_id` (`int(11)`, NOT NULL): Foreign key referencing `hari_libur.id`.

---

## 3. Storage Strategy for Exceptions (Legacy vs Modern Architecture)

### 3.1 Key Finding on Legacy UI Display vs Actual DB Storage

- In the legacy UI screenshot, the "Pengecualian" column presents a comma-delimited string of employee names (e.g., `ALVIAN KURNIAWAN, CANDRA ARIFIANTO, DANDI SAPUTRA...`).
- **Database Proof**: MariaDB does **NOT** store free text names, JSON, or comma-separated strings. It stores normalized relational rows in `pengecualian_hari_libur (id, karyawan_id, hari_libur_id)`.
- The legacy PHP/CodeIgniter controller performed an inner join between `pengecualian_hari_libur` and `karyawan`, grouped by `hari_libur_id`, and concatenated names using `GROUP_CONCAT(karyawan.nama)`.

### 3.2 Sunday (`MINGGU`) Storage Paradigm

- In legacy MariaDB, Sunday dates are explicitly stored as individual records with `keterangan = 'MINGGU'`.
- This explains why Sunday entries appear in the holiday table with explicit exceptions (e.g. drivers or security guards scheduled to work on Sundays).

---

## 4. Verified Seeds Extracted from Legacy Dump

```sql
-- Sample seeds from August 2024
INSERT INTO `hari_libur` (`id`, `tanggal`, `keterangan`, `uuid`) VALUES
(2, '2024-08-04', 'MINGGU', NULL),
(3, '2024-08-11', 'MINGGU', NULL),
(4, '2024-08-18', 'MINGGU', NULL),
(5, '2024-08-25', 'MINGGU', NULL),
(6, '2024-08-17', 'HARI KEMERDEKAAN RI', NULL);

-- Linked exceptions for August 17, 2024 (id: 6)
INSERT INTO `pengecualian_hari_libur` (`id`, `karyawan_id`, `hari_libur_id`) VALUES
(1, 53, 6),
(2, 54, 6),
(3, 63, 6);
```

---

## 5. Domain Models in IMPACT FURNITURE V2

Mapped in `app/src/modules/hr/types/holiday-settings.types.ts`:

- `LegacyHariLiburEntity`: Raw 1:1 MariaDB table representation.
- `LegacyPengecualianHariLiburEntity`: Raw pivot table representation.
- `HolidayExceptionEmployee`: Enriched employee data with `nama`, `kode`, `jabatan`, `grupNama`, and `grupColor`.
- `HolidayItem`: Unified ViewModel containing `id`, `tanggal`, `hari`, `keterangan`, `exceptionEmployeeIds`, and `exceptionEmployees`.
