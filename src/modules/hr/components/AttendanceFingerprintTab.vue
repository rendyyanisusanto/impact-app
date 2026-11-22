<script setup lang="ts">
import { ref, computed } from 'vue'
import { attendanceService } from '../services/attendance.service'
import type {
  FingerprintInspectionItem,
  FingerprintPreviewKpi,
  FingerprintSyncJobDto
} from '../types/attendance.types'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AttendanceFingerprintSyncModal from './AttendanceFingerprintSyncModal.vue'
import { formatDisplayDate } from '../utils/attendance-date'
import { getTodayDateString } from '../utils/holiday-date'
import {
  Fingerprint,
  RefreshCw,
  FileCheck2,
  FileQuestion,
  AlertTriangle,
  CheckCircle2,
  AlertCircle
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()
const canSync = computed(() => authStore.hasPermission('hr', 'create'))

const selectedDate = ref(getTodayDateString())
const activePreviewDate = ref('')
const activeSnapshotId = ref<string | null>(null)
const items = ref<FingerprintInspectionItem[]>([])
const kpi = ref<FingerprintPreviewKpi>({
  total_raw: 0,
  valid_mapped: 0,
  unmapped: 0,
  new_records: 0,
  existing_records: 0
})
const isLoading = ref(false)
const hasLoaded = ref(false)
const fetchError = ref<string | null>(null)

// Sync Modal State
const isSyncModalOpen = ref(false)

const isDateStale = computed(() => {
  return hasLoaded.value && activePreviewDate.value !== '' && activePreviewDate.value !== selectedDate.value
})

const canTriggerSync = computed(() => {
  return (
    canSync.value &&
    hasLoaded.value &&
    !isDateStale.value &&
    activeSnapshotId.value !== null &&
    items.value.length > 0 &&
    kpi.value.new_records > 0
  )
})

async function handleFetchFingerprint() {
  if (!selectedDate.value) return
  isLoading.value = true
  fetchError.value = null

  try {
    const res = await attendanceService.fetchFingerprintPreview(selectedDate.value)
    items.value = res.items
    kpi.value = res.kpi
    activeSnapshotId.value = res.snapshot_id
    activePreviewDate.value = res.date
    hasLoaded.value = true
  } catch (err: unknown) {
    fetchError.value = err instanceof Error ? err.message : 'Gagal mengambil data fingerprint dari mesin/server.'
  } finally {
    isLoading.value = false
  }
}

function handleOpenSyncModal() {
  if (!activeSnapshotId.value) return
  isSyncModalOpen.value = true
}

async function handleSyncCompleted(_job: FingerprintSyncJobDto) {
  // Refresh data preview setelah sinkronisasi selesai agar status database terupdate
  if (activePreviewDate.value) {
    try {
      const res = await attendanceService.fetchFingerprintPreview(activePreviewDate.value)
      items.value = res.items
      kpi.value = res.kpi
      activeSnapshotId.value = res.snapshot_id
    } catch {
      // Abaikan error background refresh
    }
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Filter Card: Tanggal + Ambil Data Fingerprint -->
    <div class="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xs max-w-xl">
      <form class="space-y-4" @submit.prevent="handleFetchFingerprint">
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

        <div>
          <AppButton
            variant="primary"
            type="submit"
            :is-loading="isLoading"
            size="sm"
          >
            <Fingerprint class="w-4 h-4 mr-1.5" />
            Ambil data fingerprint
          </AppButton>
        </div>
      </form>
    </div>

    <!-- Active Loading Bar matching Screenshot 6 -->
    <div v-if="isLoading" class="bg-teal-700 dark:bg-teal-800 p-4 rounded-lg text-white flex items-center justify-center gap-3 shadow-sm">
      <div class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"/>
      <span class="text-sm font-medium">Sedang mengambil dan membaca data dari adapter fingerprint...</span>
    </div>

    <!-- Error Alert -->
    <div v-if="fetchError" class="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-300 text-sm">
      <AlertCircle class="w-5 h-5 shrink-0" />
      <span>{{ fetchError }}</span>
    </div>

    <!-- Date Stale Notification -->
    <div v-if="isDateStale" class="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2.5 text-amber-800 dark:text-amber-300 text-xs">
      <AlertTriangle class="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <span>
        Tanggal filter telah diubah ke <strong>{{ formatDisplayDate(selectedDate) }}</strong>, namun data di bawah adalah pratinjau tanggal <strong>{{ formatDisplayDate(activePreviewDate) }}</strong>. Silakan klik <strong>Ambil data fingerprint</strong> untuk memperbarui.
      </span>
    </div>

    <!-- Inspection Result Section -->
    <div v-if="hasLoaded && !isLoading" class="space-y-4">
      <!-- Summary Inspection Metrics matching Screenshot 6 & Sprint 8 KPI -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div class="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-between">
          <div>
            <span class="text-xs text-gray-500 uppercase font-semibold">Total Raw Records</span>
            <p class="text-xl font-bold text-gray-900 dark:text-white">{{ kpi.total_raw }}</p>
          </div>
          <Fingerprint class="w-6 h-6 text-gray-400" />
        </div>

        <div class="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-between">
          <div>
            <span class="text-xs text-gray-500 uppercase font-semibold">Valid Terpetakan</span>
            <p class="text-xl font-bold text-teal-600">{{ kpi.valid_mapped }}</p>
          </div>
          <FileCheck2 class="w-6 h-6 text-teal-500" />
        </div>

        <div class="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-between">
          <div>
            <span class="text-xs text-gray-500 uppercase font-semibold">Tidak Terbaca / Unmapped</span>
            <p class="text-xl font-bold text-red-600">{{ kpi.unmapped }}</p>
          </div>
          <FileQuestion class="w-6 h-6 text-red-500" />
        </div>
      </div>

      <!-- Preview Table Container -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xs overflow-hidden">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 class="text-base font-bold text-gray-900 dark:text-white">
              Data fingerprint tanggal {{ formatDisplayDate(activePreviewDate) }}
            </h2>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Pratinjau rekaman mentah (raw log) dari mesin sebelum diterapkan ke database absensi
            </p>
          </div>

          <div class="flex items-center gap-3">
            <span v-if="kpi.new_records === 0 && items.length > 0" class="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 class="w-4 h-4" />
              Semua log valid sudah tersimpan di database
            </span>
            <AppButton
              v-if="canSync"
              variant="primary"
              size="sm"
              class="bg-emerald-600 hover:bg-emerald-700 text-white"
              :disabled="!canTriggerSync"
              @click="handleOpenSyncModal"
            >
              <RefreshCw class="w-4 h-4 mr-1.5" />
              Sinkronisasi Data
            </AppButton>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead class="bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              <tr>
                <th scope="col" class="px-4 py-3 text-center w-14">No</th>
                <th scope="col" class="px-4 py-3 text-left w-24">UID</th>
                <th scope="col" class="px-4 py-3 text-left w-28">Kode</th>
                <th scope="col" class="px-6 py-3 text-left">Nama</th>
                <th scope="col" class="px-4 py-3 text-left w-28">Time</th>
                <th scope="col" class="px-4 py-3 text-center w-36">Status Mapping</th>
                <th scope="col" class="px-4 py-3 text-center w-36">Status Database</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
              <tr v-if="items.length === 0">
                <td colspan="7" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  Tidak ada rekaman fingerprint pada tanggal ini.
                </td>
              </tr>
              <tr
                v-for="(row, idx) in items"
                v-else
                :key="row.id || idx"
                class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td class="px-4 py-2.5 text-center text-xs text-gray-500">{{ row.no }}</td>
                <td class="px-4 py-2.5 whitespace-nowrap text-xs font-mono font-medium text-gray-800 dark:text-gray-200">
                  {{ row.uid }}
                </td>
                <td class="px-4 py-2.5 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">
                  {{ row.kodeKaryawan || '-' }}
                </td>
                <td class="px-6 py-2.5 whitespace-nowrap font-medium">
                  <span v-if="row.isMapped" class="text-gray-900 dark:text-white">{{ row.nama }}</span>
                  <span v-else class="text-red-500 italic font-normal">{{ row.nama || 'Tidak terbaca' }}</span>
                </td>
                <td class="px-4 py-2.5 whitespace-nowrap text-xs font-mono text-gray-700 dark:text-gray-300">
                  {{ row.timeFormatted }}
                </td>
                <td class="px-4 py-2.5 whitespace-nowrap text-center text-xs">
                  <span
                    v-if="row.statusMapping === 'MAPPED' || (!row.statusMapping && row.isMapped)"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                  >
                    Terpetakan
                  </span>
                  <span
                    v-else-if="row.statusMapping === 'UID_CONFLICT'"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                  >
                    Konflik UID
                  </span>
                  <span
                    v-else-if="row.statusMapping === 'INACTIVE_EMPLOYEE'"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                  >
                    Nonaktif
                  </span>
                  <span
                    v-else-if="row.statusMapping === 'INVALID_DATA'"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                  >
                    Format Rusak
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                  >
                    Tidak Ditemukan
                  </span>
                </td>
                <td class="px-4 py-2.5 whitespace-nowrap text-center text-xs">
                  <span
                    v-if="row.statusDatabase === 'EXISTS'"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                  >
                    Sudah Tersimpan
                  </span>
                  <span
                    v-else-if="row.statusDatabase === 'NEW'"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                  >
                    Belum Tersimpan
                  </span>
                  <span
                    v-else-if="row.statusDatabase === 'CONFLICT'"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                  >
                    Konflik
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  >
                    Tidak Memenuhi
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Attendance Fingerprint Sync Modal -->
    <AttendanceFingerprintSyncModal
      v-model="isSyncModalOpen"
      :snapshot-id="activeSnapshotId || undefined"
      :target-date="activePreviewDate"
      mode="CUSTOM"
      @sync-completed="handleSyncCompleted"
    />
  </div>
</template>
