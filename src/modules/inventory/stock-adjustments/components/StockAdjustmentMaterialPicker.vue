<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { stockAdjustmentService } from '../services/stock-adjustment.service'
import { referenceService, type ReferenceOption } from '@/shared/services/reference.service'
import { Search, X, Package, Warehouse, Loader2 } from 'lucide-vue-next'
import { formatNumber } from '@/shared/utils/formatters'
import type { SelectableMaterial } from '../types/stock-adjustment.types'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'select', material: SelectableMaterial): void
  (e: 'close'): void
}>()

const searchInputRef = ref<HTMLInputElement | null>(null)
const searchQuery = ref('')
const selectedGudangId = ref<number | null>(null)
const warehouseOptions = ref<ReferenceOption[]>([])
const selectedIndex = ref(0)
const materials = ref<SelectableMaterial[]>([])
const isLoading = ref(false)

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

async function loadWarehouses() {
  try {
    warehouseOptions.value = await referenceService.getWarehouses()
  } catch {
    warehouseOptions.value = []
  }
}

async function fetchMaterials(query = '', gudangId: number | null = null) {
  isLoading.value = true
  try {
    const data = await stockAdjustmentService.getSelectableMaterials(
      query.trim() || undefined,
      gudangId ? Number(gudangId) : undefined
    )
    materials.value = data || []
    selectedIndex.value = 0
  } catch (err) {
    console.error('Error fetching materials:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadWarehouses()
})

watch(
  () => props.isOpen,
  isOpen => {
    if (isOpen) {
      searchQuery.value = ''
      selectedGudangId.value = null
      selectedIndex.value = 0
      fetchMaterials('', null)
      nextTick(() => {
        searchInputRef.value?.focus()
      })
    }
  }
)

// Debounced live search ke backend saat mengetik
watch(searchQuery, newQuery => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    fetchMaterials(newQuery, selectedGudangId.value)
  }, 250)
})

function onWarehouseChange() {
  fetchMaterials(searchQuery.value, selectedGudangId.value)
}

function clearSearch() {
  searchQuery.value = ''
  fetchMaterials('', selectedGudangId.value)
  nextTick(() => {
    searchInputRef.value?.focus()
  })
}

// Client-side filtering instan dengan null-safety
const filteredMaterials = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  let list = materials.value

  if (selectedGudangId.value) {
    list = list.filter(m => m.gudang_id === Number(selectedGudangId.value))
  }

  if (!q) return list

  return list.filter(m => {
    const kode = (m.kode || '').toLowerCase()
    const nama = (m.nama || '').toLowerCase()
    const gudang = (m.gudang_nama || '').toLowerCase()
    const satuan = (m.satuan_nama || '').toLowerCase()
    return (
      kode.includes(q) ||
      nama.includes(q) ||
      gudang.includes(q) ||
      satuan.includes(q)
    )
  })
})

function onKeydown(e: KeyboardEvent) {
  if (!props.isOpen) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (selectedIndex.value < filteredMaterials.value.length - 1) {
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
    if (filteredMaterials.value[selectedIndex.value]) {
      chooseMaterial(filteredMaterials.value[selectedIndex.value])
    }
  } else if (e.key === 'Escape') {
    e.preventDefault()
    emit('close')
  }
}

function scrollToSelected() {
  nextTick(() => {
    const activeEl = document.querySelector('[data-adjustment-picker-active="true"]')
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' })
    }
  })
}

function chooseMaterial(material: SelectableMaterial) {
  emit('select', material)
}
</script>

