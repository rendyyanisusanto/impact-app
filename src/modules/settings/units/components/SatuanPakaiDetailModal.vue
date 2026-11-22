<script setup lang="ts">
import { computed } from 'vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import type { SatuanPakai } from '../types/unit.types'
import { Scale, ArrowRightLeft } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    open?: boolean
    unit: SatuanPakai | null
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
    :title="unit ? `Detail Satuan Pakai: ${unit.nama}` : 'Detail Satuan Pakai'"
    size="md"
    @update:model-value="isOpen = $event"
    @close="isOpen = false"
  >
    <div v-if="unit" class="space-y-4">
      <div class="flex items-center gap-2">
        <Scale class="w-6 h-6 text-primary-600" />
        <h3 class="text-base font-semibold text-slate-900 dark:text-white">
          {{ unit.nama }}
        </h3>
      </div>

      <div
        class="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm"
      >
        <div>
          <span class="text-xs text-slate-500">Kode Satuan Pakai</span>
          <p class="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
            {{ unit.kode || '-' }}
          </p>
        </div>

        <div>
          <span class="text-xs text-slate-500">Satuan Beli Induk</span>
          <p class="font-semibold text-slate-900 dark:text-white mt-0.5">
            {{ unit.satuan_beli_nama || '-' }}
          </p>
        </div>
      </div>

      <div
        class="p-3 rounded-lg border border-primary-200 dark:border-primary-900/50 bg-primary-50/50 dark:bg-primary-950/20"
      >
        <div
          class="flex items-center gap-2 text-xs font-semibold text-primary-700 dark:text-primary-300"
        >
          <ArrowRightLeft class="w-4 h-4" />
          Faktor Pembagi Konversi
        </div>
        <p class="text-xl font-bold font-mono text-primary-900 dark:text-primary-100 mt-1">
          {{ unit.pembagi }}
        </p>
        <span class="text-xs text-primary-600 dark:text-primary-400">
          1 {{ unit.satuan_beli_nama }} = {{ unit.pembagi }} {{ unit.nama }}
        </span>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <AppButton variant="outline" @click="isOpen = false">Tutup</AppButton>
      </div>
    </template>
  </AppModal>
</template>
