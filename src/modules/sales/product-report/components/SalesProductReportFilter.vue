<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import {
  Filter,
  RotateCcw,
  Search,
  Calendar,
  Package,
  User,
  CheckCircle2,
  ArrowUpDown,
  X,
  AlertCircle
} from 'lucide-vue-next'
import AppSearchableSelect, { type SearchableOption } from '@/shared/components/ui/AppSearchableSelect.vue'
import type {
  ProductReportFilterParams,
  SalesProductReportFilterOptions,
  ProductReportMode
} from '../types/sales-product-report.types'

const props = withDefaults(
  defineProps<{
    initialFilters: ProductReportFilterParams
    filterOptions?: SalesProductReportFilterOptions | null
    activeMode: ProductReportMode
    loading?: boolean
  }>(),
  {
    filterOptions: null,
    loading: false
  }
)

const emit = defineEmits<{
  (e: 'apply', filters: ProductReportFilterParams): void
  (e: 'reset'): void
}>()

// Buffer form state
const form = reactive<ProductReportFilterParams>({
  ...props.initialFilters
})

// Sync when initialFilters changes externally
watch(
  () => props.initialFilters,
  (val) => {
    Object.assign(form, val)
  },
  { deep: true }
)

const activeDatePreset = ref<string>('custom')
const validationError = ref<string | null>(null)

// Product Options for AppSearchableSelect
const productOptions = computed<SearchableOption[]>(() => {
  if (!props.filterOptions?.products) return []
  return props.filterOptions.products.map(p => ({
    value: p.id,
    label: `${p.kode} — ${p.nama}`,
    description: p.kode
  }))
})

// Customer Options for AppSearchableSelect
const customerOptions = computed<SearchableOption[]>(() => {
  if (!props.filterOptions?.customers) return []
  return props.filterOptions.customers.map(c => ({
    value: c.id,
    label: c.kode ? `${c.kode} — ${c.nama}` : c.nama,
    description: c.kode
  }))
})

// Status Options
const statusOptions = computed(() => {
  return props.filterOptions?.statuses || [
    { value: '1', label: 'Disetujui (Approved)' },
    { value: '0', label: 'Draft' },
    { value: 'active', label: 'Semua Status Aktif' },
    { value: 'cancelled', label: 'Dibatalkan (Cancelled)' },
    { value: 'ALL', label: 'Semua (Termasuk Batal)' }
  ]
})

// Sort Options based on active mode
const sortOptions = computed(() => {
  if (props.activeMode === 'summary') {
    return [
      { key: 'total_qty', dir: 'DESC', label: 'Total Qty Terbesar' },
      { key: 'total_qty', dir: 'ASC', label: 'Total Qty Terkecil' },
      { key: 'so_count', dir: 'DESC', label: 'Jumlah SO Terbanyak' },
      { key: 'so_count', dir: 'ASC', label: 'Jumlah SO Tersedikit' },
      { key: 'customer_name', dir: 'ASC', label: 'Nama Customer (A - Z)' },
      { key: 'customer_name', dir: 'DESC', label: 'Nama Customer (Z - A)' },
      { key: 'last_purchase_date', dir: 'DESC', label: 'Tanggal Pembelian Terakhir' }
    ]
  }
  return [
    { key: 'tanggal', dir: 'DESC', label: 'Tanggal SO Terbaru' },
    { key: 'tanggal', dir: 'ASC', label: 'Tanggal SO Terlama' },
    { key: 'nomor_so', dir: 'ASC', label: 'Nomor SO' },
    { key: 'customer_name', dir: 'ASC', label: 'Customer (A - Z)' },
    { key: 'qty', dir: 'DESC', label: 'Qty Terbesar' },
    { key: 'subtotal', dir: 'DESC', label: 'Subtotal Terbesar' }
  ]
})

const selectedSortOption = computed({
  get() {
    const found = sortOptions.value.find(
      s => s.key === form.sort_by && s.dir === form.sort_direction
    )
    return found ? `${found.key}_${found.dir}` : `${sortOptions.value[0]?.key}_${sortOptions.value[0]?.dir}`
  },
  set(val: string) {
    const [key, dir] = val.split('_')
    form.sort_by = key
    form.sort_direction = (dir as 'ASC' | 'DESC') || 'DESC'
  }
})

