<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-vue-next'

const props = defineProps<{
  status?: number | null
  statusAktif?: number | null
  size?: 'sm' | 'md'
}>()

const badgeConfig = computed(() => {
  if (props.statusAktif === 0) {
    return {
      label: 'Dibatalkan',
      class: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: AlertTriangle
    }
  }

  if (props.status === 1) {
    return {
      label: 'Lunas',
      class: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2
    }
  }

  return {
    label: 'Belum Lunas',
    class: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock
  }
})
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border"
    :class="badgeConfig.class"
  >
    <component :is="badgeConfig.icon" class="w-3.5 h-3.5" />
    <span>{{ badgeConfig.label }}</span>
  </span>
</template>
