<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import DashboardFilters from '../components/DashboardFilters.vue'
import DashboardKpiCard from '../components/DashboardKpiCard.vue'
import DashboardSalesChart from '../components/DashboardSalesChart.vue'
import DashboardProductChart from '../components/DashboardProductChart.vue'
import DashboardRecentTransactions from '../components/DashboardRecentTransactions.vue'
import DashboardTopSpenders from '../components/DashboardTopSpenders.vue'
import DashboardLowStock from '../components/DashboardLowStock.vue'
import { useDashboard } from '../composables/useDashboard'
import { formatCurrency, formatNumber } from '@/shared/utils/formatters'
import { formatDateLabelId, formatDateISO, getNowJakarta } from '../utils/dashboard-date'
import { AlertCircle, RefreshCw } from 'lucide-vue-next'

const authStore = useAuthStore()

const { filterState, data, isLoading, error, lastUpdated, refresh, resetFilter } = useDashboard()

const userName = computed(() => {
  return authStore.currentUser?.name || authStore.user?.name || 'Pengguna'
})

const totalTransactionsFormatted = computed(() => {
  return formatCurrency(data.value?.summary.totalTransactionsAmount || 0)
})

const todayTransactionsFormatted = computed(() => {
  return formatCurrency(data.value?.summary.todayTransactionsAmount || 0)
})

// KPI 2 semantik: Menyesuaikan judul dan tanggal referensi (Section 5)
const isReferenceDateToday = computed(() => {
  const todayStr = formatDateISO(getNowJakarta())
  const refDate = data.value?.summary.referenceDate || filterState.value.endDate
  return (
    refDate === todayStr ||
    filterState.value.preset === 'today' ||
    filterState.value.preset === 'this_month' ||
    filterState.value.preset === 'month'
  )
})

const kpi2Title = computed(() => {
  if (isReferenceDateToday.value) {
    return 'Transaksi Hari Ini'
  }
  return 'Transaksi Hari Terakhir'
})

const kpi2Subtitle = computed(() => {
  const count = formatNumber(data.value?.summary.todayTransactionsCount || 0)
  if (filterState.value.preset === 'today') {
    return `${count} transaksi terkonfirmasi (WIB)`
  }
  const refDate = data.value?.summary.referenceDate || filterState.value.endDate
  const formattedRef = formatDateLabelId(refDate)
  return `${count} transaksi terkonfirmasi (per ${formattedRef})`
})

const completedSpkSubtitle = computed(() => {
  const count = data.value?.summary.completedProductionThisWeekCount ?? 0
  return `${count} SPK selesai minggu ini`
})

defineExpose({
  isLoading,
  filterState,
  data,
  refresh,
  resetFilter
})
</script>

<template>
  <div class="space-y-6 pb-12">
    <!-- 1. PAGE HEADER -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <AppPageHeader
        title="Dashboard Operasional"
        :subtitle="`Selamat datang kembali, ${userName}. Ringkasan aktivitas dan operasional furniture.`"
      />
      <div v-if="lastUpdated" class="text-right text-xs text-slate-400 shrink-0">
        <p>Waktu pembaruan:</p>
        <p class="font-medium text-slate-600">{{ lastUpdated }}</p>
      </div>
    </div>

    <!-- GLOBAL ERROR BANNER -->
    <div
      v-if="error"
      class="p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-between gap-3 text-sm text-rose-800"
      role="alert"
    >
      <div class="flex items-center gap-2">
        <AlertCircle class="w-5 h-5 text-rose-600 shrink-0" />
        <div>
          <p class="font-semibold">Terjadi kesalahan pada Dashboard</p>
          <p class="text-xs text-rose-600">{{ error }}</p>
        </div>
      </div>
      <AppButton variant="secondary" size="sm" :loading="isLoading" @click="refresh">
        <template #left-icon>
          <RefreshCw class="w-3.5 h-3.5" />
        </template>
        Coba Lagi
      </AppButton>
    </div>

    <!-- 2. FILTER AREA -->
    <section aria-label="Filter Dashboard">
      <DashboardFilters
        v-model="filterState"
        :loading="isLoading"
        :is-mock="false"
        :last-updated="lastUpdated"
        @refresh="refresh"
        @reset="resetFilter"
      />
    </section>

    <!-- 3. KPI CARDS -->
    <section aria-label="Indikator Kinerja Utama">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- KPI 1: Total Transaksi -->
        <DashboardKpiCard
          title="Total Transaksi"
          :value="totalTransactionsFormatted"
          :subtitle="`${formatNumber(data?.summary.totalTransactionsCount || 0)} transaksi pada periode ini`"
          icon-name="cart"
          :loading="isLoading"
          :is-mock="false"
        />

        <!-- KPI 2: Transaksi Hari Ini / Hari Terakhir -->
        <DashboardKpiCard
          :title="kpi2Title"
          :value="todayTransactionsFormatted"
          :subtitle="kpi2Subtitle"
          icon-name="currency"
          :loading="isLoading"
          :is-mock="false"
        />

        <!-- KPI 3: Pesanan Produksi Aktif -->
        <DashboardKpiCard
          title="SPK Produksi Aktif"
          :value="data?.summary.activeProductionOrdersCount || 0"
          unit="SPK"
          :subtitle="completedSpkSubtitle"
          icon-name="package"
          :loading="isLoading"
          :is-mock="false"
        />

        <!-- KPI 4: Stok Limit Alert -->
        <DashboardKpiCard
          title="Bahan di Bawah Limit"
          :value="data?.summary.lowStockItemsCount || 0"
          unit="Item"
          :trend="{ direction: 'down', text: 'Perlu pengadaan segera (Stok terkini)' }"
          icon-name="alert"
          :loading="isLoading"
          :is-mock="false"
        />
      </div>
    </section>

    <!-- 4. ANALYTICS CHARTS -->
    <section aria-label="Grafik Analitik" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DashboardSalesChart
        title="Grafik Penjualan"
        subtitle="Tren nilai transaksi penjualan pada periode terpilih"
        :points="data?.salesTrend || []"
        :loading="isLoading"
        :error="error"
      />

      <DashboardProductChart
        title="Grafik Produk Terlaris"
        subtitle="Distribusi kuantitas produk paling laris terjual"
        :products="data?.topProducts || []"
        :loading="isLoading"
        :error="error"
      />
    </section>

    <!-- 5. OPERATIONAL SECTION -->
    <section aria-label="Operasional Terkini" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left 2 Cols: Recent Transactions -->
      <div class="lg:col-span-2">
        <DashboardRecentTransactions
          :transactions="data?.recentTransactions || []"
          :loading="isLoading"
          :error="error"
        />
      </div>

      <!-- Right 1 Col: Top Spenders & Low Stock Warnings -->
      <div class="flex flex-col gap-6">
        <DashboardTopSpenders
          :spenders="data?.topSpenders || []"
          :loading="isLoading"
          :error="error"
        />

        <DashboardLowStock
          :items="data?.stockLimits || []"
          :loading="isLoading"
          :error="error"
        />
      </div>
    </section>
  </div>
</template>
