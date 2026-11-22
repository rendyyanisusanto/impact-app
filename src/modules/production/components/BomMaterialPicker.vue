<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { bomService } from '../services/bom.service'
import { Search, X, Package, Warehouse } from 'lucide-vue-next'
import { formatNumber, formatCurrency } from '@/shared/utils/formatters'

interface SelectableMaterial {
  id: number
  kode: string
  nama: string
  satuan_id: number
  satuan_nama: string
  qty: number
  harga_satuan: number
  gudang_nama: string
}

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'select', material: SelectableMaterial): void
  (e: 'close'): void
}>()

const searchInputRef = ref<HTMLInputElement | null>(null)
const searchQuery = ref('')
const selectedIndex = ref(0)
const materials = ref<SelectableMaterial[]>([])
const isLoading = ref(true)

async function loadMaterials() {
  isLoading.value = true
  try {
    materials.value = await bomService.getSelectableMaterials()
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadMaterials()
})

watch(
  () => props.isOpen,
  isOpen => {
    if (isOpen) {
      searchQuery.value = ''
      selectedIndex.value = 0
      loadMaterials()
      nextTick(() => {
        searchInputRef.value?.focus()
      })
    }
  }
)

const filteredMaterials = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return materials.value
  return materials.value.filter(
    m =>
      m.kode.toLowerCase().includes(q) ||
      m.nama.toLowerCase().includes(q) ||
      m.gudang_nama.toLowerCase().includes(q)
  )
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
    const activeEl = document.querySelector('[data-bom-picker-active="true"]')
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
    class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
    @keydown="onKeydown"
  >
    <div
      class="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
      @click.stop
    >
      <!-- Modal Header -->
      <div
        class="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50"
      >
        <div class="flex items-center gap-2.5">
          <div class="p-2 bg-teal-50 text-teal-700 rounded-lg">
            <Package class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-slate-900">Pilih Bahan Baku BoM</h3>
            <p class="text-xs text-slate-500">
              Pilih bahan baku untuk dimasukkan ke dalam template komposisi produk
            </p>
          </div>
        </div>
        <button
          type="button"
          class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          @click="emit('close')"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Search Input -->
      <div class="p-4 border-b border-slate-100 bg-white">
        <div class="relative">
          <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="Cari berdasarkan kode, nama bahan baku, atau gudang..."
            class="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
      </div>

      <!-- Materials List -->
      <div class="flex-1 overflow-y-auto p-2 divide-y divide-slate-100">
        <div v-if="isLoading" class="p-8 text-center text-xs text-slate-500">
          Memuat daftar bahan baku...
        </div>

        <div
          v-else-if="filteredMaterials.length === 0"
          class="p-8 text-center text-xs text-slate-500"
        >
          Tidak ada bahan baku yang cocok dengan pencarian.
        </div>

        <button
          v-for="(item, idx) in filteredMaterials"
          v-else
          :key="item.id"
          type="button"
          :data-bom-picker-active="selectedIndex === idx"
          :class="[
            'w-full text-left p-3 rounded-lg flex items-center justify-between gap-3 transition-colors',
            selectedIndex === idx ? 'bg-teal-50 border border-teal-200' : 'hover:bg-slate-50'
          ]"
          @click="chooseMaterial(item)"
          @mouseenter="selectedIndex = idx"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div
              :class="[
                'w-8 h-8 rounded flex items-center justify-center text-xs font-mono font-bold shrink-0',
                selectedIndex === idx ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
              ]"
            >
              {{ idx + 1 }}
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-mono text-xs font-semibold text-slate-900">{{ item.kode }}</span>
                <span class="text-slate-300">•</span>
                <span class="text-xs font-medium text-slate-800 truncate">{{ item.nama }}</span>
              </div>
              <div class="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                <span class="flex items-center gap-1">
                  <Warehouse class="w-3 h-3 text-slate-400" />
                  {{ item.gudang_nama || '-' }}
                </span>
                <span>•</span>
                <span
                  >Satuan Pakai: <strong>{{ item.satuan_nama }}</strong></span
                >
                <span>•</span>
                <span>Harga: {{ formatCurrency(item.harga_satuan) }}</span>
              </div>
            </div>
          </div>

          <div class="text-right shrink-0">
            <div class="text-xs font-mono font-semibold text-slate-900">
              {{ formatNumber(item.qty) }} {{ item.satuan_nama }}
            </div>
            <div class="text-[10px] text-slate-400">Stok Tersedia</div>
          </div>
        </button>
      </div>

      <!-- Modal Footer -->
      <div
        class="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500"
      >
        <div class="flex items-center gap-2">
          <span
            class="kbd px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]"
            >↑↓</span
          >
          <span>Pilih</span>
          <span
            class="kbd px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]"
            >Enter</span
          >
          <span>Terapkan</span>
          <span
            class="kbd px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]"
            >Esc</span
          >
          <span>Tutup</span>
        </div>
        <div>
          Total <strong>{{ filteredMaterials.length }}</strong> bahan baku
        </div>
      </div>
    </div>
  </div>
</template>
