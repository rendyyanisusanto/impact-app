<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Clock,
  CalendarDays,
  CalendarRange,
  UserCheck,
  Calendar,
  Fingerprint,
  Radio,
  Sparkles
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import AttendanceTodayTab from '../components/AttendanceTodayTab.vue'
import AttendanceDailyReportTab from '../components/AttendanceDailyReportTab.vue'
import AttendanceDateRangeTab from '../components/AttendanceDateRangeTab.vue'
import AttendanceEmployeeRangeTab from '../components/AttendanceEmployeeRangeTab.vue'
import AttendanceEmployeeMonthlyTab from '../components/AttendanceEmployeeMonthlyTab.vue'
import AttendanceFingerprintTab from '../components/AttendanceFingerprintTab.vue'

type TabKey =
  | 'today'
  | 'daily-report'
  | 'date-range'
  | 'employee-range'
  | 'employee-monthly'
  | 'fingerprint'

interface TabDefinition {
  key: TabKey
  label: string
  icon: typeof Clock
  description: string
  isLive?: boolean
}

const authStore = useAuthStore()
const activeTab = ref<TabKey>('today')

const tabs: TabDefinition[] = [
  {
    key: 'today',
    label: 'Presensi Hari Ini',
    icon: Clock,
    description: 'Pemantauan absensi real-time hari ini dengan 4 KPI ringkasan, penarikan log mesin, dan impor data.',
    isLive: true
  },
  {
    key: 'daily-report',
    label: 'Laporan Presensi Harian',
    icon: CalendarDays,
    description: 'Laporan kehadiran seluruh karyawan pada tanggal spesifik lengkap dengan sinkronisasi harian.'
  },
  {
    key: 'date-range',
    label: 'Laporan Presensi Range Tanggal',
    icon: CalendarRange,
    description: 'Rekapitulasi presensi multi-hari lintas divisi dengan opsi pengurutan grup atau tanggal.'
  },
  {
    key: 'employee-range',
    label: 'Laporan Presensi Range Tanggal (Karyawan)',
    icon: UserCheck,
    description: 'Riwayat presensi komprehensif untuk satu karyawan spesifik dalam periode tanggal yang dipilih.'
  },
  {
    key: 'employee-monthly',
    label: 'Laporan Presensi Per Karyawan',
    icon: Calendar,
    description: 'Matriks kalender bulanan lengkap (tanggal 1 s/d akhir bulan) untuk satu karyawan dan status jadwal kerja.'
  },
  {
    key: 'fingerprint',
    label: 'Data Fingerprint',
    icon: Fingerprint,
    description: 'Pusat inspeksi log mentah mesin absensi fisik, verifikasi mapping karyawan, dan sinkronisasi.'
  }
]

const currentTabInfo = computed(() => tabs.find((t) => t.key === activeTab.value))
const userName = computed(() => authStore.user?.name || 'Rendy')
</script>

<template>
  <div class="space-y-6">
    <!-- Top Modern Header -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-all">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-700 text-white flex items-center justify-center shadow-md shadow-teal-500/25 ring-1 ring-teal-600/30 shrink-0">
            <Fingerprint class="w-6 h-6" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Presensi
              </h1>
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800">
                <Sparkles class="w-3 h-3" />
                HR Module
              </span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Welcome Back, <strong class="font-semibold text-slate-700 dark:text-slate-200">{{ userName }}</strong></span>
              <span class="text-slate-300 dark:text-slate-600">•</span>
              <span>Sistem Manajemen Presensi &amp; Fingerprint</span>
            </p>
          </div>
        </div>

        <!-- Live device status pill -->
        <div class="flex items-center gap-2 self-start sm:self-center">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300">
            <Radio class="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>Mesin Fingerprint Aktif</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Tab Navigation Container -->
    <div class="bg-slate-100/80 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
      <nav
        class="flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth"
        aria-label="Presensi Tabs"
      >
        <button
          v-for="t in tabs"
          :key="t.key"
          type="button"
          :class="[
            'group relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer focus:outline-none select-none',
            activeTab === t.key
              ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 font-semibold shadow-sm border border-slate-200/90 dark:border-slate-700/80 ring-1 ring-black/5'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-slate-800/40 border border-transparent'
          ]"
          @click="activeTab = t.key"
        >
          <!-- Pulsing dot for live tab without adding text -->
          <span
            v-if="t.isLive"
            class="w-2 h-2 rounded-full shrink-0 transition-transform duration-200"
            :class="activeTab === t.key ? 'bg-emerald-500 ring-2 ring-emerald-300 dark:ring-emerald-700' : 'bg-slate-400 group-hover:bg-emerald-500'"
          />
          <component
            :is="t.icon"
            class="w-4 h-4 shrink-0 transition-colors duration-200"
            :class="activeTab === t.key ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'"
          />
          <span>{{ t.label }}</span>
        </button>
      </nav>
    </div>

    <!-- Active Tab Context / Helper Strip -->
    <div
      v-if="currentTabInfo"
      class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-100/80 dark:border-teal-900/40 text-xs text-teal-900 dark:text-teal-200"
    >
      <component :is="currentTabInfo.icon" class="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
      <span class="font-medium">{{ currentTabInfo.description }}</span>
    </div>

    <!-- Active Tab Content with Smooth Transition -->
    <Transition name="tab-fade" mode="out-in">
      <div :key="activeTab" class="transition-opacity duration-200">
        <AttendanceTodayTab v-if="activeTab === 'today'" />
        <AttendanceDailyReportTab v-else-if="activeTab === 'daily-report'" />
        <AttendanceDateRangeTab v-else-if="activeTab === 'date-range'" />
        <AttendanceEmployeeRangeTab v-else-if="activeTab === 'employee-range'" />
        <AttendanceEmployeeMonthlyTab v-else-if="activeTab === 'employee-monthly'" />
        <AttendanceFingerprintTab v-else-if="activeTab === 'fingerprint'" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Utility to hide scrollbar but allow horizontal scroll */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Subtle tab switch transition */
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.tab-fade-enter-from {
  opacity: 0;
  transform: translateY(3px);
}

.tab-fade-leave-to {
  opacity: 0;
  transform: translateY(-3px);
}
</style>
