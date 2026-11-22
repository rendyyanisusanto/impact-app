<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppPagination from '@/shared/components/navigation/AppPagination.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import { groupService } from '../services/group.service'
import type { Group } from '../types/group.types'
import { usePermission } from '@/shared/composables/usePermission'
import { useToast } from '@/shared/composables/useToast'
import {
  Plus,
  Search,
  RefreshCw,
  Download,
  FileSpreadsheet,
  Printer,
  Upload,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  Users,
  Shield,
  AlertTriangle,
  Info
} from 'lucide-vue-next'

const router = useRouter()
const toast = useToast()
const { hasPermission } = usePermission()

// Permissions
const canCreate = computed(() => hasPermission('system:create') || hasPermission('system.groups:create'))
const canUpdate = computed(() => hasPermission('system:update') || hasPermission('system.groups:update'))
const canDelete = computed(() => hasPermission('system:delete') || hasPermission('system.groups:delete'))

// Data State
const groups = ref<Group[]>([])
const isLoading = ref(true)
const totalItems = ref(0)
const totalPages = ref(1)
const currentPage = ref(1)
const pageSize = ref(10)
const searchQuery = ref('')
const sortBy = ref<'id' | 'name' | 'description' | 'userCount'>('id')
const sortOrder = ref<'asc' | 'desc'>('desc') // data terbaru (ID terbesar) tampil paling atas

// Bulk Selection
const selectedIds = ref<number[]>([])

// Modals State
const isDeleteDialogOpen = ref(false)
const groupToDelete = ref<Group | null>(null)
const isDeleting = ref(false)

const isBulkDeleteDialogOpen = ref(false)
const isBulkDeleting = ref(false)

const isImportModalOpen = ref(false)
const isExportingExcel = ref(false)
const isExportingPdf = ref(false)

// Active Dropdown Action
const activeActionDropdownId = ref<number | null>(null)

function toggleActionDropdown(id: number, event: MouseEvent) {
  event.stopPropagation()
  activeActionDropdownId.value = activeActionDropdownId.value === id ? null : id
}

function closeDropdown() {
  activeActionDropdownId.value = null
}

async function loadData() {
  isLoading.value = true
  closeDropdown()
  try {
    const result = await groupService.getAll({
      search: searchQuery.value,
      page: currentPage.value,
      pageSize: pageSize.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    })
    groups.value = result.items
    totalItems.value = result.totalItems
    totalPages.value = result.totalPages
  } catch (err: unknown) {
    toast.error(err instanceof Error ? err.message : 'Gagal memuat data groups.')
  } finally {
    isLoading.value = false
  }
}

// Watch search with debounce
let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    loadData()
  }, 300)
})

watch([currentPage, pageSize], () => {
  loadData()
})

onMounted(() => {
  loadData()
})

// Bulk selection helpers
const isAllPageSelected = computed(() => {
  if (groups.value.length === 0) return false
  return groups.value.every((g) => selectedIds.value.includes(g.id))
})

const isIndeterminateSelection = computed(() => {
  const selectedOnPage = groups.value.filter((g) => selectedIds.value.includes(g.id)).length
  return selectedOnPage > 0 && selectedOnPage < groups.value.length
})

function toggleSelectAllPage() {
  if (isAllPageSelected.value) {
    const pageIds = new Set(groups.value.map((g) => g.id))
    selectedIds.value = selectedIds.value.filter((id) => !pageIds.has(id))
  } else {
    const combined = new Set([...selectedIds.value, ...groups.value.map((g) => g.id)])
    selectedIds.value = Array.from(combined)
  }
}

function toggleSelectItem(id: number) {
  const idx = selectedIds.value.indexOf(id)
  if (idx !== -1) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
}

// Navigation helpers
function handleCreate() {
  router.push('/system/groups/create')
}

function handleView(id: number) {
  closeDropdown()
  router.push(`/system/groups/${id}`)
}

function handleEdit(id: number) {
  closeDropdown()
  router.push(`/system/groups/${id}/edit`)
}

// Delete helpers
function openDeleteDialog(group: Group) {
  closeDropdown()
  groupToDelete.value = group
  isDeleteDialogOpen.value = true
}

