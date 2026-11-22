<script setup lang="ts">
import { computed } from 'vue'

export interface AppRadioProps {
  modelValue?: string | number | boolean
  value: string | number | boolean
  name?: string
  id?: string
  label?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<AppRadioProps>(), {
  modelValue: undefined,
  name: undefined,
  id: undefined,
  label: '',
  disabled: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | boolean): void
  (e: 'change', value: string | number | boolean): void
}>()

const isChecked = computed(() => props.modelValue === props.value)

function handleChange() {
  if (!props.disabled) {
    emit('update:modelValue', props.value)
    emit('change', props.value)
  }
}
</script>

<template>
  <label
    class="inline-flex items-center gap-2 select-none cursor-pointer text-sm text-content-primary"
    :class="{ 'opacity-50 cursor-not-allowed': disabled }"
  >
    <input
      :id="id"
      type="radio"
      :name="name"
      :value="value"
      :checked="isChecked"
      :disabled="disabled"
      class="w-4 h-4 text-primary border-border focus:ring-primary/30 focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed cursor-pointer transition-colors"
      @change="handleChange"
    />
    <span v-if="label || $slots.default">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>
