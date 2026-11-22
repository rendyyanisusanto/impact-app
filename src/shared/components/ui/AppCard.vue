<script setup lang="ts">
import { computed } from 'vue'

export interface AppCardProps {
  title?: string
  subtitle?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  bordered?: boolean
}

const props = withDefaults(defineProps<AppCardProps>(), {
  title: '',
  subtitle: '',
  padding: 'md',
  bordered: true
})

const paddingClasses = computed(() => {
  switch (props.padding) {
    case 'none':
      return 'p-0'
    case 'sm':
      return 'p-3'
    case 'lg':
      return 'p-6'
    case 'md':
    default:
      return 'p-4 sm:p-5'
  }
})
</script>

<template>
  <div
    class="bg-surface rounded-card shadow-card overflow-hidden"
    :class="[bordered ? 'border border-border' : '']"
  >
    <div
      v-if="title || $slots.header || $slots.actions"
      class="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-border flex items-center justify-between gap-4"
    >
      <div>
        <slot name="header">
          <h3 v-if="title" class="text-sm font-semibold text-content-primary">
            {{ title }}
          </h3>
          <p v-if="subtitle" class="text-xs text-content-secondary mt-0.5">
            {{ subtitle }}
          </p>
        </slot>
      </div>
      <div v-if="$slots.actions" class="flex items-center gap-2">
        <slot name="actions" />
      </div>
    </div>

    <div :class="[paddingClasses, 'flex-1']">
      <slot />
    </div>

    <div v-if="$slots.footer" class="px-4 py-3 sm:px-5 bg-surface-muted border-t border-border">
      <slot name="footer" />
    </div>
  </div>
</template>
