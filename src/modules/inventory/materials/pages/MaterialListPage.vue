<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
import MaterialFormModal from '../components/MaterialFormModal.vue'
import MaterialDetailModal from '../components/MaterialDetailModal.vue'
import { materialService } from '../services/material.service'
import { referenceService } from '@/shared/services/reference.service'
import { MATERIAL_IMPORT_TEMPLATE, materialRowMapper } from '../utils/material-import.config'
import type { MasterDataBahan, CreateMaterialDto, UpdateMaterialDto } from '../types/material.types'
import { useCrud } from '@/shared/composables/useCrud'
import { usePermission } from '@/shared/composables/usePermission'
import { exportToExcel } from '@/shared/utils/excel-export'
import { exportToPdf } from '@/shared/utils/pdf-export'
import type { ExportColumn } from '@/shared/types/crud.types'
import { Plus, Search, RefreshCw, Upload, Eye, Edit2, Trash2, Package } from 'lucide-vue-next'
import AppSearchableSelect, {
  type SearchableOption
} from '@/shared/components/ui/AppSearchableSelect.vue'
import { MOCK_GUDANG } from '@/mocks/references/master-references.mock'

const { hasPermission } = usePermission()

const crud = useCrud<MasterDataBahan, CreateMaterialDto, UpdateMaterialDto>(materialService, {
  resourceName: 'inventory.materials',
  entityLabel: 'Bahan',
  defaultPageSize: 10,
  defaultSortBy: 'id',
  defaultSortOrder: 'desc'
})

const isExportingExcel = ref(false)
const isExportingPdf = ref(false)
const selectedGudangFilter = ref<string | number | null>('all')
const dbGudangFilterList = ref<Array<{ id: number; nama: string }>>([])

const gudangFilterOptions = computed<SearchableOption[]>(() => {
  const warehouses = dbGudangFilterList.value.length > 0 ? dbGudangFilterList.value : MOCK_GUDANG
  return [
    { label: 'Semua Gudang', value: 'all' },
    ...warehouses.map(g => ({ label: g.nama, value: g.id }))
  ]
})

onMounted(async () => {
  try {
    const lookups = await materialService.getLookups()
    referenceService.syncFromLookups(lookups)
    if (lookups.warehouses && lookups.warehouses.length > 0) {
      dbGudangFilterList.value = lookups.warehouses.map(w => ({
        id: Number(w.id),
        nama: w.nama || `Gudang #${w.id}`
      }))
    }
  } catch {
    // Non-blocking fallback
  }
})

function handleGudangFilter(val: string | number | null) {
  selectedGudangFilter.value = val
  crud.handleFilter('gudang_id', val === 'all' || val === null ? undefined : Number(val))
}

const statusOptions = [
  { label: 'Semua Status', value: 'all' },
  { label: 'Aktif', value: '1' },
  { label: 'Nonaktif', value: '0' }
]

const exportColumns: ExportColumn<MasterDataBahan>[] = [
  { key: 'no', label: 'No.' },
  { key: 'kode', label: 'Kode', formatter: val => String(val || '-') },
  { key: 'nama', label: 'Nama Bahan', formatter: val => String(val || '-') },
  { key: 'qty', label: 'Stok', formatter: val => String(val ?? 0) },
  { key: 'min_qty', label: 'Min Stok', formatter: val => String(val ?? 0) },
  { key: 'satuan_pakai_nama', label: 'Satuan Pakai', formatter: val => String(val || '-') },
  { key: 'satuan_beli_nama', label: 'Satuan Beli', formatter: val => String(val || '-') },
  { key: 'gudang_nama', label: 'Gudang', formatter: val => String(val || '-') },
  { key: 'harga_satuan_formatted', label: 'Harga Satuan' },
  {
    key: 'status',
    label: 'Status',
    formatter: val => (Number(val) === 1 ? 'Aktif' : 'Nonaktif')
  }
]

