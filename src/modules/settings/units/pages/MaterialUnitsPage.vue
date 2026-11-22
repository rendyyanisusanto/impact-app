<script setup lang="ts">
import { ref } from 'vue'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import AppPagination from '@/shared/components/navigation/AppPagination.vue'
import AppStatusBadge from '@/shared/components/data/AppStatusBadge.vue'
import AppTableSkeleton from '@/shared/components/data/AppTableSkeleton.vue'
import AppEmptyState from '@/shared/components/feedback/AppEmptyState.vue'
import AppExportActions from '@/shared/components/import-export/AppExportActions.vue'
import AppImportExcelModal from '@/shared/components/import-export/AppImportExcelModal.vue'
import SatuanBeliFormModal from '../components/SatuanBeliFormModal.vue'
import SatuanBeliDetailModal from '../components/SatuanBeliDetailModal.vue'
import SatuanPakaiFormModal from '../components/SatuanPakaiFormModal.vue'
import SatuanPakaiDetailModal from '../components/SatuanPakaiDetailModal.vue'
import { satuanBeliService, satuanPakaiService } from '../services/unit.service'
import {
  SATUAN_BELI_IMPORT_TEMPLATE,
  satuanBeliRowMapper,
  SATUAN_PAKAI_IMPORT_TEMPLATE,
  satuanPakaiRowMapper
} from '../utils/unit-import.config'
import type {
  SatuanBeli,
  CreateSatuanBeliDto,
  UpdateSatuanBeliDto,
  SatuanPakai,
  CreateSatuanPakaiDto,
  UpdateSatuanPakaiDto
} from '../types/unit.types'
import { useCrud } from '@/shared/composables/useCrud'
import { usePermission } from '@/shared/composables/usePermission'
import { exportToExcel } from '@/shared/utils/excel-export'
import { exportToPdf } from '@/shared/utils/pdf-export'
import type { ExportColumn } from '@/shared/types/crud.types'
import { Plus, Search, RefreshCw, Upload, Eye, Edit2, Trash2, Check } from 'lucide-vue-next'

const { hasPermission } = usePermission()
const activeTab = ref<'beli' | 'pakai'>('beli')

// CRUD for Satuan Beli
const crudBeli = useCrud<SatuanBeli, CreateSatuanBeliDto, UpdateSatuanBeliDto>(satuanBeliService, {
  resourceName: 'settings.material-units',
  entityLabel: 'Satuan Beli',
  defaultPageSize: 10,
  defaultSortBy: 'id',
  defaultSortOrder: 'asc'
})

// CRUD for Satuan Pakai
const crudPakai = useCrud<SatuanPakai, CreateSatuanPakaiDto, UpdateSatuanPakaiDto>(
  satuanPakaiService,
  {
    resourceName: 'settings.material-units',
    entityLabel: 'Satuan Pakai',
    defaultPageSize: 10,
    defaultSortBy: 'id',
    defaultSortOrder: 'asc'
  }
)

const isExportingExcel = ref(false)
const isExportingPdf = ref(false)

const statusOptions = [
  { label: 'Semua Status', value: 'all' },
  { label: 'Aktif', value: '1' },
  { label: 'Nonaktif', value: '0' }
]

// Export columns for Satuan Beli
const exportColumnsBeli: ExportColumn<SatuanBeli>[] = [
  { key: 'no', label: 'No.' },
  { key: 'kode', label: 'Kode', formatter: val => String(val || '-') },
  { key: 'nama', label: 'Nama Satuan Beli', formatter: val => String(val || '-') },
  {
    key: 'default',
    label: 'Default',
    formatter: val => (Number(val) === 1 ? 'Ya' : 'Tidak')
  },
  {
    key: 'status',
    label: 'Status',
    formatter: val => (Number(val) === 1 ? 'Aktif' : 'Nonaktif')
  }
]

