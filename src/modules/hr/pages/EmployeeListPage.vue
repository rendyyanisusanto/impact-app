<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppPagination from '@/shared/components/navigation/AppPagination.vue'
import AppTableSkeleton from '@/shared/components/data/AppTableSkeleton.vue'
import AppTableEmptyState from '@/shared/components/data/AppTableEmptyState.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import AppExportActions from '@/shared/components/import-export/AppExportActions.vue'
import EmployeeFilters from '../components/EmployeeFilters.vue'
import EmployeeStatusBadge from '../components/EmployeeStatusBadge.vue'
import EmployeeImportModal from '../components/EmployeeImportModal.vue'
import { employeeService } from '../services/employee.service'
import type { Employee, EmployeeFilterQuery } from '../types/employee.types'
import { usePermission } from '@/shared/composables/usePermission'
import { exportToExcel } from '@/shared/utils/excel-export'
import { exportToPdf } from '@/shared/utils/pdf-export'
import type { ExportColumn } from '@/shared/types/crud.types'
import { Users, Plus, RefreshCw, Upload, Eye, Edit2, Trash2, Power } from 'lucide-vue-next'

const router = useRouter()
const { hasPermission } = usePermission()

// Permissions
const canCreate = computed(() => hasPermission('hr:create') || hasPermission('hr.employees:create'))
const canUpdate = computed(() => hasPermission('hr:update') || hasPermission('hr.employees:update'))
const canDelete = computed(() => hasPermission('hr:delete') || hasPermission('hr.employees:delete'))

// Data State
const employees = ref<Employee[]>([])
const isLoading = ref(true)
const totalItems = ref(0)
const totalPages = ref(1)
const currentPage = ref(1)
const pageSize = ref(10)

// Filters State
const searchQuery = ref('')
const jabatanFilter = ref<number | 'all'>('all')
const statusKaryawanFilter = ref<number | 'all'>('all')
const grupFilter = ref<number | 'all'>('all')
const statusAktifFilter = ref<number | 'all' | string>('all')

// Sorting State
const sortBy = ref('id')
const sortOrder = ref<'asc' | 'desc'>('asc')

// Selection State
const selectedEmployeeIds = ref<number[]>([])

// Modals State
const isImportModalOpen = ref(false)
const isExportingExcel = ref(false)
const isExportingPdf = ref(false)

// Confirmation Dialogs
const showStatusConfirm = ref(false)
const showDeleteConfirm = ref(false)
const selectedEmployee = ref<Employee | null>(null)

// Load Data
async function loadData() {
  isLoading.value = true
  try {
    const query: EmployeeFilterQuery = {
      page: currentPage.value,
      pageSize: pageSize.value,
      search: searchQuery.value,
      jabatan_id: jabatanFilter.value,
      status_karyawan_id: statusKaryawanFilter.value,
      grup_karyawan_id: grupFilter.value,
      status: statusAktifFilter.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    }
    const response = await employeeService.list(query)
    employees.value = response.data
    totalItems.value = response.total
    totalPages.value = response.totalPages
  } catch (err) {
    console.error('Failed to load employee list:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

// Filter & Pagination Handlers
function handleSearch(val: string) {
  searchQuery.value = val
  currentPage.value = 1
  loadData()
}

function handleJabatanChange(val: number | 'all') {
  jabatanFilter.value = val
  currentPage.value = 1
  loadData()
}

function handleStatusKaryawanChange(val: number | 'all') {
  statusKaryawanFilter.value = val
  currentPage.value = 1
  loadData()
}

function handleGrupChange(val: number | 'all') {
  grupFilter.value = val
  currentPage.value = 1
  loadData()
}

function handleStatusAktifChange(val: number | 'all' | string) {
  statusAktifFilter.value = val
  currentPage.value = 1
  loadData()
}

function handleResetFilters() {
  searchQuery.value = ''
  jabatanFilter.value = 'all'
  statusKaryawanFilter.value = 'all'
  grupFilter.value = 'all'
  statusAktifFilter.value = 'all'
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
  return employees.value.length > 0 && selectedEmployeeIds.value.length === employees.value.length
})

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedEmployeeIds.value = []
  } else {
    selectedEmployeeIds.value = employees.value.map(e => e.id)
  }
}

