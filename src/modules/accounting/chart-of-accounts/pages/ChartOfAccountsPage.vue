<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { coaService } from '../services/coa.service'
import type {
  CoaGroup,
  CoaParent,
  CoaAccount,
  CoaTreeNodeGroup,
  CoaTreeNodeAccount,
  CoaKpiSummary,
  SaldoNormal
} from '../types/coa.types'
import {
  exportCoaTableToExcel,
  exportCoaTreeToExcel,
  exportCoaToPdfFormat
} from '../utils/coa-export'
import { useToast } from '@/shared/composables/useToast'
import { usePermission } from '@/shared/composables/usePermission'

// Components
import CoaKpiCards from '../components/CoaKpiCards.vue'
import CoaTreeView from '../components/CoaTreeView.vue'
import CoaTableView from '../components/CoaTableView.vue'
import CoaAccountModal from '../components/CoaAccountModal.vue'
import CoaGroupModal from '../components/CoaGroupModal.vue'
import CoaParentModal from '../components/CoaParentModal.vue'
import CoaDetailDrawer from '../components/CoaDetailDrawer.vue'
import CoaDeleteConfirmModal from '../components/CoaDeleteConfirmModal.vue'
import CoaImportModal from '../components/CoaImportModal.vue'

// Icons
import {
  Plus,
  Search,
  FileSpreadsheet,
  FileText,
  Upload,
  RefreshCw,
  FolderTree,
  Table as TableIcon,
  ChevronDown,
  Layers,
  FolderPlus
} from 'lucide-vue-next'

const toast = useToast()
const { hasPermission, currentUser } = usePermission()

const canCreate = computed(() => {
  return (
    hasPermission('accounting.chart-of-accounts', 'create') ||
    hasPermission('finance.chart-of-accounts', 'create') ||
    currentUser.value?.role === 'superadmin' ||
    currentUser.value?.roleName?.toLowerCase().includes('admin')
  )
})

const canUpdate = computed(() => {
  return (
    hasPermission('accounting.chart-of-accounts', 'update') ||
    hasPermission('finance.chart-of-accounts', 'update') ||
    currentUser.value?.role === 'superadmin' ||
    currentUser.value?.roleName?.toLowerCase().includes('admin')
  )
})

const canDelete = computed(() => {
  return (
    hasPermission('accounting.chart-of-accounts', 'delete') ||
    hasPermission('finance.chart-of-accounts', 'delete') ||
    currentUser.value?.role === 'superadmin' ||
    currentUser.value?.roleName?.toLowerCase().includes('admin')
  )
})

// View Mode: 'tree' | 'table' (Hierarki as default)
const activeView = ref<'tree' | 'table'>('tree')

// Master Data State
const kpi = ref<CoaKpiSummary | null>(null)
const treeData = ref<CoaTreeNodeGroup[]>([])
const tableAccounts = ref<CoaAccount[]>([])
const groups = ref<CoaGroup[]>([])
const parents = ref<CoaParent[]>([])

// Loading states
const isLoadingKpi = ref(false)
const isLoadingData = ref(false)
const isSubmitting = ref(false)

// Table Pagination & Sorting
const totalItems = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const totalPages = ref(1)
const sortBy = ref('no_ref')
const sortOrder = ref<'ASC' | 'DESC'>('ASC')

// Filter State
const filters = reactive({
  search: '',
  coa_id: 'all' as number | string,
  saldo_normal: 'all' as 'D' | 'K' | 'all' | string,
  status: 'all' as 'active' | 'inactive' | 'all' | string,
  is_used: 'all' as 'used' | 'unused' | 'all' | string
})

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

function onSearchInput() {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    currentPage.value = 1
    loadData()
  }, 350)
}

function onFilterChange() {
  currentPage.value = 1
  loadData()
}

