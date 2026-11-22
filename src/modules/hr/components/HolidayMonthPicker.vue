<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-vue-next'
import AppButton from '@/shared/components/ui/AppButton.vue'
import { INDONESIAN_MONTH_NAMES, getCurrentYearMonth, shiftMonth } from '../utils/holiday-date'

const props = withDefaults(
  defineProps<{
    modelValue: string // 'YYYY-MM'
    disabled?: boolean
  }>(),
  {
    disabled: false
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
}>()

const parsed = computed(() => {
  const parts = (props.modelValue || getCurrentYearMonth()).split('-')
  const year = parseInt(parts[0], 10) || new Date().getFullYear()
  const month = parseInt(parts[1], 10) || new Date().getMonth() + 1
  return { year, month }
})

const selectedMonthIndex = computed({
  get: () => parsed.value.month - 1,
  set: (val: number) => {
    const mStr = String(val + 1).padStart(2, '0')
    emit('update:modelValue', `${parsed.value.year}-${mStr}`)
  }
})

const selectedYear = computed({
  get: () => parsed.value.year,
  set: (val: number) => {
    const mStr = String(parsed.value.month).padStart(2, '0')
    emit('update:modelValue', `${val}-${mStr}`)
  }
})

// Generate year options from 2022 to 2030
const yearOptions = computed(() => {
  const currentY = new Date().getFullYear()
  const start = Math.min(2022, currentY - 2)
  const end = Math.max(2030, currentY + 4)
  const years: number[] = []
  for (let y = start; y <= end; y++) {
    years.push(y)
  }
  return years
})

function handlePrev() {
  emit('update:modelValue', shiftMonth(props.modelValue, -1))
}

function handleNext() {
  emit('update:modelValue', shiftMonth(props.modelValue, 1))
}

function handleCurrentMonth() {
  emit('update:modelValue', getCurrentYearMonth())
}

const isCurrentMonth = computed(() => {
  return props.modelValue === getCurrentYearMonth()
})
</script>

<template>
  <div class="inline-flex flex-wrap items-center gap-2">
    <!-- Navigation Buttons -->
    <div
      class="inline-flex items-center rounded-lg border border-slate-300 bg-white p-0.5 shadow-xs"
    >
      <button
        type="button"
        :disabled="disabled"
        class="inline-flex items-center justify-center rounded-md p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Bulan Sebelumnya"
        @click="handlePrev"
      >
        <ChevronLeft class="w-4 h-4" />
      </button>

      <!-- Month Selector -->
      <select
        v-model.number="selectedMonthIndex"
        :disabled="disabled"
        class="h-8 border-0 bg-transparent px-2.5 py-0 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-0 cursor-pointer disabled:cursor-not-allowed"
      >
        <option v-for="(monthName, idx) in INDONESIAN_MONTH_NAMES" :key="monthName" :value="idx">
          {{ monthName }}
        </option>
      </select>

      <span class="text-slate-300 font-light select-none">/</span>

      <!-- Year Selector -->
      <select
        v-model.number="selectedYear"
        :disabled="disabled"
        class="h-8 border-0 bg-transparent px-2 py-0 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-0 cursor-pointer disabled:cursor-not-allowed"
      >
        <option v-for="y in yearOptions" :key="y" :value="y">
          {{ y }}
        </option>
      </select>

      <button
        type="button"
        :disabled="disabled"
        class="inline-flex items-center justify-center rounded-md p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Bulan Berikutnya"
        @click="handleNext"
      >
        <ChevronRight class="w-4 h-4" />
      </button>
    </div>

    <!-- Quick 'Bulan Ini' Shortcut Button -->
    <AppButton
      v-if="!isCurrentMonth"
      variant="secondary"
      size="xs"
      :disabled="disabled"
      class="border-slate-300 text-slate-700 hover:text-[#0F766E]"
      @click="handleCurrentMonth"
    >
      <Calendar class="w-3.5 h-3.5 mr-1 text-slate-500" />
      Bulan Ini
    </AppButton>
  </div>
</template>
