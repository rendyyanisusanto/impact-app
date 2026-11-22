/**
 * Service for HR Weekly Schedule Setting (Setting Jadwal Mingguan).
 * Manages atomic persistence and provides resolver contracts for future Presensi module.
 */

import type {
  IPresensiScheduleResolver,
  LegacyJadwalEntity,
  ScheduleDayItem,
  WeeklyScheduleSaveResponse
} from '../types/schedule-settings.types'
import { isTimeInRange, mapLegacyToViewModel, mapViewModelToLegacy } from '../utils/schedule-time'
import { validateWeeklySchedule } from '../utils/schedule-validation'

/**
 * Verified MariaDB seed data from `u1573701_smm(2).sql` (table `jadwal`).
 */
export const VERIFIED_LEGACY_JADWAL_SEEDS: LegacyJadwalEntity[] = [
  {
    id: 7,
    hari: 'Senin',
    day_id: 2,
    shift_in_start: '08:00',
    shift_in_end: '10:00',
    shift_out_start: '14:30',
    shift_out_end: '16:00',
    break_start_start: '10:01',
    break_start_end: '12:00',
    break_end_start: '13:00',
    break_end_end: '14:00'
  },
  {
    id: 8,
    hari: 'Selasa',
    day_id: 3,
    shift_in_start: '08:00',
    shift_in_end: '10:00',
    shift_out_start: '14:30',
    shift_out_end: '16:00',
    break_start_start: '10:01',
    break_start_end: '12:00',
    break_end_start: '13:00',
    break_end_end: '14:00'
  },
  {
    id: 9,
    hari: 'Rabu',
    day_id: 4,
    shift_in_start: '08:00',
    shift_in_end: '10:00',
    shift_out_start: '14:30',
    shift_out_end: '16:00',
    break_start_start: '10:01',
    break_start_end: '12:00',
    break_end_start: '13:00',
    break_end_end: '14:00'
  },
  {
    id: 10,
    hari: 'Kamis',
    day_id: 5,
    shift_in_start: '08:00',
    shift_in_end: '10:00',
    shift_out_start: '14:30',
    shift_out_end: '16:00',
    break_start_start: '10:01',
    break_start_end: '12:00',
    break_end_start: '13:00',
    break_end_end: '14:00'
  },
  {
    id: 11,
    hari: 'Jumat',
    day_id: 6,
    shift_in_start: '08:00',
    shift_in_end: '10:00',
    shift_out_start: '14:30',
    shift_out_end: '16:00',
    break_start_start: '10:01',
    break_start_end: '11:30', // Legacy verified: shorter morning break before Friday prayer
    break_end_start: '13:00',
    break_end_end: '14:00'
  },
  {
    id: 12,
    hari: 'Sabtu',
    day_id: 7,
    shift_in_start: '08:00',
    shift_in_end: '10:00',
    shift_out_start: '14:30',
    shift_out_end: '16:00',
    break_start_start: '10:01',
    break_start_end: '12:00',
    break_end_start: '13:00',
    break_end_end: '14:00'
  },
  {
    id: 13,
    hari: 'Minggu',
    day_id: 1,
    shift_in_start: '08:00',
    shift_in_end: '10:00',
    shift_out_start: '14:30',
    shift_out_end: '16:00',
    break_start_start: '10:01',
    break_start_end: '12:00',
    break_end_start: '13:00',
    break_end_end: '14:00'
  }
]

export class ScheduleSettingsService implements IPresensiScheduleResolver {
  private static instance: ScheduleSettingsService
  private state: LegacyJadwalEntity[] = []
  private lastModified: string = new Date().toISOString()
  public simulateFailureOnce: boolean = false
  public delayMs: number = 0 // Instant for tests, set to e.g. 200 in app

  private constructor() {
    this.resetToOriginalSeed()
  }

  public static getInstance(): ScheduleSettingsService {
    if (!ScheduleSettingsService.instance) {
      ScheduleSettingsService.instance = new ScheduleSettingsService()
    }
    return ScheduleSettingsService.instance
  }

