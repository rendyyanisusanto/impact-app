<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppDataTable from '@/shared/components/data/AppDataTable.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import { bomService } from '../services/bom.service'
import type { BomListItem } from '../types/bom.types'
import type { TableColumn, TableSortState } from '@/shared/types/table.types'
import { usePermission } from '@/shared/composables/usePermission'
import { useToast } from '@/shared/composables/useToast'
import { formatCurrency } from '@/shared/utils/formatters'
import { exportToExcel } from '@/shared/utils/excel-export'
import { exportToPdf } from '@/shared/utils/pdf-export'
import {
  Plus,
  Search,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Printer,
  Eye,
  Edit2,
  Trash2,
  Copy,
  Layers,
  CheckCircle2,
  Package,
  Boxes,
  DollarSign
} from 'lucide-vue-next'

const router = useRouter()
const { hasPermission } = usePermission()
const toast = useToast()

const canCreate = computed(() => hasPermission('production', 'create'))
const canUpdate = computed(() => hasPermission('production', 'update'))
const canDelete = computed(() => hasPermission('production', 'delete'))

// Data table state
const items = ref<BomListItem[]>([])
const isLoading = ref(true)
const totalItems = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const sortBy = ref('id')
const sortOrder = ref<'asc' | 'desc'>('desc')

// Filter state
const filters = reactive({
  search: '',
  produk_id: '' as string | number,
  status_aktif: '1' as string | number
})

const productOptions = ref<Array<{ value: string | number; label: string }>>([
  { value: '', label: 'Semua Produk' }
])

const statusOptions = [
  { value: 'all', label: 'Semua Status' },
  { value: '1', label: 'Aktif' },
  { value: '0', label: 'Nonaktif' }
]

// Delete dialog state
const isDeleteDialogOpen = ref(false)
const deleteTarget = ref<BomListItem | null>(null)
const isDeleting = ref(false)

// Duplicate dialog state
const isDuplicateDialogOpen = ref(false)
const duplicateTarget = ref<BomListItem | null>(null)
const isDuplicating = ref(false)

const columns: TableColumn<BomListItem>[] = [
  {
    key: 'kode',
    label: 'Kode Template',
    sortable: true,
    minWidth: '140px'
  },
  {
    key: 'nama',
    label: 'Nama Template',
    sortable: true,
    minWidth: '220px'
  },
  {
    key: 'nama_produk',
    label: 'Produk Furniture',
    sortable: true,
    minWidth: '220px'
  },
  {
    key: 'total_items',
    label: 'Jenis Bahan',
    sortable: true,
    minWidth: '110px'
  },
  {
    key: 'total_estimasi_biaya',
    label: 'Est. Biaya Bahan',
    sortable: true,
    minWidth: '140px'
  },
  {
    key: 'status_aktif',
    label: 'Status',
    sortable: true,
    minWidth: '100px'
  },
  {
    key: 'actions',
    label: 'Aksi',
    sortable: false,
    minWidth: '140px'
  }
]

// KPI metrics
const kpiTotalTemplates = computed(() => items.value.length)
const kpiTotalProductsWithBom = computed(() => {
  const set = new Set(items.value.map(i => i.produk_id))
  return set.size
})
const kpiAvgMaterialsPerBom = computed(() => {
  if (items.value.length === 0) return 0
  const sum = items.value.reduce((s, i) => s + i.total_items, 0)
  return Math.round(sum / items.value.length)
})
const kpiAvgCostPerUnit = computed(() => {
  if (items.value.length === 0) return 0
  const sum = items.value.reduce((s, i) => s + i.total_estimasi_biaya, 0)
  return Math.round(sum / items.value.length)
})

async function loadData() {
  isLoading.value = true
  try {
    const res = await bomService.getTemplates({
      search: filters.search,
      produk_id: filters.produk_id === '' ? 'all' : Number(filters.produk_id),
      status_aktif: filters.status_aktif === 'all' ? 'all' : Number(filters.status_aktif),
      page: currentPage.value,
      limit: pageSize.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    })
    items.value = res.data
    totalItems.value = res.total
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat daftar template produk.'
    toast.error(message)
  } finally {
    isLoading.value = false
  }
}

async function loadProductOptions() {
  try {
    const products = await bomService.getSelectableProducts()
    productOptions.value = [
      { value: '', label: 'Semua Produk' },
      ...products.map(p => ({
        value: p.id,
        label: `[${p.kode}] ${p.nama}`
      }))
    ]
  } catch {
    // Keep default
  }
}

