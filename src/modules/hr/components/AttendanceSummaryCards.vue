<script setup lang="ts">
import type { AttendanceSummaryMetrics } from '../types/attendance.types'
import { Users, UserCheck, UserX, AlertCircle } from 'lucide-vue-next'

defineProps<{
  metrics: AttendanceSummaryMetrics
}>()
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <!-- Card 1: Total Karyawan -->
    <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-xs flex items-center justify-between">
      <div>
        <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Total Karyawan
        </p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
          {{ metrics.totalEmployees }}
        </p>
      </div>
      <div class="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
        <Users class="w-5 h-5" />
      </div>
    </div>

    <!-- Card 2: Sudah Check-In -->
    <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-xs flex items-center justify-between">
      <div>
        <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Sudah Presensi (In)
        </p>
        <p class="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">
          {{ metrics.checkedInCount }}
        </p>
      </div>
      <div class="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
        <UserCheck class="w-5 h-5" />
      </div>
    </div>

    <!-- Card 3: Belum Presensi -->
    <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-xs flex items-center justify-between">
      <div>
        <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Belum Presensi
        </p>
        <p class="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
          {{ metrics.notCheckedInCount }}
        </p>
      </div>
      <div class="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
        <UserX class="w-5 h-5" />
      </div>
    </div>

    <!-- Card 4: Terlambat / Exception (LI) -->
    <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-xs flex items-center justify-between">
      <div>
        <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Terlambat (LI)
        </p>
        <p class="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
          {{ metrics.statusCounts.LI || 0 }}
        </p>
      </div>
      <div class="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center">
        <AlertCircle class="w-5 h-5" />
      </div>
    </div>
  </div>
</template>

