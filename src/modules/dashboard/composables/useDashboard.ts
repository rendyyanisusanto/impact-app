import { ref, shallowRef, getCurrentInstance, onMounted, onUnmounted } from 'vue'
import type {
  DashboardFilterState,
  DashboardData,
  DashboardDatePreset
} from '../types/dashboard.types'
import { apiDashboardService, type IDashboardService } from '../services/dashboard.service'
import { resolvePresetDates, formatDateTimeWib } from '../utils/dashboard-date'

export function useDashboard(service: IDashboardService = apiDashboardService) {
  const initialMonth = resolvePresetDates('this_month')

  const filterState = ref<DashboardFilterState>({
    preset: 'this_month',
    startDate: initialMonth.startDate,
    endDate: initialMonth.endDate
  })

  const data = shallowRef<DashboardData | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<string>(formatDateTimeWib(new Date()))

  let latestRequestId = 0
  let currentAbortController: AbortController | null = null

  async function fetchDashboard(action: 'view' | 'refresh' | 'filter' = 'view') {
    const requestId = ++latestRequestId

    // Abort previous in-flight request if any
    if (currentAbortController) {
      currentAbortController.abort()
    }
    currentAbortController = new AbortController()

    isLoading.value = true
    error.value = null

    try {
      const result = await service.getDashboardData(
        filterState.value,
        currentAbortController.signal,
        action
      )
      // Protection against stale/out-of-order responses
      if (requestId === latestRequestId) {
        data.value = result
        lastUpdated.value = formatDateTimeWib(result.generated_at || new Date())
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return
      }
      if ((err as Error)?.name === 'AbortError') {
        return
      }
      if (requestId === latestRequestId) {
        error.value = err instanceof Error ? err.message : 'Gagal memuat data dashboard'
      }
    } finally {
      if (requestId === latestRequestId) {
        isLoading.value = false
      }
    }
  }

  function setPreset(preset: DashboardDatePreset) {
    if (preset === 'custom') {
      filterState.value = { ...filterState.value, preset }
      return
    }

    const resolved = resolvePresetDates(preset)
    filterState.value = {
      preset,
      startDate: resolved.startDate,
      endDate: resolved.endDate
    }
    fetchDashboard('filter')
  }

  function setCustomRange(startDate: string, endDate: string) {
    filterState.value = {
      preset: 'custom',
      startDate,
      endDate
    }
    fetchDashboard('filter')
  }

  function resetFilter() {
    const resolved = resolvePresetDates('this_month')
    filterState.value = {
      preset: 'this_month',
      startDate: resolved.startDate,
      endDate: resolved.endDate
    }
    fetchDashboard('filter')
  }

  function refresh() {
    fetchDashboard('refresh')
  }

  // Auto-fetch on mount if inside a Vue component instance
  if (getCurrentInstance()) {
    onMounted(() => {
      fetchDashboard('view')
    })

    onUnmounted(() => {
      if (currentAbortController) {
        currentAbortController.abort()
      }
    })
  }

  return {
    filterState,
    data,
    isLoading,
    error,
    lastUpdated,
    fetchDashboard,
    setPreset,
    setCustomRange,
    resetFilter,
    refresh
  }
}
