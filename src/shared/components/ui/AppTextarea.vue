<script setup lang="ts">
import { computed } from 'vue'

export interface AppTextareaProps {
  modelValue?: string | number | null
  id?: string
  name?: string
  rows?: number
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  invalid?: boolean
  maxlength?: number
  error?: boolean | string
}

const props = withDefaults(defineProps<AppTextareaProps>(), {
  modelValue: '',
  id: undefined,
  name: undefined,
  rows: 3,
  placeholder: '',
  disabled: false,
  readonly: false,
  required: false,
  invalid: false,
  maxlength: undefined,
  error: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', event: Event): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
}>()

const isError = computed(() => Boolean(props.error || props.invalid))

function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <textarea
    :id="id"
    :name="name"
    :rows="rows"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :required="required"
    :maxlength="maxlength"
    :aria-invalid="isError ? 'true' : undefined"
    class="w-full rounded-input border bg-surface py-2 px-3 text-sm text-content-primary placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors resize-y"
    :class="[
      isError
        ? 'border-semantic-danger focus:border-semantic-danger focus:ring-red-400/25'
        : 'border-border focus:border-primary focus:ring-primary/25'
    ]"
    @input="handleInput"
    @change="$emit('change', $event)"
    @focus="$emit('focus', $event)"
    @blur="$emit('blur', $event)"
  />
</template>
