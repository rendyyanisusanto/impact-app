<script setup lang="ts">
import { ref } from 'vue'
import * as XLSX from 'xlsx'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import { attendanceService } from '../services/attendance.service'
import type { AttendanceImportResult, AttendanceImportRowPreview } from '../types/attendance.types'
import { Download, Upload, AlertTriangle, CheckCircle, Info } from 'lucide-vue-next'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success', result: AttendanceImportResult): void
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const isParsing = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')
const previewRows = ref<AttendanceImportRowPreview[]>([])

function downloadTemplate() {
  // Generate exact legacy template matching import_presensi_harian.xlsx
  const wb = XLSX.utils.book_new()
  const wsData = [
    ['Import Data Presensi'],
    [],
    ['No', 'ID', 'Tanggal + Jam', '', 'Warning : Mohon tidak mengubah susunan kolom template presensi harian'],
    [1, 1, '2026-11-01 07:45:00'],
    [2, 2, '2026-11-01 07:50:00']
  ]
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  XLSX.writeFile(wb, 'import_presensi_harian.xlsx')
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  selectedFile.value = file
  errorMessage.value = ''
  isParsing.value = true
  previewRows.value = []

  try {
    const data = await file.arrayBuffer()
    const wb = XLSX.read(data, { type: 'array' })
    const sheetName = wb.SheetNames[0]
    if (!sheetName) throw new Error('File tidak memiliki sheet data.')

    const ws = wb.Sheets[sheetName]
    const rawRows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 })

    if (rawRows.length < 4) {
      throw new Error('Template tidak memiliki baris data presensi (data dimulai dari baris ke-4).')
    }

    const parsedData: Array<{ no: number; uid: number; rawTimestamp: string }> = []
    // Legacy starts at index 3 (row 4)
    for (let i = 3; i < rawRows.length; i++) {
      const row = rawRows[i]
      if (!row || !row[1]) continue // column 1 is UID

      const no = Number(row[0]) || i - 2
      const uid = Number(row[1])
      const rawTimestamp = String(row[2] || '').trim()

      if (uid && rawTimestamp) {
        parsedData.push({ no, uid, rawTimestamp })
      }
    }

    if (parsedData.length === 0) {
      throw new Error('Tidak ada baris data yang valid ditemukan pada file.')
    }

    previewRows.value = await attendanceService.previewImportData(parsedData)
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Gagal membaca file excel.'
  } finally {
    isParsing.value = false
  }
}

async function handleConfirmImport() {
  if (previewRows.value.length === 0) return

  isSubmitting.value = true
  try {
    const result = await attendanceService.commitImportData(previewRows.value)
    emit('success', result)
    emit('close')
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Gagal menyimpan data import.'
  } finally {
    isSubmitting.value = false
  }
}

function handleClose() {
  selectedFile.value = null
  previewRows.value = []
  errorMessage.value = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
  emit('close')
}
</script>

