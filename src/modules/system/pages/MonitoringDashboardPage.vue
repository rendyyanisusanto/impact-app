<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppBadge from '@/shared/components/ui/AppBadge.vue'
import {
  monitoringDashboardService,
  type MonitoringSummaryDto,
  type AuditStatsDto,
  type ErrorStatsResponse,
  type BugStatsResponse
} from '../services/monitoring-dashboard.service'
import { useToast } from '@/shared/composables/useToast'
import {
  RefreshCw,
  Activity,
  AlertOctagon,
  Bug,
  Server,
  ArrowRight
} from 'lucide-vue-next'

const toast = useToast()

const isLoading = ref(true)

const defaultKpis = {
  totalAuditLogs: 0,
  auditLogsLast24h: 0,
  totalErrors: 0,
  errorsLast24h: 0,
  backendErrorsLast24h: 0,
  frontendErrorsLast24h: 0,
  openBugReports: 0,
  inProgressBugReports: 0,
  resolvedBugReports: 0
}

const summary = ref<MonitoringSummaryDto>({
  kpis: { ...defaultKpis },
  recentErrors: [],
  recentAuditLogs: [],
  recentBugReports: []
})

const auditStats = ref<AuditStatsDto>({
  byAction: [],
  byModule: [],
  trend7d: []
})

const errorStats = ref<ErrorStatsResponse>({
  bySource: [],
  byStatus: [],
  topErrors: []
})

const bugStats = ref<BugStatsResponse>({
  byStatus: [],
  byPriority: [],
  unresolvedCount: 0
})

async function loadAllData() {
  try {
    isLoading.value = true
    const [sum, audit, errs, bugs] = await Promise.all([
      monitoringDashboardService.getSummary(),
      monitoringDashboardService.getAuditStats(),
      monitoringDashboardService.getErrorStats(),
      monitoringDashboardService.getBugStats()
    ])

    summary.value = {
      kpis: {
        totalAuditLogs: sum?.kpis?.totalAuditLogs ?? (sum as unknown as Record<string, number>)?.totalEvents ?? 0,
        auditLogsLast24h: sum?.kpis?.auditLogsLast24h ?? (sum as unknown as Record<string, number>)?.auditToday ?? 0,
        totalErrors: sum?.kpis?.totalErrors ?? (sum as unknown as Record<string, number>)?.totalErrors ?? 0,
        errorsLast24h: sum?.kpis?.errorsLast24h ?? (sum as unknown as Record<string, number>)?.errorsToday ?? 0,
        backendErrorsLast24h: sum?.kpis?.backendErrorsLast24h ?? 0,
        frontendErrorsLast24h: sum?.kpis?.frontendErrorsLast24h ?? 0,
        openBugReports: sum?.kpis?.openBugReports ?? (sum as unknown as Record<string, number>)?.openBugs ?? 0,
        inProgressBugReports: sum?.kpis?.inProgressBugReports ?? (sum as unknown as Record<string, number>)?.inProgressBugs ?? 0,
        resolvedBugReports: sum?.kpis?.resolvedBugReports ?? (sum as unknown as Record<string, number>)?.resolvedBugs ?? 0
      },
      recentErrors: sum?.recentErrors ?? [],
      recentAuditLogs: sum?.recentAuditLogs ?? [],
      recentBugReports: sum?.recentBugReports ?? []
    }
    auditStats.value = {
      byAction: audit?.byAction ?? [],
      byModule: audit?.byModule ?? [],
      trend7d: audit?.trend7d ?? []
    }
    errorStats.value = {
      bySource: errs?.bySource ?? [],
      byStatus: errs?.byStatus ?? [],
      topErrors: errs?.topErrors ?? []
    }
    bugStats.value = {
      byStatus: bugs?.byStatus ?? [],
      byPriority: bugs?.byPriority ?? [],
      unresolvedCount: bugs?.unresolvedCount ?? 0
    }
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Gagal memuat ringkasan monitoring.')
  } finally {
    isLoading.value = false
  }
}

function formatDate(iso: string): string {
  if (!iso) return '-'
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d)
  } catch {
    return iso
  }
}

