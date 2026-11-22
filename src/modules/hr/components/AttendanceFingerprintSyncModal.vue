<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import {
  Fingerprint,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  User,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Database,
  ArrowUpDown,
  Calendar,
  X
} from 'lucide-vue-next'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import { attendanceService } from '../services/attendance.service'
import type {
  FingerprintImportStatus,
  FingerprintSyncJobDto,
  FingerprintSyncMode,
  FingerprintSyncRecordDto
} from '../types/attendance.types'
import { formatDisplayDate } from '../utils/attendance-date'

interface Props {
  modelValue: boolean
  mode?: FingerprintSyncMode
  targetDate?: string
  dateTo?: string
  operatorName?: string
  snapshotId?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  mode: 'TODAY',
  targetDate: '',
  dateTo: '',
  operatorName: 'Operator HR',
  snapshotId: undefined
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'syncCompleted', job: FingerprintSyncJobDto): void
  (e: 'viewAttendance'): void
}>()

// Active job state
const currentJob = ref<FingerprintSyncJobDto | null>(null)
const isStarting = ref(false)
const syncError = ref<string | null>(null)
let pollTimer: ReturnType<typeof setInterval> | null = null

// Live timer
const elapsedSeconds = ref(0)
let elapsedTimer: ReturnType<typeof setInterval> | null = null

// Detail records state
const records = ref<FingerprintSyncRecordDto[]>([])
const isLoadingRecords = ref(false)
const activeTab = ref<'all' | 'success' | 'duplicate' | 'problem'>('all')
const searchQuery = ref('')
const selectedStatusFilter = ref('')
const selectedDateFilter = ref('')
const sortDirection = ref<'asc' | 'desc'>('asc')
const currentPage = ref(1)
const pageSize = ref(20)
const totalItems = ref(0)
const totalPages = ref(1)
const tabCounts = ref({
  all: 0,
  success: 0,
  duplicate: 0,
  problem: 0
})

// Stepper definitions
interface StepDef {
  key: string
  label: string
  description: string
}

const steps: StepDef[] = [
  { key: 'CONNECTING', label: 'Menghubungkan ke API', description: 'Memeriksa koneksi host dan handshake' },
  { key: 'FETCHING_DEVICE', label: 'Mengambil Data Mesin', description: 'Menarik log terbaru dari mesin fisik' },
  { key: 'FETCHING_API', label: 'Membaca Log Fingerprint', description: 'Membaca data tanggal terkait' },
  { key: 'MATCHING_EMPLOYEE', label: 'Mencocokkan UID Karyawan', description: 'Memetakan UID ke karyawan aktif' },
  { key: 'SAVING', label: 'Menyimpan Data Presensi', description: 'Deduplikasi dan penyimpanan check_log' },
  { key: 'COMPLETED', label: 'Selesai', description: 'Pembaruan KPI dan audit trail' }
]

const stageOrder = ['CONNECTING', 'FETCHING_DEVICE', 'FETCHING_API', 'MATCHING_EMPLOYEE', 'SAVING', 'COMPLETED']

function getStepState(stepKey: string): 'pending' | 'processing' | 'success' | 'failed' {
  if (!currentJob.value) return 'pending'

  const jobStatus = currentJob.value.status
  const jobStage = currentJob.value.stage

  if (jobStatus === 'FAILED' || jobStatus === 'TIMEOUT' || jobStatus === 'INTERRUPTED') {
    if (jobStage === stepKey) return 'failed'
    const failedIndex = stageOrder.indexOf(jobStage)
    const thisIndex = stageOrder.indexOf(stepKey)
    if (thisIndex < failedIndex) return 'success'
    return 'pending'
  }

  if (jobStatus === 'SUCCESS' || jobStatus === 'PARTIAL_SUCCESS') {
    return 'success'
  }

  const currentIndex = stageOrder.indexOf(jobStage)
  const thisIndex = stageOrder.indexOf(stepKey)

  if (thisIndex < currentIndex) return 'success'
  if (thisIndex === currentIndex) return 'processing'
  return 'pending'
}

const isTerminal = computed(() => {
  if (!currentJob.value) return false
  return ['SUCCESS', 'PARTIAL_SUCCESS', 'FAILED', 'TIMEOUT', 'INTERRUPTED'].includes(
    currentJob.value.status
  )
})

const isSuccess = computed(() => {
  return currentJob.value?.status === 'SUCCESS' || currentJob.value?.status === 'PARTIAL_SUCCESS'
})

