<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { productionService } from '../services/production.service'
import type { SelectableProduct } from '../types/production.types'
import { Search, X, Package, Info } from 'lucide-vue-next'
import { formatNumber } from '@/shared/utils/formatters'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'select', product: SelectableProduct): void
  (e: 'close'): void
}>()

const searchInputRef = ref<HTMLInputElement | null>(null)
const tableContainerRef = ref<HTMLDivElement | null>(null)
const searchQuery = ref('')
const selectedIndex = ref(0)
const products = ref<SelectableProduct[]>([])
const isLoading = ref(true)

let searchTimeout: ReturnType<typeof setTimeout> | null = null

async function loadProducts(query = '') {
  isLoading.value = true
  try {
    products.value = await productionService.getSelectableProducts(query)
  } catch (err) {
    console.error('Failed to load selectable products:', err)
  } finally {
    isLoading.value = false
  }
}

function onSearchInput() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadProducts(searchQuery.value)
  }, 250)
}

onMounted(() => {
  loadProducts()
})

watch(
  () => props.isOpen,
  isOpen => {
    if (isOpen) {
      searchQuery.value = ''
      selectedIndex.value = 0
      loadProducts('')
      nextTick(() => {
        searchInputRef.value?.focus()
      })
    }
  }
)

const filteredProducts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return products.value
  return products.value.filter(p => {
    const kode = (p.kode || '').toLowerCase()
    const nama = (p.nama || '').toLowerCase()
    const kategori = (p.kategori_nama || '').toLowerCase()
    const gudang = (p.gudang_nama || '').toLowerCase()
    return kode.includes(q) || nama.includes(q) || kategori.includes(q) || gudang.includes(q)
  })
})

watch(filteredProducts, () => {
  selectedIndex.value = 0
})

function onKeydown(e: KeyboardEvent) {
  if (!props.isOpen) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (selectedIndex.value < filteredProducts.value.length - 1) {
      selectedIndex.value++
      scrollToSelected()
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (selectedIndex.value > 0) {
      selectedIndex.value--
      scrollToSelected()
    }
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (filteredProducts.value[selectedIndex.value]) {
      chooseProduct(filteredProducts.value[selectedIndex.value])
    }
  } else if (e.key === 'Escape') {
    e.preventDefault()
    emit('close')
  }
}

function scrollToSelected() {
  nextTick(() => {
    const container = tableContainerRef.value
    if (!container) return
    const row = container.querySelector(`[data-index="${selectedIndex.value}"]`) as HTMLElement
    if (row) {
      row.scrollIntoView({ block: 'nearest' })
    }
  })
}

function chooseProduct(product: SelectableProduct) {
  emit('select', product)
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all"
    @keydown="onKeydown"
  >
    <div
      class="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      <!-- Header -->
      <div
        class="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700"
          >
            <Package class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-slate-800">Pilih Produk Furniture</h3>
            <p class="text-xs text-slate-500">
              Pilih produk master untuk ditambahkan ke daftar produksi
            </p>
          </div>
        </div>
        <button
          type="button"
          class="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          @click="emit('close')"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Search Input Toolbar -->
      <div class="p-4 border-b border-slate-100 bg-white">
        <div class="relative">
          <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="Cari berdasarkan kode, nama produk, kategori, atau gudang... (↑↓ navigasi, Enter pilih, Esc batal)"
            class="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
            @input="onSearchInput"
          />
        </div>
      </div>

      <!-- Table Body -->
      <div ref="tableContainerRef" class="flex-1 overflow-y-auto divide-y divide-slate-100">
        <div v-if="isLoading" class="p-12 text-center text-slate-400">
          <div
            class="inline-block animate-spin w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full mb-2"
          />
          <p class="text-xs">Memuat daftar master produk...</p>
        </div>

        <div v-else-if="filteredProducts.length === 0" class="p-12 text-center text-slate-400">
          <Package class="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-[1.5]" />
          <p class="text-sm font-medium text-slate-600">Produk tidak ditemukan</p>
          <p class="text-xs text-slate-400 mt-1">Coba gunakan kata kunci pencarian yang lain</p>
        </div>

        <table v-else class="w-full text-left text-xs border-collapse">
          <thead
            class="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px] font-semibold"
          >
            <tr>
              <th class="py-2.5 px-4 w-12 text-center">No</th>
              <th class="py-2.5 px-4 w-28">Kode</th>
              <th class="py-2.5 px-4">Nama Produk</th>
              <th class="py-2.5 px-4 w-28">Kategori</th>
              <th class="py-2.5 px-4 w-20 text-center">Satuan</th>
              <th class="py-2.5 px-4 w-24 text-right">Stok Riil</th>
              <th class="py-2.5 px-4 w-24 text-center">BoM Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="(prod, idx) in filteredProducts"
              :key="prod.id"
              :data-index="idx"
              class="cursor-pointer transition-colors"
              :class="[
                selectedIndex === idx
                  ? 'bg-teal-50 text-teal-900 font-medium'
                  : 'hover:bg-slate-50 text-slate-700'
              ]"
              @click="selectedIndex = idx"
              @dblclick="chooseProduct(prod)"
            >
              <td class="py-2 px-4 text-center text-slate-400 text-[11px]">{{ idx + 1 }}</td>
              <td class="py-2 px-4 font-mono font-medium text-slate-700">{{ prod.kode }}</td>
              <td class="py-2 px-4 font-medium">{{ prod.nama }}</td>
              <td class="py-2 px-4 text-slate-500">{{ prod.kategori_nama }}</td>
              <td class="py-2 px-4 text-center text-slate-500">{{ prod.satuan_nama }}</td>
              <td
                class="py-2 px-4 text-right font-mono font-semibold"
                :class="prod.qty > 0 ? 'text-slate-700' : 'text-amber-600'"
              >
                {{ formatNumber(prod.qty) }}
              </td>
              <td class="py-2 px-4 text-center">
                <span
                  v-if="prod.has_bom"
                  class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  Ada BoM
                </span>
                <span
                  v-else
                  class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500"
                >
                  Belum Ada
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer Info Bar -->
      <div
        class="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500"
      >
        <div class="flex items-center gap-1.5">
          <Info class="w-4 h-4 text-slate-400" />
          <span
            >Double-click baris atau tekan
            <kbd
              class="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]"
              >Enter</kbd
            >
            untuk memilih</span
          >
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            class="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors font-medium"
            @click="emit('close')"
          >
            Tutup
          </button>
          <button
            type="button"
            class="px-4 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors font-medium shadow-sm"
            :disabled="!filteredProducts[selectedIndex]"
            @click="
              filteredProducts[selectedIndex] && chooseProduct(filteredProducts[selectedIndex])
            "
          >
            Pilih Produk
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
