<script setup lang="ts">
import { ref } from 'vue'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppPagination from '@/shared/components/navigation/AppPagination.vue'
import AppTableSkeleton from '@/shared/components/data/AppTableSkeleton.vue'
import AppEmptyState from '@/shared/components/feedback/AppEmptyState.vue'
import AppExportActions from '@/shared/components/import-export/AppExportActions.vue'
import AppImportExcelModal from '@/shared/components/import-export/AppImportExcelModal.vue'
import AppBadge from '@/shared/components/ui/AppBadge.vue'
import AppSettingFormModal from '../components/AppSettingFormModal.vue'
import AppSettingDetailModal from '../components/AppSettingDetailModal.vue'
import { appSettingService } from '../services/app-setting.service'
import {
  APP_SETTING_IMPORT_TEMPLATE,
  appSettingRowMapper
} from '../utils/app-setting-import.config'
import type {
  AppSetting,
  CreateAppSettingDto,
  UpdateAppSettingDto
} from '../types/app-setting.types'
import { useCrud } from '@/shared/composables/useCrud'
import { usePermission } from '@/shared/composables/usePermission'
import { exportToExcel } from '@/shared/utils/excel-export'
import { exportToPdf } from '@/shared/utils/pdf-export'
import type { ExportColumn } from '@/shared/types/crud.types'
import { Plus, Search, RefreshCw, Upload, Eye, Edit2, Trash2 } from 'lucide-vue-next'

const { hasPermission } = usePermission()

const crud = useCrud<AppSetting, CreateAppSettingDto, UpdateAppSettingDto>(appSettingService, {
  resourceName: 'settings.app',
  entityLabel: 'Setting Aplikasi',
  defaultPageSize: 10,
  defaultSortBy: 'id',
  defaultSortOrder: 'asc'
})

const isExportingExcel = ref(false)
const isExportingPdf = ref(false)

const exportColumns: ExportColumn<AppSetting>[] = [
  { key: 'no', label: 'No.' },
  { key: 'table', label: 'Modul / Tabel', formatter: val => String(val || '-') },
  { key: 'name', label: 'Kunci (Name)', formatter: val => String(val || '-') },
  { key: 'value', label: 'Nilai (Value)', formatter: val => String(val || '-') },
  { key: 'keterangan', label: 'Keterangan', formatter: val => String(val || '-') }
]