function resetFilters() {
  filters.search = ''
  filters.coa_id = 'all'
  filters.saldo_normal = 'all'
  filters.status = 'all'
  filters.is_used = 'all'
  currentPage.value = 1
  loadData()
}

// Modals State
const isAccountModalOpen = ref(false)
const isAccountEdit = ref(false)
const selectedAccount = ref<CoaAccount | null>(null)
const initialParentId = ref<number | undefined>(undefined)
const initialCoaId = ref<number | undefined>(undefined)

const isGroupModalOpen = ref(false)
const isGroupEdit = ref(false)
const selectedGroup = ref<CoaGroup | null>(null)

const isParentModalOpen = ref(false)
const isParentEdit = ref(false)
const selectedParent = ref<CoaParent | null>(null)

const isDetailDrawerOpen = ref(false)
const detailAccount = ref<CoaAccount | null>(null)

const isDeleteModalOpen = ref(false)
const deleteTargetAccount = ref<CoaAccount | CoaTreeNodeAccount | null>(null)

const isImportModalOpen = ref(false)

// Dropdown Add Button state
const isAddDropdownOpen = ref(false)

// Fetch KPI
async function loadKpi() {
  isLoadingKpi.value = true
  try {
    kpi.value = await coaService.getKpi()
  } catch (err: any) {
    console.error('Failed to load COA KPI:', err)
  } finally {
    isLoadingKpi.value = false
  }
}

// Fetch Groups and Parents for Select options
async function loadReferences() {
  try {
    const [gList, pList] = await Promise.all([
      coaService.getGroups(),
      coaService.getParents()
    ])
    groups.value = gList
    parents.value = pList
  } catch (err: any) {
    console.error('Failed to load COA references:', err)
  }
}

// Fetch main data (tree or table)
async function loadData() {
  isLoadingData.value = true
  try {
    if (activeView.value === 'tree') {
      treeData.value = await coaService.getTree({
        search: filters.search,
        coa_id: filters.coa_id,
        saldo_normal: filters.saldo_normal,
        status: filters.status,
        is_used: filters.is_used
      })
    } else {
      const res = await coaService.getAccounts({
        search: filters.search,
        coa_id: filters.coa_id,
        saldo_normal: filters.saldo_normal,
        status: filters.status,
        is_used: filters.is_used,
        page: currentPage.value,
        limit: pageSize.value,
        sortBy: sortBy.value,
        sortOrder: sortOrder.value
      })
      tableAccounts.value = res.data
      totalItems.value = res.total
      totalPages.value = res.totalPages
    }
  } catch (err: any) {
    toast.error(err.message || 'Gagal memuat data Chart of Account')
  } finally {
    isLoadingData.value = false
  }
}

function handleSwitchView(mode: 'tree' | 'table') {
  activeView.value = mode
  loadData()
}

// Sort in Table View
function handleSort(field: string) {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'ASC' ? 'DESC' : 'ASC'
  } else {
    sortBy.value = field
    sortOrder.value = 'ASC'
  }
  loadData()
}

// Pagination
function handlePageChange(p: number) {
  currentPage.value = p
  loadData()
}

function handlePageSizeChange(s: number) {
  pageSize.value = s
  currentPage.value = 1
  loadData()
}

// =======================
// Modal Action Handlers
// =======================

// 1. Account CRUD
function openCreateAccountModal(parentId?: number, coaId?: number) {
  isAccountEdit.value = false
  selectedAccount.value = null
  initialParentId.value = parentId
  initialCoaId.value = coaId
  isAccountModalOpen.value = true
  isAddDropdownOpen.value = false
}

async function openEditAccountModal(accountId: number) {
  try {
    const acct = await coaService.getAccountById(accountId)
    selectedAccount.value = acct
    isAccountEdit.value = true
    isAccountModalOpen.value = true
  } catch (err: any) {
    toast.error(err.message || 'Gagal mengambil data rekening')
  }
}

