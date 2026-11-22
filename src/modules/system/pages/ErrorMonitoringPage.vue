<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import AppPagination from '@/shared/components/navigation/AppPagination.vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppBadge from '@/shared/components/ui/AppBadge.vue'
import BugReportModal from '../components/BugReportModal.vue'
import {
  errorMonitoringService,
  type SystemErrorItem,
  type ErrorFilterQuery,
  type ErrorStatsDto
} from '../services/error-monitoring.service'
import { useToast } from '@/shared/composables/useToast'
import {
  Search,
  RefreshCw,
  Eye,
  AlertOctagon,
  Copy,
  Check,
  Server,
  Laptop,
  Bug,
  Code
} from 'lucide-vue-next'

const toast = useToast()

const errors = ref<SystemErrorItem[]>([])
const stats = ref<ErrorStatsDto>({
  total24h: 0,
  backendCount: 0,
  frontendCount: 0,
  status500Count: 0
})

const isLoading = ref(true)
const totalItems = ref(0)
const totalPages = ref(1)
const currentPage = ref(1)
const pageSize = ref(15)

// Filters
const search = ref('')
const selectedSource = ref<'BACKEND' | 'FRONTEND' | ''>('')
const startDate = ref('')
const endDate = ref('')

// Detail Modal
const isDetailModalOpen = ref(false)
const selectedError = ref<SystemErrorItem | null>(null)
const isCopied = ref(false)

// Report as Bug Modal
const isBugModalOpen = ref(false)
const prefilledErrorCode = ref('')

const sourceOptions = [
  { value: '', label: 'Semua Sumber (Backend & Frontend)' },
  { value: 'BACKEND', label: 'Backend Server' },
  { value: 'FRONTEND', label: 'Frontend Client' }
]

async function loadStats() {
  try {
    const res = await errorMonitoringService.getStats()
    stats.value = res
  } catch {
    // Ignore stats error if any
  }
}

async function loadData() {
  try {
    isLoading.value = true
    const filters: ErrorFilterQuery = {
      page: currentPage.value,
      pageSize: pageSize.value,
      search: search.value.trim() || undefined,
      source: selectedSource.value || undefined,
      startDate: startDate.value || undefined,
      endDate: endDate.value || undefined
    }

    const res = await errorMonitoringService.getAll(filters)
    errors.value = res.items
    totalItems.value = res.totalItems
    totalPages.value = res.totalPages
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Gagal memuat log error.')
  } finally {
    isLoading.value = false
  }
}

function handlePageChange(page: number) {
  currentPage.value = page
  loadData()
}

function handlePageSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
  loadData()
}

function resetFilters() {
  search.value = ''
  selectedSource.value = ''
  startDate.value = ''
  endDate.value = ''
  currentPage.value = 1
  loadData()
}

function viewDetail(errItem: SystemErrorItem) {
  selectedError.value = errItem
  isDetailModalOpen.value = true
  isCopied.value = false
}

function copyToClipboard(text: string) {
  if (!navigator?.clipboard) return
  navigator.clipboard.writeText(text).then(() => {
    isCopied.value = true
    toast.success('Disalin ke clipboard.')
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  })
}

function reportAsBug(errItem: SystemErrorItem) {
  prefilledErrorCode.value = errItem.error_code
  isBugModalOpen.value = true
}

function formatDate(iso: string): string {
  if (!iso) return '-'
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(d)
  } catch {
    return iso
  }
}

function getStatusBadgeVariant(status: number | null): 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  if (!status) return 'neutral'
  if (status >= 500) return 'danger'
  if (status >= 400) return 'warning'
  return 'info'
}

onMounted(() => {
  loadStats()
  loadData()
})

watch([selectedSource], () => {
  currentPage.value = 1
  loadData()
})
</script>