async function handleExportExcel() {
  isExportingExcel.value = true
  try {
    const data = await materialService.exportAll({
      search: crud.searchQuery.value,
      status: crud.statusFilter.value === 'all' ? undefined : crud.statusFilter.value
    })

    exportToExcel<MasterDataBahan>({
      filename: 'master-data-bahan',
      title: 'Master Data Bahan Baku & Material',
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
    const data = await materialService.exportAll({
      search: crud.searchQuery.value,
      status: crud.statusFilter.value === 'all' ? undefined : crud.statusFilter.value
    })

    exportToPdf<MasterDataBahan>({
      filename: 'master-data-bahan',
      title: 'Laporan Master Data Bahan Baku & Material',
      subtitle: 'Daftar Persediaan Material, Gudang, dan Satuan',
      orientation: 'landscape',
      columns: exportColumns,
      data
    })
  } finally {
    isExportingPdf.value = false
  }
}

async function handleImportSuccess(_count: number) {
  await crud.fetchList()
}
</script>

<template>
  <div class="space-y-4 pb-12">
    <!-- Page Header -->
    <AppPageHeader
      title="Master Data Bahan"
      subtitle="Kelola persediaan bahan baku, harga satuan, gudang, dan konversi satuan produksi."
    >
      <template #actions>
        <AppButton
          v-if="hasPermission('inventory.materials', 'create')"
          variant="primary"
          size="sm"
          @click="crud.openCreate"
        >
          <template #left-icon>
            <Plus class="w-4 h-4" />
          </template>
          <span>Tambah Bahan</span>
        </AppButton>
      </template>
    </AppPageHeader>

    <!-- Toolbar: Search, Filters, Export, Import, Refresh -->
    <div
      class="bg-white border border-slate-200 rounded-lg p-3 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs"
    >
      <!-- Left: Search & Status Filter -->
      <div class="flex flex-wrap items-center gap-2.5 flex-1">
        <div class="w-full sm:w-64">
          <AppInput
            :model-value="crud.searchQuery.value"
            placeholder="Cari kode, nama, gudang..."
            size="sm"
            @update:model-value="crud.handleSearch(String($event))"
          >
            <template #prefix>
              <Search class="w-3.5 h-3.5 text-slate-400" />
            </template>
          </AppInput>
        </div>

        <div class="w-36">
          <AppSelect
            :model-value="crud.statusFilter.value"
            :options="statusOptions"
            size="sm"
            @update:model-value="crud.handleFilterStatus($event)"
          />
        </div>

        <div class="w-44">
          <AppSearchableSelect
            :model-value="selectedGudangFilter"
            :options="gudangFilterOptions"
            placeholder="Semua Gudang"
            size="sm"
            @update:model-value="handleGudangFilter"
          />
        </div>

        <AppButton
          variant="ghost"
          size="sm"
          :loading="crud.isLoading.value"
          title="Segarkan data tabel"
          @click="crud.fetchList"
        >
          <template #left-icon>
            <RefreshCw class="w-3.5 h-3.5 text-slate-600" />
          </template>
          Segarkan
        </AppButton>
      </div>

      <!-- Right: Import & Export Actions -->
      <div
        class="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 justify-end"
      >
        <AppButton
          v-if="hasPermission('inventory.materials', 'create')"
          variant="secondary"
          size="sm"
          title="Import data bahan dari spreadsheet Excel"
          @click="crud.isImportOpen.value = true"
        >
          <template #left-icon>
            <Upload class="w-3.5 h-3.5 text-teal-700" />
          </template>
          <span>Import Excel</span>
        </AppButton>

        <AppExportActions
          :exporting-excel="isExportingExcel"
          :exporting-pdf="isExportingPdf"
          :disabled="crud.isLoading.value"
          @export-excel="handleExportExcel"
          @export-pdf="handleExportPdf"
        />
      </div>
    </div>

    <!-- Data Table Card -->
    <div class="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr
              class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold select-none"
            >
              <th class="py-2.5 px-3 w-12 text-center">No.</th>
              <th class="py-2.5 px-3 w-14 text-center">Foto</th>
              <th
                class="py-2.5 px-3 cursor-pointer hover:text-slate-900"
                @click="crud.handleSort('kode')"
              >
                Kode
              </th>
              <th
                class="py-2.5 px-3 cursor-pointer hover:text-slate-900"
                @click="crud.handleSort('nama')"
              >
                Nama Bahan
              </th>
              <th class="py-2.5 px-3 text-right">Stok</th>
              <th class="py-2.5 px-3 text-right">Min Stok</th>
              <th class="py-2.5 px-3">Satuan Pakai</th>
              <th class="py-2.5 px-3">Satuan Beli</th>
              <th class="py-2.5 px-3">Gudang</th>
              <th class="py-2.5 px-3 text-right">Harga Satuan</th>
              <th class="py-2.5 px-3 text-center">Status</th>
              <th class="py-2.5 px-3 text-right w-28">Aksi</th>
            </tr>
          </thead>

          <AppTableSkeleton
            v-if="crud.isLoading.value"
            :columns-count="11"
            :rows-count="crud.pageSize.value"
          />

          <tbody v-else-if="crud.items.value.length === 0">
            <tr>
              <td colspan="12" class="p-8">
                <AppEmptyState
                  title="Tidak Ada Data Bahan"
                  description="Belum ada data bahan yang sesuai dengan pencarian atau filter yang aktif."
                />
              </td>
            </tr>
          </tbody>

          <tbody v-else class="divide-y divide-slate-100">
            <tr
              v-for="(item, index) in crud.items.value"
              :key="item.id"
              class="hover:bg-slate-50/75 transition-colors"
            >
              <td class="py-2.5 px-3 text-center text-slate-400 font-medium">
                {{ (crud.currentPage.value - 1) * crud.pageSize.value + index + 1 }}
              </td>

              <!-- Foto Thumbnail Column -->
              <td class="py-2 px-3 text-center">
                <div
                  class="w-9 h-9 rounded-md border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center mx-auto shrink-0 shadow-2xs"
                >
                  <img
                    v-if="item.foto"
                    :src="item.foto"
                    :alt="item.nama || 'Foto Bahan'"
                    class="w-full h-full object-cover"
                    @error="item.foto = null"
                  />
                  <Package v-else class="w-4 h-4 text-slate-400" />
                </div>
              </td>

              <td class="py-2.5 px-3 font-semibold text-teal-800">
                {{ item.kode || '-' }}
              </td>
              <td class="py-2.5 px-3 font-medium text-slate-800">
                {{ item.nama || '-' }}
              </td>

              <!-- Stok with Low Stock visual indicator -->
              <td class="py-2.5 px-3 text-right font-bold whitespace-nowrap">
                <span
                  :class="[
                    item.qty !== null && item.min_qty !== null && item.qty <= item.min_qty
                      ? 'text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200'
                      : 'text-slate-800'
                  ]"
                >
                  {{ item.qty ?? 0 }}
                </span>
              </td>

              <!-- Min Stok -->
              <td class="py-2.5 px-3 text-right text-slate-500 whitespace-nowrap">
                {{ item.min_qty ?? 0 }}
              </td>

              <td class="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                {{ item.satuan_pakai_nama || '-' }}
              </td>

              <td class="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                {{ item.satuan_beli_nama || '-' }}
              </td>

              <td class="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                {{ item.gudang_nama || '-' }}
              </td>

              <td class="py-2.5 px-3 text-right text-slate-800 font-medium whitespace-nowrap">
                {{ item.harga_satuan_formatted || '-' }}
              </td>

              <td class="py-2.5 px-3 text-center whitespace-nowrap">
                <AppStatusBadge :status="item.status === 1 ? 'active' : 'inactive'" />
              </td>

              <td class="py-2.5 px-3 text-right whitespace-nowrap">
                <div class="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    class="p-1 rounded text-slate-500 hover:text-teal-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Lihat Detail"
                    @click="crud.openDetail(item)"
                  >
                    <Eye class="w-3.5 h-3.5" />
                  </button>

                  <button
                    v-if="hasPermission('inventory.materials', 'update')"
                    type="button"
                    class="p-1 rounded text-slate-500 hover:text-amber-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Ubah Data"
                    @click="crud.openEdit(item)"
                  >
                    <Edit2 class="w-3.5 h-3.5" />
                  </button>

                  <button
                    v-if="hasPermission('inventory.materials', 'delete')"
                    type="button"
                    class="p-1 rounded text-slate-500 hover:text-rose-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Hapus Bahan"
                    @click="crud.handleDelete(item, item.nama || String(item.id))"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div
        class="p-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3"
      >
        <span class="text-xs text-slate-500">
          Menampilkan <strong class="text-slate-800">{{ crud.items.value.length }}</strong> dari
          total <strong class="text-slate-800">{{ crud.totalItems.value }}</strong> bahan
        </span>

        <AppPagination
          :current-page="crud.currentPage.value"
          :total-items="crud.totalItems.value"
          :page-size="crud.pageSize.value"
          @update:current-page="crud.handlePageChange"
        />
      </div>
    </div>

    <!-- Modals -->
    <MaterialFormModal
      v-model="crud.isFormOpen.value"
      :initial-data="crud.selectedItem.value"
      :loading="crud.isSaving.value"
      @submit="crud.saveItem($event)"
    />

    <MaterialDetailModal v-model="crud.isDetailOpen.value" :material="crud.selectedItem.value" />

    <AppImportExcelModal
      v-model="crud.isImportOpen.value"
      title="Master Data Bahan"
      :template-definition="MATERIAL_IMPORT_TEMPLATE"
      :row-mapper="materialRowMapper"
      :import-service="materialService.importBatch.bind(materialService)"
      @imported="handleImportSuccess"
    />
  </div>
</template>