<template>
  <AppModal
    :model-value="isOpen"
    title="Import Data Presensi"
    size="lg"
    @close="handleClose"
  >
    <div class="space-y-4">
      <!-- Download Template Link -->
      <div class="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between">
        <div class="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
          <Info class="w-4 h-4 shrink-0" />
          <span>Gunakan format excel standar legacy untuk import presensi.</span>
        </div>
        <AppButton size="sm" variant="primary" @click="downloadTemplate">
          <Download class="w-4 h-4 mr-1.5" />
          Download Template
        </AppButton>
      </div>

      <!-- File Upload Box -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Pilih File Excel / CSV <span class="text-red-500">*</span>
        </label>
        <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md bg-gray-50 dark:bg-gray-800/40">
          <div class="space-y-1 text-center">
            <Upload class="mx-auto h-10 w-10 text-gray-400" />
            <div class="flex text-sm text-gray-600 dark:text-gray-400">
              <label class="relative cursor-pointer rounded-md font-medium text-teal-600 hover:text-teal-500 focus-within:outline-hidden">
                <span>Upload file presensi</span>
                <input
                  ref="fileInputRef"
                  type="file"
                  class="sr-only"
                  accept=".xlsx,.xls,.csv"
                  @change="handleFileChange"
                />
              </label>
              <p class="pl-1">atau seret file ke sini</p>
            </div>
            <p class="text-xs text-gray-500">.XLSX, .XLS, atau .CSV</p>
            <p v-if="selectedFile" class="text-xs font-semibold text-teal-600 mt-2">
              File terpilih: {{ selectedFile.name }}
            </p>
          </div>
        </div>
      </div>

      <!-- Error Alert -->
      <div v-if="errorMessage" class="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600 flex items-center gap-2">
        <AlertTriangle class="w-4 h-4 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Preview Summary -->
      <div v-if="previewRows.length > 0" class="space-y-3">
        <div class="grid grid-cols-4 gap-2 text-center text-xs">
          <div class="p-2 bg-gray-100 dark:bg-gray-800 rounded">
            <span class="block text-gray-500">Total Baris</span>
            <span class="text-base font-bold text-gray-800 dark:text-gray-200">{{ previewRows.length }}</span>
          </div>
          <div class="p-2 bg-green-50 dark:bg-green-950/40 rounded">
            <span class="block text-green-700 dark:text-green-400">Siap Import</span>
            <span class="text-base font-bold text-green-700 dark:text-green-300">
              {{ previewRows.filter(r => r.isValid && !r.isDuplicate).length }}
            </span>
          </div>
          <div class="p-2 bg-amber-50 dark:bg-amber-950/40 rounded">
            <span class="block text-amber-700 dark:text-amber-400">Duplikat (Lewati)</span>
            <span class="text-base font-bold text-amber-700 dark:text-amber-300">
              {{ previewRows.filter(r => r.isDuplicate).length }}
            </span>
          </div>
          <div class="p-2 bg-red-50 dark:bg-red-950/40 rounded">
            <span class="block text-red-700 dark:text-red-400">Unmapped / Error</span>
            <span class="text-base font-bold text-red-700 dark:text-red-300">
              {{ previewRows.filter(r => !r.isValid).length }}
            </span>
          </div>
        </div>

        <!-- Preview Rows Table -->
        <div class="max-h-56 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs">
            <thead class="bg-gray-50 dark:bg-gray-800 sticky top-0">
              <tr>
                <th class="px-3 py-2 text-left font-medium text-gray-500">No</th>
                <th class="px-3 py-2 text-left font-medium text-gray-500">UID</th>
                <th class="px-3 py-2 text-left font-medium text-gray-500">Karyawan</th>
                <th class="px-3 py-2 text-left font-medium text-gray-500">Tanggal + Jam</th>
                <th class="px-3 py-2 text-left font-medium text-gray-500">Status Validasi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
              <tr v-for="row in previewRows.slice(0, 15)" :key="row.no">
                <td class="px-3 py-1.5">{{ row.no }}</td>
                <td class="px-3 py-1.5 font-mono">{{ row.uid }}</td>
                <td class="px-3 py-1.5">
                  <span v-if="row.karyawanName" class="font-medium text-gray-800 dark:text-gray-200">{{ row.karyawanName }}</span>
                  <span v-else class="text-red-500 italic">Tidak terdaftar</span>
                </td>
                <td class="px-3 py-1.5 font-mono">{{ row.timestampRaw }}</td>
                <td class="px-3 py-1.5">
                  <span v-if="row.isDuplicate" class="text-amber-600 flex items-center gap-1 font-semibold">
                    <AlertTriangle class="w-3.5 h-3.5" /> Duplikat
                  </span>
                  <span v-else-if="row.isValid" class="text-green-600 flex items-center gap-1 font-semibold">
                    <CheckCircle class="w-3.5 h-3.5" /> Valid
                  </span>
                  <span v-else class="text-red-600 flex items-center gap-1 font-semibold">
                    <AlertTriangle class="w-3.5 h-3.5" /> {{ row.errorReason }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <AppButton variant="secondary" @click="handleClose">
          Tutup
        </AppButton>
        <AppButton
          variant="primary"
          :is-loading="isSubmitting"
          :disabled="isSubmitting || previewRows.filter(r => r.isValid && !r.isDuplicate).length === 0"
          @click="handleConfirmImport"
        >
          Simpan & Import ({{ previewRows.filter(r => r.isValid && !r.isDuplicate).length }})
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>
