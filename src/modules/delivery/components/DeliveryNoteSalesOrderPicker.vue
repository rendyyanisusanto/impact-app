<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { Search, Check, X, AlertCircle, Building2, PackageCheck } from 'lucide-vue-next'
import { deliveryNoteService } from '../services/delivery-note.service'
import { formatCurrency } from '@/shared/utils/formatters'
import type { SalesOrderVariantKey } from '@/modules/sales/config/sales-order-variants'

export interface SelectableSalesOrder {
  id: number
  kode: string
  tanggal?: string
  variant: SalesOrderVariantKey
  customer_id?: number | null
  customer_nama: string
  total: number
  total_ordered_qty?: number
  total_delivered_qty?: number
  total_remaining_qty?: number
  total_deliverable_stock?: number
  delivery_status?: string
}

interface Props {
  modelValue?: number | null
  isOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  isOpen: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void
  (e: 'select', order: SelectableSalesOrder): void
  (e: 'close'): void
}>()

const searchQuery = ref('')
const orders = ref<SelectableSalesOrder[]>([])
const isLoading = ref(false)
const highlightedIndex = ref(0)
const searchInputRef = ref<HTMLInputElement | null>(null)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const loadOrders = async (query = '') => {
  isLoading.value = true
  try {
    const list = await deliveryNoteService.getEligibleSalesOrders(query)
    orders.value = list
    highlightedIndex.value = 0
  } catch (err) {
    console.error('Failed to load sales orders for delivery picker:', err)
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.isOpen,
  val => {
    if (val) {
      searchQuery.value = ''
      loadOrders()
      nextTick(() => {
        searchInputRef.value?.focus()
      })
    }
  },
  { immediate: true }
)

// Live debounced search to backend API
watch(
  () => searchQuery.value,
  newQuery => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = setTimeout(() => {
      loadOrders(newQuery)
    }, 300)
  }
)

const filteredOrders = computed(() => {
  return orders.value.filter(o => {
    // If remaining qty is 0 or deliverable stock is 0, do not display in Pilih SO
    if (o.total_remaining_qty !== undefined && o.total_remaining_qty <= 0) {
      return false
    }
    if (o.total_deliverable_stock !== undefined && o.total_deliverable_stock <= 0) {
      return false
    }

    const q = searchQuery.value.toLowerCase().trim()
    if (!q) return true

    return (
      o.kode.toLowerCase().includes(q) ||
      o.customer_nama.toLowerCase().includes(q) ||
      o.variant.toLowerCase().includes(q)
    )
  })
})

const selectOrder = (order: SelectableSalesOrder) => {
  emit('update:modelValue', order.id)
  emit('select', order)
  emit('close')
}

const close = () => {
  emit('close')
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    close()
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (highlightedIndex.value < filteredOrders.value.length - 1) {
      highlightedIndex.value++
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (highlightedIndex.value > 0) {
      highlightedIndex.value--
    }
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (filteredOrders.value[highlightedIndex.value]) {
      selectOrder(filteredOrders.value[highlightedIndex.value])
    }
  }
}

