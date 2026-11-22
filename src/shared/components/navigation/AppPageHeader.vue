<script setup lang="ts">
export interface AppPageHeaderProps {
  title: string
  subtitle?: string
}

withDefaults(defineProps<AppPageHeaderProps>(), {
  subtitle: ''
})
</script>

<template>
  <div class="mb-5">
    <div v-if="$slots.breadcrumb" class="mb-2">
      <slot name="breadcrumb" />
    </div>

    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-content-primary tracking-tight">
          {{ title }}
        </h1>
        <p v-if="subtitle" class="text-xs sm:text-sm text-content-secondary mt-0.5">
          {{ subtitle }}
        </p>
      </div>

      <div v-if="$slots.actions" class="flex items-center gap-2.5 shrink-0">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
