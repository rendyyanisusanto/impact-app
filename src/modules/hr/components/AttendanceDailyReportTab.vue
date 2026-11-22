<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { attendanceService } from '../services/attendance.service'
import { employeeGroupService } from '../services/employee-group.service'
import type {
  AttendanceRecordViewModel,
  AttendanceStatusCode,
  FingerprintSyncJobDto,
  UpdateAttendanceNoteDto
} from '../types/attendance.types'
import AttendanceStatusBadge from './AttendanceStatusBadge.vue'
import AttendanceNoteModal from './AttendanceNoteModal.vue'
import AttendanceFingerprintSyncModal from './AttendanceFingerprintSyncModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import {
  exportAttendanceReportExcel,
  exportAttendanceReportPdf
} from '../utils/attendance-export'
import { formatDisplayDate } from '../utils/attendance-date'
import { getTodayDateString } from '../utils/holiday-date'
import {
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Play,
  Edit2,
  Search,
  AlertCircle,
  Calendar,
  Info,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()
const canEdit = ref(authStore.hasPermission('hr', 'update'))
const canSync = ref(authStore.hasPermission('hr', 'create'))

// 1. Separation of selectedDate (filter input) and reportDate (active processed report date)
const selectedDate = ref(getTodayDateString())
const reportDate = ref(getTodayDateString())
const syncLockedDate = ref(getTodayDateString())

const isFilterChanged = computed(() => selectedDate.value !== reportDate.value)

// Data state
const records = ref<AttendanceRecordViewModel[]>([])
const groups = ref<{ id: number; kode: string; nama: string }[]>([])
const isLoading = ref(false)
const hasProcessed = ref(false)
const holidayInfo = ref<{ isHoliday: boolean; keterangan?: string } | null>(null)

// Filter and Pagination state
const searchQuery = ref('')
const selectedGroupFilter = ref('')
const selectedStatusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(25)

// Edit Note Modal state
const isNoteModalOpen = ref(false)
const selectedRecord = ref<AttendanceRecordViewModel | null>(null)
const isUpdatingNote = ref(false)

// Interactive Fingerprint Sync Modal state (Sprint 1-2 Reusable)
const isSyncModalOpen = ref(false)

onMounted(async () => {
  try {
    const activeGroups = await employeeGroupService.getActiveGroups()
    groups.value = activeGroups.map((g) => ({
      id: g.id,
      kode: g.kode || '',
      nama: g.nama || ''
    }))
  } catch (err) {
    console.warn('[AttendanceDailyReportTab] Gagal memuat grup karyawan:', err)
  }
  await handleProcess()
})

/**
 * Memproses dan menampilkan laporan presensi dari database lokal SMM-Impact
 * PENTING: Tombol Proses tidak boleh otomatis melakukan sinkronisasi fingerprint.
 */
async function handleProcess() {
  if (!selectedDate.value) return
  isLoading.value = true
  hasProcessed.value = true
  reportDate.value = selectedDate.value
  currentPage.value = 1

  try {
    const data = await attendanceService.getDailyAttendance(reportDate.value)
    records.value = data

    // Cek apakah ada informasi hari libur dari baris data
    const holidayRecord = data.find((r) => r.isLibur)
    if (holidayRecord) {
      holidayInfo.value = {
        isHoliday: true,
        keterangan: holidayRecord.liburKeterangan || 'Hari Libur Nasional / Perusahaan'
      }
    } else {
      holidayInfo.value = null
    }
  } catch (err) {
    console.error('[AttendanceDailyReportTab] Gagal memuat laporan harian:', err)
    records.value = []
  } finally {
    isLoading.value = false
  }
}

/**
 * Menjalankan Sinkronisasi Fingerprint Manual berdasarkan tanggal terpilih di date picker
 * Mengunci tanggal terpilih agar tidak berubah saat proses berlangsung.
 */
function handleSyncDaily() {
  syncLockedDate.value = selectedDate.value
  isSyncModalOpen.value = true
}

/**
 * Callback saat sinkronisasi fingerprint berhasil selesai dari modal interaktif
 */
async function handleSyncCompleted(_job: FingerprintSyncJobDto) {
  // Set reportDate dan selectedDate ke tanggal yang disinkronkan, lalu refresh laporan
  selectedDate.value = syncLockedDate.value
  reportDate.value = syncLockedDate.value
  await handleProcess()
}

/**
 * Callback tombol 'Lihat Hasil Presensi' dari modal interaktif
 */
async function handleViewAttendance() {
  isSyncModalOpen.value = false
  selectedDate.value = syncLockedDate.value
  reportDate.value = syncLockedDate.value
  await handleProcess()
}

/**
 * Filtered Records berdasarkan Search, Grup, dan Status
 */
const filteredRecords = computed(() => {
  let list = records.value

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(
      (r) =>
        r.kode.toLowerCase().includes(q) ||
        r.nama.toLowerCase().includes(q)
    )
  }

  if (selectedGroupFilter.value) {
    list = list.filter(
      (r) =>
        r.grupKode.toLowerCase() === selectedGroupFilter.value.toLowerCase() ||
        String(r.grupId) === selectedGroupFilter.value
    )
  }

  if (selectedStatusFilter.value) {
    list = list.filter((r) =>
      r.statuses.includes(selectedStatusFilter.value as AttendanceStatusCode)
    )
  }

  return list
})