// Export columns for Satuan Pakai
const exportColumnsPakai: ExportColumn<SatuanPakai>[] = [
  { key: 'no', label: 'No.' },
  { key: 'kode', label: 'Kode', formatter: val => String(val || '-') },
  { key: 'nama', label: 'Nama Satuan Pakai', formatter: val => String(val || '-') },
  { key: 'satuan_beli_nama', label: 'Satuan Beli Terkait', formatter: val => String(val || '-') },
  { key: 'pembagi', label: 'Nilai Pembagi', formatter: val => String(val ?? 1) }
]

async function handleExportExcel() {
  isExportingExcel.value = true
  try {
    if (activeTab.value === 'beli') {
      const data = await satuanBeliService.exportAll({
        search: crudBeli.searchQuery.value,
        status: crudBeli.statusFilter.value === 'all' ? undefined : crudBeli.statusFilter.value
      })
      exportToExcel<SatuanBeli>({
        filename: 'master-data-satuan-beli',
        title: 'Master Data Satuan Beli Bahan',
        columns: exportColumnsBeli,
        data
      })
    } else {
      const data = await satuanPakaiService.exportAll({
        search: crudPakai.searchQuery.value
      })
      exportToExcel<SatuanPakai>({
        filename: 'master-data-satuan-pakai',
        title: 'Master Data Satuan Pakai Bahan',
        columns: exportColumnsPakai,
        data
      })
    }
  } finally {
    isExportingExcel.value = false
  }
}

async function handleExportPdf() {
  isExportingPdf.value = true
  try {
    if (activeTab.value === 'beli') {
      const data = await satuanBeliService.exportAll({
        search: crudBeli.searchQuery.value,
        status: crudBeli.statusFilter.value === 'all' ? undefined : crudBeli.statusFilter.value
      })
      exportToPdf<SatuanBeli>({
        filename: 'master-data-satuan-beli',
        title: 'Master Data Satuan Beli Bahan',
        subtitle: `Dicetak: ${new Date().toLocaleDateString('id-ID')} | Total: ${data.length} satuan`,
        columns: exportColumnsBeli,
        data
      })
    } else {
      const data = await satuanPakaiService.exportAll({
        search: crudPakai.searchQuery.value
      })
      exportToPdf<SatuanPakai>({
        filename: 'master-data-satuan-pakai',
        title: 'Master Data Satuan Pakai Bahan',
        subtitle: `Dicetak: ${new Date().toLocaleDateString('id-ID')} | Total: ${data.length} satuan`,
        columns: exportColumnsPakai,
        data
      })
    }
  } finally {
    isExportingPdf.value = false
  }
}

