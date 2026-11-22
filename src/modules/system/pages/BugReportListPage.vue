<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import AppTextarea from '@/shared/components/ui/AppTextarea.vue'
import AppPagination from '@/shared/components/navigation/AppPagination.vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppBadge from '@/shared/components/ui/AppBadge.vue'
import BugReportModal from '../components/BugReportModal.vue'
import {
  bugReportService,
  type BugReportItem,
  type BugReportFilterQuery,
  type BugStatus,
  type BugPriority
} from '../services/bug-report.service'
import { useToast } from '@/shared/composables/useToast'
import {
  Search,
  RefreshCw,
  Plus,
  Eye,
  Bug,
  CheckCircle,
  Clock,
  AlertCircle,
  ImageIcon
} from 'lucide-vue-next'

const toast = useToast()

const reports = ref<BugReportItem[]>([])
const isLoading = ref(true)
const totalItems = ref(0)
const totalPages = ref(1)
const currentPage = ref(1)
const pageSize = ref(15)

// Filters
const search = ref('')
const selectedStatus = ref('')
const selectedPriority = ref('')

// Create Bug Modal
const isCreateModalOpen = ref(false)

// Detail & Edit Modal
const isDetailModalOpen = ref(false)
const selectedReport = ref<BugReportItem | null>(null)
const editStatus = ref<BugStatus>('OPEN')
const editPriority = ref<BugPriority>('MEDIUM')
const resolutionNote = ref('')
const isUpdating = ref(false)

// Image Lightbox
const activeImagePreview = ref<string | null>(null)

const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'OPEN', label: 'OPEN (Baru)' },
  { value: 'IN_PROGRESS', label: 'IN PROGRESS (Sedang Dikerjakan)' },
  { value: 'RESOLVED', label: 'RESOLVED (Selesai)' },
  { value: 'CLOSED', label: 'CLOSED (Ditutup)' },
  { value: 'REOPENED', label: 'REOPENED (Dibuka Kembali)' }
]

const priorityOptions = [
  { value: '', label: 'Semua Prioritas' },
  { value: 'LOW', label: 'LOW' },
  { value: 'MEDIUM', label: 'MEDIUM' },
  { value: 'HIGH', label: 'HIGH' },
  { value: 'CRITICAL', label: 'CRITICAL' }
]

const openCount = computed(() => reports.value.filter((r) => r.status === 'OPEN').length)
const inProgressCount = computed(() => reports.value.filter((r) => r.status === 'IN_PROGRESS').length)
const resolvedCount = computed(() => reports.value.filter((r) => r.status === 'RESOLVED' || r.status === 'CLOSED').length)

// Allowed transition rules
const transitionOptions = computed(() => {
  if (!selectedReport.value) return []
  const current = selectedReport.value.status
  const validMap: Record<BugStatus, { value: BugStatus; label: string }[]> = {
    OPEN: [
      { value: 'OPEN', label: 'OPEN' },
      { value: 'IN_PROGRESS', label: 'IN PROGRESS' },
      { value: 'RESOLVED', label: 'RESOLVED' },
      { value: 'CLOSED', label: 'CLOSED' }
    ],
    IN_PROGRESS: [
      { value: 'IN_PROGRESS', label: 'IN PROGRESS' },
      { value: 'OPEN', label: 'OPEN' },
      { value: 'RESOLVED', label: 'RESOLVED' },
      { value: 'CLOSED', label: 'CLOSED' }
    ],
    RESOLVED: [
      { value: 'RESOLVED', label: 'RESOLVED' },
      { value: 'CLOSED', label: 'CLOSED' },
      { value: 'REOPENED', label: 'REOPENED' }
    ],
    CLOSED: [
      { value: 'CLOSED', label: 'CLOSED' },
      { value: 'REOPENED', label: 'REOPENED' }
    ],
    REOPENED: [
      { value: 'REOPENED', label: 'REOPENED' },
      { value: 'IN_PROGRESS', label: 'IN PROGRESS' },
      { value: 'RESOLVED', label: 'RESOLVED' },
      { value: 'CLOSED', label: 'CLOSED' }
    ]
  }

  return validMap[current] || [{ value: current, label: current }]
})