function toggleSelect(id: number) {
  const index = selectedEmployeeIds.value.indexOf(id)
  if (index > -1) {
    selectedEmployeeIds.value.splice(index, 1)
  } else {
    selectedEmployeeIds.value.push(id)
  }
}

// Actions
function handleCreate() {
  router.push('/hr/employees/create')
}

function handleView(id: number) {
  router.push(`/hr/employees/${id}`)
}

function handleEdit(id: number) {
  router.push(`/hr/employees/${id}/edit`)
}

function promptToggleStatus(emp: Employee) {
  selectedEmployee.value = emp
  showStatusConfirm.value = true
}

async function confirmToggleStatus() {
  if (!selectedEmployee.value) return
  try {
    await employeeService.toggleStatus(selectedEmployee.value.id)
    showStatusConfirm.value = false
    selectedEmployee.value = null
    await loadData()
  } catch (err) {
    console.error('Failed to toggle status:', err)
  }
}

function promptDelete(emp: Employee) {
  selectedEmployee.value = emp
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (!selectedEmployee.value) return
  try {
    await employeeService.delete(selectedEmployee.value.id)
    showDeleteConfirm.value = false
    selectedEmployee.value = null
    await loadData()
  } catch (err) {
    console.error('Failed to delete employee:', err)
  }
}

// Exports
const exportColumns: ExportColumn<Employee>[] = [
  { key: 'kode', label: 'Kode' },
  { key: 'uid_fingerprint', label: 'UID Fingerprint' },
  { key: 'nik', label: 'NIK' },
  { key: 'nama', label: 'Nama Lengkap' },
  { key: 'jk', label: 'Jenis Kelamin' },
  { key: 'no_hp', label: 'No. HP' },
  { key: 'email', label: 'Email' },
  { key: 'alamat', label: 'Alamat' },
  { key: 'tanggal_masuk', label: 'Tanggal Masuk' },
  { key: 'jabatan_nama', label: 'Jabatan' },
  { key: 'grup_karyawan_nama', label: 'Grup' },
  { key: 'status_karyawan_nama', label: 'Status Karyawan' },
  {
    key: 'status',
    label: 'Status Aktif',
    formatter: val => (Number(val) === 1 ? 'Aktif' : 'Nonaktif')
  }
]

