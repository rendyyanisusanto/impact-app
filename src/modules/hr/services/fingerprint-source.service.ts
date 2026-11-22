/**
 * Mock Fingerprint Device Source Service
 * Simulates external hardware API endpoint (`users`, `users_today`).
 * Completely isolated from browser-to-hardware network calls.
 */

import type { RawFingerprintRecord } from '../types/attendance.types'

export interface IFingerprintSource {
  fetchUsersToday(): Promise<RawFingerprintRecord[]>
  fetchUsersByDate(dateStr: string): Promise<RawFingerprintRecord[]>
  fetchUsersYesterday(): Promise<RawFingerprintRecord[]>
  simulateDeviceAvailable: boolean
}

export class MockFingerprintSourceService implements IFingerprintSource {
  public simulateDeviceAvailable = true

  private rawRecords: RawFingerprintRecord[] = [
    // 2026-10-30 logs (matching Screenshot 2)
    { uid: 1, status_val: 0, time: '2026-10-30 07:49:08' },
    { uid: 1, status_val: 0, time: '2026-10-30 11:31:11' },
    { uid: 1, status_val: 0, time: '2026-10-30 12:38:14' },
    { uid: 1, status_val: 0, time: '2026-10-30 16:01:14' },

    { uid: 2, status_val: 0, time: '2026-10-30 07:57:04' },
    { uid: 2, status_val: 0, time: '2026-10-30 11:30:23' },
    { uid: 2, status_val: 0, time: '2026-10-30 12:55:07' },
    { uid: 2, status_val: 0, time: '2026-10-30 17:50:55' },

    { uid: 6, status_val: 0, time: '2026-10-30 07:55:52' },
    { uid: 6, status_val: 0, time: '2026-10-30 11:30:40' },
    { uid: 6, status_val: 0, time: '2026-10-30 12:44:01' },
    { uid: 6, status_val: 0, time: '2026-10-30 17:50:44' },

    { uid: 3, status_val: 0, time: '2026-10-30 07:57:10' },
    { uid: 3, status_val: 0, time: '2026-10-30 17:57:41' },

    { uid: 7, status_val: 0, time: '2026-10-30 07:57:26' },
    { uid: 7, status_val: 0, time: '2026-10-30 17:56:45' },

    { uid: 4, status_val: 0, time: '2026-10-30 07:57:55' },
    { uid: 4, status_val: 0, time: '2026-10-30 11:32:40' },
    { uid: 4, status_val: 0, time: '2026-10-30 13:01:20' },
    { uid: 4, status_val: 0, time: '2026-10-30 16:02:09' },

    { uid: 82, status_val: 0, time: '2026-10-30 08:01:42' },
    { uid: 82, status_val: 0, time: '2026-10-30 11:31:49' },
    { uid: 82, status_val: 0, time: '2026-10-30 13:01:28' },
    { uid: 82, status_val: 0, time: '2026-10-30 16:01:09' },

    { uid: 5, status_val: 0, time: '2026-10-30 07:58:12' },
    { uid: 5, status_val: 0, time: '2026-10-30 11:31:05' },
    { uid: 5, status_val: 0, time: '2026-10-30 12:45:10' },
    { uid: 5, status_val: 0, time: '2026-10-30 16:03:15' },

    { uid: 71, status_val: 0, time: '2026-10-30 07:56:30' },
    { uid: 71, status_val: 0, time: '2026-10-30 11:30:50' },
    { uid: 71, status_val: 0, time: '2026-10-30 12:50:11' },
    { uid: 71, status_val: 0, time: '2026-10-30 16:05:44' },

    // 2026-10-31 logs (matching Screenshot 3)
    { uid: 1, status_val: 0, time: '2026-10-31 07:52:08' },
    { uid: 1, status_val: 0, time: '2026-10-31 12:00:39' },
    { uid: 1, status_val: 0, time: '2026-10-31 12:43:38' },

    { uid: 2, status_val: 0, time: '2026-10-31 07:59:09' },
    { uid: 2, status_val: 0, time: '2026-10-31 12:00:47' },
    { uid: 2, status_val: 0, time: '2026-10-31 12:57:50' },

    // 2026-10-20 to 2026-10-23 logs for IWAN (matching Screenshot 4)
    { uid: 1, status_val: 0, time: '2026-10-20 08:52:21' },
    { uid: 1, status_val: 0, time: '2026-10-20 12:01:24' },
    { uid: 1, status_val: 0, time: '2026-10-20 12:45:59' },
    { uid: 1, status_val: 0, time: '2026-10-20 16:01:52' },

    { uid: 1, status_val: 0, time: '2026-10-22 07:45:17' },
    { uid: 1, status_val: 0, time: '2026-10-22 12:02:08' },
    { uid: 1, status_val: 0, time: '2026-10-22 12:44:28' },
    { uid: 1, status_val: 0, time: '2026-10-22 16:01:21' },

    { uid: 1, status_val: 0, time: '2026-10-23 07:51:41' },
    { uid: 1, status_val: 0, time: '2026-10-23 11:31:08' },
    { uid: 1, status_val: 0, time: '2026-10-23 12:38:58' },
    { uid: 1, status_val: 0, time: '2026-10-23 16:01:39' },

    // Unmapped records for testing error / unmapped handling (e.g. unknown UID 9999)
    { uid: 9999, status_val: 0, time: '2026-11-01 08:00:00' }
  ]

  async fetchUsersToday(): Promise<RawFingerprintRecord[]> {
    if (!this.simulateDeviceAvailable) {
      throw new Error('Gagal terhubung ke mesin fingerprint. Periksa koneksi jaringan mesin.')
    }
    // Return logs with today's date or simulated today (2026-11-01)
    const today = new Date().toISOString().slice(0, 10)
    const matches = this.rawRecords.filter(
      (r) => r.time.startsWith(today) || r.time.startsWith('2026-11-01')
    )
    return matches
  }

  async fetchUsersByDate(dateStr: string): Promise<RawFingerprintRecord[]> {
    if (!this.simulateDeviceAvailable) {
      throw new Error('Gagal terhubung ke mesin fingerprint. Periksa koneksi jaringan mesin.')
    }
    return this.rawRecords.filter((r) => r.time.startsWith(dateStr))
  }

  async fetchUsersYesterday(): Promise<RawFingerprintRecord[]> {
    if (!this.simulateDeviceAvailable) {
      throw new Error('Gagal terhubung ke mesin fingerprint. Periksa koneksi jaringan mesin.')
    }
    // Legacy: date == -1 day || -2 day || -3 day
    // Returns records from 3 days back
    return this.rawRecords.filter((r) => {
      const d = r.time.slice(0, 10)
      return d === '2026-10-31' || d === '2026-10-30' || d === '2026-10-29'
    })
  }

  /**
   * Helper to seed new raw mock records dynamically
   */
  addRawRecord(record: RawFingerprintRecord): void {
    this.rawRecords.push(record)
  }
}

export const fingerprintSourceService = new MockFingerprintSourceService()
