<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import {
  Filter,
  RotateCcw,
  Search,
  Calendar,
  User,
  AlertCircle
} from 'lucide-vue-next'
import AppSearchableSelect, { type SearchableOption } from '@/shared/components/ui/AppSearchableSelect.vue'
import type {
  CustomerReportFilterParams,
  SalesCustomerReportFilterOptions
} from '../types/sales-customer-report.types'

const props = withDefaults(
  defineProps<{
    initialFilters: CustomerReportFilterParams
    filterOptions?: SalesCustomerReportFilterOptions | null
    loading?: boolean
  }>(),
  {
    filterOptions: null,
    loading: false
  }
)

const emit = defineEmits<{
  (e: 'apply', filters: CustomerReportFilterParams): void
  (e: 'reset'): void
}>()

// Buffer form state
const form = reactive<CustomerReportFilterParams>({
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

// Customer Options for AppSearchableSelect
const customerOptions = computed<SearchableOption[]>(() => {
  if (!props.filterOptions?.customers) return []
  return props.filterOptions.customers.map(c => ({
    value: c.id,
    label: c.kode ? `${c.kode} — ${c.nama}` : c.nama,
    description: [c.no_hp, c.alamat, c.status === 0 ? 'Non-Aktif' : null].filter(Boolean).join(' • ')
  }))
})

// Status Options
const statusOptions = computed(() => {
  return props.filterOptions?.statuses || [
    { value: 'ALL', label: 'Semua Status' },
    { value: '0', label: 'Terbuka' },
    { value: '1', label: 'Tertutup' },
    { value: 'cancelled', label: 'Dibatalkan' }
  ]
})

// Sort Options
const sortOptions = [
  { key: 'tanggal', dir: 'DESC', label: 'Tanggal SO Terbaru' },
  { key: 'tanggal', dir: 'ASC', label: 'Tanggal SO Terlama' },
  { key: 'kode', dir: 'ASC', label: 'Nomor SO (A - Z)' },
  { key: 'total', dir: 'DESC', label: 'Total Terbesar' },
  { key: 'total', dir: 'ASC', label: 'Total Terkecil' }
]

const selectedSortOption = computed({
  get() {
    const found = sortOptions.find(
      s => s.key === form.sort_by && s.dir === form.sort_direction
    )
    return found ? `${found.key}_${found.dir}` : 'tanggal_DESC'
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
    form.date_from = ''
    form.date_to = ''
  }
}

function handleApply() {
  validationError.value = null

  if (!form.customer_id) {
    validationError.value = 'Silakan pilih Pelanggan terlebih dahulu'
    return
  }
  if (form.date_from && form.date_to && form.date_from > form.date_to) {
    validationError.value = 'Tanggal Mulai tidak boleh melebihi Tanggal Akhir'
    return
  }
  if (
    form.min_total !== undefined &&
    form.min_total !== null &&
    form.max_total !== undefined &&
    form.max_total !== null &&
    Number(form.min_total) > Number(form.max_total)
  ) {
    validationError.value = 'Total minimum tidak boleh melebihi total maksimum'
    return
  }

  emit('apply', {
    ...form,
    customer_id: Number(form.customer_id),
    page: 1
  })
}

function handleReset() {
  validationError.value = null
  activeDatePreset.value = 'custom'
  form.date_from = ''
  form.date_to = ''
  form.status = 'ALL'
  form.search = ''
  form.min_total = null
  form.max_total = null
  form.sort_by = 'tanggal'
  form.sort_direction = 'DESC'
  form.page = 1
  emit('reset')
}
</script>

<template>
  <div class="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 sm:p-5">
    <!-- Validation error alert -->
    <div
      v-if="validationError"
      class="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium"
    >
      <AlertCircle class="w-4 h-4 shrink-0" />
      <span>{{ validationError }}</span>
    </div>

    <div class="space-y-4">
      <!-- ROW 1: Customer & Date Range -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-end">
        <!-- Customer Searchable Picker -->
        <div class="lg:col-span-5">
          <label class="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
            <User class="w-3.5 h-3.5 text-teal-600" />
            <span>Pilih Pelanggan <span class="text-rose-500">*</span></span>
          </label>
          <AppSearchableSelect
            v-model="form.customer_id"
            :options="customerOptions"
            placeholder="Cari kode atau nama customer..."
          />
        </div>

        <!-- Date Range Filter -->
        <div class="lg:col-span-7">
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-xs font-medium text-slate-700 flex items-center gap-1.5">
              <Calendar class="w-3.5 h-3.5 text-teal-600" />
              <span>Periode Transaksi</span>
            </label>

            <!-- Date Presets -->
            <div class="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
              <button
                type="button"
                class="px-2 py-0.5 rounded text-[11px] font-medium transition"
                :class="activeDatePreset === 'today' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                @click="applyDatePreset('today')"
              >
                Hari Ini
              </button>
              <button
                type="button"
                class="px-2 py-0.5 rounded text-[11px] font-medium transition"
                :class="activeDatePreset === 'last_7_days' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                @click="applyDatePreset('last_7_days')"
              >
                7 Hari
              </button>
              <button
                type="button"
                class="px-2 py-0.5 rounded text-[11px] font-medium transition"
                :class="activeDatePreset === 'this_month' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                @click="applyDatePreset('this_month')"
              >
                Bulan Ini
              </button>
              <button
                type="button"
                class="px-2 py-0.5 rounded text-[11px] font-medium transition"
                :class="activeDatePreset === 'last_month' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                @click="applyDatePreset('last_month')"
              >
                Bulan Lalu
              </button>
              <button
                type="button"
                class="px-2 py-0.5 rounded text-[11px] font-medium transition"
                :class="activeDatePreset === 'last_3_months' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                @click="applyDatePreset('last_3_months')"
              >
                3 Bulan
              </button>
              <button
                type="button"
                class="px-2 py-0.5 rounded text-[11px] font-medium transition"
                :class="activeDatePreset === 'this_year' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                @click="applyDatePreset('this_year')"
              >
                Tahun Ini
              </button>
              <button
                type="button"
                class="px-2 py-0.5 rounded text-[11px] font-medium transition"
                :class="activeDatePreset === 'all' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                @click="applyDatePreset('all')"
              >
                Semua
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <input
                v-model="form.date_from"
                type="date"
                class="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-700 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                @input="activeDatePreset = 'custom'"
              />
            </div>
            <div>
              <input
                v-model="form.date_to"
                type="date"
                class="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-700 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                @input="activeDatePreset = 'custom'"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- ROW 2: Status, Search SO, Min/Max Total, Sort & Actions -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-end pt-2 border-t border-slate-100">
        <!-- Status Filter -->
        <div class="lg:col-span-2">
          <label class="block text-xs font-medium text-slate-700 mb-1.5">
            Status SO
          </label>
          <select
            v-model="form.status"
            class="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-700 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
          >
            <option v-for="st in statusOptions" :key="st.value" :value="st.value">
              {{ st.label }}
            </option>
          </select>
        </div>

        <!-- Pencarian Nomor SO / Keterangan -->
        <div class="lg:col-span-3">
          <label class="block text-xs font-medium text-slate-700 mb-1.5">
            Pencarian
          </label>
          <div class="relative">
            <Search class="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              v-model="form.search"
              type="text"
              placeholder="Cari nomor SO atau keterangan..."
              class="w-full text-xs rounded-lg border border-slate-300 pl-8 pr-3 py-2 bg-white text-slate-700 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
              @keydown.enter="handleApply"
            />
          </div>
        </div>

        <!-- Rentang Nilai (Min / Max) -->
        <div class="lg:col-span-3">
          <label class="block text-xs font-medium text-slate-700 mb-1.5">
            Rentang Total (Rp)
          </label>
          <div class="grid grid-cols-2 gap-2">
            <input
              v-model.number="form.min_total"
              type="number"
              placeholder="Min Rp"
              class="w-full text-xs rounded-lg border border-slate-300 px-2.5 py-2 bg-white text-slate-700 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
            <input
              v-model.number="form.max_total"
              type="number"
              placeholder="Max Rp"
              class="w-full text-xs rounded-lg border border-slate-300 px-2.5 py-2 bg-white text-slate-700 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
          </div>
        </div>

        <!-- Sorting -->
        <div class="lg:col-span-2">
          <label class="block text-xs font-medium text-slate-700 mb-1.5">
            Urutkan
          </label>
          <select
            v-model="selectedSortOption"
            class="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-700 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
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

        <!-- Buttons: Reset & Apply -->
        <div class="lg:col-span-2 flex items-center gap-2">
          <button
            type="button"
            class="w-1/2 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition active:scale-[0.98]"
            :disabled="loading"
            @click="handleReset"
          >
            <RotateCcw class="w-3.5 h-3.5 text-slate-500" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            class="w-1/2 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition active:scale-[0.98] disabled:opacity-50"
            :disabled="loading"
            @click="handleApply"
          >
            <Filter class="w-3.5 h-3.5" />
            <span>Terapkan</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
