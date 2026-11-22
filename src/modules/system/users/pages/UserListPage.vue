<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppPagination from '@/shared/components/navigation/AppPagination.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppBadge from '@/shared/components/ui/AppBadge.vue'
import UserResetPasswordModal from '../components/UserResetPasswordModal.vue'
import UserResetPinModal from '../components/UserResetPinModal.vue'
import { userService } from '../services/user.service'
import { groupService } from '@/modules/system/groups/services/group.service'
import type { UserListItem } from '../types/user.types'
import type { Group } from '@/modules/system/groups/types/group.types'
import { usePermission } from '@/shared/composables/usePermission'
import { useToast } from '@/shared/composables/useToast'
import {
  Plus,
  Search,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Printer,
  Upload,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  Shield,
  KeyRound,
  ShieldAlert,
  UserCheck,
  UserX,
  Filter,
  RotateCcw
} from 'lucide-vue-next'

const toast = useToast()
const { hasPermission } = usePermission()

// Permissions
const canCreate = computed(() => hasPermission('system:create') || hasPermission('system.users:create'))
const canUpdate = computed(() => hasPermission('system:update') || hasPermission('system.users:update'))
const canDelete = computed(() => hasPermission('system:delete') || hasPermission('system.users:delete'))

// Data State
const users = ref<UserListItem[]>([])
const availableGroups = ref<Group[]>([])
const isLoading = ref(true)
const totalItems = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// Filters
const searchQuery = ref('')
const selectedGroupId = ref<number | 'all'>('all')
const selectedStatus = ref<number | 'all'>('all')
const sortBy = ref<'id' | 'username' | 'firstName' | 'email' | 'groupName' | 'active'>('id')
const sortOrder = ref<'asc' | 'desc'>('desc') // data terbaru (ID terbesar) tampil paling atas

// Bulk Selection
const selectedIds = ref<number[]>([])

// Modals State
const isDeleteDialogOpen = ref(false)
const userToDelete = ref<UserListItem | null>(null)

const isBulkDeleteDialogOpen = ref(false)

const isStatusDialogOpen = ref(false)
const userToToggleStatus = ref<UserListItem | null>(null)

const isResetPasswordModalOpen = ref(false)
const isResetPinModalOpen = ref(false)
const targetUserForCredentials = ref<UserListItem | null>(null)

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

async function loadGroups() {
  try {
    const res = await groupService.getAll({ page: 1, pageSize: 100 })
    availableGroups.value = res.items
  } catch {
    // Handled
  }
}

