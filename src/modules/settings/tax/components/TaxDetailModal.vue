<script setup lang="ts">
import { computed } from 'vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppStatusBadge from '@/shared/components/data/AppStatusBadge.vue'
import AppBadge from '@/shared/components/ui/AppBadge.vue'
import type { Ppn } from '../types/tax.types'
import { Percent, CheckCircle } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    open?: boolean
    tax: Ppn | null
  }>(),
  {
    modelValue: false,
    open: false,
    tax: null
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
    :title="tax ? `Detail PPN: ${tax.nama}%` : 'Detail Tarif PPN'"
    size="md"
    @update:model-value="isOpen = $event"
    @close="isOpen = false"
  >
    <div v-if="tax" class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div
            class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950/50 flex items-center justify-center text-primary-600 dark:text-primary-400"
          >
            <Percent class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-slate-900 dark:text-white">
              PPN {{ tax.nama }}%
            </h3>
            <span class="font-mono text-xs text-slate-400">{{ tax.kode || '-' }}</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <AppBadge v-if="tax.is_active === 1" variant="success" class="flex items-center gap-1">
            <CheckCircle class="w-3.5 h-3.5" />
            Aktif Digunakan
          </AppBadge>
          <AppStatusBadge :status="tax.status === 1 ? 'active' : 'inactive'" />
        </div>
      </div>

      <div
        class="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60"
      >
        <span class="text-xs text-slate-500">Nilai Persentase Pajak</span>
        <p class="text-3xl font-extrabold text-primary-600 dark:text-primary-400 mt-1">
          {{ tax.nama }}%
        </p>
      </div>

      <div
        class="border-t border-slate-200 dark:border-slate-700 pt-3 grid grid-cols-2 gap-2 text-xs text-slate-400"
      >
        <div>Dibuat: {{ tax.created_at || '-' }}</div>
        <div>Diperbarui: {{ tax.updated_at || '-' }}</div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <AppButton variant="outline" @click="isOpen = false">Tutup</AppButton>
      </div>
    </template>
  </AppModal>
</template>
