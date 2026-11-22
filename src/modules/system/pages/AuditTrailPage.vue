<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import AppPagination from '@/shared/components/navigation/AppPagination.vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppBadge from '@/shared/components/ui/AppBadge.vue'
import {
  auditTrailService,
  type AuditLog,
  type AuditFilterQuery
} from '../services/audit-trail.service'
import { useToast } from '@/shared/composables/useToast'
import {
  Search,
  RefreshCw,
  Eye,
  Activity,
  Layers
} from 'lucide-vue-next'

const toast = useToast()

const logs = ref<AuditLog[]>([])
const isLoading = ref(true)
const totalItems = ref(0)
const totalPages = ref(1)
const currentPage = ref(1)
const pageSize = ref(15)

// Filters
const search = ref('')
const selectedModule = ref('')
const selectedAction = ref('')
const startDate = ref('')
const endDate = ref('')

// Detail Modal
const isDetailModalOpen = ref(false)
const selectedLog = ref<AuditLog | null>(null)
const isLoadingDetail = ref(false)

const actionOptions = [
  { value: '', label: 'Semua Action' },
  { value: 'CREATE', label: 'CREATE' },
  { value: 'UPDATE', label: 'UPDATE' },
  { value: 'DELETE', label: 'DELETE' },
  { value: 'LOGIN', label: 'LOGIN' },
  { value: 'LOGIN_FAILED', label: 'LOGIN_FAILED' },
  { value: 'LOGOUT', label: 'LOGOUT' },
  { value: 'ACCESS_DENIED', label: 'ACCESS_DENIED' },
  { value: 'PASSWORD_RESET', label: 'PASSWORD_RESET' },
  { value: 'PERMISSION_CHANGED', label: 'PERMISSION_CHANGED' }
]

const moduleOptions = [
  { value: '', label: 'Semua Modul' },
  { value: 'auth', label: 'Autentikasi' },
  { value: 'security', label: 'Security & Akses' },
  { value: 'users', label: 'Users' },
  { value: 'groups', label: 'Groups' },
  { value: 'master-bank', label: 'Master Bank' },
  { value: 'master-gudang', label: 'Master Gudang' },
  { value: 'master-jabatan', label: 'Master Jabatan' },
  { value: 'master-status-karyawan', label: 'Master Status Karyawan' },
  { value: 'master-kategori-bahan', label: 'Master Kategori Bahan' },
  { value: 'master-kategori-barang', label: 'Master Kategori Produk' },
  { value: 'master-satuan-bahan', label: 'Master Satuan Bahan' },
  { value: 'master-satuan-produk', label: 'Master Satuan Produk' },
  { value: 'master-ppn', label: 'Master PPN' },
  { value: 'bug-reports', label: 'Bug Reports' }
]