async function loadData() {
  isLoading.value = true
  closeDropdown()
  try {
    const result = await userService.getAll({
      search: searchQuery.value,
      groupId: selectedGroupId.value,
      status: selectedStatus.value,
      page: currentPage.value,
      pageSize: pageSize.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    })
    users.value = result.items
    totalItems.value = result.totalItems
  } catch (err: unknown) {
    toast.error(err instanceof Error ? err.message : 'Gagal memuat data user.')
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

watch([selectedGroupId, selectedStatus, currentPage, pageSize], () => {
  loadData()
})

onMounted(() => {
  loadGroups()
  loadData()
})

function resetFilters() {
  searchQuery.value = ''
  selectedGroupId.value = 'all'
  selectedStatus.value = 'all'
  currentPage.value = 1
  loadData()
}

// Bulk selection helpers
const isAllPageSelected = computed(() => {
  if (users.value.length === 0) return false
  return users.value.every(u => selectedIds.value.includes(u.id))
})

const isIndeterminate = computed(() => {
  const selectedOnPage = users.value.filter(u => selectedIds.value.includes(u.id)).length
  return selectedOnPage > 0 && selectedOnPage < users.value.length
})

function toggleSelectAll() {
  if (isAllPageSelected.value) {
    const pageIds = users.value.map(u => u.id)
    selectedIds.value = selectedIds.value.filter(id => !pageIds.includes(id))
  } else {
    const pageIds = users.value.map(u => u.id)
    selectedIds.value = Array.from(new Set([...selectedIds.value, ...pageIds]))
  }
}

function toggleSelectOne(id: number) {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter(item => item !== id)
  } else {
    selectedIds.value.push(id)
  }
}

// Single Delete Action
function confirmDelete(user: UserListItem) {
  closeDropdown()
  if (user.id === 1) {
    toast.error('Akun Superadmin root tidak dapat dihapus.')
    return
  }
  userToDelete.value = user
  isDeleteDialogOpen.value = true
}

async function handleDelete() {
  if (!userToDelete.value) return
  try {
    const res = await userService.delete(userToDelete.value.id)
    toast.success(res.message)
    selectedIds.value = selectedIds.value.filter(id => id !== userToDelete.value?.id)
    isDeleteDialogOpen.value = false
    userToDelete.value = null
    await loadData()
  } catch (err: unknown) {
    toast.error(err instanceof Error ? err.message : 'Gagal menghapus data user.')
  }
}

// Bulk Delete Action
function confirmBulkDelete() {
  closeDropdown()
  if (selectedIds.value.length === 0) return
  isBulkDeleteDialogOpen.value = true
}

async function handleBulkDelete() {
  try {
    const res = await userService.bulkDelete(selectedIds.value)
    toast.success(res.message)
    selectedIds.value = []
    isBulkDeleteDialogOpen.value = false
    await loadData()
  } catch (err: unknown) {
    toast.error(err instanceof Error ? err.message : 'Gagal menghapus beberapa data user.')
  }
}

// Status Toggle Action
function confirmToggleStatus(user: UserListItem) {
  closeDropdown()
  if (user.id === 1) {
    toast.error('Akun Superadmin root tidak dapat dinonaktifkan.')
    return
  }
  userToToggleStatus.value = user
  isStatusDialogOpen.value = true
}

async function handleToggleStatus() {
  if (!userToToggleStatus.value) return
  try {
    const res = await userService.toggleStatus(userToToggleStatus.value.id)
    toast.success(res.message)
    isStatusDialogOpen.value = false
    userToToggleStatus.value = null
    await loadData()
  } catch (err: unknown) {
    toast.error(err instanceof Error ? err.message : 'Gagal mengubah status user.')
  }
}

// Reset Password & PIN handlers
function openResetPasswordModal(user: UserListItem) {
  closeDropdown()
  targetUserForCredentials.value = user
  isResetPasswordModalOpen.value = true
}

function openResetPinModal(user: UserListItem) {
  closeDropdown()
  targetUserForCredentials.value = user
  isResetPinModalOpen.value = true
}

// Export actions
async function handleExportExcel() {
  isExportingExcel.value = true
  try {
    await userService.exportExcel({
      search: searchQuery.value,
      groupId: selectedGroupId.value,
      status: selectedStatus.value
    })
    toast.success('File Excel Master Data User berhasil diunduh.')
  } catch (err: unknown) {
    toast.error(err instanceof Error ? err.message : 'Gagal mengekspor data Excel.')
  } finally {
    isExportingExcel.value = false
  }
}

async function handleExportPdf() {
  isExportingPdf.value = true
  try {
    await userService.exportPdf({
      search: searchQuery.value,
      groupId: selectedGroupId.value,
      status: selectedStatus.value
    })
    toast.success('File PDF Master Data User berhasil diunduh.')
  } catch (err: unknown) {
    toast.error(err instanceof Error ? err.message : 'Gagal mengekspor data PDF.')
  } finally {
    isExportingPdf.value = false
  }
}

function handlePrint() {
  window.print()
}
</script>

<template>
  <div class="space-y-5" @click="closeDropdown">
    <!-- Header Page with actions -->
    <AppPageHeader
      title="Master Data User"
      subtitle="Kelola akun pengguna, relasi master karyawan, hak akses role groups, dan status aktifasi."
    >
      <template #actions>
        <div class="flex items-center gap-2">
          <!-- Refresh -->
          <AppButton
            variant="outline"
            size="sm"
            :disabled="isLoading"
            title="Refresh Data"
            @click="loadData"
          >
            <RefreshCw class="w-4 h-4 text-slate-600" :class="{ 'animate-spin': isLoading }" />
          </AppButton>

          <!-- Export Excel -->
          <AppButton
            variant="outline"
            size="sm"
            :is-loading="isExportingExcel"
            title="Export Excel"
            @click="handleExportExcel"
          >
            <FileSpreadsheet class="w-4 h-4 text-emerald-600 mr-1.5" />
            Excel
          </AppButton>

          <!-- Export PDF -->
          <AppButton
            variant="outline"
            size="sm"
            :is-loading="isExportingPdf"
            title="Export PDF"
            @click="handleExportPdf"
          >
            <FileText class="w-4 h-4 text-rose-600 mr-1.5" />
            PDF
          </AppButton>

          <!-- Print -->
          <AppButton
            variant="outline"
            size="sm"
            title="Cetak Tabel"
            @click="handlePrint"
          >
            <Printer class="w-4 h-4 text-slate-600 mr-1.5" />
            Cetak
          </AppButton>

          <!-- Import legacy modal trigger -->
          <AppButton
            variant="outline"
            size="sm"
            title="Import Akun"
            @click="isImportModalOpen = true"
          >
            <Upload class="w-4 h-4 text-slate-600 mr-1.5" />
            Import
          </AppButton>

          <!-- Bulk Delete Button -->
          <AppButton
            v-if="canDelete && selectedIds.length > 0"
            variant="danger"
            size="sm"
            @click="confirmBulkDelete"
          >
            <Trash2 class="w-4 h-4 mr-1.5" />
            Hapus ({{ selectedIds.length }})
          </AppButton>

          <!-- Create User Button -->
          <router-link v-if="canCreate" to="/system/users/create">
            <AppButton variant="primary" size="sm">
              <Plus class="w-4 h-4 mr-1.5" />
              Tambah User
            </AppButton>
          </router-link>
        </div>
      </template>
    </AppPageHeader>

    <!-- Filter Card Toolbar -->
    <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <!-- Search bar -->
        <div class="relative w-full sm:w-80">
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari nama, username, email, karyawan..."
            class="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>

        <!-- Filter Selects -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Group Filter -->
          <div class="flex items-center gap-1.5 text-xs text-slate-600">
            <Shield class="w-3.5 h-3.5 text-slate-400" />
            <select
              v-model="selectedGroupId"
              class="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">Semua Role / Group</option>
              <option v-for="g in availableGroups" :key="g.id" :value="g.id">
                {{ g.name.toUpperCase() }}
              </option>
            </select>
          </div>

          <!-- Status Filter -->
          <div class="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter class="w-3.5 h-3.5 text-slate-400" />
            <select
              v-model="selectedStatus"
              class="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">Semua Status</option>
              <option :value="1">AKTIF</option>
              <option :value="0">NON AKTIF</option>
            </select>
          </div>

          <!-- Reset Filter -->
          <button
            type="button"
            class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Reset Semua Filter"
            @click="resetFilters"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>
    </div>

    <!-- Main Table Container -->
    <div class="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
      <div class="overflow-x-auto min-h-[300px]">
        <table class="w-full text-xs text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-semibold tracking-wider">
              <th class="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  class="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  :checked="isAllPageSelected"
                  :indeterminate="isIndeterminate"
                  @change="toggleSelectAll"
                />
              </th>
              <th class="py-3 px-3 w-12 text-center">No</th>
              <th class="py-3 px-4 font-semibold">Nama Lengkap</th>
              <th class="py-3 px-4 font-semibold">Username</th>
              <th class="py-3 px-4 font-semibold">Email</th>
              <th class="py-3 px-4 font-semibold">Karyawan Terkait</th>
              <th class="py-3 px-4 font-semibold">Groups / Role</th>
              <th class="py-3 px-3 text-center font-semibold w-24">Status</th>
              <th class="py-3 px-3 text-center font-semibold w-16">Aksi</th>
            </tr>
          </thead>

          <tbody v-if="isLoading" class="divide-y divide-slate-100">
            <tr v-for="i in 5" :key="i" class="animate-pulse">
              <td class="py-3 px-3 text-center"><div class="w-4 h-4 bg-slate-200 rounded mx-auto" /></td>
              <td class="py-3 px-3 text-center"><div class="w-4 h-4 bg-slate-200 rounded mx-auto" /></td>
              <td class="py-3 px-4"><div class="w-32 h-4 bg-slate-200 rounded" /></td>
              <td class="py-3 px-4"><div class="w-24 h-4 bg-slate-200 rounded" /></td>
              <td class="py-3 px-4"><div class="w-36 h-4 bg-slate-200 rounded" /></td>
              <td class="py-3 px-4"><div class="w-28 h-4 bg-slate-200 rounded" /></td>
              <td class="py-3 px-4"><div class="w-24 h-5 bg-slate-200 rounded" /></td>
              <td class="py-3 px-3 text-center"><div class="w-16 h-5 bg-slate-200 rounded mx-auto" /></td>
              <td class="py-3 px-3 text-center"><div class="w-6 h-6 bg-slate-200 rounded mx-auto" /></td>
            </tr>
          </tbody>

          <tbody v-else-if="users.length === 0" class="divide-y divide-slate-100">
            <tr>
              <td colspan="9" class="py-12 text-center text-slate-500">
                <div class="flex flex-col items-center justify-center gap-2">
                  <ShieldAlert class="w-8 h-8 text-slate-300" />
                  <p class="font-medium text-slate-600">Tidak ada data user ditemukan</p>
                  <p class="text-xs text-slate-400">Silakan ubah filter pencarian atau tambahkan user baru.</p>
                </div>
              </td>
            </tr>
          </tbody>

          <tbody v-else class="divide-y divide-slate-100">
            <tr
              v-for="(item, idx) in users"
              :key="item.id"
              class="hover:bg-slate-50/70 transition-colors"
              :class="{ 'bg-teal-50/30': selectedIds.includes(item.id) }"
            >
              <!-- Checkbox -->
              <td class="py-3 px-3 text-center">
                <input
                  type="checkbox"
                  class="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  :checked="selectedIds.includes(item.id)"
                  @change="toggleSelectOne(item.id)"
                />
              </td>

              <!-- No -->
              <td class="py-3 px-3 text-center text-slate-400 font-mono">
                {{ (currentPage - 1) * pageSize + idx + 1 }}
              </td>

              <!-- Nama Lengkap -->
              <td class="py-3 px-4 font-semibold text-slate-900">
                {{ item.firstName }}
                <div v-if="item.id === 1" class="text-[10px] text-teal-600 font-normal">
                  Superadmin Root
                </div>
              </td>

              <!-- Username -->
              <td class="py-3 px-4 font-mono font-medium text-slate-700">
                {{ item.username }}
              </td>

              <!-- Email -->
              <td class="py-3 px-4 text-slate-600">
                {{ item.email }}
              </td>

              <!-- Karyawan Terkait -->
              <td class="py-3 px-4">
                <div v-if="item.employeeName" class="flex flex-col">
                  <span class="font-medium text-slate-800">{{ item.employeeName }}</span>
                  <span class="text-[10px] text-slate-400 font-mono">
                    Kode: {{ item.employeeCode || '-' }} {{ item.employeePosition ? `• ${item.employeePosition}` : '' }}
                  </span>
                </div>
                <span v-else class="text-slate-400 italic">Tanpa Karyawan</span>
              </td>

              <!-- Groups / Role -->
              <td class="py-3 px-4">
                <AppBadge variant="info" class="font-mono text-[10px] uppercase font-bold tracking-wider">
                  {{ item.groupName }}
                </AppBadge>
              </td>

              <!-- Status -->
              <td class="py-3 px-3 text-center">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                  :class="item.active === 1 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full mr-1.5"
                    :class="item.active === 1 ? 'bg-emerald-500' : 'bg-slate-400'"
                  />
                  {{ item.statusLabel }}
                </span>
              </td>

              <!-- Actions Dropdown -->
              <td class="py-3 px-3 text-center relative">
                <button
                  type="button"
                  class="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Menu Tindakan"
                  @click="toggleActionDropdown(item.id, $event)"
                >
                  <MoreVertical class="w-4 h-4" />
                </button>

                <!-- Dropdown Menu -->
                <div
                  v-if="activeActionDropdownId === item.id"
                  class="absolute right-3 top-8 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1 text-left divide-y divide-slate-100"
                  @click.stop
                >
                  <div class="py-1">
                    <!-- Detail -->
                    <router-link
                      :to="`/system/users/${item.id}`"
                      class="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Eye class="w-3.5 h-3.5 text-slate-400" />
                      Lihat Detail
                    </router-link>

                    <!-- Edit -->
                    <router-link
                      v-if="canUpdate"
                      :to="`/system/users/${item.id}/edit`"
                      class="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Edit2 class="w-3.5 h-3.5 text-slate-400" />
                      Edit Profil User
                    </router-link>
                  </div>

                  <div v-if="canUpdate" class="py-1">
                    <!-- Reset Password -->
                    <button
                      type="button"
                      class="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                      @click="openResetPasswordModal(item)"
                    >
                      <KeyRound class="w-3.5 h-3.5 text-amber-500" />
                      Reset Password
                    </button>

                    <!-- Reset PIN -->
                    <button
                      type="button"
                      class="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                      @click="openResetPinModal(item)"
                    >
                      <Shield class="w-3.5 h-3.5 text-teal-600" />
                      Reset PIN Otorisasi
                    </button>

                    <!-- Toggle Status -->
                    <button
                      type="button"
                      class="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-slate-50 transition-colors"
                      :class="item.active === 1 ? 'text-amber-700' : 'text-emerald-700'"
                      :disabled="item.id === 1"
                      @click="confirmToggleStatus(item)"
                    >
                      <component :is="item.active === 1 ? UserX : UserCheck" class="w-3.5 h-3.5" />
                      {{ item.active === 1 ? 'Nonaktifkan Akun' : 'Aktifkan Akun' }}
                    </button>
                  </div>

                  <div v-if="canDelete && item.id !== 1" class="py-1">
                    <!-- Delete -->
                    <button
                      type="button"
                      class="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors"
                      @click="confirmDelete(item)"
                    >
                      <Trash2 class="w-3.5 h-3.5 text-rose-500" />
                      Hapus Akun
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
        <div class="text-xs text-slate-500">
          Menampilkan <span class="font-medium text-slate-700">{{ users.length }}</span> dari
          <span class="font-medium text-slate-700">{{ totalItems }}</span> user
        </div>
        <AppPagination
          :current-page="currentPage"
          :total-items="totalItems"
          :page-size="pageSize"
          @update:current-page="currentPage = $event"
          @update:page-size="pageSize = $event"
        />
      </div>
    </div>

    <!-- Modals -->
    <!-- Reset Password Modal -->
    <UserResetPasswordModal
      :is-open="isResetPasswordModalOpen"
      :user="targetUserForCredentials"
      @close="isResetPasswordModalOpen = false"
      @saved="loadData"
    />

    <!-- Reset PIN Modal -->
    <UserResetPinModal
      :is-open="isResetPinModalOpen"
      :user="targetUserForCredentials"
      @close="isResetPinModalOpen = false"
      @saved="loadData"
    />

    <!-- Confirm Single Delete Dialog -->
    <AppConfirmDialog
      v-model="isDeleteDialogOpen"
      title="Hapus Data User"
      :message="`Apakah Anda yakin ingin menghapus akun user '${userToDelete?.username}' (${userToDelete?.firstName})? Tindakan ini tidak dapat dibatalkan.`"
      confirm-text="Hapus Akun"
      variant="danger"
      @confirm="handleDelete"
    />

    <!-- Confirm Bulk Delete Dialog -->
    <AppConfirmDialog
      v-model="isBulkDeleteDialogOpen"
      title="Hapus Multiple Data User"
      :message="`Apakah Anda yakin ingin menghapus ${selectedIds.length} akun user terpilih? Akun Superadmin root akan otomatis dilewati.`"
      confirm-text="Hapus Semua Terpilih"
      variant="danger"
      @confirm="handleBulkDelete"
    />

    <!-- Confirm Toggle Status Dialog -->
    <AppConfirmDialog
      v-model="isStatusDialogOpen"
      :title="userToToggleStatus?.active === 1 ? 'Nonaktifkan Akun User' : 'Aktifkan Akun User'"
      :message="userToToggleStatus?.active === 1
        ? `Apakah Anda yakin ingin menonaktifkan akun '${userToToggleStatus?.username}'? Pengguna tidak akan dapat login lagi ke sistem.`
        : `Apakah Anda yakin ingin mengaktifkan kembali akun '${userToToggleStatus?.username}'?`"
      :confirm-text="userToToggleStatus?.active === 1 ? 'Nonaktifkan' : 'Aktifkan'"
      :variant="userToToggleStatus?.active === 1 ? 'warning' : 'primary'"
      @confirm="handleToggleStatus"
    />

    <!-- Import Legacy Info Modal -->
    <AppModal
      :model-value="isImportModalOpen"
      title="Informasi Import Data Akun Pengguna"
      size="md"
      @update:model-value="isImportModalOpen = false"
      @close="isImportModalOpen = false"
    >
      <div class="space-y-3 text-xs text-slate-600 leading-relaxed">
        <div class="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
          <ShieldAlert class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <span class="font-bold">Keamanan Kredensial Pengguna:</span>
            Sesuai standar audit keamanan ERP V2, proses import massal akun pengguna yang mengandung password dan PIN
            secara mentah dinonaktifkan sementara.
          </div>
        </div>
        <p>
          Pembuatan akun pengguna disarankan dilakukan melalui tombol <strong>Tambah User</strong> dengan relasi resmi ke Master Data Karyawan (HR) dan penugasan Groups/Role yang tepat.
        </p>
        <p>
          Fitur onboarding akun massal yang aman dengan aktivasi email invitation akan disediakan pada modul migrasi terpusat.
        </p>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <AppButton variant="outline" @click="isImportModalOpen = false">
            Tutup
          </AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>