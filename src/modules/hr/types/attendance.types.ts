/**
 * HR Presensi & Fingerprint Domain Types
 * Matching legacy Impact SMM schema: `check_log`, `check_log_keterangan`, `v_presensi`
 */

export type AttendanceStatusCode =
  | 'EI' // Early In (Clock in on time / early) -> Blue
  | 'LI' // Late In (Clock in after shift start) -> Red
  | 'NSI' // No Sign In (Missing clock in when not absent) -> Red
  | 'LO' // Late Out (Clock out on time / overtime) -> Blue
  | 'EO' // Early Out (Clock out before shift end) -> Red
  | 'NSO' // No Sign Out (Missing clock out when not absent) -> Red
  | 'EBO' // Early Break Out (Break started before break window) -> Red
  | 'NBO' // No Break Out (Missing break start when not absent) -> Red
  | 'LBI' // Late Break In (Returned from break after break window) -> Red
  | 'NBI' // No Break In (Missing break end when not absent) -> Red
  | 'ABSENT' // Absent (No clock logs at all) -> Red

export interface AttendanceStatusMeta {
  code: AttendanceStatusCode
  label: string
  description: string
  variant: 'primary' | 'danger'
  badgeClass: string
}

export const ATTENDANCE_STATUS_MAP: Record<AttendanceStatusCode, AttendanceStatusMeta> = {
  EI: {
    code: 'EI',
    label: 'EI',
    description: 'Early In (Masuk Tepat Waktu / Awal)',
    variant: 'primary',
    badgeClass: 'bg-blue-600 text-white'
  },
  LI: {
    code: 'LI',
    label: 'LI',
    description: 'Late In (Terlambat Masuk)',
    variant: 'danger',
    badgeClass: 'bg-red-600 text-white'
  },
  NSI: {
    code: 'NSI',
    label: 'NSI',
    description: 'No Sign In (Tidak Ada Presensi Masuk)',
    variant: 'danger',
    badgeClass: 'bg-red-600 text-white'
  },
  LO: {
    code: 'LO',
    label: 'LO',
    description: 'Late Out (Pulang Sesuai/Melebihi Jadwal)',
    variant: 'primary',
    badgeClass: 'bg-blue-600 text-white'
  },
  EO: {
    code: 'EO',
    label: 'EO',
    description: 'Early Out (Pulang Lebih Awal)',
    variant: 'danger',
    badgeClass: 'bg-red-600 text-white'
  },
  NSO: {
    code: 'NSO',
    label: 'NSO',
    description: 'No Sign Out (Tidak Ada Presensi Pulang)',
    variant: 'danger',
    badgeClass: 'bg-red-600 text-white'
  },
  EBO: {
    code: 'EBO',
    label: 'EBO',
    description: 'Early Break Out (Istirahat Terlalu Cepat)',
    variant: 'danger',
    badgeClass: 'bg-red-600 text-white'
  },
  NBO: {
    code: 'NBO',
    label: 'NBO',
    description: 'No Break Out (Tidak Ada Mulai Istirahat)',
    variant: 'danger',
    badgeClass: 'bg-red-600 text-white'
  },
  LBI: {
    code: 'LBI',
    label: 'LBI',
    description: 'Late Break In (Selesai Istirahat Terlambat)',
    variant: 'danger',
    badgeClass: 'bg-red-600 text-white'
  },
  NBI: {
    code: 'NBI',
    label: 'NBI',
    description: 'No Break In (Tidak Ada Selesai Istirahat)',
    variant: 'danger',
    badgeClass: 'bg-red-600 text-white'
  },
  ABSENT: {
    code: 'ABSENT',
    label: 'ABSENT',
    description: 'Absent (Tidak Hadir / Tanpa Data Presensi)',
    variant: 'danger',
    badgeClass: 'bg-red-600 text-white font-bold'
  }
}

/**
 * Entity matching database table `check_log`
 */
export interface LegacyCheckLogEntity {
  id: number
  karyawan_id: number
  uid_finger: number
  status_absen_id: number
  tanggal: string // YYYY-MM-DD
  jam: string // HH:mm:ss
  timestamp?: string // YYYY-MM-DD HH:mm:ss
  created_at?: string
}

/**
 * Entity matching database table `check_log_keterangan`
 */
export interface LegacyCheckLogKeteranganEntity {
  id: number
  karyawan_id: number
  tanggal: string // YYYY-MM-DD
  keterangan: string
}

/**
 * Raw record from fingerprint device API
 */
export interface RawFingerprintRecord {
  uid: string | number
  status_val: number
  time: string // 'YYYY-MM-DD HH:mm:ss'
}

/**
 * Attendance row ViewModel formatted for shared DataTable & views
 */
export interface AttendanceRecordViewModel {
  id: string // composite key e.g. `${karyawanId}_${tanggal}`
  tanggal: string // 'YYYY-MM-DD'
  tanggalFormatted: string // 'dd-MM-yyyy'
  karyawanId: number
  kode: string
  nama: string
  grupId?: number | null
  grupKode: string
  grupNama: string
  grupColor?: string
  jabatanNama?: string
  cin: string // 'HH:mm:ss' or '-'
  cout: string // 'HH:mm:ss' or '-'
  bstart: string // 'HH:mm:ss' or '-'
  bend: string // 'HH:mm:ss' or '-'
  statuses: AttendanceStatusCode[]
  keterangan: string
  isLibur?: boolean
  liburKeterangan?: string
}

