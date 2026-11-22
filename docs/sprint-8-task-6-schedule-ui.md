# Sprint 8 Task 6 — Weekly Schedule UI & Component Architecture

## 1. Overview

Sprint 8 Task 6 implements the Weekly Schedule Setting UI (`/hr/schedules`) for IMPACT FURNITURE V2, translating the legacy desktop schedule editor into an enterprise Vue 3 interface.

---

## 2. Route & Navigation Architecture

- **Primary Route**: `/hr/schedules`
- **Route Alias**: `/hr/schedules/settings` (redirects automatically to `/hr/schedules`)
- **Permission Guard**: `hr:read`
- **Component**: `ScheduleSettingsPage.vue`
- **Page Header**:
  - Title: **Master Data Jadwal**
  - Subtitle: _Pengaturan jadwal kerja mingguan, rentang waktu kehadiran, dan jam istirahat karyawan._
  - Section Title: **Setting Jadwal**

---

## 3. Component Hierarchy

```
ScheduleSettingsPage.vue
├── AppPageHeader.vue
│   └── Actions: [Batalkan Perubahan], [Simpan Setting Jadwal]
├── AppAlert.vue (Feedback alerts: success, error summary, read-only banner)
└── Card Container
    ├── Card Header (Title, description, dirty indicator, time format hint)
    ├── AppSkeleton (Custom 7-row skeleton during data load)
    └── WeeklyScheduleTable.vue
        ├── Desktop View (<table> with 7 WeeklyScheduleRow.vue)
        │   └── WeeklyScheduleRow.vue (1 row = 4 ScheduleTimeRange.vue)
        │       └── ScheduleTimeRange.vue (2 ScheduleTimeInput.vue + separator)
        │           └── ScheduleTimeInput.vue (Time input with Clock icon)
        └── Mobile View (< 768px stacked day cards)
            └── 4 ScheduleTimeRange.vue blocks per card
```

---

## 4. UI Specification & 56-Input Grid

The schedule displays 7 rows in fixed calendar sequence:

1. **Senin** (Day ID 2)
2. **Selasa** (Day ID 3)
3. **Rabu** (Day ID 4)
4. **Kamis** (Day ID 5)
5. **Jumat** (Day ID 6, Emerald badge)
6. **Sabtu** (Day ID 7)
7. **Minggu** (Day ID 1, Rose badge)

Each day contains 4 range groups:

- **Jam Masuk**: Mulai – Selesai (e.g. `08:00` – `10:00`)
- **Jam Pulang**: Mulai – Selesai (e.g. `14:30` – `16:00`)
- **Mulai Istirahat**: Mulai – Selesai (e.g. `10:01` – `12:00` / Friday `11:30`)
- **Selesai Istirahat**: Mulai – Selesai (e.g. `13:00` – `14:00`)

---

## 5. Responsive Design Adaptation

- **Desktop (>= 1024px)**: Full tabular layout with sticky headers and clean vertical borders. Fits comfortably within standard 1366px and 1920px viewports.
- **Tablet (768px - 1023px)**: Horizontal scroll container preserving column alignments and input sizes without cramping.
- **Mobile (< 768px)**: Automatically switches to dedicated day-card layout. Each card represents one weekday with a 2x2 grid of time ranges, ensuring all 56 inputs remain fully accessible, touch-friendly, and readable on small viewports.