async function handleAccountSubmit(form: {
  no_ref: string
  nama: string
  indukakun_id: number
  saldo_normal: SaldoNormal
  is_active: number
}) {
  isSubmitting.value = true
  try {
    if (isAccountEdit.value && selectedAccount.value) {
      await coaService.updateAccount(selectedAccount.value.id, form)
      toast.success(`Rekening [${form.no_ref}] ${form.nama} berhasil diperbarui`)
    } else {
      await coaService.createAccount(form)
      toast.success(`Rekening [${form.no_ref}] ${form.nama} berhasil ditambahkan`)
    }
    isAccountModalOpen.value = false
    await Promise.all([loadKpi(), loadReferences(), loadData()])
  } catch (err: any) {
    toast.error(err.message || 'Gagal menyimpan rekening akuntansi')
  } finally {
    isSubmitting.value = false
  }
}

// 2. Group CRUD
function openCreateGroupModal() {
  isGroupEdit.value = false
  selectedGroup.value = null
  isGroupModalOpen.value = true
  isAddDropdownOpen.value = false
}

function openEditGroupModal(groupId: number) {
  const g = groups.value.find(item => item.id === groupId)
  if (g) {
    selectedGroup.value = g
    isGroupEdit.value = true
    isGroupModalOpen.value = true
  }
}

async function handleGroupSubmit(form: { name: string; is_active?: number }) {
  isSubmitting.value = true
  try {
    if (isGroupEdit.value && selectedGroup.value) {
      await coaService.updateGroup(selectedGroup.value.id, form)
      toast.success(`Kelompok akun "${form.name}" berhasil diperbarui`)
    } else {
      await coaService.createGroup(form)
      toast.success(`Kelompok akun "${form.name}" berhasil dibuat`)
    }
    isGroupModalOpen.value = false
    await Promise.all([loadKpi(), loadReferences(), loadData()])
  } catch (err: any) {
    toast.error(err.message || 'Gagal menyimpan kelompok akun')
  } finally {
    isSubmitting.value = false
  }
}

// 3. Parent CRUD
function openCreateParentModal() {
  isParentEdit.value = false
  selectedParent.value = null
  isParentModalOpen.value = true
  isAddDropdownOpen.value = false
}

function openEditParentModal(parentId: number) {
  const p = parents.value.find(item => item.id === parentId)
  if (p) {
    selectedParent.value = p
    isParentEdit.value = true
    isParentModalOpen.value = true
  }
}

async function handleParentSubmit(form: {
  coa_id: number
  no_akun: number
  nama: string
  is_active?: number
}) {
  isSubmitting.value = true
  try {
    if (isParentEdit.value && selectedParent.value) {
      await coaService.updateParent(selectedParent.value.id, form)
      toast.success(`Induk akun [${form.no_akun}] ${form.nama} berhasil diperbarui`)
    } else {
      await coaService.createParent(form)
      toast.success(`Induk akun [${form.no_akun}] ${form.nama} berhasil dibuat`)
    }
    isParentModalOpen.value = false
    await Promise.all([loadKpi(), loadReferences(), loadData()])
  } catch (err: any) {
    toast.error(err.message || 'Gagal menyimpan induk akun')
  } finally {
    isSubmitting.value = false
  }
}

// 4. View Detail
async function handleViewDetail(accountId: number) {
  try {
    const acct = await coaService.getAccountById(accountId)
    detailAccount.value = acct
    isDetailDrawerOpen.value = true
  } catch (err: any) {
    toast.error(err.message || 'Gagal mengambil detail rekening')
  }
}

// 5. Toggle Status
async function handleToggleStatus(acct: CoaAccount | CoaTreeNodeAccount) {
  const targetActive = acct.is_active === 1 ? 0 : 1
  try {
    await coaService.toggleAccountStatus(acct.id, targetActive)
    const msg = targetActive === 1 ? 'Rekening diaktifkan' : 'Rekening dinonaktifkan'
    toast.success(`${msg}: [${acct.no_ref}] ${acct.nama}`)
    await Promise.all([loadKpi(), loadData()])
  } catch (err: any) {
    toast.error(err.message || 'Gagal mengubah status rekening')
  }
}

