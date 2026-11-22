<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import AppPagination from '@/shared/components/navigation/AppPagination.vue'
import AppTableSkeleton from '@/shared/components/data/AppTableSkeleton.vue'
import AppTableEmptyState from '@/shared/components/data/AppTableEmptyState.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import AppExportActions from '@/shared/components/import-export/AppExportActions.vue'
import EmployeeStatusBadge from '../components/EmployeeStatusBadge.vue'
import EmployeeGroupFormModal from '../components/EmployeeGroupFormModal.vue'
import { employeeGroupService } from '../services/employee-group.service'
import type { EmployeeGroup, EmployeeGroupFilterQuery } from '../types/employee-group.types'
import { usePermission } from '@/shared/composables/usePermission'
import { exportToExcel } from '@/shared/utils/excel-export'
import { exportToPdf } from '@/shared/utils/pdf-export'
import type { ExportColumn } from '@/shared/types/crud.types'
import {
  Users2,
  Plus,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  Power,
  UserCheck,
  RotateCcw
} from 'lucide-vue-next'

const router = useRouter()
const { hasPermission } = usePermission()

// Permissions
const canCreate = computed(
  () => hasPermission('hr:create') || hasPermission('hr.employee-groups:create')
)
const canUpdate = computed(
  () => hasPermission('hr:update') || hasPermission('hr.employee-groups:update')
)
const canDelete = computed(
  () => hasPermission('hr:delete') || hasPermission('hr.employee-groups:delete')
)

// Data State
const groups = ref<EmployeeGroup[]>([])
const isLoading = ref(true)
const totalItems = ref(0)
const totalPages = ref(1)
const currentPage = ref(1)
const pageSize = ref(10)

// Filters State
const searchQuery = ref('')
const statusFilter = ref<number | 'all' | string>('all')
const sortBy = ref('id')
const sortOrder = ref<'asc' | 'desc'>('asc')

// Selection State
const selectedGroupIds = ref<number[]>([])

// Modal States
const isCreateModalOpen = ref(false)
const isEditModalOpen = ref(false)
const selectedGroup = ref<EmployeeGroup | null>(null)
const showStatusConfirm = ref(false)
const showDeleteConfirm = ref(false)
const deleteErrorMessage = ref<string | null>(null)

// Exports
const isExportingExcel = ref(false)
const isExportingPdf = ref(false)

const statusOptions = [
  { value: 'all', label: 'Semua Status' },
  { value: '1', label: 'Aktif' },
  { value: '0', label: 'Nonaktif' }
]

