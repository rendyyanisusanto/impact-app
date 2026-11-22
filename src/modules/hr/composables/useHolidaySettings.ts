/**
 * Composable for HR Holiday Settings & Employee Exceptions (useHolidaySettings).
 * Manages reactive state for month switching, table/calendar toggle, CRUD modals, and export.
 */

import { computed, ref, watch } from 'vue'
import type { ExportColumn } from '@/shared/types/crud.types'
import { exportToExcel as doExportToExcel } from '@/shared/utils/excel-export'
import { exportToPdf as doExportToPdf } from '@/shared/utils/pdf-export'
import { holidaySettingsService } from '../services/holiday-settings.service'
import type {
  CalendarDayCell,
  CreateHolidayDto,
  HolidayItem,
  UpdateHolidayDto
} from '../types/holiday-settings.types'
import {
  formatDateIndonesian,
  formatDateShort,
  getCurrentYearMonth,
  generateCalendarGrid,
  shiftMonth
} from '../utils/holiday-date'

export function useHolidaySettings(initialYearMonth?: string) {
  // State
  const selectedYearMonth = ref<string>(initialYearMonth || getCurrentYearMonth())
  const viewMode = ref<'table' | 'calendar'>('table')
  const searchQuery = ref<string>('')
  const holidays = ref<HolidayItem[]>([])
  const isLoading = ref<boolean>(false)
  const isSaving = ref<boolean>(false)
  const isDeleting = ref<boolean>(false)
  const errorMessage = ref<string | null>(null)
  const successMessage = ref<string | null>(null)

  // Modals state
  const isFormModalOpen = ref<boolean>(false)
  const isDetailModalOpen = ref<boolean>(false)
  const isDeleteDialogOpen = ref<boolean>(false)
  const modalMode = ref<'create' | 'edit'>('create')
  const activeHoliday = ref<HolidayItem | null>(null)
  const deletingHoliday = ref<HolidayItem | null>(null)
  const initialDateForCreate = ref<string | null>(null)

  // Computed calendar grid
  const calendarGrid = computed<CalendarDayCell[]>(() => {
    return generateCalendarGrid(selectedYearMonth.value, holidays.value)
  })

  const totalHolidays = computed<number>(() => holidays.value.length)

  // Load holidays for the selected month
  async function loadHolidays(): Promise<void> {
    isLoading.value = true
    errorMessage.value = null
    try {
      holidays.value = await holidaySettingsService.getHolidaysByMonth(
        selectedYearMonth.value,
        searchQuery.value
      )
    } catch (err: unknown) {
      errorMessage.value = err instanceof Error ? err.message : 'Gagal memuat data hari libur'
    } finally {
      isLoading.value = false
    }
  }

  // Month navigation
  function changeMonth(delta: number): void {
    selectedYearMonth.value = shiftMonth(selectedYearMonth.value, delta)
    loadHolidays()
  }

  function setYearMonth(yearMonth: string): void {
    if (selectedYearMonth.value !== yearMonth) {
      selectedYearMonth.value = yearMonth
      loadHolidays()
    }
  }

  // Modals management
  function openCreateModal(defaultDate?: string): void {
    modalMode.value = 'create'
    activeHoliday.value = null
    initialDateForCreate.value = defaultDate || `${selectedYearMonth.value}-01`
    isFormModalOpen.value = true
    errorMessage.value = null
  }

  function openEditModal(holiday: HolidayItem): void {
    modalMode.value = 'edit'
    activeHoliday.value = holiday
    initialDateForCreate.value = null
    isFormModalOpen.value = true
    errorMessage.value = null
  }

  function closeFormModal(): void {
    isFormModalOpen.value = false
    activeHoliday.value = null
    initialDateForCreate.value = null
  }

  function openDetailModal(holiday: HolidayItem): void {
    activeHoliday.value = holiday
    isDetailModalOpen.value = true
  }

  function closeDetailModal(): void {
    isDetailModalOpen.value = false
    activeHoliday.value = null
  }

  function promptDelete(holiday: HolidayItem): void {
    deletingHoliday.value = holiday
    isDeleteDialogOpen.value = true
  }

  function cancelDelete(): void {
    deletingHoliday.value = null
    isDeleteDialogOpen.value = false
  }

  async function confirmDelete(): Promise<boolean> {
    if (!deletingHoliday.value) return false
    isDeleting.value = true
    errorMessage.value = null
    try {
      const deletedName = deletingHoliday.value.keterangan
      await holidaySettingsService.deleteHoliday(deletingHoliday.value.id)
      successMessage.value = `Hari libur "${deletedName}" berhasil dihapus`
      isDeleteDialogOpen.value = false
      deletingHoliday.value = null
      await loadHolidays()
      return true
    } catch (err: unknown) {
      errorMessage.value = err instanceof Error ? err.message : 'Gagal menghapus hari libur'
      return false
    } finally {
      isDeleting.value = false
    }
  }

  // Save (Create or Update)
  async function saveHoliday(payload: {
    id?: number
    tanggal: string
    keterangan: string
    exceptionEmployeeIds: number[]
  }): Promise<HolidayItem | null> {
    isSaving.value = true
    errorMessage.value = null
    try {
      let saved: HolidayItem
      if (modalMode.value === 'create') {
        const createDto: CreateHolidayDto = {
          tanggal: payload.tanggal,
          keterangan: payload.keterangan,
          exceptionEmployeeIds: payload.exceptionEmployeeIds
        }
        saved = await holidaySettingsService.createHoliday(createDto)
        successMessage.value = `Hari libur "${saved.keterangan}" (${formatDateIndonesian(saved.tanggal)}) berhasil ditambahkan`
      } else {
        if (!payload.id) {
          throw new Error('ID hari libur diperlukan untuk memperbarui data')
        }
        const updateDto: UpdateHolidayDto = {
          tanggal: payload.tanggal,
          keterangan: payload.keterangan,
          exceptionEmployeeIds: payload.exceptionEmployeeIds
        }
        saved = await holidaySettingsService.updateHoliday(payload.id, updateDto)
        successMessage.value = `Hari libur "${saved.keterangan}" (${formatDateIndonesian(saved.tanggal)}) berhasil diperbarui`
      }

      closeFormModal()
      // If holiday's month differs from currently selected month, switch to it
      const savedMonth = saved.tanggal.substring(0, 7)
      if (savedMonth !== selectedYearMonth.value) {
        selectedYearMonth.value = savedMonth
      }
      await loadHolidays()
      return saved
    } catch (err: unknown) {
      errorMessage.value = err instanceof Error ? err.message : 'Gagal menyimpan data hari libur'
      return null
    } finally {
      isSaving.value = false
    }
  }

  // Export columns definition
  const exportColumns: ExportColumn<Record<string, unknown>>[] = [
    { label: 'No', key: 'no', width: 8 },
    { label: 'Tanggal', key: 'tanggal', width: 16 },
    { label: 'Hari', key: 'hari', width: 14 },
    { label: 'Keterangan', key: 'keterangan', width: 30 },
    { label: 'Pengecualian Karyawan', key: 'exceptions', width: 45 }
  ]

  function getExportRows() {
    return holidays.value.map((h, idx) => {
      const excText =
        h.exceptionEmployees && h.exceptionEmployees.length > 0
          ? h.exceptionEmployees.map(e => `${e.nama} (${e.kode})`).join(', ')
          : 'Semua Karyawan Libur (Tanpa Pengecualian)'

      return {
        no: idx + 1,
        tanggal: formatDateShort(h.tanggal),
        hari: h.hari,
        keterangan: h.keterangan,
        exceptions: excText
      }
    })
  }

  async function exportToExcel(): Promise<void> {
    const filename = `Setting_Hari_Libur_${selectedYearMonth.value}`
    const rows = getExportRows()
    await doExportToExcel<Record<string, unknown>>({
      title: `Setting Hari Libur — Periode ${selectedYearMonth.value}`,
      columns: exportColumns,
      data: rows,
      filename
    })
  }

  async function exportToPdf(): Promise<void> {
    const filename = `Setting_Hari_Libur_${selectedYearMonth.value}`
    const rows = getExportRows()
    await doExportToPdf<Record<string, unknown>>({
      title: `Setting Hari Libur — Periode ${selectedYearMonth.value}`,
      columns: exportColumns,
      data: rows,
      filename
    })
  }

  // Watch search query with reload
  watch(searchQuery, () => {
    loadHolidays()
  })

  return {
    selectedYearMonth,
    viewMode,
    searchQuery,
    holidays,
    totalHolidays,
    calendarGrid,
    isLoading,
    isSaving,
    isDeleting,
    errorMessage,
    successMessage,
    isFormModalOpen,
    isDetailModalOpen,
    isDeleteDialogOpen,
    modalMode,
    activeHoliday,
    deletingHoliday,
    initialDateForCreate,
    loadHolidays,
    changeMonth,
    setYearMonth,
    openCreateModal,
    openEditModal,
    closeFormModal,
    openDetailModal,
    closeDetailModal,
    promptDelete,
    cancelDelete,
    confirmDelete,
    saveHoliday,
    exportToExcel,
    exportToPdf
  }
}
