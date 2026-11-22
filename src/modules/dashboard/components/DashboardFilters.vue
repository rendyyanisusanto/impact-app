<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { DashboardFilterState, DashboardDatePreset } from '../types/dashboard.types'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import AppBadge from '@/shared/components/ui/AppBadge.vue'
import { RotateCcw, RefreshCw, Filter, Calendar, AlertCircle } from 'lucide-vue-next'
import { resolvePresetDates } from '../utils/dashboard-date'

const props = withDefaults(
  defineProps<{
    modelValue?: DashboardFilterState
    loading?: boolean
    isMock?: boolean
    lastUpdated?: string
  }>(),
  {
    modelValue: () => ({ preset: 'this_month' }),
    loading: false,
    isMock: true,
    lastUpdated: ''
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: DashboardFilterState): void
  (e: 'refresh'): void
  (e: 'reset'): void
}>()

function normalizePreset(val: string): DashboardDatePreset {
  if (val === 'month') return 'this_month'
  if (val === 'last_7_days') return '7d'
  if (
    val === 'today' ||
    val === 'yesterday' ||
    val === '7d' ||
    val === '30d' ||
    val === 'this_month' ||
    val === 'last_month' ||
    val === 'this_year' ||
    val === 'custom'
  ) {
    return val as DashboardDatePreset
  }
  return 'this_month'
}

function resolveFilterDates(preset: DashboardDatePreset): { startDate: string; endDate: string } {
  if (props.isMock) {
    if (preset === 'today') return { startDate: '2026-10-31', endDate: '2026-10-31' }
    if (preset === '7d') return { startDate: '2026-10-25', endDate: '2026-10-31' }
    if (preset === '30d') return { startDate: '2026-10-02', endDate: '2026-10-31' }
    if (preset === 'this_month' || preset === 'month') return { startDate: '2026-10-01', endDate: '2026-10-31' }
  }
  return resolvePresetDates(preset)
}

const selectedPreset = ref<DashboardDatePreset>(normalizePreset(props.modelValue.preset))

const defaultDates = resolveFilterDates(selectedPreset.value)
const customStartDate = ref<string>(props.modelValue.startDate || defaultDates.startDate)
const customEndDate = ref<string>(props.modelValue.endDate || defaultDates.endDate)
const validationError = ref<string | null>(null)

const presetOptions = [
  { label: 'Hari Ini', value: 'today' },
  { label: 'Kemarin', value: 'yesterday' },
  { label: '7 Hari Terakhir', value: '7d' },
  { label: '30 Hari Terakhir', value: '30d' },
  { label: 'Bulan Ini', value: 'this_month' },
  { label: 'Bulan Lalu', value: 'last_month' },
  { label: 'Tahun Ini', value: 'this_year' },
  { label: 'Rentang Kustom', value: 'custom' }
]

watch(
  () => props.modelValue,
  newVal => {
    selectedPreset.value = normalizePreset(newVal.preset)
    if (newVal.startDate) customStartDate.value = newVal.startDate
    if (newVal.endDate) customEndDate.value = newVal.endDate
  },
  { deep: true }
)

const isCustom = computed(() => selectedPreset.value === 'custom')

// Indikator Draft Filter (ketika custom date belum diterapkan)
const isDraftDirty = computed(() => {
  if (!isCustom.value) return false
  return (
    customStartDate.value !== (props.modelValue.startDate || '') ||
    customEndDate.value !== (props.modelValue.endDate || '')
  )
})

function validateCustomRange(): boolean {
  if (!customStartDate.value || !customEndDate.value) {
    validationError.value = 'Silakan pilih tanggal awal dan tanggal akhir'
    return false
  }
  if (customStartDate.value > customEndDate.value) {
    validationError.value = 'Tanggal awal tidak boleh melebihi tanggal akhir'
    return false
  }
  validationError.value = null
  return true
}

