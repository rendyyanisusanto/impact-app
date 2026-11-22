<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { attendanceService } from '../services/attendance.service'
import { employeeService } from '../services/employee.service'
import type {
  AttendanceRecordViewModel,
  AttendanceStatusCode,
  UpdateAttendanceNoteDto
} from '../types/attendance.types'
import type { Employee } from '../types/employee.types'
import AttendanceStatusBadge from './AttendanceStatusBadge.vue'
import AttendanceNoteModal from './AttendanceNoteModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import {
  exportAttendanceReportExcel,
  exportAttendanceReportPdf,
  sanitizeReportFilename
} from '../utils/attendance-export'
import { MONTH_NAMES_INDONESIAN } from '../utils/attendance-date'
import {
  FileSpreadsheet,
  FileText,
  Play,
  Edit2,
  Info,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()
const canEdit = ref(authStore.hasPermission('hr', 'update'))

const employees = ref<Employee[]>([])

// 1. Draft Form State
const selectedEmployeeId = ref<number | ''>('')
const selectedMonth = ref<number>(11) // November (matches Screenshot 5)
const selectedYear = ref<number>(2026) // 2026 (matches Screenshot 5)

// 2. Active Processed Report State
const reportEmployeeId = ref<number | ''>('')
const reportMonth = ref<number>(11)
const reportYear = ref<number>(2026)

const isFilterChanged = computed(
  () =>
    selectedEmployeeId.value !== reportEmployeeId.value ||
    selectedMonth.value !== reportMonth.value ||
    selectedYear.value !== reportYear.value
)

const records = ref<AttendanceRecordViewModel[]>([])
const isLoading = ref(false)
const hasProcessed = ref(false)

// Filter and Pagination state
const searchQuery = ref('')
const selectedStatusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(35) // Shows entire calendar month comfortably

// Edit Note Modal
const isNoteModalOpen = ref(false)
const selectedRecord = ref<AttendanceRecordViewModel | null>(null)
const isUpdatingNote = ref(false)

const monthOptions = MONTH_NAMES_INDONESIAN.map((name, index) => ({
  label: name,
  value: index + 1
}))

onMounted(async () => {
  try {
    const all = await employeeService.getAll()
    employees.value = all.filter((e) => e.status === 1)
    const defaultEmp = employees.value.find((e) => e.kode === '1') || employees.value[0]
    if (defaultEmp) {
      selectedEmployeeId.value = defaultEmp.id
      reportEmployeeId.value = defaultEmp.id
      await handleProcess()
    }
  } catch (err) {
    console.warn('[AttendanceEmployeeMonthlyTab] Gagal memuat daftar karyawan:', err)
  }
})

async function handleProcess() {
  if (!selectedEmployeeId.value || !selectedMonth.value || !selectedYear.value) return

  isLoading.value = true
  hasProcessed.value = true
  reportEmployeeId.value = selectedEmployeeId.value
  reportMonth.value = selectedMonth.value
  reportYear.value = selectedYear.value
  currentPage.value = 1

  try {
    records.value = await attendanceService.getEmployeeMonthlyAttendance({
      karyawanId: Number(reportEmployeeId.value),
      bulan: Number(reportMonth.value),
      tahun: Number(reportYear.value)
    })
  } finally {
    isLoading.value = false
  }
}

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

function getEmployeeName(): string {
  const emp = employees.value.find((e) => e.id === Number(reportEmployeeId.value))
  return emp ? `${emp.kode} - ${emp.nama}` : ''
}

function getRawEmployeeName(): string {
  const emp = employees.value.find((e) => e.id === Number(reportEmployeeId.value))
  return emp ? emp.nama : 'Karyawan'
}

const filteredRecords = computed(() => {
  let list = records.value

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(
      (r) =>
        r.tanggal.includes(q) ||
        r.tanggalFormatted.includes(q) ||
        r.keterangan.toLowerCase().includes(q)
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

async function handleExportExcel() {
  const empName = getEmployeeName()
  const rawName = getRawEmployeeName()
  const safeName = sanitizeReportFilename(rawName)
  const mStr = String(reportMonth.value).padStart(2, '0')
  const filename = `Presensi_Bulanan_${safeName}_${reportYear.value}-${mStr}`
  const title = `Presensi Karyawan (${empName}) ${mStr}/${reportYear.value}`
  exportAttendanceReportExcel(filteredRecords.value, title, filename)

  await attendanceService.recordReportExportAudit({
    reportType: 'EMPLOYEE_MONTHLY',
    type: 'EXCEL',
    employeeId: Number(reportEmployeeId.value),
    month: Number(reportMonth.value),
    year: Number(reportYear.value),
    totalRecords: filteredRecords.value.length
  })
}

async function handleExportPdf() {
  const empName = getEmployeeName()
  const rawName = getRawEmployeeName()
  const safeName = sanitizeReportFilename(rawName)
  const mStr = String(reportMonth.value).padStart(2, '0')
  const filename = `Presensi_Bulanan_${safeName}_${reportYear.value}-${mStr}`
  const title = `Presensi Karyawan (${empName}) ${mStr}/${reportYear.value}`
  exportAttendanceReportPdf(filteredRecords.value, title, filename)

  await attendanceService.recordReportExportAudit({
    reportType: 'EMPLOYEE_MONTHLY',
    type: 'PDF',
    employeeId: Number(reportEmployeeId.value),
    month: Number(reportMonth.value),
    year: Number(reportYear.value),
    totalRecords: filteredRecords.value.length
  })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Filter Card: Form Inputs (Draft) -->
    <div class="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xs max-w-xl">
      <form class="space-y-4" @submit.prevent="handleProcess">
        <!-- Karyawan Select -->
        <div class="grid grid-cols-1 sm:grid-cols-3 items-center gap-3">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Karyawan : <span class="text-red-500">*</span>
          </label>
          <div class="sm:col-span-2">
            <AppSelect
              v-model="selectedEmployeeId"
              placeholder="Pilih Karyawan"
              :options="employees.map(e => ({ label: `${e.kode} - ${e.nama}`, value: e.id }))"
              class="w-full"
            />
          </div>
        </div>

        <!-- Bulan Select -->
        <div class="grid grid-cols-1 sm:grid-cols-3 items-center gap-3">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Bulan : <span class="text-red-500">*</span>
          </label>
          <div class="sm:col-span-2">
            <AppSelect
              v-model="selectedMonth"
              :options="monthOptions"
              class="w-full"
            />
          </div>
        </div>

        <!-- Tahun Input -->
        <div class="grid grid-cols-1 sm:grid-cols-3 items-center gap-3">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Tahun : <span class="text-red-500">*</span>
          </label>
          <div class="sm:col-span-2">
            <AppInput
              v-model.number="selectedYear"
              type="number"
              min="2000"
              max="2100"
              required
              class="w-full"
            />
          </div>
        </div>

        <div>
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

    <!-- Filter Changed Indicator -->
    <div
      v-if="isFilterChanged"
      class="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center justify-between text-amber-800 dark:text-amber-200 text-xs sm:text-sm"
    >
      <div class="flex items-center gap-2">
        <Info class="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>Filter berubah. Klik <strong>Proses</strong> untuk memperbarui laporan.</span>
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

    <!-- Table Section -->
    <div v-if="hasProcessed" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xs overflow-hidden">
      <!-- Section Header -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-base font-bold text-gray-900 dark:text-white">
            Presensi Karyawan ( {{ getEmployeeName() }} ) {{ String(reportMonth).padStart(2, '0') }}/{{ reportYear }}
          </h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Matriks presensi 1 bulan kalender penuh &bull; Total {{ filteredRecords.length }} hari
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
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

      <!-- Filter Controls: Search, Status -->
      <div class="p-4 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-3">
        <div class="w-48 sm:w-56">
          <AppInput
            v-model="searchQuery"
            placeholder="Cari tanggal atau catatan..."
            size="sm"
            class="w-full"
          />
        </div>

        <div class="w-36 sm:w-44">
          <AppSelect
            v-model="selectedStatusFilter"
            size="sm"
            placeholder="Semua Status"
            :options="[
              { label: 'Semua Status', value: '' },
              { label: 'EI (Early In)', value: 'EI' },
              { label: 'LI (Late In)', value: 'LI' },
              { label: 'EO (Early Out)', value: 'EO' },
              { label: 'LO (Late Out)', value: 'LO' },
              { label: 'ABSENT', value: 'ABSENT' }
            ]"
            class="w-full"
          />
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
                Tidak ada data presensi pada bulan terpilih.
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
              <td class="px-3 py-2.5 whitespace-nowrap text-xs font-mono text-gray-700 dark:text-gray-300">
                {{ row.tanggalFormatted }}
              </td>
              <td class="px-3 py-2.5 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-white">
                {{ row.kode }}
              </td>
              <td class="px-4 py-2.5 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                {{ row.nama }}
              </td>
              <td class="px-3 py-2.5 whitespace-nowrap text-xs font-semibold" :style="{ color: row.grupColor || undefined }">
                {{ row.grupNama }}
              </td>
              <td class="px-3 py-2.5 whitespace-nowrap text-center text-xs font-mono text-gray-700 dark:text-gray-300">
                {{ row.cin }}
              </td>
              <td class="px-3 py-2.5 whitespace-nowrap text-center text-xs font-mono text-gray-700 dark:text-gray-300">
                {{ row.cout }}
              </td>
              <td class="px-3 py-2.5 whitespace-nowrap text-center text-xs font-mono text-gray-700 dark:text-gray-300">
                {{ row.bstart }}
              </td>
              <td class="px-3 py-2.5 whitespace-nowrap text-center text-xs font-mono text-gray-700 dark:text-gray-300">
                {{ row.bend }}
              </td>
              <td class="px-3 py-2.5 text-center whitespace-nowrap">
                <div class="flex items-center justify-center gap-1 flex-wrap">
                  <AttendanceStatusBadge
                    v-for="st in row.statuses"
                    :key="st"
                    :status="st"
                  />
                  <span
                    v-if="row.statuses.length === 0"
                    class="text-xs text-gray-400 italic"
                  >
                    {{ row.isLibur ? 'Libur' : '-' }}
                  </span>
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
        v-if="filteredRecords.length > 0"
        class="px-4 py-3 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400"
      >
        <div>
          Menampilkan {{ (currentPage - 1) * pageSize + 1 }} sampai
          {{ Math.min(currentPage * pageSize, filteredRecords.length) }} dari
          {{ filteredRecords.length }} total data
        </div>

        <div class="flex items-center gap-2">
          <AppButton
            size="xs"
            variant="secondary"
            :disabled="currentPage <= 1"
            @click="currentPage--"
          >
            <ChevronLeft class="w-3.5 h-3.5 mr-1" />
            Sebelumnya
          </AppButton>
          <span>Halaman {{ currentPage }} dari {{ totalPages }}</span>
          <AppButton
            size="xs"
            variant="secondary"
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
          >
            Selanjutnya
            <ChevronRight class="w-3.5 h-3.5 ml-1" />
          </AppButton>
        </div>
      </div>
    </div>

    <!-- Note Modal -->
    <AttendanceNoteModal
      :is-open="isNoteModalOpen"
      :record="selectedRecord"
      :is-loading="isUpdatingNote"
      @close="isNoteModalOpen = false"
      @save="handleSaveNote"
    />
  </div>
</template>
