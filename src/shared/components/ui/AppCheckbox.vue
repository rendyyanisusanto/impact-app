<script setup lang="ts">
import { computed } from 'vue'

export interface AppCheckboxProps {
  modelValue?: boolean | unknown[]
  value?: unknown
  id?: string
  label?: string
  disabled?: boolean
  indeterminate?: boolean
}

const props = withDefaults(defineProps<AppCheckboxProps>(), {
  modelValue: false,
  value: undefined,
  id: undefined,
  label: '',
  disabled: false,
  indeterminate: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean | unknown[]): void
  (e: 'change', event: Event): void
}>()

const isChecked = computed(() => {
  if (Array.isArray(props.modelValue)) {
    return props.modelValue.includes(props.value)
  }
  return Boolean(props.modelValue)
})

function handleChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (Array.isArray(props.modelValue)) {
    const list = [...props.modelValue]
    if (target.checked) {
      list.push(props.value)
    } else {
      const idx = list.indexOf(props.value)
      if (idx !== -1) list.splice(idx, 1)
    }
    emit('update:modelValue', list)
  } else {
    emit('update:modelValue', target.checked)
  }
  emit('change', event)
}
</script>

<template>
  <label
    class="inline-flex items-center gap-2 select-none cursor-pointer text-sm text-content-primary"
    :class="{ 'opacity-50 cursor-not-allowed': disabled }"
  >
    <input
      :id="id"
      type="checkbox"
      :checked="isChecked"
      :disabled="disabled"
      class="w-4 h-4 rounded text-primary border-border focus:ring-primary/30 focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed cursor-pointer transition-colors"
      @change="handleChange"
    />
    <span v-if="label || $slots.default">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>
