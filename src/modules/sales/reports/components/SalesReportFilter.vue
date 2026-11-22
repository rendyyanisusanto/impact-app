<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import {
  Filter,
  RotateCcw,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  Calendar,
  Package,
  CheckCircle2,
  CreditCard,
  User,
  ArrowUpDown
} from 'lucide-vue-next'
import type {
  SalesReportFilterParams,
  SalesReportFilterOptions,
  SalesReportType
} from '../types/sales-report.types'

const props = withDefaults(
  defineProps<{
    initialFilters: SalesReportFilterParams
    filterOptions?: SalesReportFilterOptions | null
    loading?: boolean
  }>(),
  {
    filterOptions: null,
    loading: false
  }
)

const emit = defineEmits<{
  (e: 'apply', filters: SalesReportFilterParams): void
  (e: 'reset'): void
}>()

// Internal filter form state (buffered until user clicks "Tampilkan Laporan")
const form = reactive<SalesReportFilterParams>({
  ...props.initialFilters
})

// Sync when props change externally
watch(
  () => props.initialFilters,
  (val) => {
    Object.assign(form, val)
  },
  { deep: true }
)

const showAdvanced = ref(false)
const activeDatePreset = ref<string>('custom')

// Report Type Options
const reportTypeOptions: { value: SalesReportType; label: string }[] = [
  { value: 'summary', label: 'Ringkasan Penjualan' },
  { value: 'detail', label: 'Detail Penjualan' },
  { value: 'customer', label: 'Penjualan per Customer' },
  { value: 'product', label: 'Penjualan per Produk' },
  { value: 'status', label: 'Status Sales Order' },
  { value: 'so_vs_delivery', label: 'Penjualan vs Pengiriman' },
  { value: 'invoice', label: 'Invoice Penjualan' },
  { value: 'payment_receivable', label: 'Pembayaran & Piutang' }
]

// Relevancy flags based on selected report type
const isProductFilterRelevant = computed(() => {
  return ['detail', 'product', 'so_vs_delivery', 'summary'].includes(form.report_type)
})

const isProductionStatusRelevant = computed(() => {
  return ['summary', 'status'].includes(form.report_type)
})

const isDeliveryStatusRelevant = computed(() => {
  return ['status', 'so_vs_delivery'].includes(form.report_type)
})

const isInvoiceFilterRelevant = computed(() => {
  return ['invoice', 'payment_receivable'].includes(form.report_type)
})

// Sort Options based on selected report type
const sortOptions = computed(() => {
  switch (form.report_type) {
    case 'summary':
      return [
        { value: 'tanggal', label: 'Tanggal SO' },
        { value: 'kode', label: 'Nomor SO' },
        { value: 'customer_name', label: 'Customer' },
        { value: 'total', label: 'Total Nominal' },
        { value: 'status', label: 'Status' }
      ]
    case 'detail':
      return [
        { value: 'tanggal', label: 'Tanggal SO' },
        { value: 'kode_so', label: 'Nomor SO' },
        { value: 'customer_name', label: 'Customer' },
        { value: 'nama_produk', label: 'Nama Produk' },
        { value: 'subtotal', label: 'Subtotal' }
      ]
    case 'customer':
      return [
        { value: 'total_nilai_so', label: 'Total Nilai SO' },
        { value: 'nama_customer', label: 'Nama Customer' },
        { value: 'jumlah_so', label: 'Jumlah SO' },
        { value: 'total_qty', label: 'Total Qty' }
      ]
    case 'product':
      return [
        { value: 'total_nilai_penjualan', label: 'Total Penjualan' },
        { value: 'nama_produk', label: 'Nama Produk' },
        { value: 'total_qty_dipesan', label: 'Total Qty Dipesan' },
        { value: 'harga_rata_rata', label: 'Harga Rata-rata' }
      ]
    case 'status':
      return [
        { value: 'tanggal', label: 'Tanggal SO' },
        { value: 'nomor_so', label: 'Nomor SO' },
        { value: 'total_so', label: 'Total SO' }
      ]
    case 'so_vs_delivery':
      return [
        { value: 'tanggal_so', label: 'Tanggal SO' },
        { value: 'nomor_so', label: 'Nomor SO' },
        { value: 'qty_pesanan', label: 'Qty Pesanan' },
        { value: 'sisa_qty', label: 'Sisa Qty' }
      ]
    case 'invoice':
      return [
        { value: 'tanggal_invoice', label: 'Tanggal Invoice' },
        { value: 'nomor_invoice', label: 'Nomor Invoice' },
        { value: 'total_invoice', label: 'Total Invoice' }
      ]
    case 'payment_receivable':
      return [
        { value: 'tanggal_invoice', label: 'Tanggal Invoice' },
        { value: 'nomor_invoice', label: 'Nomor Invoice' },
        { value: 'total_invoice', label: 'Total Tagihan' },
        { value: 'total_pembayaran', label: 'Total Pembayaran' },
        { value: 'sisa_tagihan', label: 'Sisa Tagihan' }
      ]
    default:
      return [{ value: 'tanggal', label: 'Tanggal' }]
  }
})

