<script setup lang="ts">
import { getCurrentInstance } from 'vue'
import AppCard from '@/shared/components/ui/AppCard.vue'
import AppSkeleton from '@/shared/components/ui/AppSkeleton.vue'
import AppBadge from '@/shared/components/ui/AppBadge.vue'
import type { RecentTransactionItem } from '../types/dashboard.types'
import { FileText, Inbox, AlertCircle, ExternalLink } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    transactions?: RecentTransactionItem[]
    loading?: boolean
    error?: string | null
  }>(),
  {
    transactions: () => [],
    loading: false,
    error: null
  }
)

const instance = getCurrentInstance()

function getStatusBadgeVariant(status: RecentTransactionItem['status']) {
  switch (status) {
    case 'Selesai':
      return 'success'
    case 'Diproses':
      return 'info'
    case 'Menunggu':
      return 'warning'
    case 'Dibatalkan':
    default:
      return 'neutral'
  }
}

function getOrderRoute(tx: RecentTransactionItem): string {
  if (tx.orderType === 'NON_PPN') {
    return '/sales/so-pola'
  }
  if (tx.orderType === 'NON_PPN_2') {
    return '/sales/so-ks'
  }
  return '/sales/so-impact'
}

function goToOrder(tx: RecentTransactionItem) {
  const router = instance?.appContext.config.globalProperties.$router
  const target = getOrderRoute(tx)
  if (router && typeof router.push === 'function') {
    router.push(target)
  }
}
</script>

<template>
  <AppCard padding="none" class="flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <div class="p-4 border-b border-slate-100 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <FileText class="w-4 h-4 text-teal-700" />
        <h3 class="text-sm font-bold text-slate-800">Transaksi Terakhir</h3>
      </div>
      <AppBadge variant="neutral" size="xs"> {{ transactions?.length || 0 }} Transaksi </AppBadge>
    </div>

    <!-- Body -->
    <div class="p-0 flex-1 flex flex-col justify-center">
      <!-- Loading Skeleton -->
      <div v-if="loading" class="p-4 space-y-3">
        <AppSkeleton type="line" width="100%" height="24px" />
        <AppSkeleton type="line" width="100%" height="24px" />
        <AppSkeleton type="line" width="100%" height="24px" />
        <AppSkeleton type="line" width="100%" height="24px" />
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="flex flex-col items-center justify-center py-8 text-center text-rose-600 gap-2"
        role="alert"
      >
        <AlertCircle class="w-6 h-6 text-rose-500" />
        <p class="text-xs font-semibold">Gagal memuat transaksi</p>
        <p class="text-[11px] text-slate-500">{{ error }}</p>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!transactions || transactions.length === 0"
        class="flex flex-col items-center justify-center py-10 text-center text-slate-400 gap-2"
      >
        <Inbox class="w-8 h-8 text-slate-300 stroke-1" />
        <p class="text-xs font-medium text-slate-600">Tidak ada transaksi</p>
        <p class="text-[11px] text-slate-400">Belum ada transaksi pada periode yang dipilih.</p>
      </div>

      <!-- Transactions Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold">
              <th class="py-2.5 px-3">No. Order</th>
              <th class="py-2.5 px-3">Pelanggan</th>
              <th class="py-2.5 px-3">Tanggal</th>
              <th class="py-2.5 px-3 text-right">Total Nilai</th>
              <th class="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="tx in transactions"
              :key="tx.id"
              class="hover:bg-slate-50/80 transition-colors"
            >
              <td class="py-2.5 px-3 font-semibold text-teal-800">
                <a
                  :href="getOrderRoute(tx)"
                  class="hover:underline hover:text-teal-900 inline-flex items-center gap-1 group cursor-pointer"
                  :title="`Buka modul order ${tx.orderNumber || tx.id}`"
                  @click.prevent="goToOrder(tx)"
                >
                  <span>{{ tx.orderNumber || tx.id }}</span>
                  <ExternalLink class="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                </a>
              </td>
              <td class="py-2.5 px-3 text-slate-700 font-medium truncate max-w-[180px]" :title="tx.customer">
                {{ tx.customer }}
              </td>
              <td class="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                {{ tx.date }}
              </td>
              <td class="py-2.5 px-3 text-right font-semibold text-slate-800 whitespace-nowrap">
                {{ tx.totalFormatted || `Rp ${Number(tx.total).toLocaleString('id-ID')}` }}
              </td>
              <td class="py-2.5 px-3 text-center">
                <AppBadge :variant="getStatusBadgeVariant(tx.status)" size="xs">
                  {{ tx.status }}
                </AppBadge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AppCard>
</template>