const totalPages = computed(() => Math.ceil(filteredRecords.value.length / pageSize.value) || 1)

const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRecords.value.slice(start, start + pageSize.value)
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
    await handleProcess()
  } finally {
    isUpdatingNote.value = false
  }
}

async function handleExportExcel() {
  exportAttendanceReportExcel(
    filteredRecords.value,
    `Presensi Karyawan Tanggal ${formatDisplayDate(reportDate.value)}`,
    `Laporan_Presensi_Harian_${reportDate.value}`
  )
  await attendanceService.recordExportAudit(reportDate.value, 'EXCEL', filteredRecords.value.length)
}

async function handleExportPdf() {
  exportAttendanceReportPdf(
    filteredRecords.value,
    `Presensi Karyawan Tanggal ${formatDisplayDate(reportDate.value)}`,
    `Laporan_Presensi_Harian_${reportDate.value}`
  )
  await attendanceService.recordExportAudit(reportDate.value, 'PDF', filteredRecords.value.length)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Filter Card: Tanggal + Tombol Proses -->
    <div class="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xs max-w-xl">
      <form class="space-y-4" @submit.prevent="handleProcess">
        <div class="grid grid-cols-1 sm:grid-cols-3 items-center gap-3">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Tanggal : <span class="text-red-500">*</span>
          </label>
          <div class="sm:col-span-2">
            <AppInput
              v-model="selectedDate"
              type="date"
              required
              class="w-full"
            />
          </div>
        </div>

        <div class="flex items-center gap-3">
          <AppButton
            variant="primary"
            type="submit"
            :loading="isLoading"
            size="sm"
          >
            <Play class="w-4 h-4 mr-1.5 fill-current" />
            Proses
          </AppButton>
        </div>
      </form>
    </div>

    <!-- Alert Indikator Perubahan Filter Tanggal -->
    <div
      v-if="isFilterChanged"
      class="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center justify-between text-amber-800 dark:text-amber-200 text-xs sm:text-sm"
    >
      <div class="flex items-center gap-2">
        <Info class="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>
          Filter tanggal diubah ke <strong>{{ formatDisplayDate(selectedDate) }}</strong>. Tekan tombol <strong>Proses</strong> untuk memuat data tanggal ini.
        </span>
      </div>
      <AppButton
        size="xs"
        variant="secondary"
        class="border-amber-300 text-amber-800 dark:text-amber-200 hover:bg-amber-100"
        @click="handleProcess"
      >
        Proses Sekarang
      </AppButton>
    </div>

    <!-- Hari Libur Banner (Jika Tanggal Laporan Adalah Hari Libur) -->
    <div
      v-if="holidayInfo?.isHoliday"
      class="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-3 text-blue-800 dark:text-blue-200 text-sm"
    >
      <Calendar class="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
      <div>
        <h4 class="font-bold">Informasi Hari Libur: {{ holidayInfo.keterangan }}</h4>
        <p class="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
          Tanggal {{ formatDisplayDate(reportDate) }} tercatat sebagai hari libur. Karyawan yang tidak memiliki jadwal pengecualian khusus tidak dihitung ABSENT.
        </p>
      </div>
    </div>

    <!-- Table Section -->
    <div v-if="hasProcessed" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xs overflow-hidden">
      <!-- Section Header with Actions on Right -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-base font-bold text-gray-900 dark:text-white">
            Presensi Karyawan Tanggal {{ formatDisplayDate(reportDate) }}
          </h2>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Total {{ filteredRecords.length }} karyawan ditemukan dari database lokal
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <!-- Tombol Sinkronisasi Data: Menggunakan selectedDate (tanggal di filter) -->
          <AppButton
            v-if="canSync"
            variant="primary"
            size="sm"
            class="bg-blue-600 hover:bg-blue-700 text-white"
            title="Tarik dan sinkronkan data fingerprint dari mesin untuk tanggal yang dipilih di filter"
            @click="handleSyncDaily"
          >
            <RefreshCw class="w-4 h-4 mr-1.5" />
            Sinkronisasi Data
          </AppButton>

          <!-- Export Excel (Vibrant Green) -->
          <AppButton
            variant="success"
            size="sm"
            title="Download laporan presensi ke file Excel (.xlsx)"
            @click="handleExportExcel"
          >
            <FileSpreadsheet class="w-4 h-4 mr-1.5" />
            Download Report Excel
          </AppButton>

          <!-- Export PDF (Vibrant Red) -->
          <AppButton
            variant="danger"
            size="sm"
            title="Download laporan presensi ke dokumen PDF"
            @click="handleExportPdf"
          >
            <FileText class="w-4 h-4 mr-1.5" />
            Download Report PDF
          </AppButton>
        </div>
      </div>

      <!-- Filter Controls: Search, Group, Status -->
      <div class="p-4 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-3">
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
        <div class="w-44">
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
        <div class="w-40">
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

        <!-- Clear filters button if active -->
        <button
          v-if="searchQuery || selectedGroupFilter || selectedStatusFilter"
          type="button"
          class="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 font-medium underline"
          @click="searchQuery = ''; selectedGroupFilter = ''; selectedStatusFilter = ''"
        >
          Reset Filter
        </button>
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
            <!-- Loading Skeleton -->
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
                <div class="flex flex-col items-center justify-center gap-1.5">
                  <AlertCircle class="w-6 h-6 text-gray-400" />
                  <span class="font-medium">Tidak ada data presensi pada tanggal {{ formatDisplayDate(reportDate) }}.</span>
                  <span class="text-xs text-gray-400">Tekan 'Sinkronisasi Data' jika ingin menarik log presensi dari mesin.</span>
                </div>
              </td>
            </tr>

            <!-- Data Rows -->
            <tr
              v-for="(row, idx) in paginatedRecords"
              v-else
              :key="row.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <td class="px-3 py-2.5 text-center text-xs text-gray-500 dark:text-gray-400">
                {{ (currentPage - 1) * pageSize + idx + 1 }}
              </td>
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

      <!-- Pagination Footer -->
      <div
        v-if="filteredRecords.length > pageSize"
        class="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between text-xs text-gray-600 dark:text-gray-300"
      >
        <div>
          Menampilkan {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, filteredRecords.length) }} dari {{ filteredRecords.length }} karyawan
        </div>
        <div class="flex items-center gap-2">
          <AppButton
            size="xs"
            variant="secondary"
            :disabled="currentPage <= 1"
            @click="currentPage--"
          >
            <ChevronLeft class="w-3.5 h-3.5 mr-1" /> Prev
          </AppButton>
          <span>Halaman {{ currentPage }} dari {{ totalPages }}</span>
          <AppButton
            size="xs"
            variant="secondary"
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
          >
            Next <ChevronRight class="w-3.5 h-3.5 ml-1" />
          </AppButton>
        </div>
      </div>
    </div>

    <!-- Edit Note Modal -->
    <AttendanceNoteModal
      :is-open="isNoteModalOpen"
      :record="selectedRecord"
      :is-loading="isUpdatingNote"
      @close="isNoteModalOpen = false"
      @save="handleSaveNote"
    />

    <!-- Interactive Fingerprint Sync Monitoring Modal (Sprint 1-2 Reusable) -->
    <AttendanceFingerprintSyncModal
      v-model="isSyncModalOpen"
      mode="TODAY"
      :target-date="syncLockedDate"
      :operator-name="authStore.user?.name || 'Operator HR'"
      @sync-completed="handleSyncCompleted"
      @view-attendance="handleViewAttendance"
    />
  </div>
</template>