const getVariantBadgeClass = (variant: SalesOrderVariantKey) => {
  switch (variant) {
    case 'impact':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800'
    case 'pola':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    case 'ks':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getVariantLabel = (variant: SalesOrderVariantKey) => {
  switch (variant) {
    case 'impact':
      return 'SO Impact (PPN)'
    case 'pola':
      return 'SO Pola'
    case 'ks':
      return 'SO KS'
    default:
      return variant
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    data-test="so-picker-overlay"
    @click.self="close"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full border border-gray-200 dark:border-gray-700 flex flex-col max-h-[85vh] overflow-hidden animate-fade-in"
      role="dialog"
      aria-modal="true"
      @keydown="handleKeydown"
    >
      <!-- Header -->
      <div
        class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50"
      >
        <div class="flex items-center gap-2.5">
          <div
            class="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
          >
            <PackageCheck class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">
              Pilih No. Sales Order
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Pilih order penjualan untuk membuat Surat Jalan atau Pengambilan Sendiri
            </p>
          </div>
        </div>
        <button
          type="button"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          data-test="close-picker-btn"
          @click="close"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Search Bar -->
      <div class="p-4 border-b border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800">
        <div class="relative">
          <Search
            class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500"
          />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            class="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            placeholder="Cari berdasarkan No. SO, customer, atau jenis (Impact/Pola/KS)..."
            data-test="so-picker-search-input"
          />
        </div>
      </div>

      <!-- List Container -->
      <div
        class="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-gray-100 dark:divide-gray-800"
      >
        <div
          v-if="isLoading"
          class="py-12 flex flex-col items-center justify-center text-gray-400 gap-2"
        >
          <div
            class="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"
          />
          <p class="text-xs">Memuat daftar Sales Order...</p>
        </div>

        <div
          v-else-if="filteredOrders.length === 0"
          class="py-12 text-center text-gray-500 dark:text-gray-400"
          data-test="no-orders-found"
        >
          <AlertCircle class="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
          <p class="text-sm font-medium">Tidak ada Sales Order yang cocok</p>
          <p class="text-xs text-gray-400 mt-1">Coba kata kunci pencarian yang lain.</p>
        </div>

        <div
          v-for="(order, index) in filteredOrders"
          v-else
          :key="order.id"
          class="p-3.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-4 select-none"
          :class="[
            highlightedIndex === index
              ? 'border-primary-500 bg-primary-50/40 dark:bg-primary-950/20 shadow-sm'
              : 'border-gray-100 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/60',
            modelValue === order.id ? 'ring-2 ring-primary-500/30' : ''
          ]"
          data-test="so-picker-item"
          @click="selectOrder(order)"
          @mouseenter="highlightedIndex = index"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1.5 flex-wrap">
              <span class="font-semibold text-sm text-gray-900 dark:text-gray-100 tracking-tight">
                {{ order.kode }}
              </span>
              <span
                class="px-2 py-0.5 text-[11px] font-medium rounded-full border"
                :class="getVariantBadgeClass(order.variant)"
              >
                {{ getVariantLabel(order.variant) }}
              </span>
              <span
                v-if="order.total_remaining_qty !== undefined"
                class="px-2 py-0.5 text-[11px] font-medium rounded-full border bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
              >
                Sisa: {{ order.total_remaining_qty }} Item
              </span>
              <span
                v-if="order.total_deliverable_stock !== undefined"
                class="px-2 py-0.5 text-[11px] font-medium rounded-full border bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
              >
                Stok Siap: {{ order.total_deliverable_stock }}
              </span>
            </div>

            <div class="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
              <div class="flex items-center gap-1 truncate">
                <Building2 class="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span class="truncate font-medium text-gray-700 dark:text-gray-300">{{
                  order.customer_nama
                }}</span>
              </div>
            </div>
          </div>

          <div class="text-right shrink-0">
            <div class="text-xs text-gray-400 font-medium mb-0.5">Total Pembelian</div>
            <div class="text-sm font-bold text-gray-900 dark:text-white">
              {{ formatCurrency(order.total) }}
            </div>
          </div>

          <div class="shrink-0 pl-2">
            <div
              v-if="modelValue === order.id"
              class="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center shadow"
            >
              <Check class="w-4 h-4" />
            </div>
            <div
              v-else
              class="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600 hover:border-primary-400"
            />
          </div>
        </div>
      </div>

      <!-- Footer Info -->
      <div
        class="px-6 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"
      >
        <span
          >Gunakan tombol
          <kbd class="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-[10px]">↑</kbd>
          <kbd class="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-[10px]">↓</kbd> dan
          <kbd class="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-[10px]"
            >Enter</kbd
          ></span
        >
        <button
          type="button"
          class="px-4 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          @click="close"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
</template>
