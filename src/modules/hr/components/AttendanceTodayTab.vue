<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { attendanceService } from '../services/attendance.service'
import { employeeGroupService } from '../services/employee-group.service'
import type {
  AttendanceRecordViewModel,
  AttendanceStatusCode,
  AttendanceSummaryMetrics,
  AttendanceSyncResult,
  UpdateAttendanceNoteDto
} from '../types/attendance.types'
import type { EmployeeGroup } from '../types/employee-group.types'
import AttendanceSummaryCards from './AttendanceSummaryCards.vue'
import AttendanceStatusBadge from './AttendanceStatusBadge.vue'
import AttendanceNoteModal from './AttendanceNoteModal.vue'
import AttendanceImportModal from './AttendanceImportModal.vue'
import AttendanceFingerprintSyncModal from './AttendanceFingerprintSyncModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import {
  exportAttendanceReportExcel,
  exportAttendanceReportPdf
} from '../utils/attendance-export'
import { formatDisplayDate } from '../utils/attendance-date'
import { getTodayDateString } from '../utils/holiday-date'
import {
  Fingerprint,
  History,
  Upload,
  FileSpreadsheet,
  FileText,
  Search,
  Edit2,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import type { FingerprintSyncMode, FingerprintSyncJobDto } from '../types/attendance.types'

const authStore = useAuthStore()
const canEdit = computed(() => authStore.hasPermission('hr', 'update'))
const canFetchOrImport = computed(() => authStore.hasPermission('hr', 'create'))

const records = ref<AttendanceRecordViewModel[]>([])
const groups = ref<EmployeeGroup[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const selectedGroupFilter = ref('')
const selectedStatusFilter = ref('')

// Selected record for edit note modal
const isNoteModalOpen = ref(false)
const selectedRecord = ref<AttendanceRecordViewModel | null>(null)
const isUpdatingNote = ref(false)

// Import modal state
const isImportModalOpen = ref(false)

// Fingerprint Interactive Monitoring Modal (Sprint 1)
const isSyncModalOpen = ref(false)
const syncModalMode = ref<FingerprintSyncMode>('TODAY')

// Backward-compat states
const isJobModalOpen = ref(false)
const jobTitle = ref('')
const jobStep = ref<'connecting' | 'fetching' | 'processing' | 'completed' | 'error'>('connecting')
const jobResult = ref<AttendanceSyncResult | null>(null)
const jobError = ref('')

const todayDateStr = ref(getTodayDateString())

onMounted(async () => {
  await loadData()
  groups.value = await employeeGroupService.getAll()
})

async function loadData() {
  isLoading.value = true
  try {
    records.value = await attendanceService.getTodayAttendance(todayDateStr.value)
  } finally {
    isLoading.value = false
  }
}

const summaryMetrics = computed<AttendanceSummaryMetrics>(() => {
  return attendanceService.computeSummaryMetrics(records.value)
})

const filteredRecords = computed(() => {
  return records.value.filter((r) => {
    // Search query matches kode or nama
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      const matchKode = r.kode.toLowerCase().includes(q)
      const matchNama = r.nama.toLowerCase().includes(q)
      if (!matchKode && !matchNama) return false
    }
    // Group filter
    if (selectedGroupFilter.value) {
      if (r.grupKode !== selectedGroupFilter.value) return false
    }
    // Status filter
    if (selectedStatusFilter.value) {
      if (!r.statuses.includes(selectedStatusFilter.value as AttendanceStatusCode)) return false
    }
    return true
  })
})

function handleEditNote(record: AttendanceRecordViewModel) {
  selectedRecord.value = record
  isNoteModalOpen.value = true
}

async function handleSaveNote(dto: UpdateAttendanceNoteDto) {
  isUpdatingNote.value = true
  try {
    await attendanceService.updateKeterangan(dto)
    isNoteModalOpen.value = false
    await loadData()
  } finally {
    isUpdatingNote.value = false
  }
}

// Job: Ambil data fingerprint (Today)
function handleFetchTodayFingerprint() {
  syncModalMode.value = 'TODAY'
  isSyncModalOpen.value = true
}

// Job: Ambil data 3 Hari Kebelakang
function handleFetchThreeDaysBack() {
  syncModalMode.value = 'THREE_DAYS'
  isSyncModalOpen.value = true
}

async function handleSyncCompleted(_job?: FingerprintSyncJobDto) {
  await loadData()
}

function handleExportExcel() {
  exportAttendanceReportExcel(
    filteredRecords.value,
    `Presensi Karyawan Tanggal ${formatDisplayDate(todayDateStr.value)}`,
    `Presensi_Hari_Ini_${todayDateStr.value}`
  )
}

function handleExportPdf() {
  exportAttendanceReportPdf(
    filteredRecords.value,
    `Presensi Karyawan Tanggal ${formatDisplayDate(todayDateStr.value)}`,
    `Presensi_Hari_Ini_${todayDateStr.value}`
  )
}

async function handleImportSuccess() {
  await loadData()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Top Action Buttons -->
    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xs flex flex-wrap items-center justify-between gap-3">
      <!-- Left actions: Fetch & Import -->
      <div class="flex flex-wrap items-center gap-2">
        <AppButton
          v-if="canFetchOrImport"
          variant="primary"
          size="sm"
          @click="handleFetchTodayFingerprint"
        >
          <Fingerprint class="w-4 h-4 mr-1.5" />
          Ambil data fingerprint
        </AppButton>
        <AppButton
          v-if="canFetchOrImport"
          variant="secondary"
          size="sm"
          class="border-teal-500 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/30"
          @click="handleFetchThreeDaysBack"
        >
          <History class="w-4 h-4 mr-1.5" />
          Ambil data 3 Hari Kebelakang
        </AppButton>
        <AppButton
          v-if="canFetchOrImport"
          variant="secondary"
          size="sm"
          @click="isImportModalOpen = true"
        >
          <Upload class="w-4 h-4 mr-1.5" />
          Import data
        </AppButton>
      </div>

      <!-- Right actions: Download Reports & Refresh -->
      <div class="flex flex-wrap items-center gap-2">
        <AppButton
          variant="secondary"
          size="sm"
          class="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          :disabled="isLoading"
          @click="loadData"
        >
          <RefreshCw class="w-4 h-4 mr-1.5" :class="{ 'animate-spin': isLoading }" />
          Refresh
        </AppButton>
        <AppButton
          variant="success"
          size="sm"
          @click="handleExportExcel"
        >
          <FileSpreadsheet class="w-4 h-4 mr-1.5" />
          Download Report Excel
        </AppButton>
        <AppButton
          variant="danger"
          size="sm"
          @click="handleExportPdf"
        >
          <FileText class="w-4 h-4 mr-1.5" />
          Download Report PDF
        </AppButton>
      </div>
    </div>

    <!-- Summary KPI Cards -->
    <AttendanceSummaryCards :metrics="summaryMetrics" />

    <!-- Table Container -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xs overflow-hidden">
      <!-- Table Header & Section Title -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-base font-bold text-gray-900 dark:text-white">
            Presensi Karyawan Tanggal {{ formatDisplayDate(todayDateStr) }}
          </h2>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Daftar absensi seluruh karyawan aktif berdasarkan jadwal kerja dan log fingerprint hari ini
          </p>
        </div>

        <!-- Filter Controls -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Search input -->
          <div class="w-48 sm:w-56">
            <AppInput
              v-model="searchQuery"
              placeholder="Cari kode atau nama..."
              size="sm"
              class="w-full"
            >
              <template #prefix>
                <Search class="w-3.5 h-3.5 text-gray-400" />
              </template>
            </AppInput>
          </div>

          <!-- Group filter -->
          <div class="w-40">
            <AppSelect
              v-model="selectedGroupFilter"
              placeholder="Semua Grup"
              size="sm"
              :options="[
                { label: 'Semua Grup', value: '' },
                ...groups.map(g => ({ label: `${g.kode} - ${g.nama}`, value: g.kode || '' }))
              ]"
            />
          </div>

          <!-- Status filter -->
          <div class="w-36">
            <AppSelect
              v-model="selectedStatusFilter"
              placeholder="Semua Status"
              size="sm"
              :options="[
                { label: 'Semua Status', value: '' },
                { label: 'EI (Early In)', value: 'EI' },
                { label: 'LI (Late In)', value: 'LI' },
                { label: 'LO (Late Out)', value: 'LO' },
                { label: 'EO (Early Out)', value: 'EO' },
                { label: 'EBO (Early Break)', value: 'EBO' },
                { label: 'ABSENT', value: 'ABSENT' }
              ]"
            />
          </div>
        </div>
      </div>

      <!-- Table Content -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <thead class="bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
            <tr>
              <th scope="col" class="px-3 py-3 text-center w-12">No</th>
              <th scope="col" class="px-3 py-3 text-left">Tanggal</th>
              <th scope="col" class="px-3 py-3 text-left">Kode</th>
              <th scope="col" class="px-4 py-3 text-left">Nama</th>
              <th scope="col" class="px-3 py-3 text-left">Grup</th>
              <th scope="col" class="px-3 py-3 text-center">C IN</th>
              <th scope="col" class="px-3 py-3 text-center">C OUT</th>
              <th scope="col" class="px-3 py-3 text-center">B Start</th>
              <th scope="col" class="px-3 py-3 text-center">B End</th>
              <th scope="col" class="px-3 py-3 text-center">Status</th>
              <th scope="col" class="px-4 py-3 text-left">Keterangan</th>
              <th scope="col" class="px-3 py-3 text-center w-16">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
            <!-- Loading Skeletons -->
            <template v-if="isLoading">
              <tr v-for="n in 5" :key="n" class="animate-pulse">
                <td v-for="c in 12" :key="c" class="px-3 py-3">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                </td>
              </tr>
            </template>

            <!-- Empty State -->
            <tr v-else-if="filteredRecords.length === 0">
              <td colspan="12" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                Tidak ada data presensi yang sesuai dengan kriteria pencarian.
              </td>
            </tr>

            <!-- Data Rows -->
            <tr
              v-for="(row, idx) in filteredRecords"
              v-else
              :key="row.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <td class="px-3 py-2.5 text-center text-xs text-gray-500 dark:text-gray-400">{{ idx + 1 }}</td>
              <td class="px-3 py-2.5 whitespace-nowrap text-xs font-mono text-gray-700 dark:text-gray-300">{{ row.tanggalFormatted }}</td>
              <td class="px-3 py-2.5 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-white">{{ row.kode }}</td>
              <td class="px-4 py-2.5 whitespace-nowrap font-medium text-gray-900 dark:text-white">{{ row.nama }}</td>
              <td class="px-3 py-2.5 whitespace-nowrap text-xs font-semibold" :style="{ color: row.grupColor || undefined }">
                {{ row.grupNama }}
              </td>
              <td class="px-3 py-2.5 whitespace-nowrap text-center text-xs font-mono text-gray-700 dark:text-gray-300">{{ row.cin }}</td>
              <td class="px-3 py-2.5 whitespace-nowrap text-center text-xs font-mono text-gray-700 dark:text-gray-300">{{ row.cout }}</td>
              <td class="px-3 py-2.5 whitespace-nowrap text-center text-xs font-mono text-gray-700 dark:text-gray-300">{{ row.bstart }}</td>
              <td class="px-3 py-2.5 whitespace-nowrap text-center text-xs font-mono text-gray-700 dark:text-gray-300">{{ row.bend }}</td>
              <td class="px-3 py-2.5 text-center whitespace-nowrap">
                <div class="flex items-center justify-center gap-1 flex-wrap">
                  <AttendanceStatusBadge
                    v-for="st in row.statuses"
                    :key="st"
                    :status="st"
                  />
                </div>
              </td>
              <td class="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-300 max-w-xs truncate" :title="row.keterangan">
                {{ row.keterangan || '-' }}
              </td>
              <td class="px-3 py-2.5 text-center whitespace-nowrap">
                <button
                  type="button"
                  title="Tambah / Ubah Keterangan"
                  class="p-1.5 rounded-md bg-teal-50 text-teal-600 hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-400 dark:hover:bg-teal-900/60 transition-colors"
                  :disabled="!canEdit"
                  @click="handleEditNote(row)"
                >
                  <Edit2 class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modals -->
    <AttendanceNoteModal
      :is-open="isNoteModalOpen"
      :record="selectedRecord"
      :is-loading="isUpdatingNote"
      @close="isNoteModalOpen = false"
      @save="handleSaveNote"
    />

    <AttendanceImportModal
      :is-open="isImportModalOpen"
      @close="isImportModalOpen = false"
      @success="handleImportSuccess"
    />

    <!-- Interactive Fingerprint Sync Monitoring Modal (Sprint 1 WAJIB) -->
    <AttendanceFingerprintSyncModal
      v-model="isSyncModalOpen"
      :mode="syncModalMode"
      :target-date="todayDateStr"
      :operator-name="authStore.user?.name || 'Operator HR'"
      @sync-completed="handleSyncCompleted"
      @view-attendance="loadData"
    />

    <!-- Mock Job Progress Modal (Backward Compat) -->
    <AppModal
      :model-value="isJobModalOpen"
      :title="jobTitle"
      size="md"
      @close="isJobModalOpen = false"
    >
      <div class="space-y-4 py-2">
        <div v-if="jobStep !== 'completed' && jobStep !== 'error'" class="space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"/>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
              <template v-if="jobStep === 'connecting'">Menghubungkan ke mesin fingerprint adapter...</template>
              <template v-else-if="jobStep === 'fetching'">Mengambil data log fingerprint...</template>
              <template v-else-if="jobStep === 'processing'">Memvalidasi deduplikasi dan memetakan karyawan...</template>
            </span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
            <div
              class="bg-teal-600 h-full transition-all duration-300"
              :style="{
                width: jobStep === 'connecting' ? '25%' : jobStep === 'fetching' ? '60%' : '90%'
              }"
            />
          </div>
        </div>

        <div v-else-if="jobStep === 'completed' && jobResult" class="space-y-3">
          <div class="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-300">
            <CheckCircle2 class="w-5 h-5 shrink-0" />
            <span class="font-semibold text-sm">Sinkronisasi log fingerprint selesai!</span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="p-2 bg-gray-50 dark:bg-gray-800 rounded border">
              <span class="text-gray-500">Total Diproses:</span>
              <span class="font-bold ml-1">{{ jobResult.totalProcessed }}</span>
            </div>
            <div class="p-2 bg-green-50 dark:bg-green-950/40 rounded border border-green-200">
              <span class="text-green-700 dark:text-green-400">Berhasil Disimpan:</span>
              <span class="font-bold ml-1">{{ jobResult.totalInserted }}</span>
            </div>
            <div class="p-2 bg-amber-50 dark:bg-amber-950/40 rounded border border-amber-200">
              <span class="text-amber-700 dark:text-amber-400">Duplikat (Dilewati):</span>
              <span class="font-bold ml-1">{{ jobResult.totalSkippedDuplicates }}</span>
            </div>
            <div class="p-2 bg-red-50 dark:bg-red-950/40 rounded border border-red-200">
              <span class="text-red-700 dark:text-red-400">Gagal / Unmapped:</span>
              <span class="font-bold ml-1">{{ jobResult.totalFailedMapping }}</span>
            </div>
          </div>
        </div>

        <div v-else-if="jobStep === 'error'" class="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle class="w-5 h-5 shrink-0" />
          <span>{{ jobError }}</span>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <AppButton
            variant="secondary"
            :disabled="jobStep !== 'completed' && jobStep !== 'error'"
            @click="isJobModalOpen = false"
          >
            Tutup
          </AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
