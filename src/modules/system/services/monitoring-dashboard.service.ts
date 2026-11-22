import { apiClient } from '@/shared/services/api-client'
import type { AuditLog } from './audit-trail.service'
import type { SystemErrorItem } from './error-monitoring.service'
import type { BugReportItem } from './bug-report.service'

export interface MonitoringSummaryDto {
  kpis: {
    totalAuditLogs: number
    auditLogsLast24h: number
    totalErrors: number
    errorsLast24h: number
    backendErrorsLast24h: number
    frontendErrorsLast24h: number
    openBugReports: number
    inProgressBugReports: number
    resolvedBugReports: number
  }
  recentErrors: SystemErrorItem[]
  recentAuditLogs: AuditLog[]
  recentBugReports: BugReportItem[]
}

export interface AuditStatsDto {
  byAction: { action: string; count: number }[]
  byModule: { module: string; count: number }[]
  trend7d: { date: string; count: number }[]
}

export interface ErrorStatsResponse {
  bySource: { source: string; count: number }[]
  byStatus: { http_status: number; count: number }[]
  topErrors: { fingerprint: string; error_type: string; message: string; count: number }[]
}

export interface BugStatsResponse {
  byStatus: { status: string; count: number }[]
  byPriority: { priority: string; count: number }[]
  unresolvedCount: number
}

export class MonitoringDashboardService {
  async getSummary(): Promise<MonitoringSummaryDto> {
    const res = await apiClient<MonitoringSummaryDto>('/monitoring/summary')
    return res.data
  }

  async getAuditStats(): Promise<AuditStatsDto> {
    const res = await apiClient<AuditStatsDto>('/monitoring/audit-stats')
    return res.data
  }

  async getErrorStats(): Promise<ErrorStatsResponse> {
    const res = await apiClient<ErrorStatsResponse>('/monitoring/error-stats')
    return res.data
  }

  async getBugStats(): Promise<BugStatsResponse> {
    const res = await apiClient<BugStatsResponse>('/monitoring/bug-stats')
    return res.data
  }
}

export const monitoringDashboardService = new MonitoringDashboardService()

