<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  type?: 'status' | 'active'
  status: number | null | undefined
}>()

const badgeConfig = computed(() => {
  if (props.type === 'active') {
    if (props.status === 1) {
      return {
        label: 'Aktif',
        classes: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      }
    }
    return {
      label: 'Dibatalkan',
      classes: 'bg-rose-50 text-rose-700 border-rose-200'
    }
  }

  // Business status: 1 = Diterima, 0 = Draft
  if (props.status === 1) {
    return {
      label: 'Diterima',
      classes: 'bg-teal-50 text-teal-700 border-teal-200 font-medium'
    }
  }
  return {
    label: 'Draft',
    classes: 'bg-amber-50 text-amber-700 border-amber-200 font-medium'
  }
})
</script>

<template>
  <span
    class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border leading-tight"
    :class="badgeConfig.classes"
  >
    {{ badgeConfig.label }}
  </span>
</template>
