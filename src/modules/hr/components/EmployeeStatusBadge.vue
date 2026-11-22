<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    status?: number | string | null
    type?: 'active' | 'employment'
    label?: string | null
    color?: string | null
  }>(),
  {
    status: 1,
    type: 'active',
    label: undefined,
    color: undefined
  }
)

const isActive = computed(() => Number(props.status) === 1)

const displayLabel = computed(() => {
  if (props.label) return props.label
  if (props.type === 'active') {
    return isActive.value ? 'Aktif' : 'Nonaktif'
  }
  return String(props.status ?? '-')
})

const badgeClasses = computed(() => {
  if (props.type === 'active') {
    return isActive.value
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-rose-50 text-rose-700 border-rose-200'
  }
  // Employment classification
  return 'border'
})
</script>

<template>
  <span
    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border transition-colors"
    :class="badgeClasses"
    :style="
      type === 'employment' && color
        ? { backgroundColor: `${color}15`, borderColor: `${color}40`, color }
        : {}
    "
  >
    <span
      v-if="type === 'active'"
      class="w-1.5 h-1.5 rounded-full mr-1.5"
      :class="isActive ? 'bg-emerald-500' : 'bg-rose-500'"
    />
    {{ displayLabel }}
  </span>
</template>
