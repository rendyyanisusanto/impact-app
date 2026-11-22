<script setup lang="ts">
import { computed } from 'vue'
import AppBadge from '@/shared/components/ui/AppBadge.vue'

const props = defineProps<{
  status?: number | null // 0 = Draft, 1 = Disetujui
  statusAktif?: number | null // 1 = Aktif, 0 = Dibatalkan
  type?: 'status' | 'aktif' | 'transaksi'
  statusTransaksi?: string | null // 'CASH' | 'JATUH TEMPO'
}>()

const badgeConfig = computed(() => {
  if (props.type === 'aktif') {
    if (props.statusAktif === 0) {
      return { variant: 'danger' as const, label: 'Dibatalkan' }
    }
    return { variant: 'success' as const, label: 'Aktif' }
  }

  if (props.type === 'transaksi') {
    if (props.statusTransaksi === 'JATUH TEMPO') {
      return { variant: 'warning' as const, label: 'JATUH TEMPO' }
    }
    return { variant: 'info' as const, label: 'CASH' }
  }

  // Business status: 0 = Draft, 1 = Disetujui
  if (props.status === 1) {
    return { variant: 'success' as const, label: 'Disetujui' }
  }
  return { variant: 'warning' as const, label: 'Draft' }
})
</script>

<template>
  <AppBadge :variant="badgeConfig.variant" size="sm" :dot="true">
    {{ badgeConfig.label }}
  </AppBadge>
</template>
