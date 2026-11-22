<script setup lang="ts">
import { computed, onMounted } from 'vue'
import {
  CalendarDays,
  Plus,
  List,
  Calendar,
  Search,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-vue-next'
import AppAlert from '@/shared/components/feedback/AppAlert.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import AppExportActions from '@/shared/components/import-export/AppExportActions.vue'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import { usePermission } from '@/shared/composables/usePermission'
import HolidayCalendar from '../components/HolidayCalendar.vue'
import HolidayFormModal from '../components/HolidayFormModal.vue'
import HolidayListTable from '../components/HolidayListTable.vue'
import HolidayMonthPicker from '../components/HolidayMonthPicker.vue'
import { useHolidaySettings } from '../composables/useHolidaySettings'

const {
  canCreate: checkCanCreate,
  canUpdate: checkCanUpdate,
  canDelete: checkCanDelete
} = usePermission()

// RBAC Permissions: hr.holidays or hr parent
const canCreate = computed(() => checkCanCreate('hr.holidays') || checkCanCreate('hr'))
const canUpdate = computed(() => checkCanUpdate('hr.holidays') || checkCanUpdate('hr'))
const canDelete = computed(() => checkCanDelete('hr.holidays') || checkCanDelete('hr'))

const {
  selectedYearMonth,
  viewMode,
  searchQuery,
  holidays,
  calendarGrid,
  isLoading,
  isSaving,
  errorMessage,
  successMessage,
  isFormModalOpen,
  isDeleteDialogOpen,
  modalMode,
  activeHoliday,
  deletingHoliday,
  initialDateForCreate,
  loadHolidays,
  openCreateModal,
  openEditModal,
  promptDelete,
  cancelDelete,
  confirmDelete,
  saveHoliday,
  exportToExcel,
  exportToPdf
} = useHolidaySettings('2024-08') // Default to August 2024 to showcase legacy verified seeds

onMounted(async () => {
  await loadHolidays()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <AppPageHeader
      title="Setting Hari Libur"
      subtitle="Kelola hari libur nasional, hari libur mingguan, serta pengecualian karyawan yang tetap dijadwalkan hadir."
    >
      <template #icon>
        <CalendarDays class="w-6 h-6 text-[#0F766E]" />
      </template>

      <template #actions>
        <div class="flex items-center space-x-2.5">
          <!-- Export Actions -->
          <AppExportActions
            :disabled="isLoading || holidays.length === 0"
            @export-excel="exportToExcel"
            @export-pdf="exportToPdf"
          />

          <!-- Tambah Hari Libur Button -->
          <AppButton v-if="canCreate" variant="primary" size="sm" @click="openCreateModal()">
            <Plus class="w-4 h-4 mr-1.5" />
            Tambah Hari Libur
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <!-- Read-Only Banner if User lacks create/update rights -->
    <div
      v-if="!canUpdate && !canCreate"
      class="flex items-center space-x-2.5 p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800"
    >
      <Info class="w-4 h-4 text-blue-600 shrink-0" />
      <span>
        <strong>Mode Hanya Baca:</strong> Anda memiliki hak akses untuk meninjau data hari libur,
        tetapi tidak memiliki izin untuk menambah, mengubah, atau menghapus pengaturan.
      </span>
    </div>

    <!-- Success Feedback Alert -->
    <AppAlert
      v-if="successMessage"
      variant="success"
      class="transition-opacity"
      @dismiss="successMessage = null"
    >
      <div class="flex items-center space-x-2">
        <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
        <span>{{ successMessage }}</span>
      </div>
    </AppAlert>

    <!-- Error Summary Alert -->
    <AppAlert v-if="errorMessage" variant="danger" @dismiss="errorMessage = null">
      <div class="flex items-center space-x-2">
        <AlertCircle class="w-4 h-4 text-red-600 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>
    </AppAlert>

    <!-- Toolbar: MonthPicker, Search, & ViewMode Switcher -->
    <div
      class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-xs"
    >
      <!-- Month & Year Selector -->
      <HolidayMonthPicker
        v-model="selectedYearMonth"
        :disabled="isLoading"
        @update:model-value="loadHolidays"
      />

      <!-- Right Controls: Search and View Mode Switch -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <!-- Search Input -->
        <div class="relative w-full sm:w-64">
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari keterangan, hari, nama..."
            class="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E]"
          />
        </div>

        <!-- View Mode Switch: Table vs Calendar -->
        <div class="inline-flex rounded-lg border border-slate-300 bg-slate-100 p-0.5 shadow-xs">
          <button
            type="button"
            :class="[
              'inline-flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all',
              viewMode === 'table'
                ? 'bg-white text-[#0F766E] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            ]"
            @click="viewMode = 'table'"
          >
            <List class="w-3.5 h-3.5" />
            <span>Daftar</span>
          </button>
          <button
            type="button"
            :class="[
              'inline-flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all',
              viewMode === 'calendar'
                ? 'bg-white text-[#0F766E] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            ]"
            @click="viewMode = 'calendar'"
          >
            <Calendar class="w-3.5 h-3.5" />
            <span>Kalender</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content Area: Table View or Calendar View -->
    <div>
      <HolidayListTable
        v-if="viewMode === 'table'"
        :items="holidays"
        :is-loading="isLoading"
        :can-update="canUpdate"
        :can-delete="canDelete"
        @edit="openEditModal"
        @delete="promptDelete"
        @add="openCreateModal()"
      />

      <HolidayCalendar
        v-else
        :cells="calendarGrid"
        :is-loading="isLoading"
        :can-update="canUpdate"
        @create-on-date="openCreateModal"
        @edit="openEditModal"
      />
    </div>

    <!-- Create / Edit Holiday Modal -->
    <HolidayFormModal
      v-model="isFormModalOpen"
      :mode="modalMode"
      :holiday="activeHoliday"
      :initial-date="initialDateForCreate"
      :is-saving="isSaving"
      @submit="saveHoliday"
    />

    <!-- Delete Confirmation Dialog -->
    <AppConfirmDialog
      v-model="isDeleteDialogOpen"
      title="Hapus Pengaturan Hari Libur"
      :message="`Apakah Anda yakin ingin menghapus hari libur '${deletingHoliday?.keterangan || ''}' (${deletingHoliday?.tanggal || ''})? Seluruh data pengecualian terkait akan dibersihkan.`"
      confirm-text="Hapus Hari Libur"
      cancel-text="Batal"
      variant="danger"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>
