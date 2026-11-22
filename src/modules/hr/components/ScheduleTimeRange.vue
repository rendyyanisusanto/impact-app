<script setup lang="ts">
import type { RangeKey, TimeRangeValue } from '../types/schedule-settings.types'
import ScheduleTimeInput from './ScheduleTimeInput.vue'

withDefaults(
  defineProps<{
    range: TimeRangeValue
    dayId: number
    dayName: string
    rangeKey: RangeKey
    rangeLabel: string
    disabled?: boolean
    errorMessage?: string
    isStartInvalid?: boolean
    isEndInvalid?: boolean
  }>(),
  {
    disabled: false,
    errorMessage: undefined,
    isStartInvalid: false,
    isEndInvalid: false
  }
)

const emit = defineEmits<{
  (e: 'update:start', val: string | null): void
  (e: 'update:end', val: string | null): void
}>()
</script>

<template>
  <div class="flex flex-col space-y-1">
    <div class="flex items-center space-x-1.5">
      <ScheduleTimeInput
        :id="`time-${dayId}-${rangeKey}-start`"
        :model-value="range.start"
        :aria-label="`${dayName} ${rangeLabel} Mulai`"
        :disabled="disabled"
        :is-invalid="Boolean(errorMessage) || isStartInvalid"
        @update:model-value="val => emit('update:start', val)"
      />
      <span class="text-xs text-slate-400 font-semibold select-none">–</span>
      <ScheduleTimeInput
        :id="`time-${dayId}-${rangeKey}-end`"
        :model-value="range.end"
        :aria-label="`${dayName} ${rangeLabel} Selesai`"
        :disabled="disabled"
        :is-invalid="Boolean(errorMessage) || isEndInvalid"
        @update:model-value="val => emit('update:end', val)"
      />
    </div>
    <span v-if="errorMessage" class="text-[11px] text-red-600 leading-tight">
      {{ errorMessage }}
    </span>
  </div>
</template>
