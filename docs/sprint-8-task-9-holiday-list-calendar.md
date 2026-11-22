# SPRINT 8 — TASK 9: MONTHLY LISTING & CALENDAR PROJECTION

## 1. Overview

Setting Hari Libur provides HR operators with dual visualization modes:

1. **Daftar (Table View)**: Direct tabular overview matching legacy ergonomics with enhanced readability, badge-based exception summaries, and inline actions.
2. **Kalender (Monthly Calendar View)**: Intuitive 7-column grid displaying holiday badges, exempted employee counts, today highlight, and click-to-create / click-to-edit interactions.

---

## 2. Date Mathematics & Timezone Resilience

### 2.1 The Timezone Shift Problem

Standard JavaScript `new Date('YYYY-MM-DD')` parses ISO date strings as UTC midnight. In UTC+7 (Western Indonesia Time / WIB), formatting using local methods can result in shifting dates back by one day (e.g. `2024-08-17 00:00:00 UTC` becoming `16 Agustus 23:00 WIB`).

### 2.2 Date-Only String Arithmetic

To eliminate timezone drift:

- All date values are strictly parsed using string splitting: `const [y, m, d] = dateStr.split('-')`.
- Date components are converted via `new Date(Date.UTC(y, m - 1, d))`.
- Indonesian month and day lookups use deterministic lookup arrays (`INDONESIAN_MONTH_NAMES` and `INDONESIAN_DAY_NAMES`).

---

## 3. Calendar Projection Algorithm (`generateCalendarGrid`)

The calendar grid produces a strict Monday-to-Sunday layout:

1. **Monday Offset Calculation**:
   - `rawDay = firstDayOfMonth.getUTCDay()` (where Sunday = 0, Monday = 1).
   - `mondayBasedOffset = (rawDay + 6) % 7` (Senin = 0 ... Minggu = 6).
2. **Trailing Days from Previous Month**:
   - Fills leading empty cells with the final days of the previous month (marked `isCurrentMonth: false`, with reduced opacity).
3. **Current Month Days**:
   - Generates cells for days `1` through `lastDayOfMonth` (marked `isCurrentMonth: true`).
   - Checks if date matches today (`isToday: true`).
   - Checks if day is Sunday (`isSunday: true`, with subtle rose background).
   - Links all holidays occurring on that exact date.
4. **Leading Days of Next Month**:
   - Fills remainder of the grid up to full multiples of 7 (at least 35 or 42 cells total) to maintain aligned grid geometry.

---

## 4. UI Components Architecture

- **`HolidayMonthPicker.vue`**:
  - Year and month dropdowns.
  - Previous (`<`) and Next (`>`) navigation arrows.
  - Quick action: "Bulan Ini" button to jump immediately to the current real-world month.
- **`HolidayListTable.vue`**:
  - Columns: No, Tanggal (formatted short with Indonesian day name), Keterangan, Pengecualian Karyawan, Aksi.
  - Clean empty state with "Tambah Hari Libur" CTA.
- **`HolidayCalendar.vue`**:
  - 7 columns: Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu.
  - Holiday pills with color distinction between national holidays (emerald) and Sundays (rose).
  - Hover action: Quick-add holiday on unconfigured current-month days.
