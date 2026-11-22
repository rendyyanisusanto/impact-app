<script setup lang="ts">
import { AlertCircle } from 'lucide-vue-next'
import type {
  RangeKey,
  ScheduleDayItem,
  ScheduleDayValidationError,
  TimePointKey
} from '../types/schedule-settings.types'
import ScheduleTimeRange from './ScheduleTimeRange.vue'
import WeeklyScheduleRow from './WeeklyScheduleRow.vue'

withDefaults(
  defineProps<{
    items: ScheduleDayItem[]
    disabled?: boolean
    errors?: Record<number, ScheduleDayValidationError>
  }>(),
  {
    disabled: false,
    errors: () => ({})
  }
)

const emit = defineEmits<{
  (
    e: 'update:time',
    dayId: number,
    rangeKey: RangeKey,
    pointKey: TimePointKey,
    val: string | null
  ): void
}>()
</script>

<template>
  <div class="w-full">
    <!-- Desktop & Tablet Table View (hidden on small mobile < 768px) -->
    <div
      class="hidden md:block overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-xs"
    >
      <table class="w-full text-left border-collapse text-sm">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700">
            <th class="px-3 py-3.5 text-center w-12">No</th>
            <th class="px-4 py-3.5 w-32">Hari</th>
            <th class="px-3 py-3.5">
              <div class="font-medium text-slate-800">Jam Masuk</div>
              <div class="text-[11px] font-normal text-slate-500">Mulai – Selesai</div>
            </th>
            <th class="px-3 py-3.5">
              <div class="font-medium text-slate-800">Jam Pulang</div>
              <div class="text-[11px] font-normal text-slate-500">Mulai – Selesai</div>
            </th>
            <th class="px-3 py-3.5">
              <div class="font-medium text-slate-800">Mulai Istirahat</div>
              <div class="text-[11px] font-normal text-slate-500">Mulai – Selesai</div>
            </th>
            <th class="px-3 py-3.5">
              <div class="font-medium text-slate-800">Selesai Istirahat</div>
              <div class="text-[11px] font-normal text-slate-500">Mulai – Selesai</div>
            </th>
          </tr>
        </thead>
        <tbody>
          <WeeklyScheduleRow
            v-for="day in items"
            :key="day.dayId"
            :item="day"
            :disabled="disabled"
            :error="errors[day.dayId]"
            @update:time="
              (rangeKey, pointKey, val) => emit('update:time', day.dayId, rangeKey, pointKey, val)
            "
          />
        </tbody>
      </table>
    </div>

    <!-- Mobile Card View (< 768px) ensures all 56 inputs are accessible -->
    <div class="block md:hidden space-y-4">
      <div
        v-for="day in items"
        :key="day.dayId"
        :class="[
          'p-4 bg-white rounded-lg border shadow-xs transition-colors',
          errors[day.dayId] ? 'border-red-300 bg-red-50/20' : 'border-slate-200'
        ]"
      >
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center space-x-2">
            <span
              class="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600"
            >
              {{ day.order }}
            </span>
            <span
              :class="[
                'px-2.5 py-0.5 text-xs font-semibold rounded-md',
                day.dayName === 'Minggu'
                  ? 'bg-rose-100 text-rose-800'
                  : day.dayName === 'Jumat'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-800'
              ]"
            >
              {{ day.dayName }}
            </span>
          </div>
          <span v-if="errors[day.dayId]" class="text-xs text-red-600 flex items-center space-x-1">
            <AlertCircle class="w-3.5 h-3.5" />
            <span>Periksa Rentang</span>
          </span>
        </div>

        <div
          v-if="errors[day.dayId]?.crossRange"
          class="my-2 p-2 rounded text-xs bg-amber-50 text-amber-800 border border-amber-200"
        >
          {{ errors[day.dayId]?.crossRange }}
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
          <!-- Jam Masuk -->
          <div class="bg-slate-50/60 p-2.5 rounded border border-slate-100">
            <label class="block text-xs font-medium text-slate-700 mb-1.5">Jam Masuk</label>
            <ScheduleTimeRange
              :range="day.checkIn"
              :day-id="day.dayId"
              :day-name="day.dayName"
              range-key="checkIn"
              range-label="Jam Masuk"
              :disabled="disabled"
              :error-message="errors[day.dayId]?.checkIn"
              @update:start="val => emit('update:time', day.dayId, 'checkIn', 'start', val)"
              @update:end="val => emit('update:time', day.dayId, 'checkIn', 'end', val)"
            />
          </div>

          <!-- Jam Pulang -->
          <div class="bg-slate-50/60 p-2.5 rounded border border-slate-100">
            <label class="block text-xs font-medium text-slate-700 mb-1.5">Jam Pulang</label>
            <ScheduleTimeRange
              :range="day.checkOut"
              :day-id="day.dayId"
              :day-name="day.dayName"
              range-key="checkOut"
              range-label="Jam Pulang"
              :disabled="disabled"
              :error-message="errors[day.dayId]?.checkOut"
              @update:start="val => emit('update:time', day.dayId, 'checkOut', 'start', val)"
              @update:end="val => emit('update:time', day.dayId, 'checkOut', 'end', val)"
            />
          </div>

          <!-- Mulai Istirahat -->
          <div class="bg-slate-50/60 p-2.5 rounded border border-slate-100">
            <label class="block text-xs font-medium text-slate-700 mb-1.5">Mulai Istirahat</label>
            <ScheduleTimeRange
              :range="day.breakStart"
              :day-id="day.dayId"
              :day-name="day.dayName"
              range-key="breakStart"
              range-label="Mulai Istirahat"
              :disabled="disabled"
              :error-message="errors[day.dayId]?.breakStart"
              @update:start="val => emit('update:time', day.dayId, 'breakStart', 'start', val)"
              @update:end="val => emit('update:time', day.dayId, 'breakStart', 'end', val)"
            />
          </div>

          <!-- Selesai Istirahat -->
          <div class="bg-slate-50/60 p-2.5 rounded border border-slate-100">
            <label class="block text-xs font-medium text-slate-700 mb-1.5">Selesai Istirahat</label>
            <ScheduleTimeRange
              :range="day.breakEnd"
              :day-id="day.dayId"
              :day-name="day.dayName"
              range-key="breakEnd"
              range-label="Selesai Istirahat"
              :disabled="disabled"
              :error-message="errors[day.dayId]?.breakEnd"
              @update:start="val => emit('update:time', day.dayId, 'breakEnd', 'start', val)"
              @update:end="val => emit('update:time', day.dayId, 'breakEnd', 'end', val)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
