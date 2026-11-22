<script setup lang="ts">
export interface AppDividerProps {
  vertical?: boolean
  label?: string
}

withDefaults(defineProps<AppDividerProps>(), {
  vertical: false,
  label: ''
})
</script>

<template>
  <div
    v-if="vertical"
    class="inline-block self-stretch w-px bg-border my-0.5"
    role="separator"
    aria-orientation="vertical"
  />
  <div v-else-if="label || $slots.default" class="relative my-4 flex items-center" role="separator">
    <div class="grow border-t border-border" />
    <span class="shrink-0 px-3 text-xs text-content-secondary font-medium">
      <slot>{{ label }}</slot>
    </span>
    <div class="grow border-t border-border" />
  </div>
  <hr v-else class="border-t border-border my-4 w-full" role="separator" />
</template>