  public resetToOriginalSeed(): void {
    this.state = JSON.parse(JSON.stringify(VERIFIED_LEGACY_JADWAL_SEEDS))
    this.lastModified = new Date().toISOString()
    this.simulateFailureOnce = false
  }

  private async sleep(): Promise<void> {
    if (this.delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delayMs))
    }
  }

  /**
   * Retrieves the 7-day schedule sorted from Senin (1) to Minggu (7).
   */
  public async getWeeklySchedule(): Promise<ScheduleDayItem[]> {
    await this.sleep()
    return this.getWeeklyScheduleSync()
  }

  /**
   * Synchronous getter for fast UI reads.
   */
  public getWeeklyScheduleSync(): ScheduleDayItem[] {
    const viewModels = this.state.map(entity => mapLegacyToViewModel(entity))
    return viewModels.sort((a, b) => a.order - b.order)
  }

  /**
   * Saves the entire 7-day schedule atomically.
   */
  public async saveWeeklySchedule(items: ScheduleDayItem[]): Promise<WeeklyScheduleSaveResponse> {
    await this.sleep()

    if (this.simulateFailureOnce) {
      this.simulateFailureOnce = false
      throw new Error(
        'Simulasi kegagalan server saat menyimpan jadwal. Data perubahan Anda tetap aman di formulir.'
      )
    }

    // Comprehensive validation
    const validation = validateWeeklySchedule(items)
    if (!validation.isValid) {
      const summaryMsg = validation.errorSummary.slice(0, 3).join(' | ')
      throw new Error(`Validasi jadwal gagal: ${summaryMsg}`)
    }

    // Prepare atomic update
    const updatedEntities: LegacyJadwalEntity[] = items.map(item => mapViewModelToLegacy(item))

    // Commit atomic update
    this.state = updatedEntities
    this.lastModified = new Date().toISOString()

    return {
      success: true,
      message: 'Setting jadwal mingguan berhasil disimpan.',
      updatedCount: updatedEntities.length,
      updatedAt: this.lastModified
    }
  }

  /**
   * Downstream Presensi Contract: Resolves schedule for a specific day_id (1-7).
   */
  public async getScheduleByDayId(dayId: number): Promise<ScheduleDayItem | undefined> {
    await this.sleep()
    const found = this.state.find(e => e.day_id === dayId)
    return found ? mapLegacyToViewModel(found) : undefined
  }

  /**
   * Downstream Presensi Contract: Resolves schedule for a given Date or ISO date string.
   */
  public async getScheduleByDate(date: Date | string): Promise<ScheduleDayItem | undefined> {
    const d = typeof date === 'string' ? new Date(date) : date
    // JavaScript getDay(): 0 is Sunday, 1 is Monday, ..., 6 is Saturday
    // Legacy MariaDB day_id: 1 is Sunday, 2 is Monday, ..., 7 is Saturday
    const jsDay = d.getDay()
    const legacyDayId = jsDay === 0 ? 1 : jsDay + 1

    return this.getScheduleByDayId(legacyDayId)
  }

  /**
   * Downstream Presensi Contract: Evaluates whether a given punch-in time is within allowable window.
   */
  public isWithinCheckInRange(time: string, dayId: number): boolean {
    const found = this.state.find(e => e.day_id === dayId)
    if (!found || !found.shift_in_start || !found.shift_in_end) return false
    return isTimeInRange(time, found.shift_in_start, found.shift_in_end)
  }

  /**
   * Downstream Presensi Contract: Evaluates whether a given punch-out time is within allowable window.
   */
  public isWithinCheckOutRange(time: string, dayId: number): boolean {
    const found = this.state.find(e => e.day_id === dayId)
    if (!found || !found.shift_out_start || !found.shift_out_end) return false
    return isTimeInRange(time, found.shift_out_start, found.shift_out_end)
  }

  public getLastModified(): string {
    return this.lastModified
  }
}

export const scheduleSettingsService = ScheduleSettingsService.getInstance()
