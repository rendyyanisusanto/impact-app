<script setup lang="ts">
import { getCurrentInstance } from 'vue'
import AppCard from '@/shared/components/ui/AppCard.vue'
import AppSkeleton from '@/shared/components/ui/AppSkeleton.vue'
import AppBadge from '@/shared/components/ui/AppBadge.vue'
import type { StockLimitItem } from '../types/dashboard.types'
import { AlertTriangle, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    items?: StockLimitItem[]
    loading?: boolean
    error?: string | null
  }>(),
  {
    items: () => [],
    loading: false,
    error: null
  }
)

const instance = getCurrentInstance()

function goToMaterials() {
  const router = instance?.appContext.config.globalProperties.$router
  if (router && typeof router.push === 'function') {
    router.push('/inventory/materials')
  }
}
</script>

<template>
  <AppCard padding="none" class="flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <div class="p-3.5 border-b border-slate-100 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <AlertTriangle class="w-4 h-4 text-rose-600" />
        <h3 class="text-sm font-bold text-slate-800">Stok Limit (Peringatan)</h3>
      </div>
      <AppBadge :variant="items && items.length > 0 ? 'danger' : 'neutral'" size="xs">
        {{ items?.length || 0 }} Item
      </AppBadge>
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
        <p class="text-xs font-semibold">Gagal memuat stok limit</p>
        <p class="text-[11px] text-slate-500">{{ error }}</p>
      </div>

      <!-- Empty State (All good) -->
      <div
        v-else-if="!items || items.length === 0"
        class="flex flex-col items-center justify-center py-6 text-center text-emerald-600 gap-1"
      >
        <CheckCircle2 class="w-7 h-7 text-emerald-500 stroke-1" />
        <p class="text-xs font-semibold">Semua Stok Aman</p>
        <p class="text-[11px] text-slate-400">Tidak ada bahan atau produk di bawah batas limit.</p>
      </div>

      <!-- Low Stock Items List -->
      <div v-else class="space-y-2">
        <div
          v-for="item in items"
          :key="item.id"
          class="flex items-center justify-between gap-2.5 p-2 rounded-md bg-slate-50/70 border border-slate-100 hover:bg-slate-100/70 transition-colors text-xs group"
        >
          <!-- Material details -->
          <div class="min-w-0 flex-1">
            <a
              href="/inventory/materials"
              class="font-semibold text-slate-800 truncate hover:text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
              :title="`Buka data bahan ${item.materialName}`"
              @click.prevent="goToMaterials"
            >
              <span class="truncate">{{ item.materialName }}</span>
              <ExternalLink class="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-slate-400 shrink-0 transition-opacity" />
            </a>
            <p class="text-[10px] text-slate-400">
              {{ item.warehouse }} &bull; Min: {{ item.minimumLimit }} {{ item.unit }}
            </p>
          </div>

          <!-- Stock quantity and status badge -->
          <div class="flex items-center gap-2 shrink-0">
            <div class="text-right">
              <span
                class="font-bold text-xs"
                :class="item.isCritical ? 'text-rose-700' : 'text-amber-700'"
              >
                {{ item.currentStock }}
              </span>
              <span class="text-[10px] text-slate-400 ml-0.5">
                {{ item.unit }}
              </span>
            </div>

            <AppBadge :variant="item.isCritical ? 'danger' : 'warning'" size="xs">
              {{ item.isCritical ? 'Kritis' : 'Rendah' }}
            </AppBadge>
          </div>
        </div>

        <!-- Section 2.7 & Section 12 Explanatory Label -->
        <p class="text-[10px] text-slate-400 pt-1.5 border-t border-slate-100 text-right italic">
          * Kondisi stok terkini (Per saat ini, bukan histori periode)
        </p>
      </div>
    </div>
  </AppCard>
</template>