const isAllAlreadyStored = computed(() => {
  if (!currentJob.value || !isSuccess.value) return false
  return currentJob.value.total_inserted === 0 && currentJob.value.total_duplicates > 0
})

const availableDates = computed(() => {
  if (!currentJob.value) return []
  if (currentJob.value.date_from === currentJob.value.date_to) {
    return [currentJob.value.date_from]
  }
  const dates: string[] = []
  const cur = new Date(currentJob.value.date_from)
  const end = new Date(currentJob.value.date_to)
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
})

const dateRangeLabel = computed(() => {
  if (!currentJob.value) {
    if (props.mode === 'THREE_DAYS') return '3 Hari Kebelakang'
    return props.targetDate ? formatDisplayDate(props.targetDate) : 'Hari Ini'
  }
  if (currentJob.value.date_from === currentJob.value.date_to) {
    return formatDisplayDate(currentJob.value.date_from)
  }
  return `${formatDisplayDate(currentJob.value.date_from)} s/d ${formatDisplayDate(currentJob.value.date_to)}`
})

// Trigger start sync when modal opens
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      resetState()
      await checkAndStartSync()
    } else {
      stopPolling()
    }
  },
  { immediate: true }
)

function resetState() {
  currentJob.value = null
  syncError.value = null
  records.value = []
  currentPage.value = 1
  activeTab.value = 'all'
  searchQuery.value = ''
  selectedStatusFilter.value = ''
  selectedDateFilter.value = ''
  elapsedSeconds.value = 0
}

async function checkAndStartSync() {
  isStarting.value = true
  syncError.value = null
  startElapsedTimer()

  try {
    // 1. Cek apakah ada active job yang sedang berjalan di backend
    const existingActive = await attendanceService.getActiveSyncJob()
    if (existingActive) {
      currentJob.value = existingActive
      startPolling(existingActive.id)
      return
    }

    // 2. Jika snapshotId disertakan (Sprint 8), lakukan impor langsung dari snapshot pratinjau
    if (props.snapshotId) {
      const job = await attendanceService.importFingerprintSnapshot(props.snapshotId)
      currentJob.value = job
      stopElapsedTimer()
      await loadJobRecords(job.id)
      emit('syncCompleted', job)
      return
    }

    // 3. Jalankan sync baru
    const job = await attendanceService.startSync(
      props.mode,
      props.targetDate || undefined,
      props.dateTo || undefined
    )
    currentJob.value = job

    if (['SUCCESS', 'PARTIAL_SUCCESS', 'FAILED', 'TIMEOUT', 'INTERRUPTED'].includes(job.status)) {
      stopElapsedTimer()
      await loadJobRecords(job.id)
      emit('syncCompleted', job)
    } else {
      startPolling(job.id)
    }
  } catch (err: any) {
    syncError.value = err.message || 'Gagal memulai proses sinkronisasi fingerprint.'
    stopElapsedTimer()
  } finally {
    isStarting.value = false
  }
}

