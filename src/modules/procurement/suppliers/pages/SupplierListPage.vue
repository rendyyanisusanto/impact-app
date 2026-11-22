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
import SupplierFormModal from '../components/SupplierFormModal.vue'
import SupplierDetailModal from '../components/SupplierDetailModal.vue'
import { supplierService } from '../services/supplier.service'
import { SUPPLIER_IMPORT_TEMPLATE, supplierRowMapper } from '../utils/supplier-import.config'
import type {
  MasterDataSuplier,
  CreateSupplierDto,
  UpdateSupplierDto
} from '../types/supplier.types'
import { useCrud } from '@/shared/composables/useCrud'
import { usePermission } from '@/shared/composables/usePermission'
import { exportToExcel } from '@/shared/utils/excel-export'
import { exportToPdf } from '@/shared/utils/pdf-export'
import type { ExportColumn } from '@/shared/types/crud.types'
import { Plus, Search, RefreshCw, Upload, Eye, Edit2, Trash2 } from 'lucide-vue-next'

const { hasPermission } = usePermission()

const crud = useCrud<MasterDataSuplier, CreateSupplierDto, UpdateSupplierDto>(supplierService, {
  resourceName: 'procurement.suppliers',
  entityLabel: 'Supplier',
  defaultPageSize: 10,
  defaultSortBy: 'id',
  defaultSortOrder: 'desc'
})

// Exporting state
const isExportingExcel = ref(false)
const isExportingPdf = ref(false)

const statusOptions = [
  { label: 'Semua Status', value: 'all' },
  { label: 'Aktif', value: '1' },
  { label: 'Nonaktif', value: '0' }
]

const exportColumns: ExportColumn<MasterDataSuplier>[] = [
  { key: 'no', label: 'No.' },
  { key: 'kode', label: 'Kode' },
  { key: 'nama', label: 'Nama Supplier' },
  { key: 'no_hp', label: 'No. HP' },
  { key: 'email', label: 'Email' },
  { key: 'province_name', label: 'Provinsi' },
  { key: 'city_name', label: 'Kota / Kab' },
  {
    key: 'status',
    label: 'Status',
    formatter: val => (Number(val) === 1 ? 'Aktif' : 'Nonaktif')
  }
]

