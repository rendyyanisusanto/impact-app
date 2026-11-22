<script setup lang="ts">
import { computed } from 'vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import type { Bank } from '../types/bank.types'
import { Landmark, CreditCard } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    open?: boolean
    bank: Bank | null
  }>(),
  {
    modelValue: false,
    open: false,
    bank: null
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
    :title="bank ? `Detail Bank: ${bank.bank}` : 'Detail Bank'"
    size="md"
    @update:model-value="isOpen = $event"
    @close="isOpen = false"
  >
    <div v-if="bank" class="space-y-4">
      <div
        class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700"
      >
        <div
          class="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-950/50 flex items-center justify-center text-primary-600 dark:text-primary-400"
        >
          <Landmark class="w-6 h-6" />
        </div>
        <div>
          <h3 class="text-base font-semibold text-slate-900 dark:text-white">
            {{ bank.bank }}
          </h3>
          <p class="text-xs text-slate-400">ID Referensi: #{{ bank.id }}</p>
        </div>
      </div>

      <div
        class="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1"
      >
        <span class="text-xs text-slate-500 flex items-center gap-1.5">
          <CreditCard class="w-4 h-4 text-slate-400" />
          Nomor Rekening
        </span>
        <p class="font-mono text-lg font-bold text-slate-800 dark:text-slate-100 tracking-wider">
          {{ bank.rekening || '-' }}
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