async function confirmDelete() {
  if (!groupToDelete.value) return
  isDeleting.value = true
  try {
    const res = await groupService.delete(groupToDelete.value.id)
    toast.success(res.message || 'Data berhasil terhapus')
    isDeleteDialogOpen.value = false
    groupToDelete.value = null
    await loadData()
  } catch (err: unknown) {
    toast.error(err instanceof Error ? err.message : 'Gagal menghapus group.')
  } finally {
    isDeleting.value = false
  }
}

function openBulkDeleteDialog() {
  if (selectedIds.value.length === 0) return
  isBulkDeleteDialogOpen.value = true
}

async function confirmBulkDelete() {
  isBulkDeleting.value = true
  try {
    const res = await groupService.bulkDelete(selectedIds.value)
    if (res.errorGroups.length > 0) {
      toast.warning(res.message)
    } else {
      toast.success(res.message)
    }
    selectedIds.value = []
    isBulkDeleteDialogOpen.value = false
    await loadData()
  } catch (err: unknown) {
    toast.error(err instanceof Error ? err.message : 'Gagal menghapus group terpilih.')
  } finally {
    isBulkDeleting.value = false
  }
}

// Export helpers
async function handleExportExcel() {
  isExportingExcel.value = true
  try {
    await groupService.exportExcel({ search: searchQuery.value })
    toast.success('Laporan Excel berhasil diunduh.')
  } catch (err: unknown) {
    toast.error(err instanceof Error ? err.message : 'Gagal mengekspor Excel.')
  } finally {
    isExportingExcel.value = false
  }
}

async function handleExportPdf() {
  isExportingPdf.value = true
  try {
    await groupService.exportPdf({ search: searchQuery.value })
    toast.success('Laporan PDF berhasil diunduh.')
  } catch (err: unknown) {
    toast.error(err instanceof Error ? err.message : 'Gagal mengekspor PDF.')
  } finally {
    isExportingPdf.value = false
  }
}

function handlePrint() {
  window.print()
}
</script>