async function handleExportExcel() {
  isExportingExcel.value = true
  try {
    const data = await appSettingService.exportAll({
      search: crud.searchQuery.value
    })

    exportToExcel<AppSetting>({
      filename: 'setting-aplikasi',
      title: 'Daftar Setting Aplikasi',
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
    const data = await appSettingService.exportAll({
      search: crud.searchQuery.value
    })

    exportToPdf<AppSetting>({
      filename: 'setting-aplikasi',
      title: 'Daftar Setting Aplikasi',
      subtitle: `Dicetak: ${new Date().toLocaleDateString('id-ID')} | Total: ${data.length} parameter`,
      columns: exportColumns,
      data
    })
  } finally {
    isExportingPdf.value = false
  }
}

async function handleImportSuccess() {
  crud.isImportOpen.value = false
  await crud.fetchList()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <AppPageHeader
      title="Setting Aplikasi"
      subtitle="Kelola konfigurasi penomoran otomatis, template dokumen, dan parameter sistem ERP"
      :breadcrumbs="[{ label: 'Setting', to: '/settings/app' }, { label: 'Setting Aplikasi' }]"
    >
      <template #actions>
        <div class="flex items-center gap-2 flex-wrap">
          <AppExportActions
            :is-exporting-excel="isExportingExcel"
            :is-exporting-pdf="isExportingPdf"
            @export-excel="handleExportExcel"
            @export-pdf="handleExportPdf"
          />

          <AppButton
            v-if="hasPermission('settings.app', 'create')"
            variant="outline"
            size="sm"
            @click="crud.isImportOpen.value = true"
          >
            <Upload class="w-4 h-4 mr-1.5" />
            Import Excel
          </AppButton>

          <AppButton
            v-if="hasPermission('settings.app', 'create')"
            variant="primary"
            size="sm"
            @click="crud.openCreate"
          >
            <Plus class="w-4 h-4 mr-1.5" />
            Tambah Setting
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <!-- Toolbar -->
    <div
      class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-3 justify-between"
    >
      <div class="relative w-full sm:w-80">
        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <AppInput
          :model-value="crud.searchQuery.value"
          placeholder="Cari tabel, kunci, nilai setting..."
          class="pl-9"
          @update:model-value="crud.handleSearch(String($event))"
        />
      </div>

      <div class="flex items-center gap-2">
        <AppButton
          variant="ghost"
          size="sm"
          class="px-2.5"
          title="Muat ulang data"
          @click="crud.fetchList"
        >
          <RefreshCw
            class="w-4 h-4 text-slate-500"
            :class="{ 'animate-spin': crud.isLoading.value }"
          />
        </AppButton>
      </div>
    </div>

    <!-- Table -->
    <div
      class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead
            class="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800"
          >
            <tr>
              <th scope="col" class="px-4 py-3.5 w-12 text-center">No.</th>
              <th
                scope="col"
                class="px-4 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none"
                @click="crud.handleSort('table')"
              >
                Modul / Tabel
              </th>
              <th
                scope="col"
                class="px-4 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none"
                @click="crud.handleSort('name')"
              >
                Kunci (Name)
              </th>
              <th scope="col" class="px-4 py-3.5">Nilai (Value)</th>
              <th scope="col" class="px-4 py-3.5">Keterangan</th>
              <th scope="col" class="px-4 py-3.5 text-center w-28">Aksi</th>
            </tr>
          </thead>

          <AppTableSkeleton
            v-if="crud.isLoading.value"
            :columns-count="6"
            :rows-count="crud.pageSize.value"
          />

          <tbody v-else-if="crud.items.value.length === 0">
            <tr>
              <td colspan="6" class="p-8">
                <AppEmptyState
                  title="Tidak ada data setting"
                  description="Belum ada parameter setting aplikasi yang sesuai pencarian."
                  action-label="Tambah Setting"
                  @action="crud.openCreate"
                />
              </td>
            </tr>
          </tbody>

          <tbody v-else class="divide-y divide-slate-200 dark:divide-slate-800">
            <tr
              v-for="(item, idx) in crud.items.value"
              :key="item.id"
              class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td class="px-4 py-3 text-center text-xs text-slate-400">
                {{ (crud.currentPage.value - 1) * crud.pageSize.value + idx + 1 }}
              </td>

              <td class="px-4 py-3">
                <AppBadge variant="info" class="font-mono text-xs">{{ item.table }}</AppBadge>
              </td>

              <td class="px-4 py-3 font-mono font-semibold text-slate-800 dark:text-slate-100">
                {{ item.name }}
              </td>

              <td
                class="px-4 py-3 font-mono text-xs text-primary-600 dark:text-primary-400 max-w-xs truncate font-medium"
              >
                {{ item.value }}
              </td>

              <td class="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">
                {{ item.keterangan || '-' }}
              </td>

              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    class="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                    title="Lihat Detail"
                    @click="crud.openDetail(item)"
                  >
                    <Eye class="w-4 h-4" />
                  </button>

                  <button
                    v-if="hasPermission('settings.app', 'update')"
                    type="button"
                    class="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                    title="Edit Setting"
                    @click="crud.openEdit(item)"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>

                  <button
                    v-if="hasPermission('settings.app', 'delete')"
                    type="button"
                    class="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                    title="Hapus Setting"
                    @click="crud.handleDelete(item, `${item.table}.${item.name}`)"
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
      <div
        v-if="crud.totalItems.value > 0"
        class="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between"
      >
        <span class="text-xs text-slate-500">
          Total:
          <strong class="text-slate-800 dark:text-white">{{ crud.totalItems.value }}</strong>
          parameter setting
        </span>

        <AppPagination
          :current-page="crud.currentPage.value"
          :page-size="crud.pageSize.value"
          :total-items="crud.totalItems.value"
          @update:current-page="crud.handlePageChange"
          @update:page-size="crud.handlePageSizeChange"
        />
      </div>
    </div>

    <!-- Modals -->
    <AppSettingFormModal
      v-model="crud.isFormOpen.value"
      :initial-data="crud.selectedItem.value"
      :loading="crud.isSaving.value"
      @submit="crud.saveItem($event)"
    />

    <AppSettingDetailModal v-model="crud.isDetailOpen.value" :setting="crud.selectedItem.value" />

    <AppImportExcelModal
      v-model="crud.isImportOpen.value"
      title="Setting Aplikasi"
      :template-definition="APP_SETTING_IMPORT_TEMPLATE"
      :row-mapper="appSettingRowMapper.mapRow"
      :import-service="appSettingService.importBatch.bind(appSettingService)"
      @imported="handleImportSuccess"
    />
  </div>
</template>
