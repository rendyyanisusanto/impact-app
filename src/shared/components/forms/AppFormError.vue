<script setup lang="ts">
export interface AppFormErrorProps {
  message?: string
}

withDefaults(defineProps<AppFormErrorProps>(), {
  message: ''
})
</script>

<template>
  <p
    v-if="message || $slots.default"
    class="mt-1 text-xs text-semantic-danger flex items-center gap-1"
    role="alert"
  >
    <svg class="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 20 20">
      <path
        fill-rule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
        clip-rule="evenodd"
      />
    </svg>
    <span>
      <slot>{{ message }}</slot>
    </span>
  </p>
</template>
