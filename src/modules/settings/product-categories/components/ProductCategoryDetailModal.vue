<script setup lang="ts">
import { computed } from 'vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppStatusBadge from '@/shared/components/data/AppStatusBadge.vue'
import type { KategoriBarang } from '../types/product-category.types'
import { Tag } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    open?: boolean
    category: KategoriBarang | null
  }>(),
  {
    modelValue: false,
    open: false,
    category: null
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
</script>

<template>
  <AppModal
    :model-value="isOpen"
    :title="category ? `Detail Kategori: ${category.nama}` : 'Detail Kategori Produk'"
    size="md"
    @update:model-value="isOpen = $event"
    @close="isOpen = false"
  >
    <div v-if="category" class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Tag class="w-6 h-6 text-primary-600" />
          <h3 class="text-base font-semibold text-slate-900 dark:text-white">
            {{ category.nama }}
          </h3>
        </div>
        <AppStatusBadge :status="category.status === 1 ? 'active' : 'inactive'" />
      </div>

      <div
        class="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm"
      >
        <div>
          <span class="text-xs text-slate-500">Kode Kategori</span>
          <p class="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
            {{ category.kode || '-' }}
          </p>
        </div>

        <div>
          <span class="text-xs text-slate-500">Warna Tag Label</span>
          <div class="flex items-center gap-2 mt-0.5">
            <span
              class="w-4 h-4 rounded-full border border-slate-300"
              :style="{ backgroundColor: category.color || '#8e44ad' }"
            />
            <span class="font-mono text-xs uppercase">{{ category.color || '#8e44ad' }}</span>
          </div>
        </div>
      </div>

      <div
        class="border-t border-slate-200 dark:border-slate-700 pt-3 grid grid-cols-2 gap-2 text-xs text-slate-400"
      >
        <div>Dibuat: {{ category.created_at || '-' }}</div>
        <div>Diperbarui: {{ category.updated_at || '-' }}</div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <AppButton variant="outline" @click="isOpen = false">Tutup</AppButton>
      </div>
    </template>
  </AppModal>
</template>
