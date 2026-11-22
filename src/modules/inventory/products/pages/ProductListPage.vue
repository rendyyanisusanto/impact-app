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
import ProductFormModal from '../components/ProductFormModal.vue'
import ProductDetailModal from '../components/ProductDetailModal.vue'
import {
  productService,
  MOCK_PRODUCT_CATEGORIES,
  MOCK_PRODUCT_WAREHOUSES,
  type ProductLookups
} from '../services/product.service'
import { PRODUCT_IMPORT_TEMPLATE, productRowMapper } from '../utils/product-import.config'
import type { Produk, CreateProductDto, UpdateProductDto } from '../types/product.types'
import { useCrud } from '@/shared/composables/useCrud'
import { usePermission } from '@/shared/composables/usePermission'
import { exportToExcel } from '@/shared/utils/excel-export'
import { exportToPdf } from '@/shared/utils/pdf-export'
import type { ExportColumn } from '@/shared/types/crud.types'
import {
  Plus,
  Search,
  RefreshCw,
  Upload,
  Eye,
  Edit2,
  Trash2,
  Package,
  AlertTriangle
} from 'lucide-vue-next'
import AppSearchableSelect, {
  type SearchableOption
} from '@/shared/components/ui/AppSearchableSelect.vue'

const { hasPermission } = usePermission()

const crud = useCrud<Produk, CreateProductDto, UpdateProductDto>(productService, {
  resourceName: 'inventory.products',
  entityLabel: 'Produk',
  defaultPageSize: 10,
  defaultSortBy: 'created_at',
  defaultSortOrder: 'desc'
})

const isExportingExcel = ref(false)
const isExportingPdf = ref(false)
const selectedGudangFilter = ref<string | number | null>('all')
const selectedKategoriFilter = ref<string | number | null>('all')
const liveLookups = ref<ProductLookups | null>(null)

onMounted(async () => {
  try {
    if (productService.getLookups) {
      liveLookups.value = await productService.getLookups()
    }
  } catch (err) {
    console.error('Failed to fetch product filter lookups', err)
  }
})

const gudangFilterOptions = computed<SearchableOption[]>(() => {
  const warehouses = liveLookups.value?.warehouses || MOCK_PRODUCT_WAREHOUSES
  return [
    { label: 'Semua Gudang', value: 'all' },
    ...warehouses.map(g => ({ label: g.nama || '-', value: g.id }))
  ]
})

const kategoriFilterOptions = computed<SearchableOption[]>(() => {
  const categories = liveLookups.value?.categories || MOCK_PRODUCT_CATEGORIES
  return [
    { label: 'Semua Kategori', value: 'all' },
    ...categories.map(c => ({ label: c.nama || '-', value: c.id }))
  ]
})

function handleGudangFilter(val: string | number | null) {
  selectedGudangFilter.value = val
  crud.handleFilter('gudang_id', val === 'all' || val === null ? undefined : Number(val))
}

function handleKategoriFilter(val: string | number | null) {
  selectedKategoriFilter.value = val
  crud.handleFilter('kategori_barang_id', val === 'all' || val === null ? undefined : Number(val))
}

const statusOptions = [
  { label: 'Semua Status', value: 'all' },
  { label: 'Aktif', value: '1' },
  { label: 'Nonaktif', value: '0' }
]

const exportColumns: ExportColumn<Produk>[] = [
  { key: 'no', label: 'No.' },
  { key: 'kode', label: 'Kode Produk', formatter: val => String(val || '-') },
  { key: 'nama', label: 'Nama Produk', formatter: val => String(val || '-') },
  { key: 'kategori_barang_nama', label: 'Kategori', formatter: val => String(val || '-') },
  { key: 'gudang_nama', label: 'Gudang', formatter: val => String(val || '-') },
  { key: 'qty', label: 'Stok', formatter: val => String(val ?? 0) },
  { key: 'min_qty', label: 'Min Stok', formatter: val => String(val ?? 0) },
  { key: 'satuan_barang_nama', label: 'Satuan', formatter: val => String(val || '-') },
  { key: 'harga_formatted', label: 'Harga (Rp)' },
  {
    key: 'status',
    label: 'Status',
    formatter: val => (Number(val) === 1 ? 'Aktif' : 'Nonaktif')
  }
]