async function loadData() {
  try {
    isLoading.value = true
    const filters: AuditFilterQuery = {
      page: currentPage.value,
      pageSize: pageSize.value,
      search: search.value.trim() || undefined,
      module: selectedModule.value || undefined,
      action: selectedAction.value || undefined,
      startDate: startDate.value || undefined,
      endDate: endDate.value || undefined
    }

    const res = await auditTrailService.getAll(filters)
    logs.value = res.items
    totalItems.value = res.totalItems
    totalPages.value = res.totalPages
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Gagal memuat log audit.')
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
  selectedModule.value = ''
  selectedAction.value = ''
  startDate.value = ''
  endDate.value = ''
  currentPage.value = 1
  loadData()
}

async function viewDetail(log: AuditLog) {
  isDetailModalOpen.value = true
  selectedLog.value = log
  try {
    isLoadingDetail.value = true
    const full = await auditTrailService.getById(log.id)
    selectedLog.value = full
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Gagal memuat detail log.')
  } finally {
    isLoadingDetail.value = false
  }
}

function getActionBadgeVariant(action: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  switch (action) {
    case 'CREATE':
      return 'success'
    case 'UPDATE':
      return 'info'
    case 'DELETE':
      return 'danger'
    case 'LOGIN':
      return 'primary'
    case 'LOGIN_FAILED':
    case 'ACCESS_DENIED':
      return 'danger'
    case 'LOGOUT':
      return 'neutral'
    case 'PERMISSION_CHANGED':
    case 'PASSWORD_RESET':
      return 'warning'
    default:
      return 'neutral'
  }
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

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return 'null'
  if (typeof v === 'object') return JSON.stringify(v, null, 2)
  return String(v)
}

onMounted(() => {
  loadData()
})

watch([selectedModule, selectedAction], () => {
  currentPage.value = 1
  loadData()
})
</script>

<template>
  <div class="space-y-4">
    <!-- Page Header -->
    <AppPageHeader
      title="Audit Trail & Data Changes"
      description="Rekam jejak seluruh aktivitas user, mutasi data (sebelum & sesudah), dan peristiwa keamanan sistem."
    >
      <template #actions>
        <AppButton
          variant="outline"
          size="sm"
          :loading="isLoading"
          @click="loadData"
        >
          <RefreshCw class="w-4 h-4 mr-1.5" />
          Refresh
        </AppButton>
      </template>
    </AppPageHeader>

    <!-- Filter Card -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs space-y-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <!-- Search Input -->
        <div class="lg:col-span-2">
          <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Pencarian
          </label>
          <div class="relative">
            <AppInput
              v-model="search"
              placeholder="Cari deskripsi, username, record ID, IP..."
              @keyup.enter="loadData"
            />
            <Search class="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
          </div>
        </div>

        <!-- Module Select -->
        <div>
          <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Modul
          </label>
          <AppSelect
            v-model="selectedModule"
            :options="moduleOptions"
          />
        </div>

        <!-- Action Select -->
        <div>
          <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Aksi
          </label>
          <AppSelect
            v-model="selectedAction"
            :options="actionOptions"
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
          Ditemukan <strong class="text-slate-800 dark:text-slate-200">{{ totalItems }}</strong> aktivitas
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

    <!-- Audit Logs Table -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
            <tr>
              <th class="px-3.5 py-3 w-40">Waktu</th>
              <th class="px-3.5 py-3 w-36">Pengguna</th>
              <th class="px-3.5 py-3 w-32">Modul</th>
              <th class="px-3.5 py-3 w-28">Aksi</th>
              <th class="px-3.5 py-3">Deskripsi Aktivitas</th>
              <th class="px-3.5 py-3 w-32">Tabel / ID</th>
              <th class="px-3.5 py-3 w-28">IP Address</th>
              <th class="px-3.5 py-3 w-16 text-center">Detail</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-if="isLoading">
              <td colspan="8" class="text-center py-10 text-slate-500">
                <RefreshCw class="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                Memuat riwayat audit trail...
              </td>
            </tr>

            <tr v-else-if="logs.length === 0">
              <td colspan="8" class="text-center py-12 text-slate-500">
                <Activity class="w-8 h-8 mx-auto mb-2 text-slate-400" />
                Tidak ada log aktivitas yang cocok dengan kriteria filter.
              </td>
            </tr>

            <tr
              v-for="log in logs"
              :key="log.id"
              class="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
            >
              <!-- Timestamp -->
              <td class="px-3.5 py-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                {{ formatDate(log.created_at) }}
              </td>

              <!-- User -->
              <td class="px-3.5 py-2.5 whitespace-nowrap">
                <span class="font-medium text-slate-800 dark:text-slate-200">
                  {{ log.username || 'System' }}
                </span>
              </td>

              <!-- Module -->
              <td class="px-3.5 py-2.5 whitespace-nowrap text-slate-600 dark:text-slate-400">
                <span class="inline-flex items-center gap-1">
                  <Layers class="w-3 h-3 text-slate-400" />
                  {{ log.module }}
                </span>
              </td>

              <!-- Action Badge -->
              <td class="px-3.5 py-2.5 whitespace-nowrap">
                <AppBadge :variant="getActionBadgeVariant(log.action)">
                  {{ log.action }}
                </AppBadge>
              </td>

              <!-- Description -->
              <td class="px-3.5 py-2.5 text-slate-700 dark:text-slate-300 max-w-xs truncate" :title="log.description || ''">
                {{ log.description || '-' }}
              </td>

              <!-- Table & Record ID -->
              <td class="px-3.5 py-2.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                <span v-if="log.table_name">{{ log.table_name }}#{{ log.record_id || '*' }}</span>
                <span v-else>-</span>
              </td>

              <!-- IP Address -->
              <td class="px-3.5 py-2.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                {{ log.ip_address || '-' }}
              </td>

              <!-- Action Button -->
              <td class="px-3.5 py-2.5 text-center whitespace-nowrap">
                <button
                  type="button"
                  class="p-1.5 rounded-md text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors cursor-pointer"
                  title="Lihat Detail Mutasi Data"
                  @click="viewDetail(log)"
                >
                  <Eye class="w-4 h-4" />
                </button>
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

    <!-- Detail & Diff Modal -->
    <AppModal
      v-model="isDetailModalOpen"
      title="Detail Audit Log & Perubahan Data"
      size="xl"
    >
      <div v-if="selectedLog" class="space-y-4">
        <!-- Event Summary Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2.5 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/60 text-xs">
          <div>
            <span class="block text-[10px] uppercase font-semibold text-slate-400">Event ID</span>
            <span class="font-mono text-slate-700 dark:text-slate-300 truncate block">{{ selectedLog.event_id }}</span>
          </div>
          <div>
            <span class="block text-[10px] uppercase font-semibold text-slate-400">Waktu</span>
            <span class="text-slate-700 dark:text-slate-300">{{ formatDate(selectedLog.created_at) }}</span>
          </div>
          <div>
            <span class="block text-[10px] uppercase font-semibold text-slate-400">Pengguna</span>
            <span class="font-semibold text-slate-800 dark:text-slate-200">{{ selectedLog.username || 'System' }}</span>
          </div>
          <div>
            <span class="block text-[10px] uppercase font-semibold text-slate-400">Aksi & Modul</span>
            <span class="font-medium text-slate-800 dark:text-slate-200">{{ selectedLog.action }} ({{ selectedLog.module }})</span>
          </div>
          <div>
            <span class="block text-[10px] uppercase font-semibold text-slate-400">Tabel Terkait</span>
            <span class="font-mono text-slate-700 dark:text-slate-300">{{ selectedLog.table_name || '-' }} (ID: {{ selectedLog.record_id || '-' }})</span>
          </div>
          <div>
            <span class="block text-[10px] uppercase font-semibold text-slate-400">IP Address</span>
            <span class="font-mono text-slate-700 dark:text-slate-300">{{ selectedLog.ip_address || '-' }}</span>
          </div>
          <div class="md:col-span-2">
            <span class="block text-[10px] uppercase font-semibold text-slate-400">Request ID</span>
            <span class="font-mono text-slate-700 dark:text-slate-300 truncate block">{{ selectedLog.request_id || '-' }}</span>
          </div>
        </div>

        <div>
          <span class="block text-[11px] uppercase font-semibold text-slate-500 mb-1">Deskripsi</span>
          <p class="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2.5 rounded border border-slate-200 dark:border-slate-700">
            {{ selectedLog.description || '-' }}
          </p>
        </div>

        <!-- Data Changes Diff Section -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[11px] uppercase font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Activity class="w-3.5 h-3.5 text-teal-600" />
              Perbandingan Data (Field Changes Diff)
            </span>
            <span class="text-[11px] text-slate-400">
              {{ (selectedLog.changes || []).length }} field berubah
            </span>
          </div>

          <div v-if="isLoadingDetail" class="text-center py-6 text-slate-500 text-xs">
            <RefreshCw class="w-4 h-4 animate-spin mx-auto mb-1" />
            Mengambil rekaman perubahan data...
          </div>

          <div
            v-else-if="!selectedLog.changes || selectedLog.changes.length === 0"
            class="text-center py-6 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-700 text-xs text-slate-500"
          >
            Tidak ada rekaman mutasi field spesifik untuk event ini.
          </div>

          <div v-else class="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <table class="w-full text-xs text-left">
              <thead class="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[10px]">
                <tr>
                  <th class="px-3 py-2 w-1/4">Nama Field</th>
                  <th class="px-3 py-2 w-3/8 text-rose-600 dark:text-rose-400">Nilai Sebelum (Old)</th>
                  <th class="px-3 py-2 w-3/8 text-emerald-600 dark:text-emerald-400">Nilai Sesudah (New)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                <tr
                  v-for="ch in selectedLog.changes"
                  :key="ch.id || ch.field_name"
                  class="hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                >
                  <td class="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">
                    {{ ch.field_name }}
                  </td>
                  <td class="px-3 py-2 bg-rose-50/40 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 break-all">
                    {{ formatValue(ch.old_value) }}
                  </td>
                  <td class="px-3 py-2 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 break-all">
                    {{ formatValue(ch.new_value) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Metadata JSON if present -->
        <div v-if="selectedLog.metadata">
          <span class="block text-[11px] uppercase font-semibold text-slate-500 mb-1">Metadata Tambahan</span>
          <pre class="text-[11px] font-mono bg-slate-900 text-slate-200 p-3 rounded-lg overflow-x-auto max-h-40">{{ JSON.stringify(selectedLog.metadata, null, 2) }}</pre>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <AppButton
            variant="outline"
            @click="isDetailModalOpen = false"
          >
            Tutup
          </AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