async function loadData() {
  isLoading.value = true
  deleteErrorMessage.value = null
  try {
    const query: EmployeeGroupFilterQuery = {
      page: currentPage.value,
      pageSize: pageSize.value,
      search: searchQuery.value,
      status_aktif: statusFilter.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    }
    const response = await employeeGroupService.list(query)
    groups.value = response.data
    totalItems.value = response.total
    totalPages.value = response.totalPages
  } catch (err) {
    console.error('Failed to load employee groups:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

function handleSearch(val: string) {
  searchQuery.value = val
  currentPage.value = 1
  loadData()
}

function handleStatusFilter(val: string) {
  statusFilter.value = val
  currentPage.value = 1
  loadData()
}

function handleReset() {
  searchQuery.value = ''
  statusFilter.value = 'all'
  currentPage.value = 1
  loadData()
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

// Bulk Selection
const isAllSelected = computed(() => {
  return groups.value.length > 0 && selectedGroupIds.value.length === groups.value.length
})

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedGroupIds.value = []
  } else {
    selectedGroupIds.value = groups.value.map(g => g.id)
  }
}

function toggleSelect(id: number) {
  const index = selectedGroupIds.value.indexOf(id)
  if (index > -1) {
    selectedGroupIds.value.splice(index, 1)
  } else {
    selectedGroupIds.value.push(id)
  }
}

// Navigation Actions
function handleCreate() {
  selectedGroup.value = null
  isCreateModalOpen.value = true
}

function handleEdit(group: EmployeeGroup) {
  selectedGroup.value = group
  isEditModalOpen.value = true
}

function handleView(id: number) {
  router.push(`/hr/employee-groups/${id}`)
}

function handleManageMembers(id: number) {
  router.push(`/hr/employee-groups/${id}/members`)
}

function promptToggleStatus(group: EmployeeGroup) {
  selectedGroup.value = group
  showStatusConfirm.value = true
}

async function confirmToggleStatus() {
  if (!selectedGroup.value) return
  try {
    await employeeGroupService.toggleStatus(selectedGroup.value.id)
    showStatusConfirm.value = false
    selectedGroup.value = null
    await loadData()
  } catch (err) {
    console.error('Failed to toggle group status:', err)
  }
}

function promptDelete(group: EmployeeGroup) {
  selectedGroup.value = group
  deleteErrorMessage.value = null
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (!selectedGroup.value) return
  try {
    await employeeGroupService.delete(selectedGroup.value.id)
    showDeleteConfirm.value = false
    selectedGroup.value = null
    await loadData()
  } catch (err: unknown) {
    deleteErrorMessage.value = err instanceof Error ? err.message : 'Gagal menghapus grup'
  }
}

// Export Setup
const exportColumns: ExportColumn<EmployeeGroup>[] = [
  { key: 'kode', label: 'Kode Grup' },
  { key: 'nama', label: 'Nama Grup Karyawan' },
  { key: 'member_count', label: 'Jumlah Anggota' },
  {
    key: 'status_aktif',
    label: 'Status',
    formatter: val => (Number(val) === 1 ? 'Aktif' : 'Nonaktif')
  }
]

async function handleExportExcel() {
  isExportingExcel.value = true
  try {
    const data = await employeeGroupService.exportAll({
      search: searchQuery.value,
      status_aktif: statusFilter.value
    })

    exportToExcel<EmployeeGroup>({
      filename: `master-data-grup-karyawan-${new Date().toISOString().substring(0, 10)}`,
      title: 'Master Data Grup Karyawan',
      columns: exportColumns,
      data
    })
  } finally {
    isExportingExcel.value = false
  }
}

async function handleExportPdf() {
  isExportingPdf.value = true
  try {
    const data = await employeeGroupService.exportAll({
      search: searchQuery.value,
      status_aktif: statusFilter.value
    })

    exportToPdf<EmployeeGroup>({
      filename: `master-data-grup-karyawan-${new Date().toISOString().substring(0, 10)}`,
      title: 'Laporan Master Data Grup Karyawan',
      subtitle: 'Daftar Regu Kerja, Penugasan Karyawan, dan Status Aktif',
      orientation: 'portrait',
      columns: exportColumns,
      data
    })
  } finally {
    isExportingPdf.value = false
  }
}

function handleSavedSuccess() {
  loadData()
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <AppPageHeader
      title="Master Data Grup Karyawan"
      subtitle="Kelola regu kerja operasional, pengelompokan driver/produksi, dan penugasan jadwal karyawan."
    >
      <template #icon>
        <Users2 class="w-6 h-6 text-primary" />
      </template>
      <template #actions>
        <AppButton
          v-if="canCreate"
          variant="primary"
          size="sm"
          class="flex items-center gap-1.5"
          @click="handleCreate"
        >
          <Plus class="w-4 h-4" /> Tambah Grup
        </AppButton>
      </template>
    </AppPageHeader>

    <!-- Error Alert if delete rejected -->
    <div
      v-if="deleteErrorMessage"
      class="mb-4 bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700"
    >
      {{ deleteErrorMessage }}
    </div>

    <!-- Toolbar: Export & Refresh -->
    <div
      class="flex flex-wrap items-center justify-between gap-3 mb-4 bg-surface rounded-lg border border-border p-3 shadow-sm"
    >
      <div class="flex items-center gap-2">
        <AppExportActions
          :is-exporting-excel="isExportingExcel"
          :is-exporting-pdf="isExportingPdf"
          @export-excel="handleExportExcel"
          @export-pdf="handleExportPdf"
        />
      </div>

      <div class="flex items-center gap-2">
        <AppButton
          variant="ghost"
          size="sm"
          class="flex items-center gap-1.5 text-xs text-secondary-text hover:text-primary"
          @click="loadData"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading }" /> Muat Ulang
        </AppButton>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="bg-surface rounded-lg border border-border p-3.5 shadow-sm mb-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div>
          <label
            class="block text-xs font-semibold text-secondary-text mb-1 uppercase tracking-wider"
          >
            Pencarian
          </label>
          <AppInput
            :model-value="searchQuery"
            placeholder="Cari kode atau nama grup..."
            class="w-full text-xs"
            @update:model-value="val => handleSearch(String(val))"
          />
        </div>

        <div>
          <label
            class="block text-xs font-semibold text-secondary-text mb-1 uppercase tracking-wider"
          >
            Status
          </label>
          <AppSelect
            :model-value="String(statusFilter)"
            :options="statusOptions"
            class="w-full text-xs"
            @update:model-value="val => handleStatusFilter(String(val))"
          />
        </div>

        <div class="flex items-center gap-2">
          <AppButton
            variant="ghost"
            size="sm"
            class="h-9 px-3 text-xs text-secondary-text hover:text-primary flex items-center gap-1"
            @click="handleReset"
          >
            <RotateCcw class="w-3.5 h-3.5" /> Reset Filter
          </AppButton>
        </div>
      </div>
    </div>

    <!-- DataTable Container -->
    <div class="bg-surface rounded-lg border border-border shadow-sm overflow-hidden mb-4">
      <div v-if="isLoading" class="p-4">
        <AppTableSkeleton :rows="5" :columns="6" />
      </div>

      <div v-else-if="groups.length === 0" class="p-8">
        <AppTableEmptyState
          title="Tidak Ada Data Grup Karyawan"
          description="Belum ada grup karyawan yang sesuai dengan kriteria pencarian."
        />
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr
              class="bg-slate-50 border-b border-border text-secondary-text font-semibold uppercase tracking-wider text-[11px]"
            >
              <th class="w-8 px-3 py-3 text-center">
                <input
                  type="checkbox"
                  class="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                  :checked="isAllSelected"
                  @change="toggleSelectAll"
                />
              </th>
              <th class="px-3 py-3 w-10 text-center">No.</th>
              <th class="px-3 py-3">Kode</th>
              <th class="px-3 py-3">Nama Grup</th>
              <th class="px-3 py-3 text-center">Warna Identifikasi</th>
              <th class="px-3 py-3 text-center">Jumlah Anggota</th>
              <th class="px-3 py-3 text-center">Status</th>
              <th class="px-3 py-3 text-center w-36">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr
              v-for="(grp, index) in groups"
              :key="grp.id"
              class="hover:bg-slate-50/70 transition-colors"
              :class="{ 'bg-emerald-50/30': selectedGroupIds.includes(grp.id) }"
            >
              <td class="px-3 py-2.5 text-center">
                <input
                  type="checkbox"
                  class="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                  :checked="selectedGroupIds.includes(grp.id)"
                  @change="toggleSelect(grp.id)"
                />
              </td>
              <td class="px-3 py-2.5 text-center text-secondary-text">
                {{ (currentPage - 1) * pageSize + index + 1 }}
              </td>
              <td class="px-3 py-2.5 font-mono text-secondary-text font-medium">
                {{ grp.kode || '-' }}
              </td>
              <td class="px-3 py-2.5 font-semibold text-text">
                <button
                  type="button"
                  class="hover:text-primary hover:underline text-left font-semibold"
                  @click="handleView(grp.id)"
                >
                  {{ grp.nama }}
                </button>
              </td>
              <td class="px-3 py-2.5 text-center">
                <span
                  class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-border text-[11px] font-mono"
                >
                  <span
                    class="w-3 h-3 rounded-full border border-black/10"
                    :style="{ backgroundColor: grp.color || '#0F766E' }"
                  />
                  {{ grp.color || '-' }}
                </span>
              </td>
              <td class="px-3 py-2.5 text-center">
                <button
                  type="button"
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition-colors"
                  title="Lihat daftar anggota"
                  @click="handleManageMembers(grp.id)"
                >
                  <Users2 class="w-3.5 h-3.5" /> {{ grp.member_count ?? 0 }} orang
                </button>
              </td>
              <td class="px-3 py-2.5 text-center">
                <EmployeeStatusBadge type="active" :status="grp.status_aktif" />
              </td>
              <td class="px-3 py-2.5 text-center">
                <div class="inline-flex items-center gap-1">
                  <!-- Detail -->
                  <button
                    type="button"
                    class="p-1 text-slate-500 hover:text-primary hover:bg-slate-100 rounded transition-colors"
                    title="Lihat Detail Grup"
                    @click="handleView(grp.id)"
                  >
                    <Eye class="w-4 h-4" />
                  </button>

                  <!-- Ubah -->
                  <button
                    v-if="canUpdate"
                    type="button"
                    class="p-1 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded transition-colors"
                    title="Ubah Grup"
                    @click="handleEdit(grp)"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>

                  <!-- Kelola Anggota -->
                  <button
                    type="button"
                    class="p-1 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors"
                    title="Kelola Anggota Grup"
                    @click="handleManageMembers(grp.id)"
                  >
                    <UserCheck class="w-4 h-4" />
                  </button>

                  <!-- Aktif / Nonaktifkan -->
                  <button
                    v-if="canUpdate"
                    type="button"
                    class="p-1 text-slate-500 rounded transition-colors"
                    :class="
                      grp.status_aktif === 1
                        ? 'hover:text-rose-600 hover:bg-rose-50'
                        : 'hover:text-emerald-600 hover:bg-emerald-50'
                    "
                    :title="grp.status_aktif === 1 ? 'Nonaktifkan Grup' : 'Aktifkan Grup'"
                    @click="promptToggleStatus(grp)"
                  >
                    <Power class="w-4 h-4" />
                  </button>

                  <!-- Hapus -->
                  <button
                    v-if="canDelete"
                    type="button"
                    class="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                    title="Hapus Grup"
                    @click="promptDelete(grp)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalItems > 0" class="border-t border-border p-3 bg-surface">
        <AppPagination
          :current-page="currentPage"
          :total-items="totalItems"
          :page-size="pageSize"
          @update:current-page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </div>
    </div>

    <!-- Create / Edit Form Modal -->
    <EmployeeGroupFormModal
      v-model="isCreateModalOpen"
      mode="create"
      @success="handleSavedSuccess"
    />

    <EmployeeGroupFormModal
      v-model="isEditModalOpen"
      mode="edit"
      :initial-data="selectedGroup"
      @success="handleSavedSuccess"
    />

    <!-- Toggle Status Confirm -->
    <AppConfirmDialog
      v-model="showStatusConfirm"
      :title="selectedGroup?.status_aktif === 1 ? 'Nonaktifkan Grup?' : 'Aktifkan Grup?'"
      :message="
        selectedGroup?.status_aktif === 1
          ? `Apakah Anda yakin ingin menonaktifkan grup '${selectedGroup?.nama}'?`
          : `Apakah Anda yakin ingin mengaktifkan kembali grup '${selectedGroup?.nama}'?`
      "
      :confirm-text="selectedGroup?.status_aktif === 1 ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'"
      :confirm-variant="selectedGroup?.status_aktif === 1 ? 'danger' : 'primary'"
      @confirm="confirmToggleStatus"
    />

    <!-- Delete Confirm -->
    <AppConfirmDialog
      v-model="showDeleteConfirm"
      title="Hapus Grup Karyawan?"
      :message="`Apakah Anda yakin ingin menghapus grup '${selectedGroup?.nama}'? Catatan: Jika grup masih memiliki anggota karyawan, penghapusan akan dicegah demi integritas data.`"
      confirm-text="Ya, Hapus Grup"
      cancel-text="Batal"
      confirm-variant="danger"
      @confirm="confirmDelete"
    />
  </div>
</template>
