<script setup lang="ts">
import type { GroupPermissionSummary } from '../types/group.types'
import {
  Layers,
  Eye,
  PlusCircle,
  Edit,
  Trash2,
  LayoutDashboard
} from 'lucide-vue-next'

defineProps<{
  summary: GroupPermissionSummary
}>()
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
    <!-- Active Categories -->
    <div class="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
      <div class="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
        <Layers class="w-5 h-5" />
      </div>
      <div class="min-w-0">
        <p class="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">Kategori Aktif</p>
        <p class="text-base font-bold text-slate-900 dark:text-white">
          {{ summary.activeCategoriesCount }} <span class="text-xs font-normal text-slate-400">/ {{ summary.totalCategoriesCount }}</span>
        </p>
      </div>
    </div>

    <!-- Submenus with Read -->
    <div class="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
      <div class="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
        <Eye class="w-5 h-5" />
      </div>
      <div class="min-w-0">
        <p class="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">Akses Read (R)</p>
        <p class="text-base font-bold text-slate-900 dark:text-white">
          {{ summary.submenusWithReadCount }} <span class="text-xs font-normal text-slate-400">/ {{ summary.totalSubmenusCount }}</span>
        </p>
      </div>
    </div>

    <!-- Create (C) -->
    <div class="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
      <div class="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
        <PlusCircle class="w-5 h-5" />
      </div>
      <div class="min-w-0">
        <p class="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">Create (C)</p>
        <p class="text-base font-bold text-emerald-600 dark:text-emerald-400">
          {{ summary.createCount }}
        </p>
      </div>
    </div>

    <!-- Update (U) -->
    <div class="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
      <div class="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
        <Edit class="w-5 h-5" />
      </div>
      <div class="min-w-0">
        <p class="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">Update (U)</p>
        <p class="text-base font-bold text-amber-600 dark:text-amber-400">
          {{ summary.updateCount }}
        </p>
      </div>
    </div>

    <!-- Delete (D) -->
    <div class="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
      <div class="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
        <Trash2 class="w-5 h-5" />
      </div>
      <div class="min-w-0">
        <p class="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">Delete (D)</p>
        <p class="text-base font-bold text-red-600 dark:text-red-400">
          {{ summary.deleteCount }}
        </p>
      </div>
    </div>

    <!-- Dashboard Widgets -->
    <div class="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
      <div class="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
        <LayoutDashboard class="w-5 h-5" />
      </div>
      <div class="min-w-0">
        <p class="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">Widget Dashboard</p>
        <p class="text-base font-bold text-purple-600 dark:text-purple-400">
          {{ summary.dashboardWidgetsCount }} <span class="text-xs font-normal text-slate-400">/ 3</span>
        </p>
      </div>
    </div>
  </div>
</template>