async function handleExportExcel() {
  isExportingExcel.value = true
  try {
    const data = await supplierService.exportAll({
      search: crud.searchQuery.value,
      status: crud.statusFilter.value === 'all' ? undefined : crud.statusFilter.value
    })

    exportToExcel<MasterDataSuplier>({
      filename: 'master-data-supplier',
      title: 'Master Data Supplier',
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
    const data = await supplierService.exportAll({
      search: crud.searchQuery.value,
      status: crud.statusFilter.value === 'all' ? undefined : crud.statusFilter.value
    })

    exportToPdf<MasterDataSuplier>({
      filename: 'master-data-supplier',
      title: 'Laporan Master Data Supplier',
      subtitle: 'Daftar Vendor dan Rekanan Pengadaan Bahan Baku',
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
      title="Master Data Supplier"
      subtitle="Kelola data vendor, kontak, dan rekanan pengadaan bahan baku."
    >
      <template #actions>
        <AppButton
          v-if="hasPermission('procurement.suppliers', 'create')"
          variant="primary"
          size="sm"
          @click="crud.openCreate"
        >
          <template #left-icon>
            <Plus class="w-4 h-4" />
          </template>
          <span>Tambah Supplier</span>
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
            placeholder="Cari kode, nama, telepon..."
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
        <!-- Import Button (requires create permission) -->
        <AppButton
          v-if="hasPermission('procurement.suppliers', 'create')"
          variant="secondary"
          size="sm"
          title="Import data supplier dari spreadsheet Excel"
          @click="crud.isImportOpen.value = true"
        >
          <template #left-icon>
            <Upload class="w-3.5 h-3.5 text-teal-700" />
          </template>
          <span>Import Excel</span>
        </AppButton>

        <!-- Export Actions (Excel & PDF) -->
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
                Nama Supplier
              </th>
              <th class="py-2.5 px-3">No. HP</th>
              <th class="py-2.5 px-3">Email</th>
              <th class="py-2.5 px-3">Provinsi</th>
              <th class="py-2.5 px-3">Kota / Kab</th>
              <th class="py-2.5 px-3 text-center">Status</th>
              <th class="py-2.5 px-3 text-right w-28">Aksi</th>
            </tr>
          </thead>

          <!-- Loading Skeleton -->
          <AppTableSkeleton
            v-if="crud.isLoading.value"
            :columns-count="7"
            :rows-count="crud.pageSize.value"
          />

          <!-- Empty State -->
          <tbody v-else-if="crud.items.value.length === 0">
            <tr>
              <td colspan="9" class="p-8">
                <AppEmptyState
                  title="Tidak Ada Data Supplier"
                  description="Belum ada data supplier yang sesuai dengan pencarian atau filter yang aktif."
                />
              </td>
            </tr>
          </tbody>

          <!-- Table Body -->
          <tbody v-else class="divide-y divide-slate-100">
            <tr
              v-for="(item, index) in crud.items.value"
              :key="item.id"
              class="hover:bg-slate-50/75 transition-colors"
            >
              <td class="py-2.5 px-3 text-center text-slate-400 font-medium">
                {{ (crud.currentPage.value - 1) * crud.pageSize.value + index + 1 }}
              </td>
              <td class="py-2.5 px-3 font-semibold text-teal-800">
                {{ item.kode }}
              </td>
              <td class="py-2.5 px-3 font-medium text-slate-800">
                {{ item.nama }}
              </td>
              <td class="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                {{ item.no_hp }}
              </td>
              <td class="py-2.5 px-3 text-slate-600">
                {{ item.email }}
              </td>
              <td class="py-2.5 px-3 text-slate-600">
                {{ item.province_name || '-' }}
              </td>
              <td class="py-2.5 px-3 text-slate-600">
                {{ item.city_name || '-' }}
              </td>
              <td class="py-2.5 px-3 text-center whitespace-nowrap">
                <AppStatusBadge :status="item.status === 1 ? 'active' : 'inactive'" />
              </td>
              <td class="py-2.5 px-3 text-right whitespace-nowrap">
                <div class="flex items-center justify-end gap-1">
                  <!-- Detail Button -->
                  <button
                    type="button"
                    class="p-1 rounded text-slate-500 hover:text-teal-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Lihat Detail"
                    @click="crud.openDetail(item)"
                  >
                    <Eye class="w-3.5 h-3.5" />
                  </button>

                  <!-- Edit Button -->
                  <button
                    v-if="hasPermission('procurement.suppliers', 'update')"
                    type="button"
                    class="p-1 rounded text-slate-500 hover:text-amber-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Ubah Data"
                    @click="crud.openEdit(item)"
                  >
                    <Edit2 class="w-3.5 h-3.5" />
                  </button>

                  <!-- Delete Button -->
                  <button
                    v-if="hasPermission('procurement.suppliers', 'delete')"
                    type="button"
                    class="p-1 rounded text-slate-500 hover:text-rose-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Hapus Supplier"
                    @click="crud.handleDelete(item, item.nama)"
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
          total <strong class="text-slate-800">{{ crud.totalItems.value }}</strong> supplier
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
    <SupplierFormModal
      v-model="crud.isFormOpen.value"
      :initial-data="crud.selectedItem.value"
      :loading="crud.isSaving.value"
      @submit="crud.saveItem($event)"
    />

    <SupplierDetailModal v-model="crud.isDetailOpen.value" :supplier="crud.selectedItem.value" />

    <AppImportExcelModal
      v-model="crud.isImportOpen.value"
      title="Master Data Supplier"
      :template-definition="SUPPLIER_IMPORT_TEMPLATE"
      :row-mapper="supplierRowMapper"
      :import-service="supplierService.importBatch.bind(supplierService)"
      @imported="handleImportSuccess"
    />
  </div>
</template>