async function handleExportExcel() {
  isExportingExcel.value = true
  try {
    const data = await employeeService.exportAll({
      search: searchQuery.value,
      jabatan_id: jabatanFilter.value,
      status_karyawan_id: statusKaryawanFilter.value,
      grup_karyawan_id: grupFilter.value,
      status: statusAktifFilter.value
    })

    exportToExcel<Employee>({
      filename: `master-data-karyawan-${new Date().toISOString().substring(0, 10)}`,
      title: 'Master Data Karyawan',
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
    const data = await employeeService.exportAll({
      search: searchQuery.value,
      jabatan_id: jabatanFilter.value,
      status_karyawan_id: statusKaryawanFilter.value,
      grup_karyawan_id: grupFilter.value,
      status: statusAktifFilter.value
    })

    exportToPdf<Employee>({
      filename: `master-data-karyawan-${new Date().toISOString().substring(0, 10)}`,
      title: 'Laporan Master Data Karyawan',
      subtitle: 'Daftar Karyawan, Nomor Fingerprint, Jabatan, dan Regu Kerja',
      orientation: 'landscape',
      columns: exportColumns,
      data
    })
  } finally {
    isExportingPdf.value = false
  }
}

function handleImportSuccess() {
  isImportModalOpen.value = false
  currentPage.value = 1
  loadData()
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <AppPageHeader
      title="Master Data Karyawan"
      subtitle="Kelola master data personalia, nomor biometrik fingerprint, jabatan, dan penugasan grup karyawan."
    >
      <template #icon>
        <Users class="w-6 h-6 text-primary" />
      </template>
      <template #actions>
        <div class="flex items-center gap-2">
          <!-- Tambah Karyawan -->
          <AppButton
            v-if="canCreate"
            variant="primary"
            size="sm"
            class="flex items-center gap-1.5"
            @click="handleCreate"
          >
            <Plus class="w-4 h-4" /> Tambah Karyawan
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <!-- Toolbar: Export/Import/Refresh -->
    <div
      class="flex flex-wrap items-center justify-between gap-3 mb-4 bg-surface rounded-lg border border-border p-3 shadow-sm"
    >
      <div class="flex items-center gap-2">
        <AppButton
          v-if="canCreate"
          variant="outline"
          size="sm"
          class="flex items-center gap-1.5 text-xs"
          @click="isImportModalOpen = true"
        >
          <Upload class="w-3.5 h-3.5" /> Import Excel
        </AppButton>
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

    <!-- Filter Bar -->
    <EmployeeFilters
      :search-query="searchQuery"
      :jabatan-filter="jabatanFilter"
      :status-karyawan-filter="statusKaryawanFilter"
      :grup-filter="grupFilter"
      :status-aktif-filter="statusAktifFilter"
      @update:search-query="handleSearch"
      @update:jabatan-filter="handleJabatanChange"
      @update:status-karyawan-filter="handleStatusKaryawanChange"
      @update:grup-filter="handleGrupChange"
      @update:status-aktif-filter="handleStatusAktifChange"
      @reset="handleResetFilters"
    />

    <!-- DataTable Container -->
    <div class="bg-surface rounded-lg border border-border shadow-sm overflow-hidden mb-4">
      <!-- Loading Skeleton -->
      <div v-if="isLoading" class="p-4">
        <AppTableSkeleton :rows="5" :columns="11" />
      </div>

      <!-- Empty State -->
      <div v-else-if="employees.length === 0" class="p-8">
        <AppTableEmptyState
          title="Tidak Ada Data Karyawan"
          description="Tidak ditemukan data karyawan yang sesuai dengan kata kunci pencarian atau filter yang dipilih."
        />
      </div>

      <!-- Data Table -->
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
              <th class="px-3 py-3">UID FP</th>
              <th class="px-3 py-3">NIK</th>
              <th class="px-3 py-3">Nama Karyawan</th>
              <th class="px-3 py-3">JK</th>
              <th class="px-3 py-3">No. HP</th>
              <th class="px-3 py-3">Jabatan</th>
              <th class="px-3 py-3">Grup</th>
              <th class="px-3 py-3">St. Karyawan</th>
              <th class="px-3 py-3 text-center">Status</th>
              <th class="px-3 py-3 text-center w-28">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr
              v-for="(emp, index) in employees"
              :key="emp.id"
              class="hover:bg-slate-50/70 transition-colors"
              :class="{ 'bg-emerald-50/30': selectedEmployeeIds.includes(emp.id) }"
            >
              <td class="px-3 py-2.5 text-center">
                <input
                  type="checkbox"
                  class="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                  :checked="selectedEmployeeIds.includes(emp.id)"
                  @change="toggleSelect(emp.id)"
                />
              </td>
              <td class="px-3 py-2.5 text-center text-secondary-text">
                {{ (currentPage - 1) * pageSize + index + 1 }}
              </td>
              <td class="px-3 py-2.5 font-medium text-text">
                {{ emp.kode || '-' }}
              </td>
              <td class="px-3 py-2.5 font-mono text-slate-700">
                <span
                  class="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px] font-semibold border border-slate-200"
                >
                  {{ emp.uid_fingerprint ?? '-' }}
                </span>
              </td>
              <td class="px-3 py-2.5 text-secondary-text">
                {{ emp.nik || '-' }}
              </td>
              <td class="px-3 py-2.5 font-semibold text-text">
                <button
                  type="button"
                  class="hover:text-primary hover:underline transition-colors text-left font-semibold"
                  @click="handleView(emp.id)"
                >
                  {{ emp.nama }}
                </button>
              </td>
              <td class="px-3 py-2.5 text-secondary-text">
                {{ emp.jk === 'Laki-Laki' ? 'L' : emp.jk === 'Perempuan' ? 'P' : '-' }}
              </td>
              <td class="px-3 py-2.5 text-secondary-text">
                {{ emp.no_hp || '-' }}
              </td>
              <td class="px-3 py-2.5">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border"
                  :style="{
                    backgroundColor: `${emp.jabatan_color}15`,
                    borderColor: `${emp.jabatan_color}40`,
                    color: emp.jabatan_color || '#1e293b'
                  }"
                >
                  {{ emp.jabatan_nama }}
                </span>
              </td>
              <td class="px-3 py-2.5 text-text">
                <span
                  v-if="emp.grup_karyawan_nama && emp.grup_karyawan_nama !== 'Tanpa Grup'"
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-200"
                >
                  {{ emp.grup_karyawan_nama }}
                </span>
                <span v-else class="text-secondary-text text-[11px] italic"> Tanpa Grup </span>
              </td>
              <td class="px-3 py-2.5">
                <EmployeeStatusBadge
                  type="employment"
                  :label="emp.status_karyawan_nama"
                  :color="emp.status_karyawan_color"
                />
              </td>
              <td class="px-3 py-2.5 text-center">
                <EmployeeStatusBadge type="active" :status="emp.status" />
              </td>
              <td class="px-3 py-2.5 text-center">
                <div class="inline-flex items-center gap-1">
                  <!-- Lihat Detail -->
                  <button
                    type="button"
                    class="p-1 text-slate-500 hover:text-primary hover:bg-slate-100 rounded transition-colors"
                    title="Lihat Detail"
                    @click="handleView(emp.id)"
                  >
                    <Eye class="w-4 h-4" />
                  </button>

                  <!-- Ubah -->
                  <button
                    v-if="canUpdate"
                    type="button"
                    class="p-1 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded transition-colors"
                    title="Ubah Karyawan"
                    @click="handleEdit(emp.id)"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>

                  <!-- Aktif / Nonaktifkan -->
                  <button
                    v-if="canUpdate"
                    type="button"
                    class="p-1 text-slate-500 rounded transition-colors"
                    :class="
                      emp.status === 1
                        ? 'hover:text-rose-600 hover:bg-rose-50'
                        : 'hover:text-emerald-600 hover:bg-emerald-50'
                    "
                    :title="emp.status === 1 ? 'Nonaktifkan Karyawan' : 'Aktifkan Karyawan'"
                    @click="promptToggleStatus(emp)"
                  >
                    <Power class="w-4 h-4" />
                  </button>

                  <!-- Hapus -->
                  <button
                    v-if="canDelete"
                    type="button"
                    class="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                    title="Hapus Karyawan"
                    @click="promptDelete(emp)"
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

    <!-- Toggle Status Confirm Dialog -->
    <AppConfirmDialog
      v-model="showStatusConfirm"
      :title="selectedEmployee?.status === 1 ? 'Nonaktifkan Karyawan?' : 'Aktifkan Karyawan?'"
      :message="
        selectedEmployee?.status === 1
          ? `Apakah Anda yakin ingin menonaktifkan karyawan '${selectedEmployee?.nama}'? Karyawan yang dinonaktifkan tidak akan disertakan pada penugasan transaksi baru.`
          : `Apakah Anda yakin ingin mengaktifkan kembali karyawan '${selectedEmployee?.nama}'?`
      "
      :confirm-text="selectedEmployee?.status === 1 ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'"
      :confirm-variant="selectedEmployee?.status === 1 ? 'danger' : 'primary'"
      @confirm="confirmToggleStatus"
    />

    <!-- Delete Confirm Dialog -->
    <AppConfirmDialog
      v-model="showDeleteConfirm"
      title="Hapus Data Karyawan?"
      :message="`Apakah Anda yakin ingin menghapus data karyawan '${selectedEmployee?.nama}'? Tindakan ini tidak dapat dibatalkan.`"
      confirm-text="Ya, Hapus Data"
      cancel-text="Batal"
      confirm-variant="danger"
      @confirm="confirmDelete"
    />

    <!-- Import Excel Modal -->
    <EmployeeImportModal v-model="isImportModalOpen" @imported="handleImportSuccess" />
  </div>
</template>
