<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  ChevronDown,
  ChevronRight,
  Shield,
  Search,
  ExternalLink,
  Check,
  X,
  LayoutDashboard,
  CheckCircle2,
  XCircle
} from 'lucide-vue-next'
import AppCard from '@/shared/components/ui/AppCard.vue'
import AppBadge from '@/shared/components/ui/AppBadge.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import { MENU_REGISTRY, DASHBOARD_WIDGETS } from '@/modules/system/groups/utils/permission-registry'
import type { SubmenuPermissionFlag } from '@/modules/system/groups/types/group.types'

interface Props {
  groupId?: number | null
  groupName?: string
  groupDescription?: string
  permissions: Record<string, SubmenuPermissionFlag>
  dashboardWidgets?: (string | number)[]
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  groupId: null,
  groupName: 'Belum Memilih Group',
  groupDescription: 'Pilih Groups/Role pada Informasi Akun untuk melihat hak akses efektif.',
  permissions: () => ({}),
  dashboardWidgets: () => [],
  isLoading: false
})

// Search query for submenus
const searchQuery = ref('')

// Open/close states for accordions (keyed by category ID string/number)
const openCategories = ref<Record<string | number, boolean>>({
  1: true,
  2: true,
  3: true,
  4: true,
  5: true,
  6: true,
  7: true,
  8: true,
  9: true,
  10: true
})

function toggleCategory(categoryId: string | number) {
  openCategories.value[categoryId] = !openCategories.value[categoryId]
}

function expandAll() {
  for (const cat of MENU_REGISTRY) {
    openCategories.value[cat.id] = true
  }
}

function collapseAll() {
  for (const cat of MENU_REGISTRY) {
    openCategories.value[cat.id] = false
  }
}

// Filtered categories and submenus
const filteredCategories = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return MENU_REGISTRY

  return MENU_REGISTRY.map(cat => {
    const matchingSubmenus = cat.submenus.filter(
      s => s.name.toLowerCase().includes(q) || cat.name.toLowerCase().includes(q)
    )
    return {
      ...cat,
      submenus: matchingSubmenus
    }
  }).filter(cat => cat.submenus.length > 0)
})

// Summary metrics
const summaryMetrics = computed(() => {
  let createCount = 0
  let readCount = 0
  let updateCount = 0
  let deleteCount = 0
  let totalSubmenus = 0

  for (const cat of MENU_REGISTRY) {
    for (const sub of cat.submenus) {
      totalSubmenus++
      const p = props.permissions[String(sub.id)]
      if (p?.c) createCount++
      if (p?.r) readCount++
      if (p?.u) updateCount++
      if (p?.d) deleteCount++
    }
  }

  return {
    totalMenus: totalSubmenus || 34,
    createCount,
    readCount,
    updateCount,
    deleteCount,
    dashboardCount: props.dashboardWidgets.length
  }
})

function isWidgetActive(widgetId: number | string): boolean {
  return props.dashboardWidgets.some(w => String(w) === String(widgetId))
}

// Auto expand all when searching
watch(searchQuery, (newVal) => {
  if (newVal.trim().length > 0) {
    expandAll()
  }
})
</script>