onMounted(() => {
  loadAllData()
})
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <AppPageHeader
      title="Centralized Monitoring Dashboard"
      description="Pusat pemantauan kesehatan sistem, rekam jejak audit mutasi data, pelacakan error, dan tiket bug."
    >
      <template #actions>
        <AppButton
          variant="outline"
          size="sm"
          :loading="isLoading"
          @click="loadAllData"
        >
          <RefreshCw class="w-4 h-4 mr-1.5" />
          Refresh Data
        </AppButton>
      </template>
    </AppPageHeader>

    <!-- Top KPI Executive Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <!-- Status Sistem -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-slate-500">Status Sistem</span>
          <span
            class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
            :class="(summary.kpis?.errorsLast24h ?? 0) > 10 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'"
          >
            <span
              class="w-1.5 h-1.5 rounded-full"
              :class="(summary.kpis?.errorsLast24h ?? 0) > 10 ? 'bg-amber-500' : 'bg-emerald-500'"
            />
            {{ (summary.kpis?.errorsLast24h ?? 0) > 10 ? 'Perlu Perhatian' : 'Optimal & Normal' }}
          </span>
        </div>
        <div class="mt-2.5">
          <span class="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {{ (summary.kpis?.errorsLast24h ?? 0) > 0 ? `${summary.kpis.errorsLast24h} Error` : '0 Error' }}
          </span>
          <span class="text-xs text-slate-400 block mt-0.5">dalam 24 jam terakhir</span>
        </div>
      </div>

      <!-- Audit Activities -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-slate-500">Aktivitas Audit</span>
          <div class="w-7 h-7 rounded bg-teal-50 dark:bg-teal-950/50 text-teal-600 flex items-center justify-center">
            <Activity class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-2.5">
          <span class="text-2xl font-bold text-slate-800 dark:text-slate-100 font-mono">
            {{ summary.kpis?.totalAuditLogs ?? 0 }}
          </span>
          <span class="text-xs text-teal-600 dark:text-teal-400 block mt-0.5 font-medium">
            +{{ summary.kpis?.auditLogsLast24h ?? 0 }} aktivitas hari ini
          </span>
        </div>
      </div>

      <!-- Runtime Errors -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-slate-500">Error Runtime (24h)</span>
          <div class="w-7 h-7 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
            <AlertOctagon class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-2.5">
          <span class="text-2xl font-bold text-slate-800 dark:text-slate-100 font-mono">
            {{ summary.kpis?.errorsLast24h ?? 0 }}
          </span>
          <span class="text-xs text-slate-400 block mt-0.5">
            {{ summary.kpis?.backendErrorsLast24h ?? 0 }} backend • {{ summary.kpis?.frontendErrorsLast24h ?? 0 }} client
          </span>
        </div>
      </div>

      <!-- Bug Reports -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-slate-500">Laporan Bug Aktif</span>
          <div class="w-7 h-7 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
            <Bug class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-2.5">
          <span class="text-2xl font-bold text-slate-800 dark:text-slate-100 font-mono">
            {{ (summary.kpis?.openBugReports ?? 0) + (summary.kpis?.inProgressBugReports ?? 0) }}
          </span>
          <span class="text-xs text-amber-600 dark:text-amber-400 block mt-0.5 font-medium">
            {{ summary.kpis?.openBugReports ?? 0 }} baru • {{ summary.kpis?.inProgressBugReports ?? 0 }} proses
          </span>
        </div>
      </div>
    </div>

    <!-- Visual Distribution Columns -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <!-- Error Distribution -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Server class="w-3.5 h-3.5 text-indigo-600" />
              Sumber Error (24 Jam)
            </h3>
            <RouterLink to="/system/error-monitoring" class="text-xs text-teal-600 hover:underline flex items-center gap-0.5">
              Lihat Semua <ArrowRight class="w-3 h-3" />
            </RouterLink>
          </div>

          <div v-if="(errorStats.bySource?.length ?? 0) === 0" class="text-xs text-slate-400 py-6 text-center">
            Tidak ada error yang tercatat 24 jam ini.
          </div>

          <div v-else class="space-y-2.5">
            <div
              v-for="s in errorStats.bySource"
              :key="s.source"
              class="space-y-1"
            >
              <div class="flex justify-between text-xs">
                <span class="font-medium text-slate-700 dark:text-slate-300">{{ s.source }}</span>
                <span class="font-mono text-slate-500">{{ s.count }} error</span>
              </div>
              <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full"
                  :class="s.source === 'BACKEND' ? 'bg-indigo-600' : 'bg-amber-500'"
                  :style="{ width: `${Math.min(100, (s.count / Math.max(1, summary.kpis?.errorsLast24h ?? 1)) * 100)}%` }"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 dark:border-slate-800 mt-4 text-[11px] text-slate-500">
          Status 500: <strong class="text-rose-600">{{ summary.kpis?.backendErrorsLast24h ?? 0 }}</strong>
        </div>
      </div>

      <!-- Audit Distribution -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Activity class="w-3.5 h-3.5 text-teal-600" />
              Aktivitas Audit per Aksi
            </h3>
            <RouterLink to="/system/audit-trail" class="text-xs text-teal-600 hover:underline flex items-center gap-0.5">
              Lihat Log <ArrowRight class="w-3 h-3" />
            </RouterLink>
          </div>

          <div v-if="(auditStats.byAction?.length ?? 0) === 0" class="text-xs text-slate-400 py-6 text-center">
            Belum ada aktivitas audit tercatat.
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="a in auditStats.byAction.slice(0, 5)"
              :key="a.action"
              class="flex items-center justify-between text-xs py-1 border-b border-slate-50 dark:border-slate-800/40"
            >
              <span class="font-medium text-slate-700 dark:text-slate-300">{{ a.action }}</span>
              <span class="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {{ a.count }} kali
              </span>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 dark:border-slate-800 mt-4 text-[11px] text-slate-500">
          Total mutasi 7 hari: <strong class="text-slate-700 dark:text-slate-300">{{ summary.kpis?.totalAuditLogs ?? 0 }}</strong>
        </div>
      </div>

      <!-- Bug Reports Status -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Bug class="w-3.5 h-3.5 text-amber-600" />
              Distribusi Tiket Bug
            </h3>
            <RouterLink to="/system/bug-reports" class="text-xs text-teal-600 hover:underline flex items-center gap-0.5">
              Kelola Bug <ArrowRight class="w-3 h-3" />
            </RouterLink>
          </div>

          <div v-if="(bugStats.byStatus?.length ?? 0) === 0" class="text-xs text-slate-400 py-6 text-center">
            Belum ada tiket bug dilaporkan.
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="b in bugStats.byStatus"
              :key="b.status"
              class="flex items-center justify-between text-xs py-1 border-b border-slate-50 dark:border-slate-800/40"
            >
              <span class="font-medium text-slate-700 dark:text-slate-300">{{ b.status }}</span>
              <span class="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {{ b.count }}
              </span>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 dark:border-slate-800 mt-4 text-[11px] text-slate-500">
          Tiket belum selesai: <strong class="text-amber-600">{{ bugStats.unresolvedCount }}</strong>
        </div>
      </div>
    </div>

    <!-- Live Feeds Grid: Recent Errors & Recent Audit Logs -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <!-- Recent Errors -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <AlertOctagon class="w-3.5 h-3.5 text-rose-600" />
            5 Error Terkini
          </h3>
          <RouterLink to="/system/error-monitoring" class="text-xs text-teal-600 hover:underline">
            Buka Pelacakan
          </RouterLink>
        </div>

        <div v-if="(summary.recentErrors?.length ?? 0) === 0" class="text-center py-8 text-xs text-slate-400">
          Tidak ada error terbaru.
        </div>

        <div v-else class="divide-y divide-slate-100 dark:divide-slate-800">
          <div
            v-for="errItem in (summary.recentErrors || []).slice(0, 5)"
            :key="errItem.id"
            class="py-2.5 flex items-start justify-between gap-3 text-xs"
          >
            <div class="min-w-0">
              <div class="flex items-center gap-2 mb-0.5">
                <span class="font-mono font-semibold text-rose-600 text-[11px]">{{ errItem.error_code }}</span>
                <span class="text-[10px] text-slate-400 font-mono">{{ formatDate(errItem.occurred_at) }}</span>
              </div>
              <p class="text-slate-700 dark:text-slate-300 truncate font-medium">
                {{ errItem.message }}
              </p>
            </div>
            <AppBadge :variant="errItem.source === 'BACKEND' ? 'primary' : 'warning'">
              {{ errItem.source }}
            </AppBadge>
          </div>
        </div>
      </div>

      <!-- Recent Audit Logs -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Activity class="w-3.5 h-3.5 text-teal-600" />
            5 Aktivitas Audit Terkini
          </h3>
          <RouterLink to="/system/audit-trail" class="text-xs text-teal-600 hover:underline">
            Buka Audit Trail
          </RouterLink>
        </div>

        <div v-if="(summary.recentAuditLogs?.length ?? 0) === 0" class="text-center py-8 text-xs text-slate-400">
          Tidak ada aktivitas audit terbaru.
        </div>

        <div v-else class="divide-y divide-slate-100 dark:divide-slate-800">
          <div
            v-for="log in (summary.recentAuditLogs || []).slice(0, 5)"
            :key="log.id"
            class="py-2.5 flex items-start justify-between gap-3 text-xs"
          >
            <div class="min-w-0">
              <div class="flex items-center gap-2 mb-0.5">
                <span class="font-semibold text-slate-800 dark:text-slate-200">{{ log.username || 'System' }}</span>
                <span class="text-[10px] text-slate-400 font-mono">{{ formatDate(log.created_at) }}</span>
              </div>
              <p class="text-slate-600 dark:text-slate-400 truncate">
                {{ log.description || '-' }}
              </p>
            </div>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 whitespace-nowrap">
              {{ log.action }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
