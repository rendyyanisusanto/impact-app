/**
 * Composable for managing Weekly Schedule Setting UI state, draft changes,
 * dirty state checking, validation, and persistence.
 */

import { computed, ref } from 'vue'
import { scheduleSettingsService } from '../services/schedule-settings.service'
import type {
  RangeKey,
  ScheduleDayItem,
  ScheduleValidationResult,
  TimePointKey
} from '../types/schedule-settings.types'
import { validateWeeklySchedule } from '../utils/schedule-validation'

export function useScheduleSettings() {
  const scheduleItems = ref<ScheduleDayItem[]>([])
  const originalSnapshot = ref<string>('')
  const isLoading = ref<boolean>(false)
  const isSaving = ref<boolean>(false)
  const errorMessage = ref<string | null>(null)
  const successMessage = ref<string | null>(null)

  const isDirty = computed(() => {
    if (!originalSnapshot.value) return false
    return JSON.stringify(scheduleItems.value) !== originalSnapshot.value
  })

  const validation = computed<ScheduleValidationResult>(() => {
    return validateWeeklySchedule(scheduleItems.value)
  })

  const hasErrors = computed(() => !validation.value.isValid)

  async function loadSchedule() {
    isLoading.value = true
    errorMessage.value = null
    try {
      const data = await scheduleSettingsService.getWeeklySchedule()
      // Deep clone to create editable reactive copy
      scheduleItems.value = JSON.parse(JSON.stringify(data))
      originalSnapshot.value = JSON.stringify(scheduleItems.value)
    } catch (err: unknown) {
      errorMessage.value =
        err instanceof Error ? err.message : 'Gagal memuat setting jadwal mingguan.'
    } finally {
      isLoading.value = false
    }
  }

  function updateTime(
    dayId: number,
    rangeKey: RangeKey,
    pointKey: TimePointKey,
    value: string | null
  ) {
    const item = scheduleItems.value.find(s => s.dayId === dayId)
    if (item) {
      item[rangeKey][pointKey] = value
    }
  }

  function resetChanges() {
    if (originalSnapshot.value) {
      scheduleItems.value = JSON.parse(originalSnapshot.value)
      errorMessage.value = null
    }
  }

  async function saveSchedule(): Promise<boolean> {
    if (!validation.value.isValid) {
      errorMessage.value =
        'Terdapat kesalahan pada input rentang waktu jadwal. Silakan periksa kembali.'
      return false
    }

    isSaving.value = true
    errorMessage.value = null
    successMessage.value = null

    try {
      const res = await scheduleSettingsService.saveWeeklySchedule(scheduleItems.value)
      // Update original snapshot on successful save
      originalSnapshot.value = JSON.stringify(scheduleItems.value)
      successMessage.value = res.message
      return true
    } catch (err: unknown) {
      errorMessage.value =
        err instanceof Error ? err.message : 'Gagal menyimpan perubahan setting jadwal.'
      return false
    } finally {
      isSaving.value = false
    }
  }

  return {
    scheduleItems,
    isLoading,
    isSaving,
    isDirty,
    validation,
    hasErrors,
    errorMessage,
    successMessage,
    loadSchedule,
    updateTime,
    resetChanges,
    saveSchedule
  }
}