function onPresetChange(val: string | number) {
  const preset = normalizePreset(String(val))
  selectedPreset.value = preset
  validationError.value = null

  if (preset === 'custom') {
    // Mode custom: jika valid langsung siapkan range
    if (validateCustomRange()) {
      emit('update:modelValue', {
        preset: 'custom',
        startDate: customStartDate.value,
        endDate: customEndDate.value
      })
    }
  } else {
    // Preset otomatis dihitung berdasarkan WIB
    const resolved = resolveFilterDates(preset)
    customStartDate.value = resolved.startDate
    customEndDate.value = resolved.endDate
    emit('update:modelValue', {
      preset,
      startDate: resolved.startDate,
      endDate: resolved.endDate
    })
  }
}

function handleApplyCustom() {
  if (validateCustomRange()) {
    emit('update:modelValue', {
      preset: 'custom',
      startDate: customStartDate.value,
      endDate: customEndDate.value
    })
  }
}

function handleReset() {
  selectedPreset.value = 'this_month'
  const resolved = resolveFilterDates('this_month')
  customStartDate.value = resolved.startDate
  customEndDate.value = resolved.endDate
  validationError.value = null
  emit('update:modelValue', { preset: 'this_month' })
  emit('reset')
}
</script>

<template>
  <div class="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 shadow-xs flex flex-col gap-3">
    <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
      <!-- Left: Filter Controls -->
      <div class="flex flex-wrap items-center gap-2.5">
        <div class="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Filter class="w-4 h-4 text-teal-700" />
          <span>Filter Periode:</span>
        </div>

        <div class="w-44 sm:w-52">
          <AppSelect
            :model-value="selectedPreset"
            :options="presetOptions"
            size="sm"
            aria-label="Pilih Periode Dashboard"
            @update:model-value="onPresetChange"
          />
        </div>

        <AppButton
          variant="ghost"
          size="sm"
          :disabled="loading || (selectedPreset === 'this_month' && !validationError && !isDraftDirty)"
          title="Reset filter ke periode bawaan (Bulan Ini)"
          @click="handleReset"
        >
          <template #left-icon>
            <RotateCcw class="w-3.5 h-3.5" />
          </template>
          Reset
        </AppButton>
      </div>

      <!-- Right: Status Badges & Refresh -->
      <div
        class="flex items-center justify-between lg:justify-end gap-2.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100"
      >
        <div class="flex items-center gap-2">
          <AppBadge variant="neutral" size="xs"> WIB (UTC+7) </AppBadge>
          <AppBadge v-if="isMock" variant="info" size="xs"> Simulasi (Mock) </AppBadge>
          <AppBadge v-else variant="success" size="xs"> Data Real-Time </AppBadge>
        </div>

        <AppButton
          variant="primary"
          size="sm"
          :loading="loading"
          aria-label="Segarkan data dashboard"
          @click="emit('refresh')"
        >
          <template #left-icon>
            <RefreshCw class="w-3.5 h-3.5" />
          </template>
          Segarkan
        </AppButton>
      </div>
    </div>

    <!-- Custom Date Range Row -->
    <div
      v-if="isCustom"
      class="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-2.5 text-xs text-slate-700"
    >
      <div class="flex items-center gap-1.5 font-medium text-slate-600">
        <Calendar class="w-3.5 h-3.5 text-teal-700" />
        <span>Dari:</span>
      </div>
      <input
        v-model="customStartDate"
        type="date"
        aria-label="Tanggal Awal"
        class="h-8 px-2 py-1 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
      />

      <span class="text-slate-400 font-medium">s/d</span>

      <div class="flex items-center gap-1.5 font-medium text-slate-600">
        <span>Sampai:</span>
      </div>
      <input
        v-model="customEndDate"
        type="date"
        aria-label="Tanggal Akhir"
        class="h-8 px-2 py-1 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
      />

      <AppButton variant="secondary" size="sm" :disabled="loading" @click="handleApplyCustom">
        Terapkan
      </AppButton>

      <!-- Indicator when draft filter is not yet applied -->
      <AppBadge v-if="isDraftDirty" variant="warning" size="xs">
        Filter belum diterapkan
      </AppBadge>

      <!-- Validation Error -->
      <div
        v-if="validationError"
        class="w-full flex items-center gap-1.5 text-xs text-red-600 font-medium mt-1"
        role="alert"
      >
        <AlertCircle class="w-3.5 h-3.5 text-red-500 shrink-0" />
        <span>{{ validationError }}</span>
      </div>
    </div>
  </div>
</template>