onMounted(() => {
  loadData()
  loadProductOptions()
})

function handleSearch() {
  currentPage.value = 1
  loadData()
}

function handleResetFilters() {
  filters.search = ''
  filters.produk_id = ''
  filters.status_aktif = '1'
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

function handleSort(sort: TableSortState) {
  sortBy.value = sort.key
  sortOrder.value = sort.direction
  loadData()
}

function handleViewDetail(item: BomListItem) {
  router.push(`/production/bom/${item.id}`)
}

function handleEdit(item: BomListItem) {
  router.push(`/production/bom/${item.id}/edit`)
}

function openDuplicateDialog(item: BomListItem) {
  duplicateTarget.value = item
  isDuplicateDialogOpen.value = true
}

async function handleConfirmDuplicate() {
  if (!duplicateTarget.value) return
  isDuplicating.value = true
  try {
    const duplicated = await bomService.duplicateTemplate(duplicateTarget.value.id)
    toast.success(`Template berhasil disalin dengan kode baru: ${duplicated.kode}`)
    isDuplicateDialogOpen.value = false
    duplicateTarget.value = null
    router.push(`/production/bom/${duplicated.id}/edit`)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menduplikasi template.'
    toast.error(message)
  } finally {
    isDuplicating.value = false
  }
}

function openDeleteDialog(item: BomListItem) {
  deleteTarget.value = item
  isDeleteDialogOpen.value = true
}

async function handleConfirmDelete() {
  if (!deleteTarget.value) return
  isDeleting.value = true
  try {
    await bomService.deleteTemplate(deleteTarget.value.id)
    toast.success(`Template ${deleteTarget.value.kode} berhasil dinonaktifkan.`)
    isDeleteDialogOpen.value = false
    deleteTarget.value = null
    loadData()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menonaktifkan template.'
    toast.error(message)
  } finally {
    isDeleting.value = false
  }
}

function handleExportExcel() {
  if (items.value.length === 0) {
    toast.warning('Tidak ada data untuk diekspor.')
    return
  }

  exportToExcel<BomListItem>({
    filename: `Template_Produk_BoM_${new Date().toISOString().slice(0, 10)}`,
    title: 'LAPORAN TEMPLATE PRODUK (BILL OF MATERIALS)',
    columns: [
      { key: 'kode', label: 'Kode Template' },
      { key: 'nama', label: 'Nama Template' },
      { key: 'kode_produk', label: 'Kode Produk' },
      { key: 'nama_produk', label: 'Nama Produk Furniture' },
      { key: 'total_items', label: 'Jumlah Jenis Bahan' },
      {
        key: 'total_estimasi_biaya',
        label: 'Estimasi Biaya Bahan',
        formatter: val => formatCurrency(Number(val) || 0)
      },
      {
        key: 'status_aktif',
        label: 'Status',
        formatter: val => (Number(val) === 1 ? 'Aktif' : 'Nonaktif')
      }
    ],
    data: items.value
  })
  toast.success('Daftar template produk berhasil diekspor ke Excel.')
}

function handleExportPdf() {
  if (items.value.length === 0) {
    toast.warning('Tidak ada data untuk diekspor.')
    return
  }

  exportToPdf<BomListItem>({
    filename: `Template_Produk_BoM_${new Date().toISOString().slice(0, 10)}`,
    title: 'DAFTAR BILL OF MATERIALS (BOM) / TEMPLATE PRODUK',
    subtitle: 'Master Komposisi Bahan Baku Produk Furniture',
    orientation: 'landscape',
    filterInfo: filters.search ? `Pencarian: "${filters.search}"` : undefined,
    columns: [
      { key: 'no', label: 'No' },
      { key: 'kode', label: 'Kode Template' },
      { key: 'nama', label: 'Nama Template' },
      { key: 'nama_produk', label: 'Produk Furniture' },
      { key: 'total_items', label: 'Jml Bahan' },
      {
        key: 'total_estimasi_biaya',
        label: 'Est. Biaya Bahan',
        formatter: val => formatCurrency(Number(val) || 0)
      },
      {
        key: 'status_aktif',
        label: 'Status',
        formatter: val => (Number(val) === 1 ? 'Aktif' : 'Nonaktif')
      }
    ],
    data: items.value
  })
  toast.success('Daftar template produk berhasil diekspor ke PDF.')
}

function handlePrint() {
  window.print()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <AppPageHeader
      title="Template Produk (BoM)"
      subtitle="Master Resep & Komposisi Bahan Baku Produk Furniture"
      :breadcrumbs="[{ label: 'Produksi' }, { label: 'Template Produk (BoM)' }]"
    >
      <template #actions>
        <div class="flex items-center gap-2">
          <!-- Export Excel -->
          <AppButton
            variant="outline"
            size="sm"
            class="text-slate-700 border-slate-300 hover:bg-slate-50"
            @click="handleExportExcel"
          >
            <FileSpreadsheet class="w-4 h-4 mr-1.5 text-emerald-600" />
            Export Excel
          </AppButton>

          <!-- Export PDF -->
          <AppButton
            variant="outline"
            size="sm"
            class="text-slate-700 border-slate-300 hover:bg-slate-50"
            @click="handleExportPdf"
          >
            <FileText class="w-4 h-4 mr-1.5 text-rose-600" />
            Export PDF
          </AppButton>

          <!-- Print -->
          <AppButton
            variant="outline"
            size="sm"
            class="text-slate-700 border-slate-300 hover:bg-slate-50"
            @click="handlePrint"
          >
            <Printer class="w-4 h-4 mr-1.5 text-slate-600" />
            Cetak
          </AppButton>

          <!-- Add Button (Creates full new page) -->
          <AppButton
            v-if="canCreate"
            variant="primary"
            size="sm"
            class="bg-teal-600 hover:bg-teal-700 text-white font-medium"
            @click="router.push('/production/bom/create')"
          >
            <Plus class="w-4 h-4 mr-1.5" />
            Tambah Template
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        class="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex items-center gap-4"
      >
        <div class="p-3 bg-teal-50 rounded-lg text-teal-600">
          <Layers class="w-6 h-6" />
        </div>
        <div>
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total Template BoM
          </p>
          <p class="text-xl font-bold text-slate-800">{{ kpiTotalTemplates }}</p>
        </div>
      </div>

      <div
        class="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex items-center gap-4"
      >
        <div class="p-3 bg-blue-50 rounded-lg text-blue-600">
          <Package class="w-6 h-6" />
        </div>
        <div>
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Produk Memiliki BoM
          </p>
          <p class="text-xl font-bold text-blue-700">{{ kpiTotalProductsWithBom }} item</p>
        </div>
      </div>

      <div
        class="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex items-center gap-4"
      >
        <div class="p-3 bg-amber-50 rounded-lg text-amber-600">
          <Boxes class="w-6 h-6" />
        </div>
        <div>
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Rata-rata Bahan / BoM
          </p>
          <p class="text-xl font-bold text-amber-600">{{ kpiAvgMaterialsPerBom }} jenis</p>
        </div>
      </div>

      <div
        class="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex items-center gap-4"
      >
        <div class="p-3 bg-emerald-50 rounded-lg text-emerald-600">
          <DollarSign class="w-6 h-6" />
        </div>
        <div>
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Rata-rata Est. Biaya
          </p>
          <p class="text-lg font-bold font-mono text-emerald-700">
            {{ formatCurrency(kpiAvgCostPerUnit) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <!-- Search -->
        <div class="lg:col-span-2 relative">
          <label class="block text-xs font-medium text-slate-700 mb-1">Pencarian</label>
          <div class="relative">
            <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="filters.search"
              type="text"
              placeholder="Cari kode template, nama template, atau nama produk..."
              class="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
              @keydown.enter="handleSearch"
            />
          </div>
        </div>

        <!-- Filter Produk -->
        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1">Produk Furniture</label>
          <AppSelect
            v-model="filters.produk_id"
            :options="productOptions"
            placeholder="Semua Produk"
            class="text-xs"
            @change="handleSearch"
          />
        </div>

        <!-- Status -->
        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1">Status Template</label>
          <AppSelect
            v-model="filters.status_aktif"
            :options="statusOptions"
            placeholder="Semua Status"
            class="text-xs"
            @change="handleSearch"
          />
        </div>
      </div>

      <div class="mt-3 flex items-center justify-end gap-2">
        <AppButton
          variant="outline"
          size="sm"
          class="text-xs text-slate-600 border-slate-200 hover:bg-slate-50"
          @click="handleResetFilters"
        >
          <RefreshCw class="w-3.5 h-3.5 mr-1" />
          Reset Filter
        </AppButton>
        <AppButton
          variant="primary"
          size="sm"
          class="text-xs bg-teal-600 hover:bg-teal-700 text-white"
          @click="handleSearch"
        >
          Terapkan Filter
        </AppButton>
      </div>
    </div>

    <!-- Data Table -->
    <div class="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <AppDataTable
        :columns="columns"
        :data="items"
        :loading="isLoading"
        :total="totalItems"
        :page="currentPage"
        :per-page="pageSize"
        @update:page="handlePageChange"
        @update:per-page="handlePageSizeChange"
        @sort="handleSort"
      >
        <!-- Column: Kode -->
        <template #cell-kode="{ row }">
          <button
            type="button"
            class="font-mono text-xs font-bold text-teal-700 hover:underline hover:text-teal-800"
            @click="handleViewDetail(row)"
          >
            {{ row.kode }}
          </button>
        </template>

        <!-- Column: Nama Template -->
        <template #cell-nama="{ row }">
          <span class="text-xs font-semibold text-slate-800 line-clamp-1" :title="row.nama">
            {{ row.nama }}
          </span>
        </template>

        <!-- Column: Produk Furniture -->
        <template #cell-nama_produk="{ row }">
          <div>
            <span class="font-mono text-[11px] font-semibold text-slate-500 mr-1.5"
              >[{{ row.kode_produk }}]</span
            >
            <span class="text-xs font-medium text-slate-900">{{ row.nama_produk }}</span>
          </div>
        </template>

        <!-- Column: Jenis Bahan -->
        <template #cell-total_items="{ row }">
          <span class="text-xs font-mono font-medium text-slate-700">
            {{ row.total_items }} bahan
          </span>
        </template>

        <!-- Column: Est. Biaya Bahan -->
        <template #cell-total_estimasi_biaya="{ row }">
          <span class="text-xs font-mono font-bold text-slate-800">
            {{ formatCurrency(row.total_estimasi_biaya) }}
          </span>
          <span class="text-[10px] text-slate-400 block">/ unit</span>
        </template>

        <!-- Column: Status -->
        <template #cell-status_aktif="{ row }">
          <span
            v-if="row.status_aktif === 1"
            class="inline-flex items-center gap-1 font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px]"
          >
            <CheckCircle2 class="w-3 h-3" />
            <span>Aktif</span>
          </span>
          <span
            v-else
            class="inline-flex items-center gap-1 font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 text-[11px]"
          >
            <span>Nonaktif</span>
          </span>
        </template>

        <!-- Column: Actions -->
        <template #cell-actions="{ row }">
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded transition-colors"
              title="Lihat Detail & Simulasi"
              @click="handleViewDetail(row)"
            >
              <Eye class="w-4 h-4" />
            </button>

            <button
              v-if="canCreate"
              type="button"
              class="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
              title="Duplikasi Template"
              @click="openDuplicateDialog(row)"
            >
              <Copy class="w-4 h-4" />
            </button>

            <button
              v-if="canUpdate"
              type="button"
              class="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded transition-colors"
              title="Edit Komposisi BoM"
              @click="handleEdit(row)"
            >
              <Edit2 class="w-4 h-4" />
            </button>

            <button
              v-if="canDelete && row.status_aktif === 1"
              type="button"
              class="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors"
              title="Nonaktifkan Template"
              @click="openDeleteDialog(row)"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </template>
      </AppDataTable>
    </div>

    <!-- Confirm Delete / Deactivate Dialog -->
    <AppConfirmDialog
      v-model="isDeleteDialogOpen"
      title="Nonaktifkan Template Produk"
      :message="`Apakah Anda yakin ingin menonaktifkan template '${deleteTarget?.kode} - ${deleteTarget?.nama}'? Template ini tidak akan dihapus dari histori produksi, tetapi tidak dapat dipilih untuk pesanan produksi baru.`"
      confirm-text="Ya, Nonaktifkan Template"
      variant="danger"
      @confirm="handleConfirmDelete"
    />

    <!-- Confirm Duplicate Dialog -->
    <AppConfirmDialog
      v-model="isDuplicateDialogOpen"
      title="Duplikasi Template Produk"
      :message="`Buat salinan template '${duplicateTarget?.kode} - ${duplicateTarget?.nama}'? Seluruh rincian komposisi bahan akan disalin ke dokumen template baru.`"
      confirm-text="Ya, Duplikasi Template"
      variant="primary"
      @confirm="handleConfirmDuplicate"
    />
  </div>
</template>
