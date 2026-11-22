<script setup lang="ts">
import { AlertCircle } from 'lucide-vue-next'
import type {
  RangeKey,
  ScheduleDayItem,
  ScheduleDayValidationError,
  TimePointKey
} from '../types/schedule-settings.types'
import ScheduleTimeRange from './ScheduleTimeRange.vue'

withDefaults(
  defineProps<{
    item: ScheduleDayItem
    disabled?: boolean
    error?: ScheduleDayValidationError
  }>(),
  {
    disabled: false,
    error: undefined
  }
)

const emit = defineEmits<{
  (e: 'update:time', rangeKey: RangeKey, pointKey: TimePointKey, val: string | null): void
}>()
</script>

<template>
  <tr
    :class="[
      'border-b border-slate-200 hover:bg-slate-50/70 transition-colors',
      error ? 'bg-red-50/30' : ''
    ]"
  >
    <!-- No -->
    <td class="px-3 py-3 text-center text-xs text-slate-500 font-medium whitespace-nowrap">
      {{ item.order }}
    </td>

    <!-- Hari -->
    <td class="px-4 py-3 whitespace-nowrap">
      <div class="flex items-center space-x-2">
        <span
          :class="[
            'px-2.5 py-1 text-xs font-semibold rounded-md tracking-wide',
            item.dayName === 'Minggu'
              ? 'bg-rose-100 text-rose-800'
              : item.dayName === 'Jumat'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-800'
          ]"
        >
          {{ item.dayName }}
        </span>
      </div>
      <div
        v-if="error?.crossRange"
        class="flex items-center space-x-1 mt-1 text-[11px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200"
      >
        <AlertCircle class="w-3 h-3 text-amber-600 shrink-0" />
        <span class="truncate max-w-[180px]" :title="error.crossRange">{{ error.crossRange }}</span>
      </div>
    </td>

    <!-- Jam Masuk -->
    <td class="px-3 py-3">
      <ScheduleTimeRange
        :range="item.checkIn"
        :day-id="item.dayId"
        :day-name="item.dayName"
        range-key="checkIn"
        range-label="Jam Masuk"
        :disabled="disabled"
        :error-message="error?.checkIn"
        @update:start="val => emit('update:time', 'checkIn', 'start', val)"
        @update:end="val => emit('update:time', 'checkIn', 'end', val)"
      />
    </td>

    <!-- Jam Pulang -->
    <td class="px-3 py-3">
      <ScheduleTimeRange
        :range="item.checkOut"
        :day-id="item.dayId"
        :day-name="item.dayName"
        range-key="checkOut"
        range-label="Jam Pulang"
        :disabled="disabled"
        :error-message="error?.checkOut"
        @update:start="val => emit('update:time', 'checkOut', 'start', val)"
        @update:end="val => emit('update:time', 'checkOut', 'end', val)"
      />
    </td>

    <!-- Mulai Istirahat -->
    <td class="px-3 py-3">
      <ScheduleTimeRange
        :range="item.breakStart"
        :day-id="item.dayId"
        :day-name="item.dayName"
        range-key="breakStart"
        range-label="Mulai Istirahat"
        :disabled="disabled"
        :error-message="error?.breakStart"
        @update:start="val => emit('update:time', 'breakStart', 'start', val)"
        @update:end="val => emit('update:time', 'breakStart', 'end', val)"
      />
    </td>

    <!-- Selesai Istirahat -->
    <td class="px-3 py-3">
      <ScheduleTimeRange
        :range="item.breakEnd"
        :day-id="item.dayId"
        :day-name="item.dayName"
        range-key="breakEnd"
        range-label="Selesai Istirahat"
        :disabled="disabled"
        :error-message="error?.breakEnd"
        @update:start="val => emit('update:time', 'breakEnd', 'start', val)"
        @update:end="val => emit('update:time', 'breakEnd', 'end', val)"
      />
    </td>
  </tr>
</template>
