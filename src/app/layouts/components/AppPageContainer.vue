<script setup lang="ts">
/**
 * AppPageContainer.vue
 * Standardized responsive page container for ERP information density.
 * Uses layout tokens for content padding (24px desktop, 16px mobile)
 * and accommodates wide tables without global viewport clipping.
 */
</script>

<template>
  <div class="w-full max-w-[1920px] mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-5 space-y-5">
    <slot />
  </div>
</template>
