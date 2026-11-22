<script setup lang="ts">
import { Plus, Users } from 'lucide-vue-next'
import type { CalendarDayCell, HolidayItem } from '../types/holiday-settings.types'

defineProps<{
  cells: CalendarDayCell[]
  isLoading?: boolean
  canUpdate?: boolean
}>()

const emit = defineEmits<{
  (e: 'create-on-date', dateStr: string): void
  (e: 'edit', holiday: HolidayItem): void
}>()

const DAY_HEADERS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
</script>

<template>
  <div class="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
    <!-- Day Names Header (7 Columns) -->
    <div
      class="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold text-slate-600"
    >
      <div
        v-for="(dayName, idx) in DAY_HEADERS"
        :key="dayName"
        :class="[
          'py-2.5 border-r last:border-r-0 border-slate-200',
          idx === 6 ? 'text-rose-600 bg-rose-50/50' : 'text-slate-700'
        ]"
      >
        <span>{{ dayName }}</span>
      </div>
    </div>

    <!-- Calendar Grid Cells -->
    <div class="grid grid-cols-7 divide-x divide-y divide-slate-200 bg-slate-200">
      <div
        v-for="cell in cells"
        :key="cell.date"
        :class="[
          'min-h-[105px] p-2 flex flex-col justify-between transition-colors relative group',
          cell.isCurrentMonth ? 'bg-white' : 'bg-slate-50/70 opacity-60',
          cell.isSunday && cell.isCurrentMonth ? 'bg-rose-50/20' : '',
          cell.isToday ? 'ring-2 ring-inset ring-[#0F766E]' : ''
        ]"
        @click="
          canUpdate && cell.holidays.length === 0 ? emit('create-on-date', cell.date) : undefined
        "
      >
        <!-- Top bar: Date number & Today tag -->
        <div class="flex items-center justify-between mb-1">
          <span
            :class="[
              'inline-flex items-center justify-center text-xs font-semibold rounded-full w-6 h-6',
              cell.isToday
                ? 'bg-[#0F766E] text-white shadow-xs'
                : cell.isSunday
                  ? 'text-rose-600 font-bold'
                  : 'text-slate-800'
            ]"
          >
            {{ cell.dayNumber }}
          </span>

          <span
            v-if="cell.isToday"
            class="text-[10px] font-medium text-[#0F766E] bg-teal-50 px-1.5 py-0.2 rounded"
          >
            Hari Ini
          </span>

          <!-- Quick Add button visible on hover if cell has no holiday -->
          <button
            v-if="canUpdate && cell.isCurrentMonth && cell.holidays.length === 0"
            type="button"
            class="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-[#0F766E] hover:bg-teal-50 rounded transition-all"
            title="Tambah Hari Libur pada Tanggal Ini"
            @click.stop="emit('create-on-date', cell.date)"
          >
            <Plus class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Holidays in this cell -->
        <div class="space-y-1.5 flex-1">
          <div
            v-for="h in cell.holidays"
            :key="h.id"
            :class="[
              'p-1.5 rounded-md text-[11px] font-medium shadow-2xs border cursor-pointer transition-all hover:scale-[1.02]',
              h.keterangan === 'MINGGU'
                ? 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
            ]"
            :title="`Klik untuk mengedit: ${h.keterangan}`"
            @click.stop="emit('edit', h)"
          >
            <div class="font-semibold line-clamp-2 leading-tight">
              {{ h.keterangan }}
            </div>

            <!-- Exception Count Indicator -->
            <div
              v-if="h.exceptionEmployeeIds.length > 0"
              class="mt-1 flex items-center text-[10px] text-emerald-700 font-medium"
            >
              <Users class="w-3 h-3 mr-1 shrink-0" />
              <span>{{ h.exceptionEmployeeIds.length }} dikecualikan</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Calendar Legend -->
    <div
      class="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center gap-4 text-xs text-slate-600"
    >
      <span class="font-semibold text-slate-700">Keterangan:</span>
      <div class="flex items-center space-x-1.5">
        <span class="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
        <span>Hari Libur Nasional / Cuti</span>
      </div>
      <div class="flex items-center space-x-1.5">
        <span class="w-3 h-3 rounded bg-rose-100 border border-rose-300" />
        <span>Hari Libur Minggu</span>
      </div>
      <div class="flex items-center space-x-1.5">
        <span class="w-3 h-3 rounded-full bg-[#0F766E]" />
        <span>Hari Ini</span>
      </div>
      <div class="flex items-center space-x-1.5">
        <Users class="w-3.5 h-3.5 text-emerald-700" />
        <span>Terdapat Karyawan Dikecualikan (Tetap Masuk)</span>
      </div>
    </div>
  </div>
</template>