<template>
  <div class="space-y-6" @click="closeDropdown">
    <!-- Page Header -->
    <AppPageHeader
      title="Master Data Groups (Role Access)"
      subtitle="Kelola grup pengguna, hak akses menu CRUD, dan widget dashboard"
      :breadcrumbs="[
        { label: 'System Setting', to: '/system/groups' },
        { label: 'Master Data Groups (Role)' }
      ]"
    >
      <template #actions>
        <div class="flex items-center gap-2 flex-wrap">
          <AppButton
            variant="outline"
            size="sm"
            :is-loading="isExportingExcel"
            @click="handleExportExcel"
          >
            <FileSpreadsheet class="w-4 h-4 mr-1.5 text-emerald-600" />
            Export Excel
          </AppButton>

          <AppButton
            variant="outline"
            size="sm"
            :is-loading="isExportingPdf"
            @click="handleExportPdf"
          >
            <Download class="w-4 h-4 mr-1.5 text-red-600" />
            Export PDF
          </AppButton>

          <AppButton
            variant="outline"
            size="sm"
            @click="handlePrint"
          >
            <Printer class="w-4 h-4 mr-1.5 text-slate-600" />
            Print
          </AppButton>

          <AppButton
            variant="outline"
            size="sm"
            @click="isImportModalOpen = true"
          >
            <Upload class="w-4 h-4 mr-1.5 text-blue-600" />
            Import Data
          </AppButton>

          <AppButton
            v-if="canCreate"
            variant="primary"
            size="sm"
            @click="handleCreate"
          >
            <Plus class="w-4 h-4 mr-1.5" />
            Tambah Groups
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <!-- Main Card -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
      <!-- Toolbar -->
      <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <!-- Search bar -->
        <div class="relative w-full sm:w-80">
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari nama atau keterangan..."
            class="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <!-- Right actions -->
        <div class="flex items-center gap-2">
          <!-- Bulk Delete button -->
          <button
            v-if="selectedIds.length > 0 && canDelete"
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800 hover:bg-red-100 cursor-pointer"
            @click="openBulkDeleteDialog"
          >
            <Trash2 class="w-3.5 h-3.5" />
            <span>Hapus Terpilih ({{ selectedIds.length }})</span>
          </button>

          <!-- Refresh button -->
          <AppButton
            variant="outline"
            size="sm"
            :disabled="isLoading"
            @click="loadData"
          >
            <RefreshCw class="w-3.5 h-3.5 mr-1" :class="{ 'animate-spin': isLoading }" />
            Refresh
          </AppButton>
        </div>
      </div>

      <!-- Table Container -->
      <div class="overflow-x-auto">
        <table class="w-full text-xs text-left">
          <thead class="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700 select-none">
            <tr>
              <th class="w-12 px-4 py-3.5 text-center">
                <input
                  type="checkbox"
                  :checked="isAllPageSelected"
                  :indeterminate="isIndeterminateSelection"
                  class="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  aria-label="Pilih semua baris"
                  @change="toggleSelectAllPage"
                />
              </th>
              <th class="w-16 px-3 py-3.5 text-center">No</th>
              <th class="px-4 py-3.5">Nama Groups</th>
              <th class="px-4 py-3.5">Keterangan</th>
              <th class="w-32 px-4 py-3.5 text-center">Jumlah User</th>
              <th class="w-24 px-4 py-3.5 text-center">Aksi</th>
            </tr>
          </thead>

          <!-- Loading Skeleton -->
          <tbody v-if="isLoading" class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-for="n in 5" :key="n" class="animate-pulse">
              <td class="px-4 py-3 text-center"><div class="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded mx-auto"/></td>
              <td class="px-3 py-3 text-center"><div class="w-6 h-4 bg-slate-200 dark:bg-slate-700 rounded mx-auto"/></td>
              <td class="px-4 py-3"><div class="w-32 h-4 bg-slate-200 dark:bg-slate-700 rounded"/></td>
              <td class="px-4 py-3"><div class="w-48 h-4 bg-slate-200 dark:bg-slate-700 rounded"/></td>
              <td class="px-4 py-3 text-center"><div class="w-12 h-4 bg-slate-200 dark:bg-slate-700 rounded mx-auto"/></td>
              <td class="px-4 py-3 text-center"><div class="w-8 h-4 bg-slate-200 dark:bg-slate-700 rounded mx-auto"/></td>
            </tr>
          </tbody>

          <!-- Empty State -->
          <tbody v-else-if="groups.length === 0">
            <tr>
              <td colspan="6" class="py-12 text-center text-slate-500 dark:text-slate-400">
                <div class="flex flex-col items-center justify-center gap-2">
                  <Shield class="w-8 h-8 text-slate-300 dark:text-slate-600" />
                  <p class="font-medium">Tidak ada data groups yang ditemukan</p>
                  <p v-if="searchQuery" class="text-xs text-slate-400">
                    Coba sesuaikan kata kunci pencarian Anda.
                  </p>
                </div>
              </td>
            </tr>
          </tbody>

          <!-- Table Rows matching legacy screenshot -->
          <tbody v-else class="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            <tr
              v-for="(item, index) in groups"
              :key="item.id"
              :class="[
                'transition-colors',
                selectedIds.includes(item.id)
                  ? 'bg-teal-50/40 dark:bg-teal-950/20'
                  : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
              ]"
            >
              <!-- Checkbox -->
              <td class="px-4 py-3 text-center">
                <input
                  type="checkbox"
                  :checked="selectedIds.includes(item.id)"
                  class="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  :aria-label="`Pilih group ${item.name}`"
                  @change="toggleSelectItem(item.id)"
                />
              </td>

              <!-- No -->
              <td class="px-3 py-3 text-center text-slate-500 dark:text-slate-400">
                {{ (currentPage - 1) * pageSize + index + 1 }}
              </td>

              <!-- Nama Groups (Bold, Uppercase in legacy, clickable) -->
              <td class="px-4 py-3">
                <button
                  type="button"
                  class="font-bold uppercase text-slate-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer text-left"
                  @click="handleView(item.id)"
                >
                  {{ item.name.toUpperCase() }}
                </button>
                <div v-if="item.id === 1" class="mt-0.5">
                  <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-700 dark:text-teal-400">
                    <Shield class="w-3 h-3" /> System Role
                  </span>
                </div>
              </td>

              <!-- Keterangan -->
              <td class="px-4 py-3 text-slate-600 dark:text-slate-300">
                {{ item.description || '-' }}
              </td>

              <!-- Jumlah User -->
              <td class="px-4 py-3 text-center">
                <span
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  :class="
                    (item.userCount || 0) > 0
                      ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  "
                >
                  <Users class="w-3 h-3" />
                  {{ item.userCount || 0 }} User
                </span>
              </td>

              <!-- Actions Dropdown -->
              <td class="px-4 py-3 text-center relative">
                <div class="inline-block text-left">
                  <button
                    type="button"
                    class="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    aria-label="Menu Aksi"
                    @click="(e) => toggleActionDropdown(item.id, e)"
                  >
                    <MoreVertical class="w-4 h-4" />
                  </button>

                  <!-- Dropdown Menu -->
                  <div
                    v-if="activeActionDropdownId === item.id"
                    class="absolute right-4 mt-1 w-36 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 z-30 py-1 text-xs"
                    @click.stop
                  >
                    <button
                      type="button"
                      class="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2 cursor-pointer"
                      @click="handleView(item.id)"
                    >
                      <Eye class="w-3.5 h-3.5 text-blue-600" />
                      <span>Lihat</span>
                    </button>

                    <button
                      v-if="canUpdate"
                      type="button"
                      class="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2 cursor-pointer"
                      @click="handleEdit(item.id)"
                    >
                      <Edit2 class="w-3.5 h-3.5 text-amber-600" />
                      <span>Ubah</span>
                    </button>

                    <button
                      v-if="canDelete && item.id !== 1"
                      type="button"
                      class="w-full text-left px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 cursor-pointer"
                      @click="openDeleteDialog(item)"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="p-4 border-t border-slate-200 dark:border-slate-800">
        <AppPagination
          :current-page="currentPage"
          :total-pages="totalPages"
          :total-items="totalItems"
          :page-size="pageSize"
          @update:current-page="currentPage = $event"
          @update:page-size="pageSize = $event"
        />
      </div>
    </div>

    <!-- Single Delete Confirm Dialog -->
    <AppConfirmDialog
      :model-value="isDeleteDialogOpen"
      title="Hapus Groups (Role)"
      variant="danger"
      @confirm="confirmDelete"
      @cancel="isDeleteDialogOpen = false"
    >
      <div v-if="groupToDelete" class="space-y-3 text-sm">
        <p>
          Apakah Anda yakin ingin menghapus group <strong>{{ groupToDelete.name }}</strong>?
        </p>
        <div v-if="(groupToDelete.userCount || 0) > 0" class="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
          <AlertTriangle class="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Peringatan: Group ini masih memiliki <strong>{{ groupToDelete.userCount }} user</strong> yang terkait. Sesuai aturan sistem, group tidak dapat dihapus sebelum seluruh user dialihkan ke group lain.
          </span>
        </div>
        <p v-else class="text-xs text-slate-500">
          Tindakan ini akan menghapus konfigurasi hak akses submenu dan dashboard secara permanen.
        </p>
      </div>
    </AppConfirmDialog>

    <!-- Bulk Delete Confirm Dialog -->
    <AppConfirmDialog
      :model-value="isBulkDeleteDialogOpen"
      title="Hapus Banyak Groups"
      variant="danger"
      @confirm="confirmBulkDelete"
      @cancel="isBulkDeleteDialogOpen = false"
    >
      <div class="space-y-2 text-sm">
        <p>
          Apakah Anda yakin ingin menghapus <strong>{{ selectedIds.length }} group terpilih</strong>?
        </p>
        <p class="text-xs text-slate-500">
          Sistem akan secara otomatis memvalidasi apakah ada group yang masih memiliki user aktif atau merupakan role Superadmin.
        </p>
      </div>
    </AppConfirmDialog>

    <!-- Import Data Info Modal -->
    <AppModal
      :model-value="isImportModalOpen"
      title="Import Data Groups (Role Access)"
      size="md"
      @close="isImportModalOpen = false"
    >
      <div class="space-y-4 py-2 text-sm">
        <div class="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3 text-amber-800 dark:text-amber-200 text-xs">
          <Info class="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
          <div>
            <p class="font-semibold text-sm mb-1">Audit Format Template Import Legacy</p>
            <p>
              Berdasarkan audit teknis terhadap sistem legacy, import hak akses groups terdistribusi langsung melalui skema database relasional. Untuk menjamin keamanan otorisasi perusahaan, pembuatan dan perubahan konfigurasi permission direkomendasikan melalui form visual <strong>Tambah Groups</strong> untuk menghindari corrupt permission mapping.
            </p>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end">
          <AppButton variant="primary" @click="isImportModalOpen = false">
            Tutup
          </AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
