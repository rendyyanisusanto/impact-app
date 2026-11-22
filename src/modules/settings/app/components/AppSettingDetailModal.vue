<script setup lang="ts">
import { computed } from 'vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppBadge from '@/shared/components/ui/AppBadge.vue'
import type { AppSetting } from '../types/app-setting.types'
import { Sliders, Key } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    open?: boolean
    setting: AppSetting | null
  }>(),
  {
    modelValue: false,
    open: false,
    setting: null
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
    :title="
      setting ? `Detail Setting: ${setting.table}.${setting.name}` : 'Detail Setting Aplikasi'
    "
    size="md"
    @update:model-value="isOpen = $event"
    @close="isOpen = false"
  >
    <div v-if="setting" class="space-y-4">
      <div
        class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700"
      >
        <div
          class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950/50 flex items-center justify-center text-primary-600 dark:text-primary-400"
        >
          <Sliders class="w-5 h-5" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <AppBadge variant="info">{{ setting.table }}</AppBadge>
            <span class="font-mono text-sm font-bold text-slate-800 dark:text-slate-100">{{
              setting.name
            }}</span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">ID Setting: #{{ setting.id_setting_table }}</p>
        </div>
      </div>

      <div
        class="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1"
      >
        <span class="text-xs text-slate-500 flex items-center gap-1.5">
          <Key class="w-4 h-4 text-slate-400" />
          Nilai Pengaturan (Value)
        </span>
        <pre
          class="font-mono text-sm font-semibold bg-slate-50 dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700 overflow-x-auto text-primary-700 dark:text-primary-300"
          >{{ setting.value }}</pre>
      </div>

      <div v-if="setting.keterangan" class="space-y-1">
        <span class="text-xs text-slate-500">Keterangan Parameter</span>
        <p class="text-sm text-slate-700 dark:text-slate-300">
          {{ setting.keterangan }}
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