async function loadData() {
  try {
    isLoading.value = true
    const filters: BugReportFilterQuery = {
      page: currentPage.value,
      pageSize: pageSize.value,
      search: search.value.trim() || undefined,
      status: selectedStatus.value || undefined,
      priority: selectedPriority.value || undefined
    }

    const res = await bugReportService.getAll(filters)
    reports.value = res.items
    totalItems.value = res.totalItems
    totalPages.value = res.totalPages
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Gagal memuat laporan bug.')
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
  selectedStatus.value = ''
  selectedPriority.value = ''
  currentPage.value = 1
  loadData()
}

async function viewDetail(item: BugReportItem) {
  selectedReport.value = item
  editStatus.value = item.status
  editPriority.value = item.priority
  resolutionNote.value = item.resolution_note || ''
  isDetailModalOpen.value = true

  try {
    const full = await bugReportService.getById(item.id)
    selectedReport.value = full
    editStatus.value = full.status
    editPriority.value = full.priority
    resolutionNote.value = full.resolution_note || ''
  } catch {
    // Keep basic
  }
}

async function handleUpdateStatus() {
  if (!selectedReport.value) return

  try {
    isUpdating.value = true
    const updated = await bugReportService.update(selectedReport.value.id, {
      status: editStatus.value,
      priority: editPriority.value,
      resolutionNote: resolutionNote.value.trim() || null
    })

    toast.success(`Laporan bug ${updated.report_code} berhasil diperbarui.`)
    selectedReport.value = updated
    isDetailModalOpen.value = false
    loadData()
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Gagal memperbarui laporan bug.')
  } finally {
    isUpdating.value = false
  }
}

function getPriorityBadgeVariant(priority: BugPriority): 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  switch (priority) {
    case 'CRITICAL':
      return 'danger'
    case 'HIGH':
      return 'warning'
    case 'MEDIUM':
      return 'info'
    case 'LOW':
    default:
      return 'neutral'
  }
}

function getStatusBadgeVariant(status: BugStatus): 'primary' | 'warning' | 'success' | 'danger' | 'info' | 'neutral' {
  switch (status) {
    case 'OPEN':
      return 'primary'
    case 'IN_PROGRESS':
      return 'warning'
    case 'RESOLVED':
      return 'success'
    case 'CLOSED':
      return 'neutral'
    case 'REOPENED':
      return 'danger'
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
      minute: '2-digit'
    }).format(d)
  } catch {
    return iso
  }
}

onMounted(() => {
  loadData()
})