<template>
  <AppCard class="border border-slate-200 shadow-sm overflow-hidden">
    <!-- Header -->
    <template #header>
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-slate-50 border-b border-slate-200">
        <div class="flex items-center gap-2.5">
          <div class="p-2 bg-teal-50 text-teal-700 rounded-lg border border-teal-200">
            <Shield class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-base font-semibold text-slate-800">Preview Role Access (Hak Akses)</h3>
              <AppBadge v-if="props.groupName" variant="info" class="font-mono text-xs font-bold uppercase">
                {{ props.groupName }}
              </AppBadge>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">
              {{ props.groupDescription }}
            </p>
          </div>
        </div>

        <div v-if="props.groupId" class="flex items-center gap-2">
          <router-link
            :to="`/system/groups/${props.groupId}`"
            target="_blank"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-white border border-teal-300 rounded-lg hover:bg-teal-50 transition-colors"
          >
            <ExternalLink class="w-3.5 h-3.5" />
            Detail Master Group
          </router-link>
        </div>
      </div>
    </template>

    <div class="p-5 space-y-6">
      <!-- Info notice -->
      <div class="flex items-start gap-3 p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-lg text-xs text-blue-800">
        <Shield class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div class="leading-relaxed">
          <span class="font-semibold">Catatan Otorisasi:</span> Pengguna ini mengikuti permission dari group
          <span class="font-semibold uppercase tracking-wide">"{{ props.groupName }}"</span>.
          Hak akses tidak dapat diubah per user secara ad-hoc, melainkan dikelola terpusat melalui
          <router-link to="/system/groups" class="font-semibold underline hover:text-blue-950">Master Data Groups (Role Access)</router-link>.
        </div>
      </div>

      <!-- KPI Metric Summary -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div class="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
          <div class="text-[11px] font-medium text-slate-500">Total Menu</div>
          <div class="text-xl font-bold text-slate-800 mt-0.5">{{ summaryMetrics.totalMenus }}</div>
          <div class="text-[10px] text-slate-400">Submenu ERP</div>
        </div>

        <div class="p-3 bg-white border border-emerald-200 rounded-lg shadow-2xs">
          <div class="text-[11px] font-medium text-emerald-700">Akses Buat (C)</div>
          <div class="text-xl font-bold text-emerald-600 mt-0.5">{{ summaryMetrics.createCount }}</div>
          <div class="text-[10px] text-emerald-600/70">Menu diizinkan</div>
        </div>

        <div class="p-3 bg-white border border-blue-200 rounded-lg shadow-2xs">
          <div class="text-[11px] font-medium text-blue-700">Akses Lihat (R)</div>
          <div class="text-xl font-bold text-blue-600 mt-0.5">{{ summaryMetrics.readCount }}</div>
          <div class="text-[10px] text-blue-600/70">Menu diizinkan</div>
        </div>

        <div class="p-3 bg-white border border-amber-200 rounded-lg shadow-2xs">
          <div class="text-[11px] font-medium text-amber-700">Akses Ubah (U)</div>
          <div class="text-xl font-bold text-amber-600 mt-0.5">{{ summaryMetrics.updateCount }}</div>
          <div class="text-[10px] text-amber-600/70">Menu diizinkan</div>
        </div>

        <div class="p-3 bg-white border border-rose-200 rounded-lg shadow-2xs">
          <div class="text-[11px] font-medium text-rose-700">Akses Hapus (D)</div>
          <div class="text-xl font-bold text-rose-600 mt-0.5">{{ summaryMetrics.deleteCount }}</div>
          <div class="text-[10px] text-rose-600/70">Menu diizinkan</div>
        </div>

        <div class="p-3 bg-white border border-teal-200 rounded-lg shadow-2xs">
          <div class="text-[11px] font-medium text-teal-700">Dashboard Widget</div>
          <div class="text-xl font-bold text-teal-600 mt-0.5">{{ summaryMetrics.dashboardCount }} / 3</div>
          <div class="text-[10px] text-teal-600/70">Widget aktif</div>
        </div>
      </div>

      <!-- Dashboard Widgets Access Cards -->
      <div class="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
        <div class="flex items-center gap-2 mb-3">
          <LayoutDashboard class="w-4 h-4 text-slate-600" />
          <h4 class="text-sm font-semibold text-slate-800">Akses Widget Dashboard</h4>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div
            v-for="widget in DASHBOARD_WIDGETS"
            :key="widget.id"
            class="p-3 bg-white border rounded-lg flex items-center justify-between"
            :class="isWidgetActive(widget.id) ? 'border-teal-300 ring-1 ring-teal-200' : 'border-slate-200 opacity-60'"
          >
            <div>
              <div class="text-xs font-semibold text-slate-800">{{ widget.name }}</div>
              <div class="text-[11px] text-slate-500 mt-0.5">{{ widget.keterangan }}</div>
            </div>
            <div>
              <span
                v-if="isWidgetActive(widget.id)"
                class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded"
              >
                <CheckCircle2 class="w-3 h-3 text-teal-600" /> Aktif
              </span>
              <span
                v-else
                class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-slate-400 bg-slate-50 border border-slate-200 rounded"
              >
                <XCircle class="w-3 h-3 text-slate-400" /> Tidak
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Search & Accordion Controls -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div class="relative w-full sm:w-72">
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari submenu atau modul..."
            class="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>

        <div class="flex items-center gap-2 self-end">
          <AppButton size="sm" variant="outline" @click="expandAll">
            Buka Semua
          </AppButton>
          <AppButton size="sm" variant="outline" @click="collapseAll">
            Tutup Semua
          </AppButton>
        </div>
      </div>

      <!-- Categories Accordion List -->
      <div class="space-y-3">
        <div
          v-for="cat in filteredCategories"
          :key="cat.id"
          class="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs"
        >
          <!-- Accordion Header -->
          <button
            type="button"
            class="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100/70 border-b border-slate-200 text-left transition-colors"
            @click="toggleCategory(cat.id)"
          >
            <div class="flex items-center gap-2.5">
              <component
                :is="openCategories[cat.id] ? ChevronDown : ChevronRight"
                class="w-4 h-4 text-slate-500 flex-shrink-0"
              />
              <span class="text-xs font-bold text-slate-800 uppercase tracking-wide">
                {{ cat.name }}
              </span>
              <span class="text-[11px] font-normal text-slate-400">
                ({{ cat.submenus.length }} menu)
              </span>
            </div>

            <!-- Mini Indicators -->
            <div class="text-[11px] text-slate-500 hidden sm:block">
              <span class="font-mono text-teal-700 font-semibold">
                {{ cat.submenus.filter(s => props.permissions[String(s.id)]?.r).length }}
              </span> / {{ cat.submenus.length }} diizinkan
            </div>
          </button>

          <!-- Accordion Body -->
          <div v-show="openCategories[cat.id]" class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="bg-slate-50/80 text-slate-600 border-b border-slate-200 text-[11px]">
                  <th class="py-2.5 px-4 text-left font-semibold">Submenu</th>
                  <th class="py-2.5 px-3 text-center font-semibold w-20">Buat (C)</th>
                  <th class="py-2.5 px-3 text-center font-semibold w-20">Lihat (R)</th>
                  <th class="py-2.5 px-3 text-center font-semibold w-20">Ubah (U)</th>
                  <th class="py-2.5 px-3 text-center font-semibold w-20">Hapus (D)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="sub in cat.submenus"
                  :key="sub.id"
                  class="hover:bg-slate-50/60 transition-colors"
                >
                  <td class="py-2.5 px-4 text-slate-800 font-medium">
                    {{ sub.name }}
                  </td>

                  <!-- C -->
                  <td class="py-2.5 px-3 text-center">
                    <span
                      v-if="!sub.allowedActions.c"
                      class="text-slate-300 font-mono text-sm"
                      title="Tidak didukung menu ini"
                    >-</span>
                    <span
                      v-else-if="props.permissions[String(sub.id)]?.c"
                      class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 font-bold"
                      title="Diizinkan"
                    >
                      <Check class="w-3.5 h-3.5 stroke-[2.5]" />
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-50 text-slate-400"
                      title="Ditolak"
                    >
                      <X class="w-3.5 h-3.5 stroke-[1.5]" />
                    </span>
                  </td>

                  <!-- R -->
                  <td class="py-2.5 px-3 text-center">
                    <span
                      v-if="!sub.allowedActions.r"
                      class="text-slate-300 font-mono text-sm"
                    >-</span>
                    <span
                      v-else-if="props.permissions[String(sub.id)]?.r"
                      class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 font-bold"
                      title="Diizinkan"
                    >
                      <Check class="w-3.5 h-3.5 stroke-[2.5]" />
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-50 text-slate-400"
                      title="Ditolak"
                    >
                      <X class="w-3.5 h-3.5 stroke-[1.5]" />
                    </span>
                  </td>

                  <!-- U -->
                  <td class="py-2.5 px-3 text-center">
                    <span
                      v-if="!sub.allowedActions.u"
                      class="text-slate-300 font-mono text-sm"
                      title="Tidak didukung menu ini"
                    >-</span>
                    <span
                      v-else-if="props.permissions[String(sub.id)]?.u"
                      class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 font-bold"
                      title="Diizinkan"
                    >
                      <Check class="w-3.5 h-3.5 stroke-[2.5]" />
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-50 text-slate-400"
                      title="Ditolak"
                    >
                      <X class="w-3.5 h-3.5 stroke-[1.5]" />
                    </span>
                  </td>

                  <!-- D -->
                  <td class="py-2.5 px-3 text-center">
                    <span
                      v-if="!sub.allowedActions.d"
                      class="text-slate-300 font-mono text-sm"
                      title="Tidak didukung menu ini"
                    >-</span>
                    <span
                      v-else-if="props.permissions[String(sub.id)]?.d"
                      class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 font-bold"
                      title="Diizinkan"
                    >
                      <Check class="w-3.5 h-3.5 stroke-[2.5]" />
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-50 text-slate-400"
                      title="Ditolak"
                    >
                      <X class="w-3.5 h-3.5 stroke-[1.5]" />
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </AppCard>
</template>