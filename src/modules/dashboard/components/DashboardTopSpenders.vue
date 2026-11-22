<script setup lang="ts">
import { getCurrentInstance } from 'vue'
import AppCard from '@/shared/components/ui/AppCard.vue'
import AppSkeleton from '@/shared/components/ui/AppSkeleton.vue'
import AppBadge from '@/shared/components/ui/AppBadge.vue'
import type { TopSpenderItem } from '../types/dashboard.types'
import { Award, Users, AlertCircle, ExternalLink } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    spenders?: TopSpenderItem[]
    loading?: boolean
    error?: string | null
  }>(),
  {
    spenders: () => [],
    loading: false,
    error: null
  }
)

const instance = getCurrentInstance()

function getRankBadgeClass(rank: number): string {
  if (rank === 1) return 'bg-amber-100 text-amber-800 border-amber-300 font-bold'
  if (rank === 2) return 'bg-slate-200 text-slate-700 border-slate-300 font-bold'
  if (rank === 3) return 'bg-amber-50 text-amber-900 border-amber-200 font-bold'
  return 'bg-slate-100 text-slate-600 border-slate-200'
}

function goToCustomers() {
  const router = instance?.appContext.config.globalProperties.$router
  if (router && typeof router.push === 'function') {
    router.push('/sales/customers')
  }
}
</script>

<template>
  <AppCard padding="none" class="flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <div class="p-3.5 border-b border-slate-100 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Award class="w-4 h-4 text-amber-600" />
        <h3 class="text-sm font-bold text-slate-800">Top Spender</h3>
      </div>
      <AppBadge variant="neutral" size="xs"> Pelanggan Terbaik </AppBadge>
    </div>

    <!-- Body -->
    <div class="p-3.5 flex-1 flex flex-col justify-center">
      <!-- Loading Skeleton -->
      <div v-if="loading" class="space-y-2.5">
        <AppSkeleton type="line" width="100%" height="28px" />
        <AppSkeleton type="line" width="100%" height="28px" />
        <AppSkeleton type="line" width="100%" height="28px" />
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="flex flex-col items-center justify-center py-6 text-center text-rose-600 gap-1.5"
        role="alert"
      >
        <AlertCircle class="w-5 h-5 text-rose-500" />
        <p class="text-xs font-semibold">Gagal memuat top spender</p>
        <p class="text-[11px] text-slate-500">{{ error }}</p>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!spenders || spenders.length === 0"
        class="flex flex-col items-center justify-center py-6 text-center text-slate-400 gap-1"
      >
        <Users class="w-7 h-7 text-slate-300 stroke-1" />
        <p class="text-xs font-medium text-slate-600">Belum ada data pelanggan</p>
        <p class="text-[11px] text-slate-400">Tidak ada transaksi pada periode terpilih.</p>
      </div>

      <!-- Ranked List -->
      <div v-else class="space-y-2">
        <div
          v-for="spender in spenders"
          :key="spender.customerName"
          class="flex items-center justify-between gap-2.5 p-2 rounded-md bg-slate-50/70 border border-slate-100 hover:bg-slate-100/70 transition-colors text-xs group"
        >
          <!-- Rank & Name -->
          <div class="flex items-center gap-2.5 min-w-0 flex-1">
            <span
              class="w-5 h-5 rounded-full flex items-center justify-center text-[11px] shrink-0 border"
              :class="getRankBadgeClass(spender.rank)"
            >
              {{ spender.rank }}
            </span>
            <div class="min-w-0 flex-1">
              <a
                href="/sales/customers"
                class="font-semibold text-slate-800 truncate hover:text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                :title="`Buka data pelanggan ${spender.customerName}`"
                @click.prevent="goToCustomers"
              >
                <span class="truncate">{{ spender.customerName }}</span>
                <ExternalLink class="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-slate-400 shrink-0 transition-opacity" />
              </a>
              <p class="text-[10px] text-slate-400">{{ spender.orderCount }} pesanan</p>
            </div>
          </div>

          <!-- Total Spent -->
          <div class="text-right shrink-0">
            <span class="font-bold text-teal-800 text-xs">
              {{ spender.totalSpentFormatted }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </AppCard>
</template>