<template>
  <div
    v-if="isOpen"
    tabindex="-1"
    class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 focus:outline-none"
    @keydown="onKeydown"
  >
    <div
      class="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
      @click.stop
    >
      <!-- Modal Header -->
      <div
        class="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50"
      >
        <div class="flex items-center gap-2.5">
          <div class="p-2 bg-teal-50 text-teal-700 rounded-lg">
            <Package class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-slate-900">Pilih Bahan Baku</h3>
            <p class="text-xs text-slate-500">Pilih bahan baku untuk dicatat hasil stock opname</p>
          </div>
        </div>
        <button
          type="button"
          class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          title="Tutup (Esc)"
          @click="emit('close')"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Search & Gudang Filter Toolbar -->
      <div class="p-3.5 border-b border-slate-100 bg-white space-y-2">
        <div class="flex items-center gap-2">
          <!-- Text Search Input -->
          <div class="relative flex-1">
            <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              placeholder="Cari berdasarkan kode, nama bahan, atau gudang..."
              class="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              @keydown="onKeydown"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
              title="Hapus kata kunci"
              @click="clearSearch"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Filter Gudang Dropdown -->
          <div class="w-44 shrink-0">
            <select
              v-model="selectedGudangId"
              class="w-full py-2 px-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-slate-700"
              @change="onWarehouseChange"
            >
              <option :value="null">Semua Gudang</option>
              <option
                v-for="wh in warehouseOptions"
                :key="wh.value"
                :value="wh.value"
              >
                {{ wh.label }}
              </option>
            </select>
          </div>
        </div>

        <div class="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span>Gunakan panah ↑↓ untuk navigasi, Enter untuk memilih</span>
          <span v-if="isLoading" class="flex items-center gap-1 text-teal-600">
            <Loader2 class="w-3 h-3 animate-spin" />
            <span>Mencari...</span>
          </span>
        </div>
      </div>

      <!-- Materials List Container -->
      <div class="flex-1 overflow-y-auto p-2 divide-y divide-slate-100 min-h-[220px]">
        <div v-if="isLoading && filteredMaterials.length === 0" class="p-10 text-center text-xs text-slate-500">
          <Loader2 class="w-6 h-6 animate-spin text-teal-600 mx-auto mb-2" />
          Memuat daftar bahan baku dari database...
        </div>

        <div
          v-else-if="filteredMaterials.length === 0"
          class="p-10 text-center text-xs text-slate-500"
        >
          <Package class="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p class="font-medium text-slate-700">Tidak ada bahan baku yang cocok</p>
          <p class="text-[11px] text-slate-400 mt-1">Coba kata kunci lain atau pilih "Semua Gudang"</p>
          <button
            v-if="searchQuery || selectedGudangId"
            type="button"
            class="mt-3 px-3 py-1 text-xs text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded font-medium transition-colors"
            @click="clearSearch"
          >
            Reset Pencarian
          </button>
        </div>

        <button
          v-for="(item, idx) in filteredMaterials"
          v-else
          :key="item.id"
          type="button"
          :data-adjustment-picker-active="selectedIndex === idx"
          :class="[
            'w-full text-left p-2.5 rounded-lg flex items-center justify-between gap-3 transition-colors',
            selectedIndex === idx ? 'bg-teal-50/90 border border-teal-300' : 'hover:bg-slate-50'
          ]"
          @click="chooseMaterial(item)"
          @dblclick="chooseMaterial(item)"
          @mouseenter="selectedIndex = idx"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div
              :class="[
                'w-7 h-7 rounded flex items-center justify-center text-xs font-mono font-bold shrink-0',
                selectedIndex === idx ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
              ]"
            >
              {{ idx + 1 }}
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-mono text-xs font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                  {{ item.kode || `MAT-${item.id}` }}
                </span>
                <span class="text-xs font-semibold text-slate-800 truncate">{{ item.nama }}</span>
              </div>
              <div class="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                <span class="flex items-center gap-1">
                  <Warehouse class="w-3 h-3 text-slate-400" />
                  {{ item.gudang_nama || 'Gudang Utama' }}
                </span>
                <span>•</span>
                <span>Satuan: <strong>{{ item.satuan_nama || 'Unit' }}</strong></span>
              </div>
            </div>
          </div>

          <div class="text-right shrink-0">
            <div class="text-xs font-mono font-bold text-slate-900">
              {{ formatNumber(item.qty) }} {{ item.satuan_nama || 'Unit' }}
            </div>
            <div class="text-[10px] text-slate-400">Stok Sistem</div>
          </div>
        </button>
      </div>

      <!-- Modal Footer -->
      <div
        class="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500"
      >
        <div class="flex items-center gap-2">
          <span class="kbd px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">↑↓</span>
          <span>Pilih</span>
          <span class="kbd px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">Enter</span>
          <span>Pilih</span>
          <span class="kbd px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">Esc</span>
          <span>Tutup</span>
        </div>
        <div>
          Total <strong>{{ filteredMaterials.length }}</strong> bahan ditemukan
        </div>
      </div>
    </div>
  </div>
</template>
