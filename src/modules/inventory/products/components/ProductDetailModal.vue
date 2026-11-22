<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppStatusBadge from '@/shared/components/data/AppStatusBadge.vue'
import AppBadge from '@/shared/components/ui/AppBadge.vue'
import type { Produk } from '../types/product.types'
import { Package, AlertTriangle, CheckCircle, Tag, Warehouse, Box } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    open?: boolean
    product: Produk | null
  }>(),
  {
    modelValue: false,
    open: false,
    product: null
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}>()

const isOpen = computed({
  get: () => props.modelValue || props.open,
  set: val => {
    emit('update:modelValue', val)
    if (!val) emit('close')
  }
})

const isLowStock = computed(() => {
  if (!props.product) return false
  return (props.product.qty ?? 0) <= (props.product.min_qty ?? 0)
})

const imageFailed = ref(false)
watch(
  () => props.product,
  () => {
    imageFailed.value = false
  }
)
</script>

<template>
  <AppModal
    :model-value="isOpen"
    :title="product ? `Detail Produk: ${product.nama}` : 'Detail Produk'"
    size="lg"
    @update:model-value="isOpen = $event"
    @close="isOpen = false"
  >
    <div v-if="product" class="space-y-5">
      <!-- Top Overview: Photo & Key Info -->
      <div class="flex flex-col sm:flex-row gap-5 items-start">
        <!-- Main Image -->
        <div
          class="w-full sm:w-44 h-44 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0"
        >
          <img
            v-if="product.foto && !imageFailed"
            :src="product.foto"
            :alt="product.nama || 'Foto Produk'"
            class="w-full h-full object-cover"
            @error="imageFailed = true"
          />
          <div v-else class="text-center p-3 text-slate-400">
            <Package class="w-12 h-12 mx-auto mb-1 stroke-1" />
            <span class="text-xs">Tidak ada foto</span>
          </div>
        </div>

        <!-- Header details -->
        <div class="flex-1 space-y-2">
          <div class="flex items-center gap-2 flex-wrap">
            <AppBadge variant="info" class="font-mono">{{ product.kode || '-' }}</AppBadge>
            <AppStatusBadge :status="product.status === 1 ? 'active' : 'inactive'" />
            <span
              v-if="isLowStock"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 gap-1"
            >
              <AlertTriangle class="w-3.5 h-3.5" />
              Stok Menipis
            </span>
            <span
              v-else
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 gap-1"
            >
              <CheckCircle class="w-3.5 h-3.5" />
              Stok Aman
            </span>
          </div>

          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
            {{ product.nama }}
          </h3>

          <div class="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {{ product.harga_formatted }}
          </div>

          <div
            class="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-700"
          >
            <div class="flex items-center gap-1.5">
              <Tag class="w-3.5 h-3.5 text-slate-400" />
              <span
                >Kategori: <strong>{{ product.kategori_barang_nama }}</strong></span
              >
            </div>
            <div class="flex items-center gap-1.5">
              <Warehouse class="w-3.5 h-3.5 text-slate-400" />
              <span
                >Gudang: <strong>{{ product.gudang_nama }}</strong></span
              >
            </div>
            <div class="flex items-center gap-1.5">
              <Box class="w-3.5 h-3.5 text-slate-400" />
              <span
                >Satuan: <strong>{{ product.satuan_barang_nama }}</strong></span
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Stock Information Card -->
      <div
        class="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700"
      >
        <div>
          <span class="text-xs text-slate-500">Stok Saat Ini</span>
          <p class="text-lg font-semibold text-slate-900 dark:text-white">
            {{ product.qty }} {{ product.satuan_barang_nama }}
          </p>
        </div>
        <div>
          <span class="text-xs text-slate-500">Minimal Stok (Batas)</span>
          <p class="text-lg font-semibold text-slate-900 dark:text-white">
            {{ product.min_qty }} {{ product.satuan_barang_nama }}
          </p>
        </div>
        <div>
          <span class="text-xs text-slate-500">Status Ketersediaan</span>
          <p class="text-sm font-medium mt-1">
            <span v-if="isLowStock" class="text-red-600 dark:text-red-400 font-semibold"
              >Perlu Restok</span
            >
            <span v-else class="text-emerald-600 dark:text-emerald-400 font-semibold"
              >Tersedia</span
            >
          </p>
        </div>
      </div>

      <!-- Additional Photos Gallery -->
      <div v-if="product.fotos && product.fotos.length > 0">
        <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Gallery Foto Tambahan ({{ product.fotos.length }})
        </h4>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="foto in product.fotos"
            :key="foto.id"
            class="w-20 h-20 rounded border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800"
          >
            <img :src="foto.foto" alt="Gallery foto" class="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <!-- Description -->
      <div v-if="product.keterangan" class="border-t border-slate-200 dark:border-slate-700 pt-3">
        <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
          Keterangan & Spesifikasi
        </h4>
        <p class="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
          {{ product.keterangan }}
        </p>
      </div>

      <!-- Audit Metadata -->
      <div
        class="border-t border-slate-200 dark:border-slate-700 pt-3 grid grid-cols-2 gap-2 text-xs text-slate-400"
      >
        <div>Dibuat: {{ product.created_at || '-' }}</div>
        <div>Diperbarui: {{ product.updated_at || '-' }}</div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <AppButton variant="outline" @click="isOpen = false">Tutup</AppButton>
      </div>
    </template>
  </AppModal>
</template>
