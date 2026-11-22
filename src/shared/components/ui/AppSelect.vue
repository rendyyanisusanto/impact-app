<script setup lang="ts">
import { computed } from 'vue'

export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

export interface AppSelectProps {
  modelValue?: string | number | null
  options?: Array<SelectOption | string | number>
  id?: string
  name?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  invalid?: boolean
  error?: boolean | string
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<AppSelectProps>(), {
  modelValue: '',
  options: () => [],
  id: undefined,
  name: undefined,
  placeholder: '-- Pilih --',
  disabled: false,
  required: false,
  invalid: false,
  error: false,
  size: 'md'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
  (e: 'change', event: Event): void
}>()

const normalizedOptions = computed<SelectOption[]>(() => {
  return props.options.map(opt => {
    if (typeof opt === 'object' && opt !== null) {
      return opt as SelectOption
    }
    return {
      label: String(opt),
      value: opt
    }
  })
})

const isError = computed(() => Boolean(props.error || props.invalid))

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const matching = normalizedOptions.value.find(opt => String(opt.value) === target.value)
  const emittedValue = matching !== undefined ? matching.value : target.value
  emit('update:modelValue', emittedValue)
  emit('change', event)
}

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'py-1 pl-2.5 pr-8 text-xs'
    case 'lg':
      return 'py-2.5 pl-3.5 pr-10 text-base'
    case 'md':
    default:
      return 'py-1.5 pl-3 pr-8 text-sm'
  }
})
</script>

<template>
  <div class="relative w-full">
    <select
      :id="id"
      :name="name"
      :value="modelValue"
      :disabled="disabled"
      :required="required"
      :aria-invalid="isError ? 'true' : undefined"
      class="w-full appearance-none rounded-input border bg-surface text-content-primary transition-colors focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer"
      :class="[
        sizeClasses,
        isError
          ? 'border-semantic-danger focus:border-semantic-danger focus:ring-red-400/25'
          : 'border-border focus:border-primary focus:ring-primary/25'
      ]"
      @change="handleChange"
    >
      <option v-if="placeholder" value="" disabled :selected="!modelValue">
        {{ placeholder }}
      </option>
      <option
        v-for="opt in normalizedOptions"
        :key="opt.value"
        :value="opt.value"
        :disabled="opt.disabled"
      >
        {{ opt.label }}
      </option>
    </select>
    <div
      class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500"
    >
      <svg class="w-4 h-4 fill-current" viewBox="0 0 20 20">
        <path
          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
          clip-rule="evenodd"
          fill-rule="evenodd"
        />
      </svg>
    </div>
  </div>
</template>