async function handleExportExcel() {
  isExportingExcel.value = true
  try {
    const data = await productService.exportAll({
      search: crud.searchQuery.value,
      status: crud.statusFilter.value === 'all' ? undefined : crud.statusFilter.value,
      filters: {
        gudang_id: selectedGudangFilter.value === 'all' ? undefined : selectedGudangFilter.value,
        kategori_barang_id:
          selectedKategoriFilter.value === 'all' ? undefined : selectedKategoriFilter.value
      }
    })

    exportToExcel<Produk>({
      filename: 'master-data-produk',
      title: 'Master Data Produk (Barang Jadi)',
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
    const data = await productService.exportAll({
      search: crud.searchQuery.value,
      status: crud.statusFilter.value === 'all' ? undefined : crud.statusFilter.value,
      filters: {
        gudang_id: selectedGudangFilter.value === 'all' ? undefined : selectedGudangFilter.value,
        kategori_barang_id:
          selectedKategoriFilter.value === 'all' ? undefined : selectedKategoriFilter.value
      }
    })

    exportToPdf<Produk>({
      filename: 'master-data-produk',
      title: 'Master Data Produk (Barang Jadi)',
      subtitle: `Dicetak: ${new Date().toLocaleDateString('id-ID')} | Total: ${data.length} item`,
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
      title="Master Data Produk"
      subtitle="Kelola data barang jadi, stok gudang, harga jual, dan spesifikasi produk"
      :breadcrumbs="[
        { label: 'Persediaan', to: '/inventory/products' },
        { label: 'Master Data Produk' }
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
            v-if="hasPermission('inventory.products', 'create')"
            variant="outline"
            size="sm"
            @click="crud.isImportOpen.value = true"
          >
            <Upload class="w-4 h-4 mr-1.5" />
            Import Excel
          </AppButton>

          <AppButton
            v-if="hasPermission('inventory.products', 'create')"
            variant="primary"
            size="sm"
            @click="crud.openCreate"
          >
            <Plus class="w-4 h-4 mr-1.5" />
            Tambah Produk
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <!-- Filters & Search Toolbar -->
    <div
      class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
    >
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <!-- Search Input -->
        <div class="relative">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <AppInput
            :model-value="crud.searchQuery.value"
            placeholder="Cari kode, nama, deskripsi..."
            class="pl-9"
            @update:model-value="crud.handleSearch(String($event))"
          />
        </div>

        <!-- Warehouse Filter -->
        <div>
          <AppSearchableSelect
            v-model="selectedGudangFilter"
            :options="gudangFilterOptions"
            placeholder="Filter Gudang"
            @update:model-value="handleGudangFilter"
          />
        </div>

        <!-- Category Filter -->
        <div>
          <AppSearchableSelect
            v-model="selectedKategoriFilter"
            :options="kategoriFilterOptions"
            placeholder="Filter Kategori"
            @update:model-value="handleKategoriFilter"
          />
        </div>

        <!-- Status Filter & Reset -->
        <div class="flex items-center gap-2">
          <AppSelect
            :model-value="String(crud.statusFilter.value)"
            :options="statusOptions"
            class="flex-1"
            @update:model-value="crud.handleFilterStatus(String($event))"
          />
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
    </div>

    <!-- Table Section -->
    <div
      class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
    >
      <!-- Data Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead
            class="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800"
          >
            <tr>
              <th scope="col" class="px-4 py-3.5 w-12 text-center">No.</th>
              <th scope="col" class="px-3 py-3.5 w-16 text-center">Foto</th>
              <th
                scope="col"
                class="px-4 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none"
                @click="crud.handleSort('kode')"
              >
                Kode
              </th>
              <th
                scope="col"
                class="px-4 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none"
                @click="crud.handleSort('nama')"
              >
                Nama Produk
              </th>
              <th scope="col" class="px-4 py-3.5">Kategori</th>
              <th scope="col" class="px-4 py-3.5">Gudang</th>
              <th
                scope="col"
                class="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none"
                @click="crud.handleSort('qty')"
              >
                Stok
              </th>
              <th scope="col" class="px-4 py-3.5">Satuan</th>
              <th
                scope="col"
                class="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none"
                @click="crud.handleSort('harga')"
              >
                Harga Jual
              </th>
              <th scope="col" class="px-4 py-3.5 text-center">Status</th>
              <th scope="col" class="px-4 py-3.5 text-center w-28">Aksi</th>
            </tr>
          </thead>

          <AppTableSkeleton
            v-if="crud.isLoading.value"
            :columns-count="11"
            :rows-count="crud.pageSize.value"
          />

          <tbody v-else-if="crud.items.value.length === 0">
            <tr>
              <td colspan="11" class="p-8">
                <AppEmptyState
                  title="Tidak ada data produk"
                  description="Belum ada data barang jadi yang sesuai filter atau pencarian Anda."
                  action-label="Tambah Produk Baru"
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
              <!-- Number -->
              <td class="px-4 py-3 text-center text-xs text-slate-400">
                {{ (crud.currentPage.value - 1) * crud.pageSize.value + idx + 1 }}
              </td>

              <!-- Photo Thumbnail -->
              <td class="px-3 py-3 text-center">
                <div
                  class="w-10 h-10 mx-auto rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden"
                >
                  <img
                    v-if="item.foto"
                    :src="item.foto"
                    :alt="item.nama || 'Foto'"
                    class="w-full h-full object-cover"
                    @error="item.foto = null"
                  />
                  <Package v-else class="w-5 h-5 text-slate-400 stroke-1" />
                </div>
              </td>

              <!-- Code -->
              <td
                class="px-4 py-3 font-mono text-xs font-semibold text-slate-800 dark:text-slate-100"
              >
                {{ item.kode || '-' }}
              </td>

              <!-- Name & Description -->
              <td class="px-4 py-3">
                <div class="font-medium text-slate-900 dark:text-white">
                  {{ item.nama }}
                </div>
                <div v-if="item.keterangan" class="text-xs text-slate-400 truncate max-w-xs">
                  {{ item.keterangan }}
                </div>
              </td>

              <!-- Category -->
              <td class="px-4 py-3 text-xs">
                <span
                  class="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {{ item.kategori_barang_nama }}
                </span>
              </td>

              <!-- Warehouse -->
              <td class="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">
                {{ item.gudang_nama }}
              </td>

              <!-- Stock & Min QTY Alert -->
              <td class="px-4 py-3 text-right">
                <div
                  class="flex items-center justify-end gap-1 font-semibold text-slate-900 dark:text-white"
                >
                  <span>{{ item.qty }}</span>
                  <AlertTriangle
                    v-if="item.is_low_stock"
                    class="w-4 h-4 text-amber-500 flex-shrink-0"
                    title="Stok di bawah batas minimal!"
                  />
                </div>
                <div class="text-[11px] text-slate-400">Min: {{ item.min_qty }}</div>
              </td>

              <!-- Unit -->
              <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                {{ item.satuan_barang_nama }}
              </td>

              <!-- Price -->
              <td class="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">
                {{ item.harga_formatted }}
              </td>

              <!-- Status -->
              <td class="px-4 py-3 text-center">
                <AppStatusBadge :status="item.status === 1 ? 'active' : 'inactive'" />
              </td>

              <!-- Actions -->
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
                    v-if="hasPermission('inventory.products', 'update')"
                    type="button"
                    class="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                    title="Edit Produk"
                    @click="crud.openEdit(item)"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>

                  <button
                    v-if="hasPermission('inventory.products', 'delete')"
                    type="button"
                    class="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                    title="Hapus Produk"
                    @click="crud.handleDelete(item, item.nama || String(item.id))"
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
          <strong class="text-slate-800 dark:text-white">{{ crud.totalItems.value }}</strong> produk
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

    <!-- Create / Edit Modal -->
    <ProductFormModal
      v-model="crud.isFormOpen.value"
      :initial-data="crud.selectedItem.value"
      :loading="crud.isSaving.value"
      @submit="crud.saveItem($event)"
    />

    <!-- Detail Modal -->
    <ProductDetailModal v-model="crud.isDetailOpen.value" :product="crud.selectedItem.value" />

    <!-- Import Excel Modal -->
    <AppImportExcelModal
      v-model="crud.isImportOpen.value"
      title="Master Data Produk"
      :template-definition="PRODUCT_IMPORT_TEMPLATE"
      :row-mapper="productRowMapper.mapRow"
      :import-service="productService.importBatch.bind(productService)"
      @imported="handleImportSuccess"
    />
  </div>
</template>
