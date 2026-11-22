<script setup lang="ts">
import type {
  RecentTransactionItem,
  TopSpenderItem,
  StockLimitItem
} from '../types/dashboard.types'
import AppCard from '@/shared/components/ui/AppCard.vue'
import AppBadge from '@/shared/components/ui/AppBadge.vue'
import AppSkeleton from '@/shared/components/ui/AppSkeleton.vue'
import AppEmptyState from '@/shared/components/feedback/AppEmptyState.vue'
import { AlertTriangle } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    type: 'recent-transactions' | 'top-spenders' | 'stock-limits'
    title?: string
    subtitle?: string
    loading?: boolean
    recentTransactions?: RecentTransactionItem[]
    topSpenders?: TopSpenderItem[]
    stockLimits?: StockLimitItem[]
  }>(),
  {
    title: '',
    subtitle: '',
    loading: false,
    recentTransactions: () => [],
    topSpenders: () => [],
    stockLimits: () => []
  }
)

const resolvedTitle =
  props.title ||
  (props.type === 'recent-transactions'
    ? 'Transaksi Terakhir'
    : props.type === 'top-spenders'
      ? 'Top Spender Pelanggan'
      : 'Peringatan Stok Limit')

const resolvedSubtitle =
  props.subtitle ||
  (props.type === 'recent-transactions'
    ? 'Sales order terbaru yang masuk ke sistem'
    : props.type === 'top-spenders'
      ? 'Pelanggan dengan akumulasi pesanan tertinggi'
      : 'Bahan baku yang berada di bawah ambang batas minimum')

function getStatusVariant(status: string): 'success' | 'info' | 'warning' | 'danger' {
  switch (status) {
    case 'Selesai':
      return 'success'
    case 'Diproses':
      return 'info'
    case 'Menunggu':
      return 'warning'
    default:
      return 'danger'
  }
}
</script>

<template>
  <AppCard :title="resolvedTitle" :subtitle="resolvedSubtitle" class="flex flex-col">
    <template #actions>
      <AppBadge variant="neutral" size="xs"> Data Simulasi </AppBadge>
    </template>

    <!-- LOADING STATE -->
    <div v-if="loading" class="py-4 space-y-3">
      <div
        v-for="i in 4"
        :key="i"
        class="flex items-center justify-between gap-4 py-2 border-b border-slate-100 last:border-b-0"
      >
        <div class="space-y-1.5 flex-1">
          <AppSkeleton type="line" width="60%" height="14px" />
          <AppSkeleton type="line" width="30%" height="12px" />
        </div>
        <AppSkeleton type="line" width="20%" height="14px" />
      </div>
    </div>

    <!-- WIDGET 1: TRANSAKSI TERAKHIR -->
    <div v-else-if="type === 'recent-transactions'" class="flex-1">
      <div v-if="recentTransactions.length === 0" class="py-6">
        <AppEmptyState
          title="Belum Ada Transaksi"
          description="Transaksi terbaru akan tampil di sini saat transaksi baru dibuat."
        />
      </div>

      <div v-else class="overflow-x-auto -mx-4 -my-3 sm:-mx-5 sm:-my-3.5">
        <table class="w-full text-left text-xs">
          <thead
            class="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
          >
            <tr>
              <th scope="col" class="px-4 py-2.5">No. Order</th>
              <th scope="col" class="px-4 py-2.5">Pelanggan</th>
              <th scope="col" class="px-4 py-2.5">Tanggal</th>
              <th scope="col" class="px-4 py-2.5 text-right">Total</th>
              <th scope="col" class="px-4 py-2.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="item in recentTransactions"
              :key="item.id"
              class="hover:bg-slate-50/80 transition-colors"
            >
              <td class="px-4 py-2.5 font-medium text-teal-800 whitespace-nowrap">
                {{ item.id }}
              </td>
              <td class="px-4 py-2.5 font-medium text-slate-800 whitespace-nowrap">
                {{ item.customer }}
              </td>
              <td class="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                {{ item.date }}
              </td>
              <td class="px-4 py-2.5 text-right font-semibold text-slate-900 whitespace-nowrap">
                {{ item.total }}
              </td>
              <td class="px-4 py-2.5 text-center whitespace-nowrap">
                <AppBadge :variant="getStatusVariant(item.status)" size="xs">
                  {{ item.status }}
                </AppBadge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- WIDGET 2: TOP SPENDER -->
    <div v-else-if="type === 'top-spenders'" class="flex-1">
      <div v-if="topSpenders.length === 0" class="py-6">
        <AppEmptyState
          title="Data Pelanggan Kosong"
          description="Akumulasi pembelian pelanggan akan muncul setelah transaksi tercatat."
        />
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="spender in topSpenders"
          :key="spender.rank"
          class="flex items-center justify-between text-xs pb-2.5 border-b border-slate-100 last:border-b-0 last:pb-0"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <span
              class="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0"
              :class="
                spender.rank === 1
                  ? 'bg-teal-100 text-teal-800 border border-teal-200'
                  : 'bg-slate-100 text-slate-600'
              "
            >
              {{ spender.rank }}
            </span>
            <div class="min-w-0">
              <p class="font-medium text-slate-800 truncate">
                {{ spender.customerName }}
              </p>
              <p class="text-[10px] text-slate-500">{{ spender.orderCount }} Transaksi</p>
            </div>
          </div>
          <span class="font-semibold text-slate-900 shrink-0 ml-2">
            {{ spender.totalSpentFormatted }}
          </span>
        </div>
      </div>
    </div>

    <!-- WIDGET 3: STOK LIMIT -->
    <div v-else-if="type === 'stock-limits'" class="flex-1">
      <div v-if="stockLimits.length === 0" class="py-6">
        <AppEmptyState
          title="Semua Stok Aman"
          description="Tidak ada bahan baku atau produk yang berada di bawah batas minimum."
        />
      </div>

      <div v-else class="space-y-2.5">
        <div
          v-for="stock in stockLimits"
          :key="stock.id"
          class="p-2.5 rounded-md bg-rose-50/60 border border-rose-200/80 flex items-center justify-between text-xs gap-3"
        >
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <AlertTriangle class="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <p class="font-medium text-slate-900 truncate">
                {{ stock.materialName }}
              </p>
            </div>
            <p class="text-[10px] text-slate-500 mt-0.5 ml-5">
              {{ stock.warehouse }} • Min: {{ stock.minimumLimit }} {{ stock.unit }}
            </p>
          </div>
          <AppBadge variant="danger" size="xs" class="shrink-0">
            Sisa {{ stock.currentStock }} {{ stock.unit }}
          </AppBadge>
        </div>
      </div>
    </div>
  </AppCard>
</template>
