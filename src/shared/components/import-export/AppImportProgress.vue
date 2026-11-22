<script setup lang="ts">
import { computed } from 'vue'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    progress: number // 0 - 100
    statusText?: string
    isComplete?: boolean
    isError?: boolean
    errorMessage?: string
    processedCount?: number
    totalCount?: number
  }>(),
  {
    statusText: 'Memproses data...',
    isComplete: false,
    isError: false,
    errorMessage: '',
    processedCount: 0,
    totalCount: 0
  }
)

const clampedProgress = computed(() => {
  return Math.min(Math.max(props.progress, 0), 100)
})
</script>

<template>
  <div class="space-y-3 py-3" role="status" aria-live="polite">
    <!-- Header Status -->
    <div class="flex items-center justify-between text-xs">
      <div class="flex items-center gap-2">
        <CheckCircle2 v-if="isComplete" class="w-4 h-4 text-emerald-600" />
        <AlertCircle v-else-if="isError" class="w-4 h-4 text-rose-600" />
        <Loader2 v-else class="w-4 h-4 text-teal-700 animate-spin" />

        <span
          class="font-medium"
          :class="{
            'text-emerald-700 font-semibold': isComplete,
            'text-rose-700 font-semibold': isError,
            'text-slate-700': !isComplete && !isError
          }"
        >
          {{ isError ? errorMessage || 'Gagal memproses import' : statusText }}
        </span>
      </div>

      <span class="font-bold text-slate-700 text-xs tabular-nums"> {{ clampedProgress }}% </span>
    </div>

    <!-- Progress Bar Track -->
    <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/80">
      <div
        class="h-full transition-all duration-300 rounded-full"
        :class="{
          'bg-emerald-600': isComplete,
          'bg-rose-600': isError,
          'bg-[#0F766E]': !isComplete && !isError
        }"
        :style="{ width: `${clampedProgress}%` }"
      />
    </div>

    <!-- Counters -->
    <div v-if="totalCount > 0" class="flex justify-between text-[11px] text-slate-500">
      <span>
        Diproses: <strong class="text-slate-800">{{ processedCount }}</strong> dari
        {{ totalCount }} baris
      </span>
      <span>
        {{ isComplete ? 'Selesai 100%' : 'Sedang berjalan...' }}
      </span>
    </div>
  </div>
</template>
