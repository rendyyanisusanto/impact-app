<script setup lang="ts">
import { Clock } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    modelValue: string | null
    id?: string
    ariaLabel?: string
    disabled?: boolean
    isInvalid?: boolean
    placeholder?: string
  }>(),
  {
    id: undefined,
    ariaLabel: 'Pilih Waktu',
    disabled: false,
    isInvalid: false,
    placeholder: '--:--'
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void
}>()

function handleChange(event: Event) {
  const target = event.target as HTMLInputElement
  const val = target.value.trim()
  emit('update:modelValue', val === '' ? null : val)
}
</script>

<template>
  <div class="relative inline-flex items-center w-full min-w-[100px] max-w-[130px]">
    <input
      :id="id"
      type="time"
      :value="modelValue || ''"
      :disabled="disabled"
      :aria-label="ariaLabel"
      :placeholder="placeholder"
      :class="[
        'w-full py-1.5 pl-7 pr-2 text-xs font-mono rounded border transition-colors focus:outline-none focus:ring-1',
        isInvalid
          ? 'border-red-400 text-red-700 bg-red-50 focus:border-red-500 focus:ring-red-500'
          : 'border-slate-300 text-slate-800 bg-white hover:border-slate-400 focus:border-[#0F766E] focus:ring-[#0F766E]',
        disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : ''
      ]"
      @input="handleChange"
      @change="handleChange"
    />
    <Clock
      :class="[
        'w-3.5 h-3.5 absolute left-2 pointer-events-none',
        isInvalid ? 'text-red-500' : 'text-slate-400'
      ]"
    />
  </div>
</template>