/**
 * Filter contracts
 */
export interface AttendanceDailyFilter {
  tanggal: string // YYYY-MM-DD
}

export interface AttendanceDateRangeFilter {
  tanggalMulai: string // YYYY-MM-DD
  tanggalSelesai: string // YYYY-MM-DD
  orderBy: 'KARYAWAN' | 'TANGGAL'
}

export interface AttendanceEmployeeRangeFilter {
  karyawanId: number
  tanggalMulai: string // YYYY-MM-DD
  tanggalSelesai: string // YYYY-MM-DD
}

export interface AttendanceEmployeeMonthlyFilter {
  karyawanId: number
  bulan: number // 1 - 12
  tahun: number // e.g. 2026
}

/**
 * KPI summary metrics
 */
export interface AttendanceSummaryMetrics {
  totalEmployees: number
  checkedInCount: number
  notCheckedInCount: number
  statusCounts: Record<AttendanceStatusCode, number>
}

/**
 * Note update input
 */
export type AttendanceTargetType = 'KARYAWAN' | 'GRUP' | 'SEMUA'

export interface UpdateAttendanceNoteDto {
  ditujukan: AttendanceTargetType
  tanggal: string // YYYY-MM-DD
  keterangan: string
  karyawanId?: number
  grupId?: number
}

/**
 * Fingerprint Synchronization & Import
 */
export type FingerprintMappingStatus =
  | 'MAPPED'
  | 'UID_NOT_FOUND'
  | 'UID_CONFLICT'
  | 'INACTIVE_EMPLOYEE'
  | 'INVALID_DATA'

export type FingerprintDatabaseStatus = 'NEW' | 'EXISTS' | 'CONFLICT' | 'NOT_ELIGIBLE'

export interface FingerprintInspectionItem {
  id?: string
  no: number
  uid: number | string
  nama: string
  timeFormatted: string
  timestamp: string
  state: number
  isMapped: boolean
  kodeKaryawan?: string | null
  karyawanId?: number | null
  statusMapping?: FingerprintMappingStatus
  statusDatabase?: FingerprintDatabaseStatus
  reason?: string | null
}

export interface FingerprintPreviewKpi {
  total_raw: number
  valid_mapped: number
  unmapped: number
  new_records: number
  existing_records: number
}

export interface FingerprintPreviewResponse {
  snapshot_id: string
  date: string
  kpi: FingerprintPreviewKpi
  items: FingerprintInspectionItem[]
}

export interface AttendanceSyncResult {
  totalProcessed: number
  totalInserted: number
  totalSkippedDuplicates: number
  totalFailedMapping: number
  details: string[]
}

export interface AttendanceImportRowPreview {
  no: number
  uid: number
  timestampRaw: string
  date: string
  time: string
  karyawanId?: number
  karyawanName?: string
  isDuplicate: boolean
  isValid: boolean
  errorReason?: string
}

export interface AttendanceImportResult {
  totalRows: number
  validCount: number
  insertedCount: number
  duplicateCount: number
  unmappedCount: number
  errors: string[]
}

/**
 * Backend Sync Job and Record Types (Sprint 1)
 */
export type FingerprintSyncMode = 'TODAY' | 'THREE_DAYS' | 'CUSTOM'
export type FingerprintSyncStatus =
  | 'IDLE'
  | 'CONNECTING'
  | 'FETCHING_DEVICE'
  | 'FETCHING_API'
  | 'MATCHING_EMPLOYEE'
  | 'SAVING'
  | 'SUCCESS'
  | 'PARTIAL_SUCCESS'
  | 'FAILED'
  | 'TIMEOUT'
  | 'INTERRUPTED'

export type FingerprintImportStatus =
  | 'INSERTED'
  | 'DUPLICATE'
  | 'UID_NOT_FOUND'
  | 'UID_CONFLICT'
  | 'INACTIVE_EMPLOYEE'
  | 'INVALID_DATA'
  | 'INSERT_FAILED'
  | 'DATA_CONFLICT'

export interface FingerprintSyncJobDto {
  id: string
  request_id?: string | null
  operator_id?: number | null
  operator_username?: string | null
  mode: FingerprintSyncMode
  date_from: string
  date_to: string
  stage: string
  status: FingerprintSyncStatus
  total_device: number
  total_received: number
  total_inserted: number
  total_duplicates: number
  total_unmatched: number
  total_conflicts: number
  total_failed: number
  unique_employees: number
  start_time: string
  end_time?: string | null
  duration_ms?: number | null
  error_stage?: string | null
  error_message?: string | null
  safe_suggestion?: string | null
  created_at: string
  updated_at: string
}

export interface FingerprintSyncRecordDto {
  id: number
  job_id: string
  scan_date: string
  scan_time: string
  timestamp: string
  uid_finger: number
  status_absen_id: number
  karyawan_id?: number | null
  kode_karyawan?: string | null
  nama_karyawan?: string | null
  grup_nama?: string | null
  status_import: FingerprintImportStatus
  reason?: string | null
  created_at: string
}

export interface AttendanceKpiDto {
  date: string
  totalEmployees: number
  presentCount: number
  absentCount: number
  lateCount: number
  statusCounts: Record<AttendanceStatusCode, number>
  lastSync?: {
    jobId: string
    status: FingerprintSyncStatus
    timestamp: string
    operator: string
    totalInserted: number
    totalDuplicates: number
  } | null
}


