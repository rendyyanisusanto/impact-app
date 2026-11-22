<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { productService } from '@/modules/inventory/products/services/product.service'
import type { Produk } from '@/modules/inventory/products/types/product.types'
import { formatCurrency, formatNumber } from '@/shared/utils/formatters'
import { Search, X, Package, Check, AlertCircle } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', product: Produk): void
}>()

const searchInputRef = ref<HTMLInputElement | null>(null)
const searchQuery = ref('')
const selectedIndex = ref(0)
const allProducts = ref<Produk[]>([])

async function loadProducts(): Promise<void> {
  try {
    const res = await productService.getAll({ pageSize: 100 })
    allProducts.value = (res.data || []).filter(p => p.status === 1)
  } catch (error) {
    console.error('Failed to load products in picker:', error)
  }
}

const filteredProducts = computed<Produk[]>(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return allProducts.value
  return allProducts.value.filter(
    p => (p.nama || '').toLowerCase().includes(q) || (p.kode || '').toLowerCase().includes(q)
  )
})

watch(
  () => props.isOpen,
  async open => {
    if (open) {
      searchQuery.value = ''
      selectedIndex.value = 0
      if (allProducts.value.length === 0) {
        await loadProducts()
      }
      await nextTick()
      searchInputRef.value?.focus()
    }
  }
)

watch(filteredProducts, () => {
  selectedIndex.value = 0
})

function selectCurrentProduct() {
  const prod = filteredProducts.value[selectedIndex.value]
  if (prod) {
    emit('select', prod)
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (!props.isOpen) return

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (selectedIndex.value < filteredProducts.value.length - 1) {
      selectedIndex.value++
      scrollToActive()
    }
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    if (selectedIndex.value > 0) {
      selectedIndex.value--
      scrollToActive()
    }
  } else if (event.key === 'Enter') {
    event.preventDefault()
    selectCurrentProduct()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
  }
}

function scrollToActive() {
  nextTick(() => {
    const el = document.querySelector('.product-picker-active-row')
    if (el) {
      el.scrollIntoView({ block: 'nearest' })
    }
  })
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
    @click.self="emit('close')"
  >
    <div
      class="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      <!-- Modal Header -->
      <div
        class="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50"
      >
        <div class="flex items-center gap-2.5">
          <div
            class="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700"
          >
            <Package class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-slate-800">Pilih Produk Furniture</h3>
            <p class="text-xs text-slate-500">
              Cari produk berdasarkan kode atau nama barang jadi (Sprint 3 Master Produk)
            </p>
          </div>
        </div>

        <button
          type="button"
          class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
          @click="emit('close')"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Search Input Toolbar -->
      <div class="p-4 border-b border-slate-100 bg-white">
        <div class="relative">
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="Ketik kode atau nama produk furniture (Gunakan panah ↑ ↓ dan Enter)..."
            class="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      <!-- Product List Table -->
      <div class="flex-1 overflow-y-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead
            class="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-semibold tracking-wider z-10"
          >
            <tr>
              <th class="py-2.5 px-4 w-32">Kode Produk</th>
              <th class="py-2.5 px-4">Nama Produk</th>
              <th class="py-2.5 px-4 w-28 text-right">Stok Fisik</th>
              <th class="py-2.5 px-4 w-36 text-right">Harga Satuan</th>
              <th class="py-2.5 px-4 w-20 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="filteredProducts.length === 0">
              <td colspan="5" class="py-12 text-center text-slate-400">
                <AlertCircle class="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p class="font-medium text-xs">Produk tidak ditemukan</p>
                <p class="text-[11px] text-slate-400 mt-0.5">
                  Coba kata kunci pencarian kode atau nama lain.
                </p>
              </td>
            </tr>

            <tr
              v-for="(prod, idx) in filteredProducts"
              :key="prod.id"
              class="cursor-pointer transition-colors"
              :class="[
                selectedIndex === idx
                  ? 'product-picker-active-row bg-teal-50/70 border-l-4 border-l-teal-600'
                  : 'hover:bg-slate-50'
              ]"
              @click="selectedIndex = idx"
              @dblclick="selectCurrentProduct"
            >
              <td class="py-2.5 px-4 font-mono font-semibold text-slate-800">
                {{ prod.kode }}
              </td>
              <td class="py-2.5 px-4 font-medium text-slate-800">
                <div>{{ prod.nama }}</div>
                <div v-if="prod.keterangan" class="text-[11px] text-slate-400 truncate max-w-sm">
                  {{ prod.keterangan }}
                </div>
              </td>
              <td class="py-2.5 px-4 text-right font-mono font-medium text-slate-700">
                <span
                  class="px-2 py-0.5 rounded text-[11px]"
                  :class="
                    (prod.qty ?? 0) > 0
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'bg-rose-50 text-rose-700 font-semibold'
                  "
                >
                  {{ formatNumber(prod.qty ?? 0) }} Pcs
                </span>
              </td>
              <td class="py-2.5 px-4 text-right font-mono font-semibold text-teal-700">
                {{ formatCurrency(prod.harga ?? 0) }}
              </td>
              <td class="py-2.5 px-4 text-center">
                <button
                  type="button"
                  class="p-1.5 rounded-lg text-teal-600 hover:bg-teal-100/70 transition-colors"
                  title="Pilih Produk"
                  @click.stop="emit('select', prod)"
                >
                  <Check class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal Footer -->
      <div
        class="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500"
      >
        <div class="flex items-center gap-3 text-[11px] text-slate-400">
          <span>Gunakan <b>↑</b> <b>↓</b> untuk memilih</span>
          <span>•</span>
          <span><b>Enter</b> untuk konfirmasi</span>
          <span>•</span>
          <span><b>Esc</b> untuk tutup</span>
        </div>

        <button
          type="button"
          class="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          @click="emit('close')"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
</template>
