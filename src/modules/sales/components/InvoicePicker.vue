<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import {
  Search,
  Check,
  FileText,
  X,
  AlertCircle,
  Building2,
  Calendar,
  CreditCard
} from 'lucide-vue-next'
import type { SalesInvoiceListItem } from '../types/sales-invoice.types'
import { salesPaymentService } from '../services/sales-payment.service'

interface Props {
  modelValue?: number | null
  isOpen?: boolean
  customerId?: number | null
  excludedInvoiceIds?: number[]
  multiple?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  isOpen: false,
  customerId: null,
  excludedInvoiceIds: () => [],
  multiple: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void
  (e: 'select', invoice: SalesInvoiceListItem): void
  (e: 'add-multiple', invoices: SalesInvoiceListItem[]): void
  (e: 'close'): void
}>()

const searchQuery = ref('')
const invoices = ref<SalesInvoiceListItem[]>([])
const selectedIds = ref<Set<number>>(new Set())
const isLoading = ref(false)
const highlightedIndex = ref(0)
const searchInputRef = ref<HTMLInputElement | null>(null)

const loadEligibleInvoices = async () => {
  isLoading.value = true
  try {
    const list = await salesPaymentService.getEligibleInvoicesForPayment(props.customerId, searchQuery.value)
    invoices.value = list
    highlightedIndex.value = 0
  } catch (err) {
    console.error('Failed to load eligible invoices for picker:', err)
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.isOpen,
  val => {
    if (val) {
      searchQuery.value = ''
      selectedIds.value = new Set()
      loadEligibleInvoices()
      nextTick(() => {
        searchInputRef.value?.focus()
      })
    }
  },
  { immediate: true }
)

watch(
  () => props.customerId,
  () => {
    if (props.isOpen) {
      loadEligibleInvoices()
    }
  }
)

const filteredInvoices = computed(() => {
  if (!searchQuery.value.trim()) return invoices.value
  const q = searchQuery.value.toLowerCase().trim()
  return invoices.value.filter(
    inv =>
      inv.kode.toLowerCase().includes(q) ||
      inv.so_kode.toLowerCase().includes(q) ||
      inv.customer_nama.toLowerCase().includes(q) ||
      (inv.so_variant && inv.so_variant.toLowerCase().includes(q))
  )
})

const isExcluded = (id: number) => {
  return props.excludedInvoiceIds.includes(id)
}

const isAllSelected = computed(() => {
  const selectable = filteredInvoices.value.filter(inv => !isExcluded(inv.id))
  return selectable.length > 0 && selectable.every(inv => selectedIds.value.has(inv.id))
})

const toggleSelectAll = () => {
  const selectable = filteredInvoices.value.filter(inv => !isExcluded(inv.id))
  if (isAllSelected.value) {
    selectable.forEach(inv => selectedIds.value.delete(inv.id))
  } else {
    selectable.forEach(inv => selectedIds.value.add(inv.id))
  }
}

const toggleSelection = (inv: SalesInvoiceListItem) => {
  if (isExcluded(inv.id)) return
  if (!props.multiple) {
    selectInvoice(inv)
    return
  }
  if (selectedIds.value.has(inv.id)) {
    selectedIds.value.delete(inv.id)
  } else {
    selectedIds.value.add(inv.id)
  }
}

const handleAddMultiple = () => {
  const chosen = invoices.value.filter(inv => selectedIds.value.has(inv.id))
  if (chosen.length > 0) {
    emit('add-multiple', chosen)
    if (chosen.length === 1 && chosen[0]) {
      emit('update:modelValue', chosen[0].id)
      emit('select', chosen[0])
    }
  }
  emit('close')
}

watch(filteredInvoices, () => {
  highlightedIndex.value = 0
})

const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val)
}