async function handleImportSuccess() {
  if (activeTab.value === 'beli') {
    crudBeli.isImportOpen.value = false
    await crudBeli.fetchList()
  } else {
    crudPakai.isImportOpen.value = false
    await crudPakai.fetchList()
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <AppPageHeader
      title="Master Data Satuan Bahan"
      subtitle="Kelola konversi satuan beli pengadaan dan satuan pakai produksi bahan baku"
      :breadcrumbs="[
        { label: 'Setting', to: '/settings/material-units' },
        { label: 'Satuan Bahan' }
      ]"
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
            v-if="hasPermission('settings.material-units', 'create')"
            variant="outline"
            size="sm"
            @click="
              activeTab === 'beli'
                ? (crudBeli.isImportOpen.value = true)
                : (crudPakai.isImportOpen.value = true)
            "
          >
            <Upload class="w-4 h-4 mr-1.5" />
            Import Excel
          </AppButton>

          <AppButton
            v-if="hasPermission('settings.material-units', 'create')"
            variant="primary"
            size="sm"
            @click="activeTab === 'beli' ? crudBeli.openCreate() : crudPakai.openCreate()"
          >
            <Plus class="w-4 h-4 mr-1.5" />
            {{ activeTab === 'beli' ? 'Tambah Satuan Beli' : 'Tambah Satuan Pakai' }}
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <!-- Tab navigation -->
    <div class="border-b border-slate-200 dark:border-slate-800 flex items-center gap-4">
      <button
        type="button"
        class="pb-3 text-sm font-semibold transition-colors border-b-2 cursor-pointer flex items-center gap-2"
        :class="
          activeTab === 'beli'
            ? 'border-primary-600 text-primary-600 dark:text-primary-400'
            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
        "
        @click="activeTab = 'beli'"
      >
        <span>Satuan Beli</span>
        <span
          class="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
        >
          {{ crudBeli.totalItems.value }}
        </span>
      </button>

      <button
        type="button"
        class="pb-3 text-sm font-semibold transition-colors border-b-2 cursor-pointer flex items-center gap-2"
        :class="
          activeTab === 'pakai'
            ? 'border-primary-600 text-primary-600 dark:text-primary-400'
            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
        "
        @click="activeTab = 'pakai'"
      >
        <span>Satuan Pakai (Konversi Produksi)</span>
        <span
          class="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
        >
          {{ crudPakai.totalItems.value }}
        </span>
      </button>
    </div>

    <!-- TAB 1: SATUAN BELI -->
    <div v-if="activeTab === 'beli'" class="space-y-4">
      <!-- Toolbar -->
      <div
        class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-3 justify-between"
      >
        <div class="relative w-full sm:w-80">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <AppInput
            :model-value="crudBeli.searchQuery.value"
            placeholder="Cari kode, nama satuan beli..."
            class="pl-9"
            @update:model-value="crudBeli.handleSearch(String($event))"
          />
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto">
          <AppSelect
            :model-value="String(crudBeli.statusFilter.value)"
            :options="statusOptions"
            class="w-40"
            @update:model-value="crudBeli.handleFilterStatus(String($event))"
          />
          <AppButton
            variant="ghost"
            size="sm"
            class="px-2.5"
            title="Muat ulang data"
            @click="crudBeli.fetchList"
          >
            <RefreshCw
              class="w-4 h-4 text-slate-500"
              :class="{ 'animate-spin': crudBeli.isLoading.value }"
            />
          </AppButton>
        </div>
      </div>

      <!-- Table Beli -->
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
                  @click="crudBeli.handleSort('kode')"
                >
                  Kode
                </th>
                <th
                  scope="col"
                  class="px-4 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none"
                  @click="crudBeli.handleSort('nama')"
                >
                  Nama Satuan Beli
                </th>
                <th scope="col" class="px-4 py-3.5 text-center">Default</th>
                <th scope="col" class="px-4 py-3.5 text-center">Status</th>
                <th scope="col" class="px-4 py-3.5 text-center w-28">Aksi</th>
              </tr>
            </thead>

            <AppTableSkeleton
              v-if="crudBeli.isLoading.value"
              :columns-count="6"
              :rows-count="crudBeli.pageSize.value"
            />

            <tbody v-else-if="crudBeli.items.value.length === 0">
              <tr>
                <td colspan="6" class="p-8">
                  <AppEmptyState
                    title="Tidak ada data satuan beli"
                    description="Belum ada satuan beli yang sesuai pencarian atau filter."
                    action-label="Tambah Satuan Beli"
                    @action="crudBeli.openCreate"
                  />
                </td>
              </tr>
            </tbody>

            <tbody v-else class="divide-y divide-slate-200 dark:divide-slate-800">
              <tr
                v-for="(item, idx) in crudBeli.items.value"
                :key="item.id"
                class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <td class="px-4 py-3 text-center text-xs text-slate-400">
                  {{ (crudBeli.currentPage.value - 1) * crudBeli.pageSize.value + idx + 1 }}
                </td>

                <td
                  class="px-4 py-3 font-mono text-xs font-semibold text-slate-800 dark:text-slate-100"
                >
                  {{ item.kode || '-' }}
                </td>

                <td class="px-4 py-3 font-medium text-slate-900 dark:text-white">
                  {{ item.nama }}
                </td>

                <td class="px-4 py-3 text-center">
                  <span
                    v-if="item.default === 1"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  >
                    <Check class="w-3 h-3" />
                    Default
                  </span>
                  <span v-else class="text-xs text-slate-400">-</span>
                </td>

                <td class="px-4 py-3 text-center">
                  <AppStatusBadge :status="item.status === 1 ? 'active' : 'inactive'" />
                </td>

                <td class="px-4 py-3 text-center">
                  <div class="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      class="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                      title="Lihat Detail"
                      @click="crudBeli.openDetail(item)"
                    >
                      <Eye class="w-4 h-4" />
                    </button>

                    <button
                      v-if="hasPermission('settings.material-units', 'update')"
                      type="button"
                      class="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                      title="Edit Satuan"
                      @click="crudBeli.openEdit(item)"
                    >
                      <Edit2 class="w-4 h-4" />
                    </button>

                    <button
                      v-if="hasPermission('settings.material-units', 'delete')"
                      type="button"
                      class="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                      title="Hapus Satuan"
                      @click="crudBeli.handleDelete(item, item.nama || String(item.id))"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-if="crudBeli.totalItems.value > 0"
          class="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between"
        >
          <span class="text-xs text-slate-500">
            Total:
            <strong class="text-slate-800 dark:text-white">{{ crudBeli.totalItems.value }}</strong>
            satuan beli
          </span>
          <AppPagination
            :current-page="crudBeli.currentPage.value"
            :page-size="crudBeli.pageSize.value"
            :total-items="crudBeli.totalItems.value"
            @update:current-page="crudBeli.handlePageChange"
            @update:page-size="crudBeli.handlePageSizeChange"
          />
        </div>
      </div>
    </div>

    <!-- TAB 2: SATUAN PAKAI -->
    <div v-else class="space-y-4">
      <!-- Toolbar -->
      <div
        class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-3 justify-between"
      >
        <div class="relative w-full sm:w-80">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <AppInput
            :model-value="crudPakai.searchQuery.value"
            placeholder="Cari kode, nama satuan pakai, satuan beli..."
            class="pl-9"
            @update:model-value="crudPakai.handleSearch(String($event))"
          />
        </div>

        <div class="flex items-center gap-2">
          <AppButton
            variant="ghost"
            size="sm"
            class="px-2.5"
            title="Muat ulang data"
            @click="crudPakai.fetchList"
          >
            <RefreshCw
              class="w-4 h-4 text-slate-500"
              :class="{ 'animate-spin': crudPakai.isLoading.value }"
            />
          </AppButton>
        </div>
      </div>

      <!-- Table Pakai -->
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
                  @click="crudPakai.handleSort('kode')"
                >
                  Kode
                </th>
                <th
                  scope="col"
                  class="px-4 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none"
                  @click="crudPakai.handleSort('nama')"
                >
                  Nama Satuan Pakai
                </th>
                <th scope="col" class="px-4 py-3.5">Satuan Beli Induk</th>
                <th
                  scope="col"
                  class="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none"
                  @click="crudPakai.handleSort('pembagi')"
                >
                  Faktor Pembagi (Konversi)
                </th>
                <th scope="col" class="px-4 py-3.5 text-center w-28">Aksi</th>
              </tr>
            </thead>

            <AppTableSkeleton
              v-if="crudPakai.isLoading.value"
              :columns-count="6"
              :rows-count="crudPakai.pageSize.value"
            />

            <tbody v-else-if="crudPakai.items.value.length === 0">
              <tr>
                <td colspan="6" class="p-8">
                  <AppEmptyState
                    title="Tidak ada data satuan pakai"
                    description="Belum ada satuan pakai yang sesuai pencarian."
                    action-label="Tambah Satuan Pakai"
                    @action="crudPakai.openCreate"
                  />
                </td>
              </tr>
            </tbody>

            <tbody v-else class="divide-y divide-slate-200 dark:divide-slate-800">
              <tr
                v-for="(item, idx) in crudPakai.items.value"
                :key="item.id"
                class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <td class="px-4 py-3 text-center text-xs text-slate-400">
                  {{ (crudPakai.currentPage.value - 1) * crudPakai.pageSize.value + idx + 1 }}
                </td>

                <td
                  class="px-4 py-3 font-mono text-xs font-semibold text-slate-800 dark:text-slate-100"
                >
                  {{ item.kode || '-' }}
                </td>

                <td class="px-4 py-3 font-medium text-slate-900 dark:text-white">
                  {{ item.nama }}
                </td>

                <td class="px-4 py-3 text-slate-700 dark:text-slate-300">
                  {{ item.satuan_beli_nama }}
                </td>

                <td
                  class="px-4 py-3 text-right font-mono font-semibold text-primary-600 dark:text-primary-400"
                >
                  {{ item.pembagi }}
                </td>

                <td class="px-4 py-3 text-center">
                  <div class="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      class="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                      title="Lihat Detail"
                      @click="crudPakai.openDetail(item)"
                    >
                      <Eye class="w-4 h-4" />
                    </button>

                    <button
                      v-if="hasPermission('settings.material-units', 'update')"
                      type="button"
                      class="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                      title="Edit Satuan Pakai"
                      @click="crudPakai.openEdit(item)"
                    >
                      <Edit2 class="w-4 h-4" />
                    </button>

                    <button
                      v-if="hasPermission('settings.material-units', 'delete')"
                      type="button"
                      class="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                      title="Hapus Satuan Pakai"
                      @click="crudPakai.handleDelete(item, item.nama || String(item.id))"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-if="crudPakai.totalItems.value > 0"
          class="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between"
        >
          <span class="text-xs text-slate-500">
            Total:
            <strong class="text-slate-800 dark:text-white">{{ crudPakai.totalItems.value }}</strong>
            satuan pakai
          </span>
          <AppPagination
            :current-page="crudPakai.currentPage.value"
            :page-size="crudPakai.pageSize.value"
            :total-items="crudPakai.totalItems.value"
            @update:current-page="crudPakai.handlePageChange"
            @update:page-size="crudPakai.handlePageSizeChange"
          />
        </div>
      </div>
    </div>

    <!-- Modals for Satuan Beli -->
    <SatuanBeliFormModal
      v-model="crudBeli.isFormOpen.value"
      :initial-data="crudBeli.selectedItem.value"
      :loading="crudBeli.isSaving.value"
      @submit="crudBeli.saveItem($event)"
    />

    <SatuanBeliDetailModal
      v-model="crudBeli.isDetailOpen.value"
      :unit="crudBeli.selectedItem.value"
    />

    <AppImportExcelModal
      v-model="crudBeli.isImportOpen.value"
      title="Master Data Satuan Beli"
      :template-definition="SATUAN_BELI_IMPORT_TEMPLATE"
      :row-mapper="satuanBeliRowMapper.mapRow"
      :import-service="satuanBeliService.importBatch.bind(satuanBeliService)"
      @imported="handleImportSuccess"
    />

    <!-- Modals for Satuan Pakai -->
    <SatuanPakaiFormModal
      v-model="crudPakai.isFormOpen.value"
      :initial-data="crudPakai.selectedItem.value"
      :loading="crudPakai.isSaving.value"
      @submit="crudPakai.saveItem($event)"
    />

    <SatuanPakaiDetailModal
      v-model="crudPakai.isDetailOpen.value"
      :unit="crudPakai.selectedItem.value"
    />

    <AppImportExcelModal
      v-model="crudPakai.isImportOpen.value"
      title="Master Data Satuan Pakai"
      :template-definition="SATUAN_PAKAI_IMPORT_TEMPLATE"
      :row-mapper="satuanPakaiRowMapper.mapRow"
      :import-service="satuanPakaiService.importBatch.bind(satuanPakaiService)"
      @imported="handleImportSuccess"
    />
  </div>
</template>