// Date Preset Logic
function applyDatePreset(
  preset: 'today' | 'last_7_days' | 'this_month' | 'last_month' | 'last_3_months' | 'this_year' | 'all'
) {
  activeDatePreset.value = preset
  const now = new Date()

  if (preset === 'today') {
    const ymd = now.toISOString().slice(0, 10)
    form.date_from = ymd
    form.date_to = ymd
  } else if (preset === 'last_7_days') {
    const past = new Date(now)
    past.setDate(past.getDate() - 7)
    form.date_from = past.toISOString().slice(0, 10)
    form.date_to = now.toISOString().slice(0, 10)
  } else if (preset === 'this_month') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    form.date_from = firstDay.toISOString().slice(0, 10)
    form.date_to = lastDay.toISOString().slice(0, 10)
  } else if (preset === 'last_month') {
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0)
    form.date_from = firstDay.toISOString().slice(0, 10)
    form.date_to = lastDay.toISOString().slice(0, 10)
  } else if (preset === 'last_3_months') {
    const past = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    form.date_from = past.toISOString().slice(0, 10)
    form.date_to = lastDay.toISOString().slice(0, 10)
  } else if (preset === 'this_year') {
    const firstDay = new Date(now.getFullYear(), 0, 1)
    const lastDay = new Date(now.getFullYear(), 11, 31)
    form.date_from = firstDay.toISOString().slice(0, 10)
    form.date_to = lastDay.toISOString().slice(0, 10)
  } else if (preset === 'all') {
    form.date_from = '2020-01-01'
    form.date_to = now.toISOString().slice(0, 10)
  }
}

// Active Chips
const activeChips = computed(() => {
  const chips: { key: string; label: string; text: string }[] = []

  if (form.product_id) {
    const p = props.filterOptions?.products.find(item => item.id === form.product_id)
    chips.push({
      key: 'product_id',
      label: 'Produk',
      text: p ? `${p.kode} - ${p.nama}` : `ID #${form.product_id}`
    })
  }

  if (form.date_from && form.date_to) {
    chips.push({
      key: 'date',
      label: 'Periode',
      text: `${form.date_from} s/d ${form.date_to}`
    })
  }

  if (form.customer_id) {
    const c = props.filterOptions?.customers.find(item => item.id === form.customer_id)
    chips.push({
      key: 'customer_id',
      label: 'Customer',
      text: c ? c.nama : `ID #${form.customer_id}`
    })
  }

  if (form.so_status && form.so_status !== '1') {
    const st = statusOptions.value.find(s => s.value === form.so_status)
    chips.push({
      key: 'so_status',
      label: 'Status SO',
      text: st ? st.label : form.so_status
    })
  }

  if (form.search && form.search.trim()) {
    chips.push({
      key: 'search',
      label: 'Cari',
      text: `"${form.search}"`
    })
  }

  return chips
})

function removeChip(key: string) {
  if (key === 'customer_id') {
    form.customer_id = undefined
  } else if (key === 'so_status') {
    form.so_status = '1'
  } else if (key === 'search') {
    form.search = ''
  }
  handleApply()
}

function handleApply() {
  validationError.value = null

  if (!form.product_id) {
    validationError.value = 'Silakan pilih Produk terlebih dahulu'
    return
  }
  if (!form.date_from || !form.date_to) {
    validationError.value = 'Tanggal Mulai dan Tanggal Akhir wajib diisi'
    return
  }
  if (form.date_from > form.date_to) {
    validationError.value = 'Tanggal Mulai tidak boleh melebihi Tanggal Akhir'
    return
  }
  if (props.activeMode === 'customer_detail' && !form.customer_id) {
    validationError.value = 'Customer wajib dipilih untuk Mode Detail Transaksi Customer'
    return
  }

  emit('apply', {
    ...form,
    product_id: Number(form.product_id),
    page: 1
  })
}

function handleReset() {
  validationError.value = null
  activeDatePreset.value = 'custom'
  // Keep the current product if exists, or reset to initial
  form.customer_id = undefined
  form.so_status = '1'
  form.search = ''
  form.sort_direction = 'DESC'
  emit('reset')
}
</script>