const getVariantBadge = (variant?: string) => {
  switch (variant) {
    case 'impact':
      return { label: 'SO Impact (PPN)', bg: 'bg-teal-50 text-teal-700 border-teal-200' }
    case 'pola':
      return { label: 'SO Pola', bg: 'bg-blue-50 text-blue-700 border-blue-200' }
    case 'ks':
      return { label: 'SO KS', bg: 'bg-purple-50 text-purple-700 border-purple-200' }
    default:
      return { label: 'SO Impact', bg: 'bg-slate-50 text-slate-700 border-slate-200' }
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (!props.isOpen && !searchInputRef.value) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (filteredInvoices.value.length > 0) {
      highlightedIndex.value = (highlightedIndex.value + 1) % filteredInvoices.value.length
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (filteredInvoices.value.length > 0) {
      highlightedIndex.value =
        (highlightedIndex.value - 1 + filteredInvoices.value.length) % filteredInvoices.value.length
    }
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (filteredInvoices.value.length > 0) {
      const selected = filteredInvoices.value[highlightedIndex.value]
      if (selected) {
        selectInvoice(selected)
      }
    }
  } else if (e.key === 'Escape') {
    e.preventDefault()
    emit('close')
  }
}

const selectInvoice = (inv: SalesInvoiceListItem) => {
  emit('update:modelValue', inv.id)
  emit('select', inv)
  emit('close')
}

onMounted(() => {
  loadEligibleInvoices()
})
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity"
    @click.self="emit('close')"
    @keydown="handleKeyDown"
  >
    <div
      class="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
    >
      <!-- Header -->
      <div
        class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50"
      >
        <div>
          <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
            <FileText class="w-5 h-5 text-teal-600" />
            Pilih Invoice Tagihan Penjualan
          </h3>
          <p class="text-xs text-slate-500 mt-0.5">
            Gunakan panah naik/turun dan tombol Enter untuk navigasi cepat
          </p>
        </div>
        <button
          type="button"
          class="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          @click="emit('close')"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Search Input & Multi-Select Bar -->
      <div class="p-4 border-b border-slate-100 bg-white space-y-3">
        <div class="relative">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            data-test="invoice-picker-search"
            class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 placeholder-slate-400"
            placeholder="Cari berdasarkan No Invoice, No SO, atau Nama Customer..."
            @keydown="handleKeyDown"
          />
        </div>

        <!-- Multi-select Toolbar -->
        <div v-if="multiple" class="flex items-center justify-between text-xs pt-1">
          <label class="flex items-center gap-2 cursor-pointer font-medium text-slate-700 select-none">
            <input
              type="checkbox"
              :checked="isAllSelected"
              class="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              @change="toggleSelectAll"
            />
            <span>Pilih Semua yang Tersedia</span>
          </label>

          <span class="text-slate-500">
            Terpilih: <strong class="text-teal-700">{{ selectedIds.size }}</strong> invoice
          </span>
        </div>
      </div>

      <!-- Invoices List -->
      <div class="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
        <div v-if="isLoading" class="p-8 text-center text-slate-500 text-sm">
          Memuat daftar tagihan invoice...
        </div>

        <div
          v-else-if="filteredInvoices.length === 0"
          data-test="invoice-picker-empty"
          class="p-8 text-center"
        >
          <AlertCircle class="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p class="text-sm font-medium text-slate-700">
            Tidak ada invoice tagihan yang siap dibayar
          </p>
          <p class="text-xs text-slate-400 mt-1">
            Seluruh invoice telah lunas atau tidak ditemukan hasil yang cocok dengan kata kunci pencarian.
          </p>
        </div>

        <div
          v-for="(inv, idx) in filteredInvoices"
          :key="inv.id"
          data-test="invoice-picker-item"
          :class="[
            'p-3.5 rounded-lg transition-colors border text-left flex items-start justify-between gap-3',
            isExcluded(inv.id)
              ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-100'
              : selectedIds.has(inv.id)
                ? 'bg-teal-50/80 border-teal-300 ring-1 ring-teal-500/20 cursor-pointer'
                : highlightedIndex === idx
                  ? 'bg-slate-50 border-slate-200 cursor-pointer'
                  : 'hover:bg-slate-50 border-transparent cursor-pointer'
          ]"
          @click="toggleSelection(inv)"
          @mouseenter="highlightedIndex = idx"
        >
          <!-- Checkbox for multi-mode -->
          <div v-if="multiple" class="pt-0.5 flex-shrink-0">
            <input
              type="checkbox"
              :checked="selectedIds.has(inv.id)"
              :disabled="isExcluded(inv.id)"
              class="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
              @click.stop="toggleSelection(inv)"
            />
          </div>

          <div class="space-y-1.5 flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-bold text-slate-900 text-sm tracking-tight">{{ inv.kode }}</span>
              <span
                :class="[
                  'text-[11px] font-semibold px-2 py-0.5 rounded-full border',
                  getVariantBadge(inv.so_variant).bg
                ]"
              >
                {{ getVariantBadge(inv.so_variant).label }}
              </span>
              <span class="text-xs text-slate-500 font-medium">Ref: {{ inv.so_kode }}</span>
              <span
                :class="[
                  'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase',
                  inv.status_pembayaran === 'BELUM_BAYAR'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-blue-100 text-blue-800'
                ]"
              >
                {{ inv.status_pembayaran === 'BELUM_BAYAR' ? 'Belum Bayar' : 'Sebagian' }}
              </span>
              <span
                v-if="isExcluded(inv.id)"
                class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 uppercase"
              >
                Sudah Dipilih
              </span>
            </div>

            <div class="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
              <span class="flex items-center gap-1 font-medium text-slate-700 truncate">
                <Building2 class="w-3.5 h-3.5 text-slate-400" />
                {{ inv.customer_nama }}
              </span>
              <span class="flex items-center gap-1 text-slate-500">
                <Calendar class="w-3.5 h-3.5 text-slate-400" />
                {{ inv.tanggal }}
              </span>
              <span class="text-slate-500"> Jenis: {{ inv.jenis }} </span>
            </div>
          </div>

          <div class="text-right flex-shrink-0 space-y-0.5">
            <div class="text-xs text-slate-500">Total: {{ formatCurrency(inv.total) }}</div>
            <div class="text-sm font-bold text-rose-600 flex items-center justify-end gap-1">
              <CreditCard class="w-3.5 h-3.5" />
              Sisa: {{ formatCurrency(inv.sisa_pembayaran) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div
        class="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500"
      >
        <span>
          Menampilkan <strong>{{ filteredInvoices.length }}</strong> tagihan invoice siap dibayar
        </span>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors font-medium"
            @click="emit('close')"
          >
            Batal (Esc)
          </button>

          <button
            v-if="multiple"
            type="button"
            data-test="btn-add-selected-invoices"
            :disabled="selectedIds.size === 0"
            class="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-xs"
            @click="handleAddMultiple"
          >
            <Check class="w-4 h-4" />
            Tambahkan {{ selectedIds.size > 0 ? `(${selectedIds.size})` : '' }} Invoice
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
