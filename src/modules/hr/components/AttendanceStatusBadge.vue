<script setup lang="ts">
import { computed } from 'vue'
import type { AttendanceStatusCode } from '../types/attendance.types'
import { ATTENDANCE_STATUS_MAP } from '../types/attendance.types'

const props = defineProps<{
  status: AttendanceStatusCode
}>()

const meta = computed(() => {
  return ATTENDANCE_STATUS_MAP[props.status] || {
    code: props.status,
    label: props.status,
    description: props.status,
    variant: 'danger' as const,
    badgeClass: 'bg-red-600 text-white'
  }
})

const isPrimary = computed(() => meta.value.variant === 'primary')
</script>

<template>
  <span
    :class="[
      'inline-flex items-center px-1.5 py-0.5 text-xs font-bold rounded shadow-xs select-none tracking-tight',
      isPrimary
        ? 'bg-blue-600 text-white hover:bg-blue-700'
        : 'bg-red-600 text-white hover:bg-red-700'
    ]"
    :title="meta.description"
    :data-status="status"
  >
    {{ meta.label }}
  </span>
</template>

