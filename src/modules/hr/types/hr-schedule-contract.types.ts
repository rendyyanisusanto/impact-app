/**
 * Contract type prepared for future Sprint 8 Tasks 6-8 (Setting Jadwal & Penugasan Jadwal).
 * Groups and employees will be referenced by schedule assignment rules.
 */
export interface ScheduleAssignmentReference {
  targetType: 'group' | 'employee'
  targetId: number
  targetName: string
  activeMemberCount?: number
}

export interface FutureScheduleContract {
  id?: number
  scheduleName?: string
  assignedGroupIds?: number[]
  assignedEmployeeIds?: number[]
}

export type {
  ScheduleDayItem,
  IPresensiScheduleResolver,
  LegacyJadwalEntity,
  TimeRangeValue
} from './schedule-settings.types'