<template>
  <div class="space-y-4">
    <!-- Page Header -->
    <AppPageHeader
      title="Error Tracking & System Errors"
      description="Pemantauan kesalahan runtime aplikasi terpusat dari backend dan frontend dengan fingerprinting otomatis."
    >
      <template #actions>
        <AppButton
          variant="outline"
          size="sm"
          :loading="isLoading"
          @click="() => { loadStats(); loadData(); }"
        >
          <RefreshCw class="w-4 h-4 mr-1.5" />
          Refresh
        </AppButton>
      </template>
    </AppPageHeader>

    <!-- KPI Metric Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <!-- 24h Errors -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs flex items-center justify-between">
        <div>
          <span class="block text-xs text-slate-500 font-medium">Total Error (24 Jam)</span>
          <span class="text-xl font-bold text-slate-800 dark:text-slate-100 font-mono">{{ stats.total24h }}</span>
        </div>
        <div class="w-9 h-9 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
          <AlertOctagon class="w-5 h-5" />
        </div>
      </div>

      <!-- Backend 500s -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs flex items-center justify-between">
        <div>
          <span class="block text-xs text-slate-500 font-medium">Backend Errors</span>
          <span class="text-xl font-bold text-slate-800 dark:text-slate-100 font-mono">{{ stats.backendCount }}</span>
        </div>
        <div class="w-9 h-9 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
          <Server class="w-5 h-5" />
        </div>
      </div>

      <!-- Frontend Errors -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs flex items-center justify-between">
        <div>
          <span class="block text-xs text-slate-500 font-medium">Frontend Errors</span>
          <span class="text-xl font-bold text-slate-800 dark:text-slate-100 font-mono">{{ stats.frontendCount }}</span>
        </div>
        <div class="w-9 h-9 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
          <Laptop class="w-5 h-5" />
        </div>
      </div>

      <!-- Fatal 500s -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs flex items-center justify-between">
        <div>
          <span class="block text-xs text-slate-500 font-medium">HTTP 500 Internal</span>
          <span class="text-xl font-bold text-rose-600 font-mono">{{ stats.status500Count }}</span>
        </div>
        <div class="w-9 h-9 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 flex items-center justify-center">
          <Code class="w-5 h-5" />
        </div>
      </div>
    </div>

    <!-- Filter Card -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs space-y-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <!-- Search Input -->
        <div class="lg:col-span-2">
          <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Pencarian
          </label>
          <div class="relative">
            <AppInput
              v-model="search"
              placeholder="Cari kode error, pesan, endpoint, username..."
              @keyup.enter="loadData"
            />
            <Search class="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
          </div>
        </div>

        <!-- Source Select -->
        <div>
          <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Sumber Error
          </label>
          <AppSelect
            v-model="selectedSource"
            :options="sourceOptions"
          />
        </div>

        <!-- Date Range -->
        <div>
          <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Tanggal
          </label>
          <div class="flex items-center gap-1.5">
            <input
              v-model="startDate"
              type="date"
              class="w-full text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              @change="loadData"
            />
            <span class="text-slate-400">-</span>
            <input
              v-model="endDate"
              type="date"
              class="w-full text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              @change="loadData"
            />
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60">
        <span class="text-xs text-slate-500">
          Ditemukan <strong class="text-slate-800 dark:text-slate-200">{{ totalItems }}</strong> rekaman error
        </span>
        <div class="flex gap-2">
          <AppButton
            variant="ghost"
            size="sm"
            @click="resetFilters"
          >
            Reset Filter
          </AppButton>
          <AppButton
            variant="primary"
            size="sm"
            @click="loadData"
          >
            Terapkan
          </AppButton>
        </div>
      </div>
    </div>

    <!-- Error Table -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
            <tr>
              <th class="px-3.5 py-3 w-44">Kode Error</th>
              <th class="px-3.5 py-3 w-40">Waktu</th>
              <th class="px-3.5 py-3 w-28">Sumber</th>
              <th class="px-3.5 py-3 w-32">Status / Tipe</th>
              <th class="px-3.5 py-3">Pesan Kesalahan</th>
              <th class="px-3.5 py-3 w-48">Endpoint / Halaman</th>
              <th class="px-3.5 py-3 w-28">Pengguna</th>
              <th class="px-3.5 py-3 w-20 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-if="isLoading">
              <td colspan="8" class="text-center py-10 text-slate-500">
                <RefreshCw class="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                Memuat riwayat error sistem...
              </td>
            </tr>

            <tr v-else-if="errors.length === 0">
              <td colspan="8" class="text-center py-12 text-slate-500">
                <Check class="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                Bagus! Tidak ada error sistem yang ditemukan sesuai filter.
              </td>
            </tr>

            <tr
              v-for="errItem in errors"
              :key="errItem.id"
              class="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
            >
              <!-- Error Code -->
              <td class="px-3.5 py-2.5 font-mono text-[11px] font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                <div class="flex items-center gap-1.5">
                  <span>{{ errItem.error_code }}</span>
                  <button
                    type="button"
                    class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Salin Kode Error"
                    @click="copyToClipboard(errItem.error_code)"
                  >
                    <Copy class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>

              <!-- Timestamp -->
              <td class="px-3.5 py-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                {{ formatDate(errItem.occurred_at) }}
              </td>

              <!-- Source Badge -->
              <td class="px-3.5 py-2.5 whitespace-nowrap">
                <AppBadge :variant="errItem.source === 'BACKEND' ? 'primary' : 'warning'">
                  {{ errItem.source }}
                </AppBadge>
              </td>

              <!-- Status & Error Type -->
              <td class="px-3.5 py-2.5 whitespace-nowrap">
                <div class="flex items-center gap-1.5">
                  <AppBadge v-if="errItem.http_status" :variant="getStatusBadgeVariant(errItem.http_status)">
                    {{ errItem.http_status }}
                  </AppBadge>
                  <span class="text-slate-600 dark:text-slate-400 font-medium truncate max-w-[100px]" :title="errItem.error_type">
                    {{ errItem.error_type }}
                  </span>
                </div>
              </td>

              <!-- Message -->
              <td class="px-3.5 py-2.5 text-slate-700 dark:text-slate-300 max-w-sm truncate" :title="errItem.message">
                {{ errItem.message }}
              </td>

              <!-- Endpoint / Page -->
              <td class="px-3.5 py-2.5 font-mono text-[11px] text-slate-500 max-w-[180px] truncate" :title="errItem.endpoint || ''">
                <span v-if="errItem.http_method" class="font-bold text-slate-700 dark:text-slate-300 mr-1">
                  {{ errItem.http_method }}
                </span>
                {{ errItem.endpoint || '-' }}
              </td>

              <!-- User -->
              <td class="px-3.5 py-2.5 whitespace-nowrap text-slate-600 dark:text-slate-400">
                {{ errItem.username || 'Anonim' }}
              </td>

              <!-- Action -->
              <td class="px-3.5 py-2.5 text-center whitespace-nowrap">
                <div class="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    class="p-1.5 rounded-md text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors cursor-pointer"
                    title="Lihat Detail Stack Trace"
                    @click="viewDetail(errItem)"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    class="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Buat Laporan Bug dari Error Ini"
                    @click="reportAsBug(errItem)"
                  >
                    <Bug class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
        <AppPagination
          :current-page="currentPage"
          :total-pages="totalPages"
          :total-items="totalItems"
          :page-size="pageSize"
          @update:current-page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </div>
    </div>

    <!-- Error Detail Modal -->
    <AppModal
      v-model="isDetailModalOpen"
      title="Detail System Error"
      size="xl"
    >
      <div v-if="selectedError" class="space-y-4">
        <!-- Overview Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2.5 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/60 text-xs">
          <div>
            <span class="block text-[10px] uppercase font-semibold text-slate-400">Kode Error</span>
            <span class="font-mono font-bold text-rose-600 dark:text-rose-400 truncate block">{{ selectedError.error_code }}</span>
          </div>
          <div>
            <span class="block text-[10px] uppercase font-semibold text-slate-400">Waktu Terjadi</span>
            <span class="text-slate-700 dark:text-slate-300">{{ formatDate(selectedError.occurred_at) }}</span>
          </div>
          <div>
            <span class="block text-[10px] uppercase font-semibold text-slate-400">Sumber</span>
            <span class="font-semibold text-slate-800 dark:text-slate-200">{{ selectedError.source }} ({{ selectedError.error_type }})</span>
          </div>
          <div>
            <span class="block text-[10px] uppercase font-semibold text-slate-400">HTTP Status</span>
            <span class="font-bold text-slate-800 dark:text-slate-200">{{ selectedError.http_status || '-' }}</span>
          </div>
          <div class="md:col-span-2">
            <span class="block text-[10px] uppercase font-semibold text-slate-400">Endpoint / URL</span>
            <span class="font-mono text-slate-700 dark:text-slate-300 truncate block">
              {{ selectedError.http_method ? selectedError.http_method + ' ' : '' }}{{ selectedError.endpoint || '-' }}
            </span>
          </div>
          <div>
            <span class="block text-[10px] uppercase font-semibold text-slate-400">Pengguna</span>
            <span class="text-slate-700 dark:text-slate-300">{{ selectedError.username || 'Anonim' }}</span>
          </div>
          <div>
            <span class="block text-[10px] uppercase font-semibold text-slate-400">IP Address</span>
            <span class="font-mono text-slate-700 dark:text-slate-300">{{ selectedError.ip_address || '-' }}</span>
          </div>
          <div class="md:col-span-4">
            <span class="block text-[10px] uppercase font-semibold text-slate-400">Request ID</span>
            <span class="font-mono text-slate-700 dark:text-slate-300 truncate block">{{ selectedError.request_id || '-' }}</span>
          </div>
        </div>

        <!-- Error Message Block -->
        <div>
          <span class="block text-[11px] uppercase font-semibold text-slate-500 mb-1">Pesan Error Tersanitasi</span>
          <div class="p-3 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-lg text-xs font-mono text-rose-800 dark:text-rose-200 break-all">
            {{ selectedError.message }}
          </div>
        </div>

        <!-- Stack Trace Block -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[11px] uppercase font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Code class="w-3.5 h-3.5 text-teal-600" />
              Stack Trace (Aman dari Password / Token)
            </span>
            <AppButton
              variant="outline"
              size="sm"
              @click="copyToClipboard(selectedError.stack_trace || selectedError.message)"
            >
              <Copy class="w-3.5 h-3.5 mr-1" />
              Salin Trace
            </AppButton>
          </div>

          <pre class="text-[11px] font-mono bg-slate-950 text-slate-300 p-3.5 rounded-lg overflow-x-auto max-h-64 border border-slate-800 leading-relaxed">{{ selectedError.stack_trace || 'Tidak ada stack trace yang tersedia.' }}</pre>
        </div>

        <!-- Context JSON if available -->
        <div v-if="selectedError.context">
          <span class="block text-[11px] uppercase font-semibold text-slate-500 mb-1">Context Payload</span>
          <pre class="text-[11px] font-mono bg-slate-900 text-slate-200 p-3 rounded-lg overflow-x-auto max-h-36 border border-slate-800">{{ JSON.stringify(selectedError.context, null, 2) }}</pre>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between w-full">
          <AppButton
            variant="danger"
            size="sm"
            @click="() => { if (selectedError) { isDetailModalOpen = false; reportAsBug(selectedError); } }"
          >
            <Bug class="w-3.5 h-3.5 mr-1.5" />
            Laporkan sebagai Bug
          </AppButton>
          <AppButton
            variant="outline"
            @click="isDetailModalOpen = false"
          >
            Tutup
          </AppButton>
        </div>
      </template>
    </AppModal>

    <!-- Bug Report Modal Shortcut -->
    <BugReportModal
      v-model="isBugModalOpen"
      :initial-error-code="prefilledErrorCode"
    />
  </div>
</template>