<template>
  <div class="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 space-y-4">
    <!-- Header Filter & Presets -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
      <div class="flex items-center gap-2">
        <Filter class="w-4 h-4 text-primary-600" />
        <h2 class="text-xs font-bold uppercase tracking-wider text-slate-700">
          FILTER LAPORAN
        </h2>
      </div>

      <!-- Date Presets -->
      <div class="flex items-center gap-1 overflow-x-auto text-xs py-0.5">
        <button
          type="button"
          class="px-2.5 py-1 rounded-md transition font-medium text-[11px] whitespace-nowrap"
          :class="activeDatePreset === 'today' ? 'bg-primary-50 text-primary-700 font-semibold border border-primary-200' : 'text-slate-500 hover:bg-slate-100'"
          @click="applyDatePreset('today')"
        >
          Hari Ini
        </button>
        <button
          type="button"
          class="px-2.5 py-1 rounded-md transition font-medium text-[11px] whitespace-nowrap"
          :class="activeDatePreset === 'last_7_days' ? 'bg-primary-50 text-primary-700 font-semibold border border-primary-200' : 'text-slate-500 hover:bg-slate-100'"
          @click="applyDatePreset('last_7_days')"
        >
          7 Hari Terakhir
        </button>
        <button
          type="button"
          class="px-2.5 py-1 rounded-md transition font-medium text-[11px] whitespace-nowrap"
          :class="activeDatePreset === 'this_month' ? 'bg-primary-50 text-primary-700 font-semibold border border-primary-200' : 'text-slate-500 hover:bg-slate-100'"
          @click="applyDatePreset('this_month')"
        >
          Bulan Ini
        </button>
        <button
          type="button"
          class="px-2.5 py-1 rounded-md transition font-medium text-[11px] whitespace-nowrap"
          :class="activeDatePreset === 'last_month' ? 'bg-primary-50 text-primary-700 font-semibold border border-primary-200' : 'text-slate-500 hover:bg-slate-100'"
          @click="applyDatePreset('last_month')"
        >
          Bulan Lalu
        </button>
        <button
          type="button"
          class="px-2.5 py-1 rounded-md transition font-medium text-[11px] whitespace-nowrap"
          :class="activeDatePreset === 'last_3_months' ? 'bg-primary-50 text-primary-700 font-semibold border border-primary-200' : 'text-slate-500 hover:bg-slate-100'"
          @click="applyDatePreset('last_3_months')"
        >
          3 Bulan Terakhir
        </button>
        <button
          type="button"
          class="px-2.5 py-1 rounded-md transition font-medium text-[11px] whitespace-nowrap"
          :class="activeDatePreset === 'this_year' ? 'bg-primary-50 text-primary-700 font-semibold border border-primary-200' : 'text-slate-500 hover:bg-slate-100'"
          @click="applyDatePreset('this_year')"
        >
          Tahun Ini
        </button>
        <button
          type="button"
          class="px-2.5 py-1 rounded-md transition font-medium text-[11px] whitespace-nowrap"
          :class="activeDatePreset === 'all' ? 'bg-primary-50 text-primary-700 font-semibold border border-primary-200' : 'text-slate-500 hover:bg-slate-100'"
          @click="applyDatePreset('all')"
        >
          Semua Historis
        </button>
      </div>
    </div>

    <!-- Error Banner -->
    <div
      v-if="validationError"
      class="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium"
    >
      <AlertCircle class="w-4 h-4 shrink-0 text-rose-600" />
      <span>{{ validationError }}</span>
    </div>

    <!-- Main Filters Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
      <!-- 1. Produk (Mandatory) -->
      <div class="sm:col-span-2 space-y-1">
        <label class="block text-[11px] font-semibold text-slate-700 flex items-center gap-1">
          <Package class="w-3.5 h-3.5 text-primary-600" />
          Produk <span class="text-rose-500 font-bold">*</span>
        </label>
        <AppSearchableSelect
          v-model="form.product_id"
          :options="productOptions"
          placeholder="Cari kode atau nama produk..."
          size="sm"
          :allow-clear="false"
        />
      </div>

      <!-- 2. Tanggal Mulai -->
      <div class="space-y-1">
        <label class="block text-[11px] font-semibold text-slate-700 flex items-center gap-1">
          <Calendar class="w-3.5 h-3.5 text-slate-400" />
          Tanggal Mulai <span class="text-rose-500 font-bold">*</span>
        </label>
        <input
          v-model="form.date_from"
          type="date"
          class="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
          @change="activeDatePreset = 'custom'"
        />
      </div>

      <!-- 3. Tanggal Akhir -->
      <div class="space-y-1">
        <label class="block text-[11px] font-semibold text-slate-700 flex items-center gap-1">
          <Calendar class="w-3.5 h-3.5 text-slate-400" />
          Tanggal Akhir <span class="text-rose-500 font-bold">*</span>
        </label>
        <input
          v-model="form.date_to"
          type="date"
          class="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
          @change="activeDatePreset = 'custom'"
        />
      </div>

      <!-- 4. Customer -->
      <div class="sm:col-span-1 space-y-1">
        <label class="block text-[11px] font-semibold text-slate-700 flex items-center gap-1">
          <User class="w-3.5 h-3.5 text-slate-400" />
          Customer
          <span v-if="activeMode === 'customer_detail'" class="text-rose-500 font-bold">*</span>
          <span v-else class="text-slate-400 font-normal text-[10px]">(Opsional)</span>
        </label>
        <AppSearchableSelect
          v-model="form.customer_id"
          :options="customerOptions"
          :placeholder="activeMode === 'customer_detail' ? 'Pilih customer...' : 'Semua Customer'"
          size="sm"
          :allow-clear="true"
        />
      </div>

      <!-- 5. Status SO -->
      <div class="space-y-1">
        <label class="block text-[11px] font-semibold text-slate-700 flex items-center gap-1">
          <CheckCircle2 class="w-3.5 h-3.5 text-slate-400" />
          Status SO
        </label>
        <select
          v-model="form.so_status"
          class="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition font-medium"
        >
          <option v-for="st in statusOptions" :key="st.value" :value="st.value">
            {{ st.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Advanced / Secondary Filters Row -->
    <div class="pt-2 flex flex-col md:flex-row md:items-center justify-between gap-3 border-t border-slate-100 text-xs">
      <!-- Search & Sorting -->
      <div class="flex flex-wrap items-center gap-3 flex-1">
        <!-- Quick Search -->
        <div class="relative w-64">
          <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            v-model="form.search"
            type="text"
            placeholder="Cari nomor SO / customer..."
            class="w-full text-xs rounded-lg border border-slate-300 bg-white pl-8 pr-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
            @keyup.enter="handleApply"
          />
        </div>

        <!-- Urutkan Berdasarkan -->
        <div class="flex items-center gap-1.5">
          <label class="text-[11px] font-semibold text-slate-600 flex items-center gap-1 whitespace-nowrap">
            <ArrowUpDown class="w-3.5 h-3.5 text-slate-400" />
            Urutan:
          </label>
          <select
            v-model="selectedSortOption"
            class="text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition font-medium"
          >
            <option
              v-for="opt in sortOptions"
              :key="`${opt.key}_${opt.dir}`"
              :value="`${opt.key}_${opt.dir}`"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2 self-end md:self-auto">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-medium text-xs transition"
          @click="handleReset"
        >
          <RotateCcw class="w-3.5 h-3.5 text-slate-500" />
          Reset
        </button>

        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-semibold text-xs shadow-sm shadow-primary-500/20 transition disabled:opacity-50"
          :disabled="loading"
          @click="handleApply"
        >
          <Search class="w-3.5 h-3.5" />
          {{ loading ? 'Memuat...' : 'Tampilkan Laporan' }}
        </button>
      </div>
    </div>

    <!-- Active Filter Chips -->
    <div v-if="activeChips.length > 0" class="flex flex-wrap items-center gap-1.5 pt-1">
      <span class="text-[11px] text-slate-500 font-medium">Filter Aktif:</span>
      <div
        v-for="chip in activeChips"
        :key="chip.key"
        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/80 text-[11px] text-slate-700"
      >
        <span class="font-medium text-slate-500">{{ chip.label }}:</span>
        <span class="font-semibold text-slate-800">{{ chip.text }}</span>
        <button
          v-if="chip.key !== 'product_id' && chip.key !== 'date'"
          type="button"
          class="ml-0.5 text-slate-400 hover:text-slate-600"
          @click="removeChip(chip.key)"
        >
          <X class="w-3 h-3" />
        </button>
      </div>
    </div>
  </div>
</template>
