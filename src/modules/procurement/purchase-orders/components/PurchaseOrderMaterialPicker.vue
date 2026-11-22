<script setup lang="ts">
import { ref, computed, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { purchaseOrderService } from '../services/purchase-order.service'
import { Search, X, Package, Check } from 'lucide-vue-next'
import { formatCurrency } from '@/shared/utils/formatters'

interface MaterialItem {
  id: number
  kode: string
  nama: string
  qty: number
  satuan_beli_id: number | null
  satuan_beli_nama?: string
  harga_satuan: number | null
}

const props = defineProps<{
  isOpen: boolean
  anchorRect?: { top: number; left: number; width: number; height: number } | null
}>()

const emit = defineEmits<{
  (e: 'select', material: MaterialItem): void
  (e: 'close'): void
}>()

const searchInputRef = ref<HTMLInputElement | null>(null)
const searchQuery = ref('')
const selectedIndex = ref(0)
const materials = ref<MaterialItem[]>([])
const isLoading = ref(true)

onMounted(async () => {
  try {
    materials.value = await purchaseOrderService.getMaterials()
  } finally {
    isLoading.value = false
  }
})

// Auto focus search input when opened
const filteredMaterials = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return materials.value
  return materials.value.filter(
    m => m.kode.toLowerCase().includes(q) || m.nama.toLowerCase().includes(q)
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
    const activeEl = document.querySelector('[data-picker-active="true"]')
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' })
    }
  })
}

function chooseMaterial(material: MaterialItem) {
  emit('select', material)
}

// Compute popup position avoiding container overflows
const popupStyle = computed(() => {
  if (!props.anchorRect) {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '480px',
      maxWidth: '90vw'
    }
  }

  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth
  const popupHeight = 360
  const popupWidth = 480

  let top = props.anchorRect.top + props.anchorRect.height + 4
  let left = props.anchorRect.left

  // Flip up if bottom overflows viewport
  if (top + popupHeight > viewportHeight && props.anchorRect.top > popupHeight) {
    top = props.anchorRect.top - popupHeight - 4
  }

  // Adjust left if right overflows viewport
  if (left + popupWidth > viewportWidth - 20) {
    left = Math.max(20, viewportWidth - popupWidth - 20)
  }

  return {
    top: `${Math.max(10, top)}px`,
    left: `${Math.max(10, left)}px`,
    width: `${popupWidth}px`,
    maxWidth: '92vw'
  }
})

// Listen to global escape & focus input
function handleGlobalKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})

// Focus search input on open
nextTick(() => {
  if (searchInputRef.value) {
    searchInputRef.value.focus()
  }
})
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- Backdrop overlay -->
    <div
      class="fixed inset-0 bg-slate-900/30 backdrop-blur-[1px] transition-opacity"
      @click="emit('close')"
    />

    <!-- Floating Material Selector Box -->
    <div
      class="fixed bg-white rounded-lg shadow-2xl border border-slate-300 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100"
      :style="popupStyle"
      @click.stop
    >
      <!-- Header with search -->
      <div class="p-3 bg-slate-50 border-b border-slate-200">
        <div class="flex items-center justify-between mb-2">
          <div
            class="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide"
          >
            <Package class="w-4 h-4 text-teal-600" />
            <span>Pilih Bahan Baku</span>
          </div>
          <button
            type="button"
            class="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200"
            @click="emit('close')"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="relative">
          <Search class="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="Cari kode atau nama bahan (gunakan ↑ ↓ Enter)..."
            class="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            @keydown="onKeydown"
          />
        </div>
      </div>

      <!-- Materials List -->
      <div class="max-h-64 overflow-y-auto divide-y divide-slate-100">
        <div v-if="isLoading" class="p-4 text-center text-xs text-slate-400">
          Memuat daftar bahan...
        </div>

        <div
          v-else-if="filteredMaterials.length === 0"
          class="p-6 text-center text-xs text-slate-500"
        >
          Tidak ada bahan yang sesuai dengan pencarian "{{ searchQuery }}".
        </div>

        <div
          v-for="(item, index) in filteredMaterials"
          v-else
          :key="item.id"
          :data-picker-active="index === selectedIndex"
          class="px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors"
          :class="[
            index === selectedIndex
              ? 'bg-teal-50 text-teal-900 font-medium'
              : 'hover:bg-slate-50 text-slate-700'
          ]"
          @click="chooseMaterial(item)"
          @mouseenter="selectedIndex = index"
        >
          <div class="flex flex-col flex-1 pr-2">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-slate-900">{{ item.nama }}</span>
              <span
                class="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200"
              >
                {{ item.kode }}
              </span>
            </div>
            <div class="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3">
              <span
                >Stok: <strong>{{ item.qty }}</strong> {{ item.satuan_beli_nama || 'Pcs' }}</span
              >
              <span v-if="item.harga_satuan"
                >Ref. Harga: {{ formatCurrency(item.harga_satuan) }}</span
              >
            </div>
          </div>

          <div v-if="index === selectedIndex" class="text-teal-600">
            <Check class="w-4 h-4" />
          </div>
        </div>
      </div>

      <!-- Footer tips -->
      <div
        class="p-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between px-3"
      >
        <span
          >Gunakan <strong>↑</strong> <strong>↓</strong> untuk navigasi,
          <strong>Enter</strong> untuk memilih</span
        >
        <span><strong>Esc</strong> untuk tutup</span>
      </div>
    </div>
  </div>
</template>
