<script setup lang="ts">
export interface AppFormLabelProps {
  forId?: string
  required?: boolean
}

withDefaults(defineProps<AppFormLabelProps>(), {
  forId: undefined,
  required: false
})
</script>

<template>
  <label :for="forId" class="block text-xs font-semibold text-content-primary mb-1 select-none">
    <slot />
    <span v-if="required" class="text-semantic-danger ml-0.5" aria-hidden="true">*</span>
  </label>
</template>
