<script setup lang="ts">
import { computed } from 'vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppStatusBadge from '@/shared/components/data/AppStatusBadge.vue'
import type { SatuanBarang } from '../types/unit.types'
import { Box } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    open?: boolean
    unit: SatuanBarang | null
  }>(),
  {
    modelValue: false,
    open: false,
    unit: null
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
    :title="unit ? `Detail Satuan Produk: ${unit.nama}` : 'Detail Satuan Produk'"
    size="md"
    @update:model-value="isOpen = $event"
    @close="isOpen = false"
  >
    <div v-if="unit" class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Box class="w-6 h-6 text-primary-600" />
          <h3 class="text-base font-semibold text-slate-900 dark:text-white">
            {{ unit.nama }}
          </h3>
        </div>
        <AppStatusBadge :status="unit.status === 1 ? 'active' : 'inactive'" />
      </div>

      <div
        class="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm"
      >
        <span class="text-xs text-slate-500">Kode Satuan</span>
        <p class="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
          {{ unit.kode || '-' }}
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <AppButton variant="outline" @click="isOpen = false">Tutup</AppButton>
      </div>
    </template>
  </AppModal>
</template>
