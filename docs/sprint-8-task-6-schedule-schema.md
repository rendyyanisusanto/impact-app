# Sprint 8 Task 6 — Database & Schema Audit for HR Weekly Schedule

## 1. Executive Summary

This document records the database schema audit and mapping for the Weekly Work Schedule Setting (Setting Jadwal Mingguan) in IMPACT FURNITURE V2. All findings have been verified directly against the production SQL dump `u1573701_smm(2).sql` from the legacy system.

---

## 2. Legacy Table Schema: `jadwal`

In the legacy MariaDB database, the weekly work schedule is stored in the table `jadwal`:

```sql
CREATE TABLE `jadwal` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `hari` varchar(255) DEFAULT NULL,
  `shift_in_start` varchar(255) DEFAULT NULL,
  `shift_out_start` varchar(255) DEFAULT NULL,
  `break_start_start` varchar(255) DEFAULT NULL,
  `break_end_start` varchar(255) DEFAULT NULL,
  `day_id` int(11) DEFAULT NULL,
  `shift_in_end` varchar(255) DEFAULT NULL,
  `shift_out_end` varchar(255) DEFAULT NULL,
  `break_start_end` varchar(255) DEFAULT NULL,
  `break_end_end` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=latin1;
```

---

## 3. Column-by-Column Verification Matrix

| Column Name         | Data Type      | Nullable | Legacy Purpose & Semantics                                     | Verification Status    |
| :------------------ | :------------- | :------- | :------------------------------------------------------------- | :--------------------- |
| `id`                | `int(11)`      | NO       | Primary Key (auto-increment: 7 to 13)                          | Verified from SQL dump |
| `hari`              | `varchar(255)` | YES      | Indonesian day name (`Senin` .. `Minggu`)                      | Verified from SQL dump |
| `day_id`            | `int(11)`      | YES      | Standard PHP/MySQL day index (1=Minggu, 2=Senin .. 7=Sabtu)    | Verified from SQL dump |
| `shift_in_start`    | `varchar(255)` | YES      | Jam Masuk - Batas Awal (e.g. `'08:00'`)                        | Verified from SQL dump |
| `shift_in_end`      | `varchar(255)` | YES      | Jam Masuk - Batas Akhir (e.g. `'10:00'`)                       | Verified from SQL dump |
| `shift_out_start`   | `varchar(255)` | YES      | Jam Pulang - Batas Awal (e.g. `'14:30'`)                       | Verified from SQL dump |
| `shift_out_end`     | `varchar(255)` | YES      | Jam Pulang - Batas Akhir (e.g. `'16:00'`)                      | Verified from SQL dump |
| `break_start_start` | `varchar(255)` | YES      | Mulai Istirahat - Batas Awal (e.g. `'10:01'`)                  | Verified from SQL dump |
| `break_start_end`   | `varchar(255)` | YES      | Mulai Istirahat - Batas Akhir (e.g. `'12:00'`, Fri: `'11:30'`) | Verified from SQL dump |
| `break_end_start`   | `varchar(255)` | YES      | Selesai Istirahat - Batas Awal (e.g. `'13:00'`)                | Verified from SQL dump |
| `break_end_end`     | `varchar(255)` | YES      | Selesai Istirahat - Batas Akhir (e.g. `'14:00'`)               | Verified from SQL dump |

---

## 4. Key Architectural Findings

1. **Global Weekly Schedule**:
   - The table `jadwal` contains exactly 7 rows corresponding to the 7 days of the week.
   - There are **NO foreign keys** to `karyawan_id`, `grup_karyawan_id`, or `jabatan_id` in `jadwal`.
   - The schedule is a company-wide weekly attendance window matrix. No fictional per-employee or per-group schedule assignment tables exist in the legacy schema.

2. **Eight Time Columns per Day (Four Ranges)**:
   - Each day defines 4 distinct time intervals (start and end point):
     - `shift_in`: Allowed arrival/check-in window.
     - `shift_out`: Allowed departure/check-out window.
     - `break_start`: Window within which lunchtime break may commence.
     - `break_end`: Window within which employees must conclude their break and resume duties.
   - Total inputs per 7-day week: $7 \times 4 \times 2 = 56$ time points.

3. **Friday Prayer Accommodation**:
   - In legacy production seeds, Friday has `break_start_end = '11:30'` (rather than `'12:00'`), reflecting local cultural practices for Friday communal prayer (_Sholat Jumat_).

4. **Timezone Safety**:
   - All time fields are stored strictly as 24-hour time strings (`HH:mm`), eliminating timezone drift issues that occur when converting raw time strings to JavaScript `Date` timestamps.