// 6. Delete
function handleDeleteRequest(acct: CoaAccount | CoaTreeNodeAccount) {
  deleteTargetAccount.value = acct
  isDeleteModalOpen.value = true
}

async function handleConfirmDelete(accountId: number) {
  isSubmitting.value = true
  try {
    const res = await coaService.deleteAccount(accountId)
    toast.success(res.message || 'Rekening berhasil dihapus')
    isDeleteModalOpen.value = false
    await Promise.all([loadKpi(), loadData()])
  } catch (err: any) {
    toast.error(err.message || 'Gagal menghapus rekening')
  } finally {
    isSubmitting.value = false
  }
}

// 7. Export Handlers
async function handleExportExcel() {
  try {
    void coaService.logExport(filters, 'excel')
    if (activeView.value === 'tree') {
      exportCoaTreeToExcel(treeData.value)
    } else {
      // Ambil seluruh akun sesuai filter aktif untuk diekspor
      const fullList = await coaService.getAccounts({
        search: filters.search,
        coa_id: filters.coa_id,
        saldo_normal: filters.saldo_normal,
        status: filters.status,
        is_used: filters.is_used,
        limit: 1000
      })
      exportCoaTableToExcel(fullList.data)
    }
    toast.success('Berkas Excel berhasil diunduh')
  } catch (err: any) {
    toast.error('Gagal mengekspor data ke Excel')
  }
}

async function handleExportPdf() {
  try {
    void coaService.logExport(filters, 'pdf')
    const fullList = await coaService.getAccounts({
      search: filters.search,
      coa_id: filters.coa_id,
      saldo_normal: filters.saldo_normal,
      status: filters.status,
      is_used: filters.is_used,
      limit: 1000
    })
    exportCoaToPdfFormat(fullList.data)
    toast.success('Berkas PDF berhasil diunduh')
  } catch (err: any) {
    toast.error('Gagal mengekspor data ke PDF')
  }
}

