<script setup lang="ts">
import { computed } from 'vue'
import { X as CloseIcon } from 'lucide-vue-next'

export interface AppInputProps {
  modelValue?: string | number | null
  type?: string
  id?: string
  name?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  invalid?: boolean
  error?: boolean | string
  size?: 'sm' | 'md' | 'lg'
  clearable?: boolean
  autocomplete?: string
}

const props = withDefaults(defineProps<AppInputProps>(), {
  modelValue: '',
  type: 'text',
  id: undefined,
  name: undefined,
  placeholder: '',
  disabled: false,
  readonly: false,
  required: false,
  invalid: false,
  error: false,
  size: 'md',
  clearable: false,
  autocomplete: 'off'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
  (e: 'change', event: Event): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
  (e: 'clear'): void
}>()

const isError = computed(() => Boolean(props.error || props.invalid))

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit(
    'update:modelValue',
    props.type === 'number' ? (target.value === '' ? '' : Number(target.value)) : target.value
  )
}

function handleClear() {
  emit('update:modelValue', '')
  emit('clear')
}

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'py-1 px-2.5 text-xs'
    case 'lg':
      return 'py-2.5 px-3.5 text-base'
    case 'md':
    default:
      return 'py-1.5 px-3 text-sm'
  }
})
</script>

<template>
  <div class="relative w-full flex items-center">
    <div
      v-if="$slots.prefix"
      class="absolute left-2.5 flex items-center pointer-events-none text-slate-400"
    >
      <slot name="prefix" />
    </div>

    <input
      :id="id"
      :type="type"
      :name="name"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :aria-invalid="isError ? 'true' : undefined"
      :autocomplete="autocomplete"
      class="w-full rounded-input border bg-surface text-content-primary transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
      :class="[
        sizeClasses,
        $slots.prefix ? 'pl-8' : '',
        $slots.suffix || clearable ? 'pr-8' : '',
        isError
          ? 'border-semantic-danger focus:border-semantic-danger focus:ring-red-400/25'
          : 'border-border focus:border-primary focus:ring-primary/25'
      ]"
      @input="handleInput"
      @change="$emit('change', $event)"
      @focus="$emit('focus', $event)"
      @blur="$emit('blur', $event)"
    />

    <button
      v-if="clearable && modelValue && !disabled && !readonly"
      type="button"
      class="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5 focus:outline-none"
      title="Hapus teks"
      @click="handleClear"
    >
      <CloseIcon class="w-3.5 h-3.5" />
    </button>

    <div v-else-if="$slots.suffix" class="absolute right-2.5 flex items-center text-slate-400">
      <slot name="suffix" />
    </div>
  </div>
</template>
