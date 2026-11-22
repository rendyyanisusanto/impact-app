<script setup lang="ts">
export interface AppFormSectionProps {
  title: string
  description?: string
}

withDefaults(defineProps<AppFormSectionProps>(), {
  description: ''
})
</script>

<template>
  <div class="py-3">
    <div class="border-b border-border pb-2.5 mb-4">
      <h4 class="text-sm font-semibold text-content-primary">
        {{ title }}
      </h4>
      <p v-if="description" class="text-xs text-content-secondary mt-0.5">
        {{ description }}
      </p>
    </div>
    <div class="space-y-4">
      <slot />
    </div>
  </div>
</template>