// On Mounted Lifecycle
onMounted(() => {
  loadKpi()
  loadReferences()
  loadData()
})
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto pb-12">
    <!-- Breadcrumb & Header Section -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <nav class="flex items-center space-x-2 text-xs text-gray-500 mb-1">
          <router-link to="/dashboard" class="hover:text-teal-600 transition-colors">Dashboard</router-link>
          <span>&rsaquo;</span>
          <span>Keuangan</span>
          <span>&rsaquo;</span>
          <span class="text-gray-800 font-semibold">Chart of Account</span>
        </nav>
        <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Chart of Account</h1>
        <p class="text-xs text-gray-500 mt-1">
          Kelola struktur rekening akuntansi dan klasifikasi keuangan perusahaan.
        </p>
      </div>

      <!-- Action Buttons Toolbar -->
      <div class="flex flex-wrap items-center gap-2">
        <!-- Export Excel -->
        <button
          type="button"
          class="inline-flex items-center px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-2xs"
          @click="handleExportExcel"
        >
          <FileSpreadsheet class="w-4 h-4 text-emerald-600 mr-1.5" />
          Export Excel
        </button>

        <!-- Export PDF -->
        <button
          type="button"
          class="inline-flex items-center px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-2xs"
          @click="handleExportPdf"
        >
          <FileText class="w-4 h-4 text-red-600 mr-1.5" />
          Export PDF
        </button>

        <!-- Import Akun -->
        <button
          v-if="canCreate"
          type="button"
          class="inline-flex items-center px-3 py-2 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors shadow-2xs"
          @click="isImportModalOpen = true"
        >
          <Upload class="w-4 h-4 mr-1.5" />
          Import Akun
        </button>

        <!-- Group Add Buttons Dropdown -->
        <div v-if="canCreate" class="relative">
          <div class="inline-flex rounded-lg shadow-sm">
            <button
              type="button"
              class="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 rounded-l-lg hover:bg-teal-700 transition-colors"
              @click="openCreateAccountModal()"
            >
              <Plus class="w-4 h-4 mr-1.5" />
              Tambah Akun
            </button>
            <button
              type="button"
              class="px-2 py-2 text-white bg-teal-600 border-l border-teal-500 rounded-r-lg hover:bg-teal-700 transition-colors"
              @click="isAddDropdownOpen = !isAddDropdownOpen"
            >
              <ChevronDown class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Dropdown Options -->
          <div
            v-if="isAddDropdownOpen"
            class="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-30 animate-in fade-in zoom-in-95"
            @click="isAddDropdownOpen = false"
          >
            <button
              type="button"
              class="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center"
              @click="openCreateGroupModal()"
            >
              <Layers class="w-3.5 h-3.5 text-indigo-600 mr-2" />
              Tambah Kelompok Akun
            </button>
            <button
              type="button"
              class="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center"
              @click="openCreateParentModal()"
            >
              <FolderPlus class="w-3.5 h-3.5 text-teal-600 mr-2" />
              Tambah Induk Akun
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- KPI Cards Section -->
    <CoaKpiCards :kpi="kpi" :is-loading="isLoadingKpi" />

    <!-- Filters & View Switcher Bar -->
    <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-3">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <!-- Search Input -->
        <div class="relative flex-1 max-w-md">
          <Search class="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            v-model="filters.search"
            type="text"
            placeholder="Cari kode atau nama rekening akuntansi..."
            class="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            @input="onSearchInput"
          />
        </div>

        <!-- View Switcher (Hierarki vs Tabel) -->
        <div class="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 shrink-0">
          <button
            type="button"
            :class="[
              'inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
              activeView === 'tree'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            ]"
            @click="handleSwitchView('tree')"
          >
            <FolderTree class="w-3.5 h-3.5 mr-1.5 text-teal-600" />
            Tampilan Hierarki
          </button>
          <button
            type="button"
            :class="[
              'inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
              activeView === 'table'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            ]"
            @click="handleSwitchView('table')"
          >
            <TableIcon class="w-3.5 h-3.5 mr-1.5 text-teal-600" />
            Tampilan Tabel
          </button>
        </div>
      </div>

      <!-- Advanced Filter Dropdowns -->
      <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 pt-2 border-t border-gray-100 text-xs">
        <!-- Filter Kelompok -->
        <div>
          <label class="block text-2xs font-semibold text-gray-500 mb-0.5">Kelompok Akun</label>
          <select
            v-model="filters.coa_id"
            class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            @change="onFilterChange"
          >
            <option value="all">Semua Kelompok</option>
            <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.id }} - {{ g.name }}</option>
          </select>
        </div>

        <!-- Filter Saldo Normal -->
        <div>
          <label class="block text-2xs font-semibold text-gray-500 mb-0.5">Saldo Normal</label>
          <select
            v-model="filters.saldo_normal"
            class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            @change="onFilterChange"
          >
            <option value="all">Semua Saldo</option>
            <option value="D">Debit (D)</option>
            <option value="K">Kredit (K)</option>
          </select>
        </div>

        <!-- Filter Status -->
        <div>
          <label class="block text-2xs font-semibold text-gray-500 mb-0.5">Status</label>
          <select
            v-model="filters.status"
            class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            @change="onFilterChange"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>

        <!-- Filter Digunakan -->
        <div>
          <label class="block text-2xs font-semibold text-gray-500 mb-0.5">Penggunaan Transaksi</label>
          <select
            v-model="filters.is_used"
            class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            @change="onFilterChange"
          >
            <option value="all">Semua</option>
            <option value="used">Sudah Digunakan</option>
            <option value="unused">Belum Digunakan</option>
          </select>
        </div>

        <!-- Reset Button -->
        <div class="flex items-end">
          <button
            type="button"
            class="w-full py-1.5 px-3 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors flex items-center justify-center"
            @click="resetFilters"
          >
            <RefreshCw class="w-3 h-3 mr-1" />
            Reset
          </button>
        </div>
      </div>
    </div>

    <!-- Active View Component: Hierarki vs Tabel -->
    <div>
      <CoaTreeView
        v-if="activeView === 'tree'"
        :tree="treeData"
        :is-loading="isLoadingData"
        :can-create="canCreate"
        :can-update="canUpdate"
        :can-delete="canDelete"
        @view="handleViewDetail"
        @edit-account="openEditAccountModal"
        @edit-parent="openEditParentModal"
        @edit-group="openEditGroupModal"
        @add-account-to-parent="openCreateAccountModal"
        @toggle-status="handleToggleStatus"
        @delete-account="handleDeleteRequest"
      />

      <CoaTableView
        v-else
        :accounts="tableAccounts"
        :is-loading="isLoadingData"
        :total="totalItems"
        :current-page="currentPage"
        :page-size="pageSize"
        :total-pages="totalPages"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        :can-update="canUpdate"
        :can-delete="canDelete"
        @view="handleViewDetail"
        @edit="openEditAccountModal"
        @toggle-status="handleToggleStatus"
        @delete="handleDeleteRequest"
        @sort="handleSort"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      />
    </div>

    <!-- MODALS -->
    <!-- 1. Account Create / Edit Modal -->
    <CoaAccountModal
      :is-open="isAccountModalOpen"
      :is-edit="isAccountEdit"
      :account-data="selectedAccount"
      :groups="groups"
      :parents="parents"
      :is-loading="isSubmitting"
      :initial-parent-id="initialParentId"
      :initial-coa-id="initialCoaId"
      @close="isAccountModalOpen = false"
      @submit="handleAccountSubmit"
    />

    <!-- 2. Group Create / Edit Modal -->
    <CoaGroupModal
      :is-open="isGroupModalOpen"
      :is-edit="isGroupEdit"
      :group-data="selectedGroup"
      :is-loading="isSubmitting"
      @close="isGroupModalOpen = false"
      @submit="handleGroupSubmit"
    />

    <!-- 3. Parent Create / Edit Modal -->
    <CoaParentModal
      :is-open="isParentModalOpen"
      :is-edit="isParentEdit"
      :parent-data="selectedParent"
      :groups="groups"
      :is-loading="isSubmitting"
      @close="isParentModalOpen = false"
      @submit="handleParentSubmit"
    />

    <!-- 4. Account Detail Drawer -->
    <CoaDetailDrawer
      :is-open="isDetailDrawerOpen"
      :account="detailAccount"
      @close="isDetailDrawerOpen = false"
      @edit="openEditAccountModal"
    />

    <!-- 5. Delete Confirm Modal -->
    <CoaDeleteConfirmModal
      :is-open="isDeleteModalOpen"
      :account="deleteTargetAccount"
      :is-loading="isSubmitting"
      @close="isDeleteModalOpen = false"
      @confirm-delete="handleConfirmDelete"
      @deactivate-instead="(acct) => { isDeleteModalOpen = false; handleToggleStatus(acct); }"
    />

    <!-- 6. Import Excel Modal -->
    <CoaImportModal
      :is-open="isImportModalOpen"
      :parents="parents"
      @close="isImportModalOpen = false"
      @imported="() => { loadKpi(); loadData(); toast.success('Impor master rekening selesai'); }"
    />
  </div>
</template>

<style scoped>
.text-2xs {
  font-size: 0.6875rem;
  line-height: 0.875rem;
}
.shadow-2xs {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
</style>
