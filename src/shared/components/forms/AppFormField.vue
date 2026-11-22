<script setup lang="ts">
import { computed } from 'vue'
import AppFormLabel from './AppFormLabel.vue'
import AppFormError from './AppFormError.vue'

export interface AppFormFieldProps {
  id?: string
  label?: string
  required?: boolean
  error?: string | boolean
  helperText?: string
}

const props = withDefaults(defineProps<AppFormFieldProps>(), {
  id: undefined,
  label: '',
  required: false,
  error: false,
  helperText: ''
})

const generatedId = computed(
  () => props.id || `field-${Math.random().toString(36).substring(2, 9)}`
)
const errorMessage = computed(() => (typeof props.error === 'string' ? props.error : ''))
const hasError = computed(() => Boolean(props.error))
const errorId = computed(() => `${generatedId.value}-error`)
const helperId = computed(() => `${generatedId.value}-helper`)
const ariaDescribedBy = computed(() => {
  if (errorMessage.value) return errorId.value
  if (props.helperText) return helperId.value
  return undefined
})
</script>

<template>
  <div class="w-full">
    <AppFormLabel v-if="label || $slots.label" :for-id="generatedId" :required="required">
      <slot name="label">
        {{ label }}
      </slot>
    </AppFormLabel>

    <div>
      <slot
        :id="generatedId"
        :is-error="hasError"
        :aria-describedby="ariaDescribedBy"
        :aria-invalid="hasError ? 'true' : undefined"
      />
    </div>

    <AppFormError v-if="errorMessage" :id="errorId" :message="errorMessage" />

    <p v-else-if="helperText" :id="helperId" class="mt-1 text-xs text-content-secondary">
      {{ helperText }}
    </p>
  </div>
</template>