watch([selectedStatus, selectedPriority], () => {
  currentPage.value = 1
  loadData()
})
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <AppPageHeader
      title="Pelaporan Masalah & Bug Reporting"
      description="Kelola seluruh tiket laporan kendala, bug aplikasi, dan status penanganan oleh tim teknis."
    >
      <template #actions>
        <div class="flex items-center gap-2">
          <AppButton
            variant="outline"
            size="sm"
            :loading="isLoading"
            @click="loadData"
          >
            <RefreshCw class="w-4 h-4 mr-1.5" />
            Refresh
          </AppButton>
          <AppButton
            variant="primary"
            size="sm"
            @click="isCreateModalOpen = true"
          >
            <Plus class="w-4 h-4 mr-1.5" />
            Buat Laporan Bug
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <!-- KPI Metric Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <!-- Total Reports -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs flex items-center justify-between">
        <div>
          <span class="block text-xs text-slate-500 font-medium">Total Laporan</span>
          <span class="text-xl font-bold text-slate-800 dark:text-slate-100 font-mono">{{ totalItems }}</span>
        </div>
        <div class="w-9 h-9 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
          <Bug class="w-5 h-5" />
        </div>
      </div>

      <!-- Open / Baru -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs flex items-center justify-between">
        <div>
          <span class="block text-xs text-slate-500 font-medium">Laporan Baru (Open)</span>
          <span class="text-xl font-bold text-teal-600 font-mono">{{ openCount }}</span>
        </div>
        <div class="w-9 h-9 rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center">
          <AlertCircle class="w-5 h-5" />
        </div>
      </div>

      <!-- In Progress -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs flex items-center justify-between">
        <div>
          <span class="block text-xs text-slate-500 font-medium">Sedang Dikerjakan</span>
          <span class="text-xl font-bold text-amber-600 font-mono">{{ inProgressCount }}</span>
        </div>
        <div class="w-9 h-9 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
          <Clock class="w-5 h-5" />
        </div>
      </div>

      <!-- Resolved -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs flex items-center justify-between">
        <div>
          <span class="block text-xs text-slate-500 font-medium">Selesai / Closed</span>
          <span class="text-xl font-bold text-emerald-600 font-mono">{{ resolvedCount }}</span>
        </div>
        <div class="w-9 h-9 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
          <CheckCircle class="w-5 h-5" />
        </div>
      </div>
    </div>

    <!-- Filter Toolbar -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs space-y-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <!-- Search -->
        <div class="lg:col-span-2">
          <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Pencarian
          </label>
          <div class="relative">
            <AppInput
              v-model="search"
              placeholder="Cari kode laporan, judul, deskripsi, pelapor..."
              @keyup.enter="loadData"
            />
            <Search class="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
          </div>
        </div>

        <!-- Status Filter -->
        <div>
          <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Status
          </label>
          <AppSelect
            v-model="selectedStatus"
            :options="statusOptions"
          />
        </div>

        <!-- Priority Filter -->
        <div>
          <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Prioritas
          </label>
          <AppSelect
            v-model="selectedPriority"
            :options="priorityOptions"
          />
        </div>
      </div>

      <div class="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60">
        <span class="text-xs text-slate-500">
          Ditemukan <strong class="text-slate-800 dark:text-slate-200">{{ totalItems }}</strong> laporan bug
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

    <!-- Bug Reports Table -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
            <tr>
              <th class="px-3.5 py-3 w-40">Kode Tiket</th>
              <th class="px-3.5 py-3">Judul Masalah</th>
              <th class="px-3.5 py-3 w-32">Modul</th>
              <th class="px-3.5 py-3 w-28 text-center">Prioritas</th>
              <th class="px-3.5 py-3 w-32 text-center">Status</th>
              <th class="px-3.5 py-3 w-32">Pelapor</th>
              <th class="px-3.5 py-3 w-36">Tanggal Lapor</th>
              <th class="px-3.5 py-3 w-20 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-if="isLoading">
              <td colspan="8" class="text-center py-10 text-slate-500">
                <RefreshCw class="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                Memuat daftar laporan bug...
              </td>
            </tr>

            <tr v-else-if="reports.length === 0">
              <td colspan="8" class="text-center py-12 text-slate-500">
                <CheckCircle class="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                Tidak ada laporan bug yang ditemukan sesuai filter.
              </td>
            </tr>

            <tr
              v-for="rep in reports"
              :key="rep.id"
              class="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
            >
              <!-- Ticket Code -->
              <td class="px-3.5 py-2.5 font-mono text-[11px] font-semibold text-teal-700 dark:text-teal-400 whitespace-nowrap">
                {{ rep.report_code }}
              </td>

              <!-- Title -->
              <td class="px-3.5 py-2.5 font-medium text-slate-800 dark:text-slate-200 max-w-sm truncate" :title="rep.title">
                {{ rep.title }}
              </td>

              <!-- Module -->
              <td class="px-3.5 py-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                {{ rep.module || '-' }}
              </td>

              <!-- Priority -->
              <td class="px-3.5 py-2.5 text-center whitespace-nowrap">
                <AppBadge :variant="getPriorityBadgeVariant(rep.priority)">
                  {{ rep.priority }}
                </AppBadge>
              </td>

              <!-- Status -->
              <td class="px-3.5 py-2.5 text-center whitespace-nowrap">
                <AppBadge :variant="getStatusBadgeVariant(rep.status)">
                  {{ rep.status }}
                </AppBadge>
              </td>

              <!-- Reporter -->
              <td class="px-3.5 py-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                {{ rep.reporter_username || 'Anonim' }}
              </td>

              <!-- Created At -->
              <td class="px-3.5 py-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                {{ formatDate(rep.created_at) }}
              </td>

              <!-- Action Button -->
              <td class="px-3.5 py-2.5 text-center whitespace-nowrap">
                <button
                  type="button"
                  class="p-1.5 rounded-md text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors cursor-pointer"
                  title="Tinjau & Tindaklanjuti Laporan Bug"
                  @click="viewDetail(rep)"
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

    <!-- Bug Detail & Transition Modal -->
    <AppModal
      v-model="isDetailModalOpen"
      :title="selectedReport ? `Detail Laporan: ${selectedReport.report_code}` : 'Detail Laporan Bug'"
      size="xl"
    >
      <div v-if="selectedReport" class="space-y-4">
        <!-- Overview Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2.5 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/60 text-xs">
          <div>
            <span class="block text-[10px] uppercase font-semibold text-slate-400">Kode Tiket</span>
            <span class="font-mono font-bold text-teal-700 dark:text-teal-400 truncate block">{{ selectedReport.report_code }}</span>
          </div>
          <div>
            <span class="block text-[10px] uppercase font-semibold text-slate-400">Tanggal Lapor</span>
            <span class="text-slate-700 dark:text-slate-300">{{ formatDate(selectedReport.created_at) }}</span>
          </div>
          <div>
            <span class="block text-[10px] uppercase font-semibold text-slate-400">Pelapor</span>
            <span class="font-semibold text-slate-800 dark:text-slate-200">{{ selectedReport.reporter_username || 'Anonim' }}</span>
          </div>
          <div>
            <span class="block text-[10px] uppercase font-semibold text-slate-400">Modul Terkait</span>
            <span class="font-medium text-slate-800 dark:text-slate-200">{{ selectedReport.module || '-' }}</span>
          </div>
          <div v-if="selectedReport.page_url" class="md:col-span-4">
            <span class="block text-[10px] uppercase font-semibold text-slate-400">URL Halaman Terkait</span>
            <span class="font-mono text-slate-700 dark:text-slate-300 truncate block">{{ selectedReport.page_url }}</span>
          </div>
        </div>

        <!-- Title & Description -->
        <div>
          <span class="block text-[11px] uppercase font-semibold text-slate-500 mb-1">Judul Masalah</span>
          <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {{ selectedReport.title }}
          </p>
        </div>

        <div>
          <span class="block text-[11px] uppercase font-semibold text-slate-500 mb-1">Deskripsi & Langkah Reproduksi</span>
          <div class="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {{ selectedReport.description }}
          </div>
        </div>

        <!-- Attachments Section -->
        <div v-if="selectedReport.attachments && selectedReport.attachments.length > 0">
          <span class="block text-[11px] uppercase font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
            <ImageIcon class="w-3.5 h-3.5 text-teal-600" />
            Tangkapan Layar Lampiran ({{ selectedReport.attachments.length }})
          </span>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div
              v-for="att in selectedReport.attachments"
              :key="att.id"
              class="border border-slate-200 dark:border-slate-700 rounded-lg p-2 bg-slate-50 dark:bg-slate-800 flex flex-col items-center group cursor-pointer hover:border-teal-500 transition-colors"
              @click="activeImagePreview = `/api/v1/bug-reports/${selectedReport.id}/attachments/${att.id}`"
            >
              <div class="w-full h-28 bg-slate-200 dark:bg-slate-700 rounded overflow-hidden flex items-center justify-center mb-1.5">
                <img
                  :src="`/api/v1/bug-reports/${selectedReport.id}/attachments/${att.id}`"
                  :alt="att.file_name"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <span class="text-[11px] text-slate-600 dark:text-slate-300 truncate w-full text-center font-medium">
                {{ att.file_name }}
              </span>
            </div>
          </div>
        </div>

        <!-- Admin Resolution Form -->
        <div class="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
          <span class="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Tindak Lanjut & Status Penyelesaian
          </span>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Ubah Status
              </label>
              <AppSelect
                v-model="editStatus"
                :options="transitionOptions"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Ubah Prioritas
              </label>
              <AppSelect
                v-model="editPriority"
                :options="[
                  { value: 'LOW', label: 'LOW' },
                  { value: 'MEDIUM', label: 'MEDIUM' },
                  { value: 'HIGH', label: 'HIGH' },
                  { value: 'CRITICAL', label: 'CRITICAL' }
                ]"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Catatan Resolusi / Perbaikan Teknis
            </label>
            <AppTextarea
              v-model="resolutionNote"
              :rows="3"
              placeholder="Catatan mengenai perbaikan yang dilakukan atau alasan penutupan tiket bug..."
            />
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between w-full">
          <AppButton
            variant="outline"
            @click="isDetailModalOpen = false"
          >
            Tutup
          </AppButton>
          <AppButton
            variant="primary"
            :loading="isUpdating"
            @click="handleUpdateStatus"
          >
            Simpan Perubahan
          </AppButton>
        </div>
      </template>
    </AppModal>

    <!-- Create Bug Report Modal -->
    <BugReportModal
      v-model="isCreateModalOpen"
      @submitted="loadData"
    />

    <!-- Lightbox Modal for Attachments -->
    <AppModal
      :model-value="!!activeImagePreview"
      title="Pratinjau Tangkapan Layar"
      size="xl"
      @update:model-value="activeImagePreview = null"
    >
      <div v-if="activeImagePreview" class="flex items-center justify-center max-h-[75vh] overflow-auto">
        <img
          :src="activeImagePreview"
          alt="Screenshot Preview"
          class="max-w-full max-h-[70vh] object-contain rounded border border-slate-200 dark:border-slate-800"
        />
      </div>
      <template #footer>
        <div class="flex justify-end">
          <AppButton
            variant="outline"
            @click="activeImagePreview = null"
          >
            Tutup
          </AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