function startPolling(jobId: string) {
  stopPolling()
  pollTimer = setInterval(async () => {
    try {
      const updated = await attendanceService.getSyncJob(jobId)
      currentJob.value = updated

      if (['SUCCESS', 'PARTIAL_SUCCESS', 'FAILED', 'TIMEOUT', 'INTERRUPTED'].includes(updated.status)) {
        stopPolling()
        stopElapsedTimer()
        await loadJobRecords(jobId)
        emit('syncCompleted', updated)
      }
    } catch (err: any) {
      console.warn('Polling status sync error:', err.message)
    }
  }, 900)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

function startElapsedTimer() {
  stopElapsedTimer()
  elapsedSeconds.value = 0
  elapsedTimer = setInterval(() => {
    elapsedSeconds.value++
  }, 1000)
}

function stopElapsedTimer() {
  if (elapsedTimer) {
    clearInterval(elapsedTimer)
    elapsedTimer = null
  }
}

onUnmounted(() => {
  stopPolling()
  stopElapsedTimer()
})

async function loadJobRecords(jobId: string) {
  isLoadingRecords.value = true
  try {
    const res = await attendanceService.getSyncJobRecords(jobId, {
      page: currentPage.value,
      pageSize: pageSize.value,
      tab: activeTab.value,
      status: selectedStatusFilter.value || undefined,
      date: selectedDateFilter.value || undefined,
      search: searchQuery.value.trim() || undefined,
      sortDirection: sortDirection.value
    })

    records.value = res.data
    totalItems.value = res.meta.totalItems
    totalPages.value = res.meta.totalPages
    tabCounts.value = res.meta.counts
  } catch (err: any) {
    console.error('Error loading sync detail records:', err.message)
  } finally {
    isLoadingRecords.value = false
  }
}

function handleTabChange(tab: 'all' | 'success' | 'duplicate' | 'problem') {
  activeTab.value = tab
  currentPage.value = 1
  if (currentJob.value) loadJobRecords(currentJob.value.id)
}

function handleSearch() {
  currentPage.value = 1
  if (currentJob.value) loadJobRecords(currentJob.value.id)
}

function toggleSort() {
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  currentPage.value = 1
  if (currentJob.value) loadJobRecords(currentJob.value.id)
}

function handlePageChange(newPage: number) {
  if (newPage >= 1 && newPage <= totalPages.value) {
    currentPage.value = newPage
    if (currentJob.value) loadJobRecords(currentJob.value.id)
  }
}

function closeModal() {
  stopPolling()
  stopElapsedTimer()
  emit('update:modelValue', false)
}

function handleViewAttendance() {
  closeModal()
  emit('viewAttendance')
}

function getStatusBadge(status: FingerprintImportStatus): {
  label: string
  class: string
  bgDot: string
} {
  switch (status) {
    case 'INSERTED':
      return { label: 'Tersimpan', class: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800', bgDot: 'bg-emerald-500' }
    case 'DUPLICATE':
      return { label: 'Sudah Ada', class: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800', bgDot: 'bg-blue-500' }
    case 'UID_NOT_FOUND':
      return { label: 'UID Tidak Dikenal', class: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800', bgDot: 'bg-amber-500' }
    case 'UID_CONFLICT':
      return { label: 'Konflik UID', class: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800', bgDot: 'bg-rose-500' }
    case 'INACTIVE_EMPLOYEE':
      return { label: 'Non-Aktif', class: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700', bgDot: 'bg-slate-500' }
    case 'INVALID_DATA':
      return { label: 'Data Invalid', class: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800', bgDot: 'bg-red-500' }
    case 'INSERT_FAILED':
    case 'DATA_CONFLICT':
      return { label: 'Konflik Data', class: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800', bgDot: 'bg-red-500' }
    default:
      return { label: status, class: 'bg-gray-50 text-gray-700 border-gray-200', bgDot: 'bg-gray-500' }
  }
}
</script>

<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
    @click.self="isTerminal ? closeModal() : null"
  >
    <div
      class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col w-full max-w-5xl max-h-[92vh] overflow-hidden transition-all duration-300"
    >
      <!-- MODAL HEADER -->
      <div class="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/80">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center ring-1 ring-teal-500/20 shrink-0">
            <Fingerprint class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Sinkronisasi Fingerprint
              </h2>
              <span
                v-if="currentJob"
                :class="[
                  'px-2 py-0.5 rounded-full text-[11px] font-semibold border',
                  currentJob.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800' :
                  currentJob.status === 'PARTIAL_SUCCESS' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800' :
                  currentJob.status === 'FAILED' || currentJob.status === 'TIMEOUT' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800' :
                  'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800'
                ]"
              >
                {{ currentJob.status === 'SUCCESS' ? 'Berhasil' :
                   currentJob.status === 'PARTIAL_SUCCESS' ? 'Berhasil Sebagian' :
                   currentJob.status === 'FAILED' ? 'Gagal' :
                   currentJob.status === 'TIMEOUT' ? 'Waktu Habis (Timeout)' :
                   'Sedang Memproses...' }}
              </span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5">
              <span class="font-medium text-slate-700 dark:text-slate-300">
                {{ mode === 'THREE_DAYS' ? 'Mode: 3 Hari Kebelakang' : (targetDate ? 'Laporan Presensi Harian' : 'Mode: Hari Ini') }}
              </span>
              <span>•</span>
              <span class="flex items-center gap-1">
                <Calendar class="w-3 h-3 text-slate-400" />
                {{ dateRangeLabel }}
              </span>
              <span>•</span>
              <span class="flex items-center gap-1">
                <User class="w-3 h-3 text-slate-400" />
                {{ operatorName }}
              </span>
              <span>•</span>
              <span class="flex items-center gap-1">
                <Clock class="w-3 h-3 text-slate-400" />
                Durasi: {{ currentJob?.duration_ms ? `${(currentJob.duration_ms / 1000).toFixed(1)}s` : `${elapsedSeconds}s` }}
              </span>
            </p>
          </div>
        </div>

        <button
          type="button"
          class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          @click="closeModal"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- MODAL BODY (SCROLLABLE) -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        <!-- 1. STEPPER PROGRESS (Always visible while running or when done) -->
        <div class="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 sm:p-4">
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <div
              v-for="(st, idx) in steps"
              :key="st.key"
              :class="[
                'p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between',
                getStepState(st.key) === 'success'
                  ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/60'
                  : getStepState(st.key) === 'processing'
                  ? 'bg-teal-50 border-teal-300 dark:bg-teal-950/40 dark:border-teal-700 ring-1 ring-teal-500/20'
                  : getStepState(st.key) === 'failed'
                  ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800/60'
                  : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 opacity-60'
              ]"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  TAHAP {{ idx + 1 }}
                </span>
                <span v-if="getStepState(st.key) === 'success'" class="text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 class="w-4 h-4" />
                </span>
                <span v-else-if="getStepState(st.key) === 'processing'" class="text-teal-600 dark:text-teal-400 animate-spin">
                  <RefreshCw class="w-4 h-4" />
                </span>
                <span v-else-if="getStepState(st.key) === 'failed'" class="text-rose-600 dark:text-rose-400">
                  <XCircle class="w-4 h-4" />
                </span>
                <span v-else class="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 text-[10px] flex items-center justify-center text-slate-400">
                  {{ idx + 1 }}
                </span>
              </div>
              <div>
                <p class="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                  {{ st.label }}
                </p>
                <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {{ st.description }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. ERROR STATE PANEL (If failed) -->
        <div
          v-if="currentJob && (currentJob.status === 'FAILED' || currentJob.status === 'TIMEOUT' || syncError)"
          class="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 space-y-2"
        >
          <div class="flex items-start gap-2.5">
            <AlertTriangle class="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 class="text-sm font-bold text-rose-950 dark:text-rose-100">
                Gagal Menghubungkan ke Mesin Fingerprint
              </h3>
              <p class="text-xs mt-1 text-rose-800 dark:text-rose-300">
                {{ currentJob.error_message || syncError }}
              </p>
              <p v-if="currentJob.safe_suggestion" class="text-xs font-medium text-rose-900 dark:text-rose-200 mt-2 bg-rose-100/70 dark:bg-rose-900/40 p-2 rounded-lg border border-rose-200/80 dark:border-rose-800">
                💡 <strong>Saran:</strong> {{ currentJob.safe_suggestion }}
              </p>
            </div>
          </div>
        </div>

        <!-- 3. SUMMARY CARDS (When finished) -->
        <div v-if="currentJob && isTerminal" class="space-y-3">
          <!-- Information banner when success -->
          <div
            v-if="isSuccess"
            class="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between gap-2 text-emerald-800 dark:text-emerald-200"
          >
            <div class="flex items-center gap-2">
              <CheckCircle2 class="w-5 h-5 text-emerald-600 shrink-0" />
              <span class="font-semibold text-sm">Sinkronisasi log fingerprint selesai!</span>
            </div>
            <span v-if="isAllAlreadyStored" class="text-xs text-emerald-700 dark:text-emerald-300">
              Tidak ada data baru, seluruh log sudah tersimpan sebelumnya.
            </span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-center">
            <!-- 1. Log Diterima -->
            <div class="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span class="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Log Diterima</span>
              <span class="text-lg font-bold text-slate-900 dark:text-white mt-0.5 block">
                {{ currentJob.total_received }}
              </span>
            </div>

            <!-- 2. Log Baru Disimpan -->
            <div class="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/50 shadow-2xs">
              <span class="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 block">Baru Disimpan</span>
              <span class="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {{ currentJob.total_inserted }}
              </span>
            </div>

            <!-- 3. Log Sudah Ada -->
            <div class="bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-xl border border-blue-200 dark:border-blue-800/50 shadow-2xs">
              <span class="text-[11px] font-medium text-blue-700 dark:text-blue-300 block">Sudah Ada</span>
              <span class="text-lg font-bold text-blue-600 dark:text-blue-400 mt-0.5 block">
                {{ currentJob.total_duplicates }}
              </span>
            </div>

            <!-- 4. Karyawan Unik -->
            <div class="bg-purple-50/50 dark:bg-purple-950/20 p-3 rounded-xl border border-purple-200 dark:border-purple-800/50 shadow-2xs">
              <span class="text-[11px] font-medium text-purple-700 dark:text-purple-300 block">Karyawan Cocok</span>
              <span class="text-lg font-bold text-purple-600 dark:text-purple-400 mt-0.5 block">
                {{ currentJob.unique_employees }}
              </span>
            </div>

            <!-- 5. UID Tidak Dikenal -->
            <div class="bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200 dark:border-amber-800/50 shadow-2xs">
              <span class="text-[11px] font-medium text-amber-700 dark:text-amber-300 block">UID Tidak Dikenal</span>
              <span class="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">
                {{ currentJob.total_unmatched }}
              </span>
            </div>

            <!-- 6. UID Konflik -->
            <div class="bg-rose-50/50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-200 dark:border-rose-800/50 shadow-2xs">
              <span class="text-[11px] font-medium text-rose-700 dark:text-rose-300 block">UID Konflik</span>
              <span class="text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5 block">
                {{ currentJob.total_conflicts }}
              </span>
            </div>

            <!-- 7. Record Gagal -->
            <div class="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span class="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Record Gagal</span>
              <span class="text-lg font-bold text-slate-700 dark:text-slate-300 mt-0.5 block">
                {{ currentJob.total_failed }}
              </span>
            </div>
          </div>
        </div>

        <!-- 4. TABEL DETAIL DATA FINGERPRINT YANG DIAMBIL -->
        <div v-if="currentJob && isTerminal" class="space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <!-- Tabs -->
            <div class="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                :class="[
                  'px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5',
                  activeTab === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                ]"
                @click="handleTabChange('all')"
              >
                <span>Semua Data</span>
                <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {{ tabCounts.all }}
                </span>
              </button>

              <button
                type="button"
                :class="[
                  'px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5',
                  activeTab === 'success'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                ]"
                @click="handleTabChange('success')"
              >
                <span>Berhasil</span>
                <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  {{ tabCounts.success }}
                </span>
              </button>

              <button
                type="button"
                :class="[
                  'px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5',
                  activeTab === 'duplicate'
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                ]"
                @click="handleTabChange('duplicate')"
              >
                <span>Sudah Ada</span>
                <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                  {{ tabCounts.duplicate }}
                </span>
              </button>

              <button
                type="button"
                :class="[
                  'px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5',
                  activeTab === 'problem'
                    ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                ]"
                @click="handleTabChange('problem')"
              >
                <span>Bermasalah</span>
                <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                  {{ tabCounts.problem }}
                </span>
              </button>
            </div>

            <!-- Filters & Search -->
            <div class="flex flex-wrap items-center gap-2">
              <div class="w-44 sm:w-52">
                <AppInput
                  v-model="searchQuery"
                  size="sm"
                  placeholder="Cari UID / Nama..."
                  @keyup.enter="handleSearch"
                >
                  <template #prefix>
                    <Search class="w-3.5 h-3.5 text-slate-400" />
                  </template>
                </AppInput>
              </div>

              <!-- Date filter if 3-day sync -->
              <div v-if="availableDates.length > 1" class="w-36">
                <AppSelect
                  v-model="selectedDateFilter"
                  size="sm"
                  placeholder="Semua Tanggal"
                  :options="[
                    { label: 'Semua Tanggal', value: '' },
                    ...availableDates.map(d => ({ label: formatDisplayDate(d), value: d }))
                  ]"
                  @change="handleSearch"
                />
              </div>

              <!-- Sort button -->
              <button
                type="button"
                class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
                @click="toggleSort"
              >
                <ArrowUpDown class="w-3 h-3 text-slate-400" />
                <span>{{ sortDirection === 'asc' ? 'Waktu (Asc)' : 'Waktu (Desc)' }}</span>
              </button>
            </div>
          </div>

          <!-- TABLE CONTAINER -->
          <div class="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs bg-white dark:bg-slate-900">
            <div class="overflow-x-auto max-h-72">
              <table class="w-full text-left border-collapse text-xs">
                <thead class="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <tr>
                    <th class="py-2.5 px-3 w-12 text-center">No.</th>
                    <th class="py-2.5 px-3">Tanggal</th>
                    <th class="py-2.5 px-3">Jam</th>
                    <th class="py-2.5 px-3">UID Finger</th>
                    <th class="py-2.5 px-3">Kode</th>
                    <th class="py-2.5 px-3">Nama Karyawan</th>
                    <th class="py-2.5 px-3">Grup</th>
                    <th class="py-2.5 px-3">Status Import</th>
                    <th class="py-2.5 px-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                  <tr v-if="isLoadingRecords">
                    <td colspan="9" class="py-8 text-center text-slate-500 dark:text-slate-400">
                      <RefreshCw class="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                      <span>Memuat data baris fingerprint...</span>
                    </td>
                  </tr>

                  <tr v-else-if="records.length === 0">
                    <td colspan="9" class="py-8 text-center text-slate-500 dark:text-slate-400">
                      <Database class="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <span>Tidak ada baris data yang cocok dengan filter.</span>
                    </td>
                  </tr>

                  <tr
                    v-for="(row, idx) in records"
                    :key="row.id || idx"
                    class="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td class="py-2.5 px-3 text-center text-slate-500">
                      {{ (currentPage - 1) * pageSize + idx + 1 }}
                    </td>
                    <td class="py-2.5 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                      {{ formatDisplayDate(row.scan_date) }}
                    </td>
                    <td class="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {{ row.scan_time }}
                    </td>
                    <td class="py-2.5 px-3 whitespace-nowrap">
                      <span class="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {{ row.uid_finger }}
                      </span>
                    </td>
                    <td class="py-2.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {{ row.kode_karyawan || '-' }}
                    </td>
                    <td class="py-2.5 px-3 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                      {{ row.nama_karyawan || 'Tidak Dikenal' }}
                    </td>
                    <td class="py-2.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {{ row.grup_nama || '-' }}
                    </td>
                    <td class="py-2.5 px-3 whitespace-nowrap">
                      <span
                        :class="[
                          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border',
                          getStatusBadge(row.status_import).class
                        ]"
                      >
                        <span class="w-1.5 h-1.5 rounded-full" :class="getStatusBadge(row.status_import).bgDot" />
                        {{ getStatusBadge(row.status_import).label }}
                      </span>
                    </td>
                    <td class="py-2.5 px-3 text-slate-500 dark:text-slate-400 text-[11px] max-w-xs truncate">
                      {{ row.reason || '-' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- TABLE PAGINATION FOOTER -->
            <div class="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
              <span>Menampilkan {{ records.length }} dari {{ totalItems }} baris</span>
              <div class="flex items-center gap-2">
                <span>Halaman {{ currentPage }} dari {{ totalPages }}</span>
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    :disabled="currentPage <= 1"
                    class="p-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                    @click="handlePageChange(currentPage - 1)"
                  >
                    <ChevronLeft class="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    :disabled="currentPage >= totalPages"
                    class="p-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                    @click="handlePageChange(currentPage + 1)"
                  >
                    <ChevronRight class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL FOOTER -->
      <div class="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span v-if="!isTerminal" class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <RefreshCw class="w-3.5 h-3.5 animate-spin text-teal-600" />
            <span>Sinkronisasi sedang berlangsung di backend...</span>
          </span>
          <a
            v-else-if="currentJob && currentJob.total_unmatched > 0"
            href="#/hr/employees"
            class="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium hover:underline"
          >
            <ExternalLink class="w-3.5 h-3.5" />
            <span>Buka Master Karyawan untuk lengkapi UID</span>
          </a>
        </div>

        <div class="flex items-center gap-2">
          <!-- Button while running: Sembunyikan -->
          <AppButton
            v-if="!isTerminal"
            variant="secondary"
            size="sm"
            @click="closeModal"
          >
            Sembunyikan
          </AppButton>

          <!-- Button when done: Coba Lagi if failed -->
          <AppButton
            v-if="isTerminal && (currentJob?.status === 'FAILED' || currentJob?.status === 'TIMEOUT')"
            variant="secondary"
            size="sm"
            @click="checkAndStartSync"
          >
            <RefreshCw class="w-4 h-4 mr-1.5" />
            Coba Lagi
          </AppButton>

          <!-- Button when done: Lihat Data Presensi -->
          <AppButton
            v-if="isTerminal && isSuccess"
            variant="primary"
            size="sm"
            class="bg-teal-600 hover:bg-teal-700 text-white"
            @click="handleViewAttendance"
          >
            <CheckCircle2 class="w-4 h-4 mr-1.5" />
            Lihat Data Presensi
          </AppButton>

          <!-- Button when done: Tutup -->
          <AppButton
            v-if="isTerminal"
            variant="secondary"
            size="sm"
            @click="closeModal"
          >
            Tutup
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>
