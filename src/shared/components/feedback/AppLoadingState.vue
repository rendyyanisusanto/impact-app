<script setup lang="ts">
import AppSpinner from '@/shared/components/ui/AppSpinner.vue'

export interface AppLoadingStateProps {
  text?: string
}

withDefaults(defineProps<AppLoadingStateProps>(), {
  text: 'Memuat data...'
})
</script>

<template>
  <div class="py-12 px-4 text-center flex flex-col items-center justify-center">
    <AppSpinner size="lg" color="primary" />
    <p class="mt-3 text-xs text-content-secondary font-medium">
      {{ text }}
    </p>
  </div>
</template>