// Set active sort column when report type changes if current sort is not supported
watch(
  () => form.report_type,
  () => {
    const validSortKeys = sortOptions.value.map(s => s.value)
    if (!validSortKeys.includes(form.sort_by || '')) {
      form.sort_by = validSortKeys[0] || 'tanggal'
    }
  }
)

// Date Presets
function applyDatePreset(preset: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'all') {
  activeDatePreset.value = preset
  const now = new Date()

  if (preset === 'today') {
    const ymd = now.toISOString().slice(0, 10)
    form.date_from = ymd
    form.date_to = ymd
  } else if (preset === 'yesterday') {
    const yest = new Date(now)
    yest.setDate(yest.getDate() - 1)
    const ymd = yest.toISOString().slice(0, 10)
    form.date_from = ymd
    form.date_to = ymd
  } else if (preset === 'this_week') {
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
    const monday = new Date(now.setDate(diff))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    form.date_from = monday.toISOString().slice(0, 10)
    form.date_to = sunday.toISOString().slice(0, 10)
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

// Active Filter Chips computation
const activeChips = computed(() => {
  const chips: { key: string; label: string; valueText: string }[] = []

  if (form.date_from || form.date_to) {
    chips.push({
      key: 'date',
      label: 'Periode',
      valueText: `${form.date_from || 'Awal'} s/d ${form.date_to || 'Sekarang'}`
    })
  }

  if (form.status && form.status !== 'ALL') {
    const stLabel = props.filterOptions?.statuses.find(s => s.value === form.status)?.label || form.status
    chips.push({
      key: 'status',
      label: 'Status SO',
      valueText: stLabel
    })
  }

  if (form.customer_id) {
    const cust = props.filterOptions?.customers.find(c => c.id === form.customer_id)
    chips.push({
      key: 'customer_id',
      label: 'Customer',
      valueText: cust ? cust.nama : `ID #${form.customer_id}`
    })
  }

  if (form.product_id && isProductFilterRelevant.value) {
    const prod = props.filterOptions?.products.find(p => p.id === form.product_id)
    chips.push({
      key: 'product_id',
      label: 'Produk',
      valueText: prod ? prod.nama : `ID #${form.product_id}`
    })
  }

  if (form.invoice_type && form.invoice_type !== 'ALL' && isInvoiceFilterRelevant.value) {
    chips.push({
      key: 'invoice_type',
      label: 'Jenis Invoice',
      valueText: form.invoice_type
    })
  }

  if (form.payment_status && form.payment_status !== 'ALL' && isInvoiceFilterRelevant.value) {
    const ps = props.filterOptions?.payment_statuses.find(p => p.value === form.payment_status)?.label || form.payment_status
    chips.push({
      key: 'payment_status',
      label: 'Status Bayar',
      valueText: ps
    })
  }

  if (form.delivery_status && form.delivery_status !== 'ALL' && isDeliveryStatusRelevant.value) {
    const ds = props.filterOptions?.delivery_statuses.find(d => d.value === form.delivery_status)?.label || form.delivery_status
    chips.push({
      key: 'delivery_status',
      label: 'Pengiriman',
      valueText: ds
    })
  }

  if (form.search && form.search.trim()) {
    chips.push({
      key: 'search',
      label: 'Pencarian',
      valueText: `"${form.search}"`
    })
  }

  return chips
})

function removeChip(key: string) {
  if (key === 'date') {
    form.date_from = ''
    form.date_to = ''
    activeDatePreset.value = 'all'
  } else if (key === 'status') {
    form.status = 'ALL'
  } else if (key === 'customer_id') {
    form.customer_id = undefined
  } else if (key === 'product_id') {
    form.product_id = undefined
  } else if (key === 'invoice_type') {
    form.invoice_type = 'ALL'
  } else if (key === 'payment_status') {
    form.payment_status = 'ALL'
  } else if (key === 'delivery_status') {
    form.delivery_status = 'ALL'
  } else if (key === 'search') {
    form.search = ''
  }
  handleApply()
}

function handleApply() {
  emit('apply', { ...form, page: 1 })
}

function handleReset() {
  activeDatePreset.value = 'all'
  form.date_from = ''
  form.date_to = ''
  form.customer_id = undefined
  form.product_id = undefined
  form.status = 'ALL'
  form.production_status = 'ALL'
  form.delivery_status = 'ALL'
  form.invoice_type = 'ALL'
  form.payment_status = 'ALL'
  form.order_type = 'ALL'
  form.search = ''
  form.min_amount = undefined
  form.max_amount = undefined
  form.created_by = undefined
  form.sort_direction = 'DESC'
  emit('reset')
}
</script>

<template>
  <div class="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-4">
    <!-- Header Parameter Laporan -->
    <div class="flex items-center justify-between pb-3 border-b border-slate-100">
      <div class="flex items-center gap-2">
        <Filter class="w-4 h-4 text-teal-600" />
        <h2 class="text-xs font-bold uppercase tracking-wider text-slate-700">
          PARAMETER LAPORAN
        </h2>
      </div>

      <!-- Date Presets -->
      <div class="flex items-center gap-1 overflow-x-auto text-xs">
        <button
          type="button"
          class="px-2.5 py-1 rounded-md transition font-medium text-[11px]"
          :class="activeDatePreset === 'today' ? 'bg-teal-50 text-teal-700 font-semibold border border-teal-200' : 'text-slate-500 hover:bg-slate-100'"
          @click="applyDatePreset('today')"
        >
          Hari Ini
        </button>
        <button
          type="button"
          class="px-2.5 py-1 rounded-md transition font-medium text-[11px]"
          :class="activeDatePreset === 'yesterday' ? 'bg-teal-50 text-teal-700 font-semibold border border-teal-200' : 'text-slate-500 hover:bg-slate-100'"
          @click="applyDatePreset('yesterday')"
        >
          Kemarin
        </button>
        <button
          type="button"
          class="px-2.5 py-1 rounded-md transition font-medium text-[11px]"
          :class="activeDatePreset === 'this_week' ? 'bg-teal-50 text-teal-700 font-semibold border border-teal-200' : 'text-slate-500 hover:bg-slate-100'"
          @click="applyDatePreset('this_week')"
        >
          Minggu Ini
        </button>
        <button
          type="button"
          class="px-2.5 py-1 rounded-md transition font-medium text-[11px]"
          :class="activeDatePreset === 'this_month' ? 'bg-teal-50 text-teal-700 font-semibold border border-teal-200' : 'text-slate-500 hover:bg-slate-100'"
          @click="applyDatePreset('this_month')"
        >
          Bulan Ini
        </button>
        <button
          type="button"
          class="px-2.5 py-1 rounded-md transition font-medium text-[11px]"
          :class="activeDatePreset === 'last_month' ? 'bg-teal-50 text-teal-700 font-semibold border border-teal-200' : 'text-slate-500 hover:bg-slate-100'"
          @click="applyDatePreset('last_month')"
        >
          Bulan Lalu
        </button>
        <button
          type="button"
          class="px-2.5 py-1 rounded-md transition font-medium text-[11px]"
          :class="activeDatePreset === 'this_year' ? 'bg-teal-50 text-teal-700 font-semibold border border-teal-200' : 'text-slate-500 hover:bg-slate-100'"
          @click="applyDatePreset('this_year')"
        >
          Tahun Ini
        </button>
        <button
          type="button"
          class="px-2.5 py-1 rounded-md transition font-medium text-[11px]"
          :class="activeDatePreset === 'all' ? 'bg-teal-50 text-teal-700 font-semibold border border-teal-200' : 'text-slate-500 hover:bg-slate-100'"
          @click="applyDatePreset('all')"
        >
          Semua
        </button>
      </div>
    </div>

    <!-- Main Filters Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      <!-- 1. Jenis Laporan -->
      <div class="space-y-1">
        <label class="block text-[11px] font-semibold text-slate-600">
          Jenis Laporan <span class="text-rose-500">*</span>
        </label>
        <select
          v-model="form.report_type"
          class="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition font-medium"
        >
          <option v-for="opt in reportTypeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <!-- 2. Tanggal Mulai -->
      <div class="space-y-1">
        <label class="block text-[11px] font-semibold text-slate-600 flex items-center gap-1">
          <Calendar class="w-3 h-3 text-slate-400" />
          Tanggal Mulai
        </label>
        <input
          v-model="form.date_from"
          type="date"
          class="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
          @change="activeDatePreset = 'custom'"
        />
      </div>

      <!-- 3. Tanggal Akhir -->
      <div class="space-y-1">
        <label class="block text-[11px] font-semibold text-slate-600 flex items-center gap-1">
          <Calendar class="w-3 h-3 text-slate-400" />
          Tanggal Akhir
        </label>
        <input
          v-model="form.date_to"
          type="date"
          class="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
          @change="activeDatePreset = 'custom'"
        />
      </div>

      <!-- 4. Status Transaksi -->
      <div class="space-y-1">
        <label class="block text-[11px] font-semibold text-slate-600 flex items-center gap-1">
          <CheckCircle2 class="w-3 h-3 text-slate-400" />
          Status Transaksi
        </label>
        <select
          v-model="form.status"
          class="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
        >
          <option value="ALL">Semua Status</option>
          <option value="0">Draft</option>
          <option value="1">Disetujui</option>
          <option value="cancelled">Dibatalkan</option>
        </select>
      </div>

      <!-- 5. Customer -->
      <div class="space-y-1">
        <label class="block text-[11px] font-semibold text-slate-600 flex items-center gap-1">
          <User class="w-3 h-3 text-slate-400" />
          Customer
        </label>
        <select
          v-model="form.customer_id"
          class="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition truncate"
        >
          <option :value="undefined">Semua Customer</option>
          <option v-for="c in filterOptions?.customers" :key="c.id" :value="c.id">
            {{ c.kode ? `[${c.kode}] ` : '' }}{{ c.nama }}
          </option>
        </select>
      </div>

      <!-- 6. Nomor Dokumen / Search -->
      <div class="space-y-1">
        <label class="block text-[11px] font-semibold text-slate-600 flex items-center gap-1">
          <Search class="w-3 h-3 text-slate-400" />
          Nomor Dokumen
        </label>
        <div class="relative">
          <input
            v-model="form.search"
            type="text"
            placeholder="Cari No SO, Invoice..."
            class="w-full text-xs rounded-lg border border-slate-300 bg-white pl-2.5 pr-7 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
            @keyup.enter="handleApply"
          />
          <button
            v-if="form.search"
            type="button"
            class="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
            @click="form.search = ''"
          >
            <X class="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>

    <!-- Advanced Filters Toggle & Drawer -->
    <div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-semibold transition py-1"
        @click="showAdvanced = !showAdvanced"
      >
        <component :is="showAdvanced ? ChevronUp : ChevronDown" class="w-3.5 h-3.5" />
        {{ showAdvanced ? 'Tutup Filter Lanjutan' : 'Buka Filter Lanjutan' }}
      </button>

      <!-- Advanced Filters Row -->
      <div
        v-if="showAdvanced"
        class="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 animate-in fade-in duration-150"
      >
        <!-- 7. Produk -->
        <div v-if="isProductFilterRelevant" class="space-y-1">
          <label class="block text-[11px] font-semibold text-slate-600 flex items-center gap-1">
            <Package class="w-3 h-3 text-slate-400" />
            Produk
          </label>
          <select
            v-model="form.product_id"
            class="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition truncate"
          >
            <option :value="undefined">Semua Produk</option>
            <option v-for="p in filterOptions?.products" :key="p.id" :value="p.id">
              {{ p.kode ? `[${p.kode}] ` : '' }}{{ p.nama }}
            </option>
          </select>
        </div>

        <!-- 8. Status Produksi -->
        <div v-if="isProductionStatusRelevant" class="space-y-1">
          <label class="block text-[11px] font-semibold text-slate-600">
            Status Produksi
          </label>
          <select
            v-model="form.production_status"
            class="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
          >
            <option value="ALL">Semua</option>
            <option value="0">Belum Produksi</option>
            <option value="1">Selesai / Dalam Produksi</option>
          </select>
        </div>

        <!-- 9. Status Pengiriman -->
        <div v-if="isDeliveryStatusRelevant" class="space-y-1">
          <label class="block text-[11px] font-semibold text-slate-600">
            Status Pengiriman
          </label>
          <select
            v-model="form.delivery_status"
            class="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
          >
            <option value="ALL">Semua</option>
            <option value="BELUM">Belum Dikirim</option>
            <option value="PARSIAL">Parsial</option>
            <option value="SELESAI">Selesai</option>
          </select>
        </div>

        <!-- 10. Jenis Invoice -->
        <div v-if="isInvoiceFilterRelevant" class="space-y-1">
          <label class="block text-[11px] font-semibold text-slate-600">
            Jenis Invoice
          </label>
          <select
            v-model="form.invoice_type"
            class="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
          >
            <option value="ALL">Semua Jenis</option>
            <option value="DP">DP</option>
            <option value="TERMIN">TERMIN</option>
            <option value="PELUNASAN">PELUNASAN</option>
          </select>
        </div>

        <!-- 11. Status Pembayaran -->
        <div v-if="isInvoiceFilterRelevant" class="space-y-1">
          <label class="block text-[11px] font-semibold text-slate-600 flex items-center gap-1">
            <CreditCard class="w-3 h-3 text-slate-400" />
            Status Pembayaran
          </label>
          <select
            v-model="form.payment_status"
            class="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
          >
            <option value="ALL">Semua Status</option>
            <option value="BELUM_BAYAR">Belum Bayar</option>
            <option value="SEBAGIAN">Sebagian</option>
            <option value="LUNAS">Lunas</option>
          </select>
        </div>

        <!-- 12. Tipe Order -->
        <div class="space-y-1">
          <label class="block text-[11px] font-semibold text-slate-600">
            Tipe Order
          </label>
          <select
            v-model="form.order_type"
            class="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
          >
            <option value="ALL">Semua Tipe Order</option>
            <option value="PPN">PPN (Impact)</option>
            <option value="NON_PPN">NON PPN (Pola)</option>
            <option value="NON_PPN_2">NON PPN 2 (KS)</option>
          </select>
        </div>

        <!-- 13. Dibuat Oleh -->
        <div class="space-y-1">
          <label class="block text-[11px] font-semibold text-slate-600 flex items-center gap-1">
            <User class="w-3 h-3 text-slate-400" />
            Dibuat Oleh
          </label>
          <select
            v-model="form.created_by"
            class="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
          >
            <option :value="undefined">Semua Operator</option>
            <option v-for="u in filterOptions?.users" :key="u.id" :value="u.id">
              {{ u.username }}
            </option>
          </select>
        </div>

        <!-- 14. Basis Tanggal -->
        <div class="space-y-1">
          <label class="block text-[11px] font-semibold text-slate-600">
            Basis Tanggal
          </label>
          <select
            v-model="form.date_basis"
            class="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
          >
            <option value="so">Tanggal SO</option>
            <option value="invoice">Tanggal Invoice</option>
            <option value="payment">Tanggal Pembayaran</option>
            <option value="delivery">Tanggal Surat Jalan</option>
          </select>
        </div>

        <!-- 15. Urutkan Berdasarkan -->
        <div class="space-y-1">
          <label class="block text-[11px] font-semibold text-slate-600 flex items-center gap-1">
            <ArrowUpDown class="w-3 h-3 text-slate-400" />
            Urutkan
          </label>
          <select
            v-model="form.sort_by"
            class="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
          >
            <option v-for="s in sortOptions" :key="s.value" :value="s.value">
              {{ s.label }}
            </option>
          </select>
        </div>

        <!-- 16. Arah Urutan -->
        <div class="space-y-1">
          <label class="block text-[11px] font-semibold text-slate-600">
            Arah
          </label>
          <select
            v-model="form.sort_direction"
            class="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
          >
            <option value="DESC">Menurun (Terbaru / Terbesar)</option>
            <option value="ASC">Menaik (Terlama / Terkecil)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Active Filter Chips -->
    <div v-if="activeChips.length > 0" class="flex flex-wrap items-center gap-1.5 pt-2">
      <span class="text-[11px] text-slate-400 font-medium">Filter Aktif:</span>
      <div
        v-for="chip in activeChips"
        :key="chip.key"
        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-slate-100 text-slate-700 border border-slate-200"
      >
        <span class="text-slate-500 font-medium">{{ chip.label }}:</span>
        <span class="font-semibold text-slate-800">{{ chip.valueText }}</span>
        <button
          type="button"
          class="text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition"
          @click="removeChip(chip.key)"
        >
          <X class="w-3 h-3" />
        </button>
      </div>
    </div>

    <!-- Bottom Actions -->
    <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
        :disabled="loading"
        @click="handleReset"
      >
        <RotateCcw class="w-3.5 h-3.5 text-slate-400" />
        Reset Filter
      </button>

      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition disabled:opacity-50"
        :disabled="loading"
        @click="handleApply"
      >
        <Filter class="w-3.5 h-3.5" />
        {{ loading ? 'Memuat...' : 'Tampilkan Laporan' }}
      </button>
    </div>
  </div>
</template>
