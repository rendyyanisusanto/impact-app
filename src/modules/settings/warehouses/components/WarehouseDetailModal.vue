<script setup lang="ts">
import { computed } from 'vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppStatusBadge from '@/shared/components/data/AppStatusBadge.vue'
import type { Gudang } from '../types/warehouse.types'
import { Warehouse, MapPin } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    open?: boolean
    warehouse: Gudang | null
  }>(),
  {
    modelValue: false,
    open: false,
    warehouse: null
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
    :title="warehouse ? `Detail Gudang: ${warehouse.nama}` : 'Detail Gudang'"
    size="md"
    @update:model-value="isOpen = $event"
    @close="isOpen = false"
  >
    <div v-if="warehouse" class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Warehouse class="w-6 h-6 text-primary-600" />
          <h3 class="text-base font-semibold text-slate-900 dark:text-white">
            {{ warehouse.nama }}
          </h3>
        </div>
        <AppStatusBadge :status="warehouse.status === 1 ? 'active' : 'inactive'" />
      </div>

      <div
        class="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm"
      >
        <div>
          <span class="text-xs text-slate-500">Kode Gudang</span>
          <p class="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
            {{ warehouse.kode || '-' }}
          </p>
        </div>

        <div>
          <span class="text-xs text-slate-500">Warna Tag Label</span>
          <div class="flex items-center gap-2 mt-0.5">
            <span
              class="w-4 h-4 rounded-full border border-slate-300"
              :style="{ backgroundColor: warehouse.color || '#000000' }"
            />
            <span class="font-mono text-xs uppercase">{{ warehouse.color || '#000000' }}</span>
          </div>
        </div>
      </div>

      <div class="space-y-1">
        <span class="text-xs text-slate-500 flex items-center gap-1">
          <MapPin class="w-3.5 h-3.5" />
          Alamat Gudang
        </span>
        <p
          class="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800"
        >
          {{ warehouse.alamat || 'Tidak ada alamat tercatat' }}
        </p>
      </div>

      <div
        class="border-t border-slate-200 dark:border-slate-700 pt-3 grid grid-cols-2 gap-2 text-xs text-slate-400"
      >
        <div>Dibuat: {{ warehouse.created_at || '-' }}</div>
        <div>Diperbarui: {{ warehouse.updated_at || '-' }}</div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <AppButton variant="outline" @click="isOpen = false">Tutup</AppButton>
      </div>
    </template>
  </AppModal>
</template>
