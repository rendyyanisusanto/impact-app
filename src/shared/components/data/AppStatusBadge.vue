<script setup lang="ts">
import { computed } from 'vue'
import AppBadge from '@/shared/components/ui/AppBadge.vue'

export interface AppStatusBadgeProps {
  status: string
  label?: string
  dot?: boolean
}

const props = withDefaults(defineProps<AppStatusBadgeProps>(), {
  label: undefined,
  dot: true
})

interface StatusConfig {
  variant: 'primary' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'
  defaultLabel: string
}

const statusMap: Record<string, StatusConfig> = {
  active: { variant: 'success', defaultLabel: 'Aktif' },
  aktif: { variant: 'success', defaultLabel: 'Aktif' },
  completed: { variant: 'success', defaultLabel: 'Selesai' },
  selesai: { variant: 'success', defaultLabel: 'Selesai' },
  paid: { variant: 'success', defaultLabel: 'Lunas' },
  lunas: { variant: 'success', defaultLabel: 'Lunas' },

  inactive: { variant: 'neutral', defaultLabel: 'Non-aktif' },
  draft: { variant: 'neutral', defaultLabel: 'Draft' },

  pending: { variant: 'warning', defaultLabel: 'Menunggu' },
  menunggu: { variant: 'warning', defaultLabel: 'Menunggu' },
  in_progress: { variant: 'info', defaultLabel: 'Diproses' },
  processing: { variant: 'info', defaultLabel: 'Diproses' },

  cancelled: { variant: 'danger', defaultLabel: 'Dibatalkan' },
  batal: { variant: 'danger', defaultLabel: 'Dibatalkan' },
  rejected: { variant: 'danger', defaultLabel: 'Ditolak' }
}

const config = computed<StatusConfig>(() => {
  const key = props.status?.toLowerCase()
  return (
    statusMap[key] || {
      variant: 'neutral',
      defaultLabel: props.status
    }
  )
})

const displayLabel = computed(() => props.label ?? config.value.defaultLabel)
</script>

<template>
  <AppBadge :variant="config.variant" :dot="dot">
    {{ displayLabel }}
  </AppBadge>
</template>
