<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  MENU_REGISTRY
} from '../utils/permission-registry'
import type {
  SubmenuPermissionFlag,
  MenuCategoryDefinition
} from '../types/group.types'
import {
  Search,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-vue-next'

const props = defineProps<{
  modelValue: Record<string, SubmenuPermissionFlag>
  readOnly?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, SubmenuPermissionFlag>): void
}>()

const searchQuery = ref('')
const expandedCategories = ref<Record<string | number, boolean>>({
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
  expandedCategories.value[categoryId] = !expandedCategories.value[categoryId]
}

function expandAll() {
  for (const cat of MENU_REGISTRY) {
    expandedCategories.value[cat.id] = true
  }
}

function collapseAll() {
  for (const cat of MENU_REGISTRY) {
    expandedCategories.value[cat.id] = false
  }
}

// Filter categories based on search query without mutating state
const filteredCategories = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return MENU_REGISTRY

  return MENU_REGISTRY.map((cat) => {
    const matchingSubs = cat.submenus.filter(
      (sub) =>
        sub.name.toLowerCase().includes(query) ||
        (sub.alias && sub.alias.toLowerCase().includes(query)) ||
        cat.name.toLowerCase().includes(query)
    )
    return {
      ...cat,
      submenus: matchingSubs
    }
  }).filter((cat) => cat.submenus.length > 0)
})

// Deep clone model value for safe updates
function updateFlag(
  submenuId: number | string,
  action: 'c' | 'r' | 'u' | 'd',
  val: boolean
) {
  if (props.readOnly) return
  const idStr = String(submenuId)
  const current = { ...props.modelValue }
  const existing = current[idStr] || { c: false, r: false, u: false, d: false }
  current[idStr] = {
    ...existing,
    [action]: val
  }
  emit('update:modelValue', current)
}

// Category-level Select All
function getCategorySelectionState(cat: MenuCategoryDefinition) {
  let totalAllowed = 0
  let totalChecked = 0

  for (const sub of cat.submenus) {
    const p = props.modelValue[String(sub.id)] || { c: false, r: false, u: false, d: false }
    if (sub.allowedActions.c) {
      totalAllowed++
      if (p.c) totalChecked++
    }
    if (sub.allowedActions.r) {
      totalAllowed++
      if (p.r) totalChecked++
    }
    if (sub.allowedActions.u) {
      totalAllowed++
      if (p.u) totalChecked++
    }
    if (sub.allowedActions.d) {
      totalAllowed++
      if (p.d) totalChecked++
    }
  }

  return {
    isAll: totalAllowed > 0 && totalChecked === totalAllowed,
    isIndeterminate: totalChecked > 0 && totalChecked < totalAllowed,
    totalChecked,
    totalAllowed
  }
}

function toggleCategoryAll(cat: MenuCategoryDefinition) {
  if (props.readOnly) return
  const state = getCategorySelectionState(cat)
  const shouldCheck = !state.isAll

  const current = { ...props.modelValue }
  for (const sub of cat.submenus) {
    const idStr = String(sub.id)
    const existing = current[idStr] || { c: false, r: false, u: false, d: false }
    current[idStr] = {
      c: sub.allowedActions.c ? shouldCheck : existing.c,
      r: sub.allowedActions.r ? shouldCheck : existing.r,
      u: sub.allowedActions.u ? shouldCheck : existing.u,
      d: sub.allowedActions.d ? shouldCheck : existing.d
    }
  }
  emit('update:modelValue', current)
}

// Column-level Select All within a category
function getColumnSelectionState(cat: MenuCategoryDefinition, action: 'c' | 'r' | 'u' | 'd') {
  let totalAllowed = 0
  let totalChecked = 0

  for (const sub of cat.submenus) {
    if (sub.allowedActions[action]) {
      totalAllowed++
      const p = props.modelValue[String(sub.id)]
      if (p && p[action]) totalChecked++
    }
  }

  return {
    isAll: totalAllowed > 0 && totalChecked === totalAllowed,
    isIndeterminate: totalChecked > 0 && totalChecked < totalAllowed,
    totalChecked,
    totalAllowed
  }
}

function toggleColumnAll(cat: MenuCategoryDefinition, action: 'c' | 'r' | 'u' | 'd') {
  if (props.readOnly) return
  const state = getColumnSelectionState(cat, action)
  const shouldCheck = !state.isAll

  const current = { ...props.modelValue }
  for (const sub of cat.submenus) {
    if (sub.allowedActions[action]) {
      const idStr = String(sub.id)
      const existing = current[idStr] || { c: false, r: false, u: false, d: false }
      current[idStr] = {
        ...existing,
        [action]: shouldCheck
      }
    }
  }
  emit('update:modelValue', current)
}

// Global toggle all
function toggleGlobalAll(select: boolean) {
  if (props.readOnly) return
  const current = { ...props.modelValue }
  for (const cat of MENU_REGISTRY) {
    for (const sub of cat.submenus) {
      current[String(sub.id)] = {
        c: select ? sub.allowedActions.c : false,
        r: select ? sub.allowedActions.r : false,
        u: select ? sub.allowedActions.u : false,
        d: select ? sub.allowedActions.d : false
      }
    }
  }
  emit('update:modelValue', current)
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header with Legacy Explanatory Alert -->
    <div class="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs">
      <div class="flex items-center gap-2 mb-2 font-bold text-sm">
        <Info class="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
        <span>Keterangan Kolom Hak Akses (Role Access) :</span>
      </div>
      <ul class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-6 list-disc">
        <li><strong>C (CREATE):</strong> User diperbolehkan untuk menambah / membuat data.</li>
        <li><strong>R (READ):</strong> User diperbolehkan untuk melihat dan mencetak (print/export) data.</li>
        <li><strong>U (UPDATE):</strong> User diperbolehkan untuk mengubah / memperbarui data.</li>
        <li><strong>D (DELETE):</strong> User diperbolehkan untuk menghapus / menonaktifkan data.</li>
      </ul>
    </div>

    <!-- Toolbar: Search & Expand/Collapse -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <!-- Search Input -->
      <div class="relative w-full sm:w-72">
        <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari submenu / hak akses..."
          class="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
      </div>

      <!-- Quick actions -->
      <div class="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          class="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
          @click="expandAll"
        >
          Expand All
        </button>
        <button
          type="button"
          class="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
          @click="collapseAll"
        >
          Collapse All
        </button>
        <template v-if="!readOnly">
          <button
            type="button"
            class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-100/80 cursor-pointer"
            @click="toggleGlobalAll(true)"
          >
            Pilih Semua Akses
          </button>
          <button
            type="button"
            class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100/80 cursor-pointer"
            @click="toggleGlobalAll(false)"
          >
            Batalkan Semua
          </button>
        </template>
      </div>
    </div>

    <!-- Category Accordions -->
    <div class="space-y-3">
      <div
        v-for="cat in filteredCategories"
        :key="cat.id"
        class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs transition-all"
      >
        <!-- Accordion Header -->
        <div
          class="px-4 py-3 bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3 cursor-pointer select-none"
          @click="toggleCategory(cat.id)"
        >
          <div class="flex items-center gap-3 min-w-0">
            <!-- Select All Category Checkbox -->
            <input
              type="checkbox"
              :checked="getCategorySelectionState(cat).isAll"
              :indeterminate="getCategorySelectionState(cat).isIndeterminate"
              :disabled="readOnly"
              class="rounded border-slate-300 text-teal-600 focus:ring-teal-500 disabled:opacity-50 cursor-pointer"
              :aria-label="`Pilih semua akses ${cat.name}`"
              @click.stop
              @change="toggleCategoryAll(cat)"
            />
            <h4 class="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
              {{ cat.name }}
            </h4>
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
              {{ getCategorySelectionState(cat).totalChecked }} / {{ getCategorySelectionState(cat).totalAllowed }} dipilih
            </span>
          </div>

          <div class="flex items-center gap-2">
            <component
              :is="expandedCategories[cat.id] ? ChevronUp : ChevronDown"
              class="w-4 h-4 text-slate-500 dark:text-slate-400"
            />
          </div>
        </div>

        <!-- Accordion Content: Submenu Table -->
        <div v-show="expandedCategories[cat.id]" class="overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead class="bg-slate-100/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th class="px-4 py-2.5">Submenu</th>
                <th class="w-16 px-2 py-2.5 text-center">C</th>
                <th class="w-16 px-2 py-2.5 text-center">R</th>
                <th class="w-16 px-2 py-2.5 text-center">U</th>
                <th class="w-16 px-2 py-2.5 text-center">D</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr
                v-for="sub in cat.submenus"
                :key="sub.id"
                class="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
              >
                <!-- Submenu Title -->
                <td class="px-4 py-2.5">
                  <div class="font-medium text-slate-900 dark:text-white">
                    {{ sub.name }}
                  </div>
                  <div class="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    {{ sub.resource }}
                  </div>
                </td>

                <!-- C: Create -->
                <td class="px-2 py-2.5 text-center">
                  <input
                    v-if="sub.allowedActions.c"
                    type="checkbox"
                    :checked="modelValue[String(sub.id)]?.c || false"
                    :disabled="readOnly"
                    class="rounded border-slate-300 text-teal-600 focus:ring-teal-500 disabled:opacity-50 cursor-pointer"
                    :aria-label="`Create ${sub.name}`"
                    @change="(e) => updateFlag(sub.id, 'c', (e.target as HTMLInputElement).checked)"
                  />
                  <span v-else class="text-slate-300 dark:text-slate-600">-</span>
                </td>

                <!-- R: Read -->
                <td class="px-2 py-2.5 text-center">
                  <input
                    v-if="sub.allowedActions.r"
                    type="checkbox"
                    :checked="modelValue[String(sub.id)]?.r || false"
                    :disabled="readOnly"
                    class="rounded border-slate-300 text-teal-600 focus:ring-teal-500 disabled:opacity-50 cursor-pointer"
                    :aria-label="`Read ${sub.name}`"
                    @change="(e) => updateFlag(sub.id, 'r', (e.target as HTMLInputElement).checked)"
                  />
                  <span v-else class="text-slate-300 dark:text-slate-600">-</span>
                </td>

                <!-- U: Update -->
                <td class="px-2 py-2.5 text-center">
                  <input
                    v-if="sub.allowedActions.u"
                    type="checkbox"
                    :checked="modelValue[String(sub.id)]?.u || false"
                    :disabled="readOnly"
                    class="rounded border-slate-300 text-teal-600 focus:ring-teal-500 disabled:opacity-50 cursor-pointer"
                    :aria-label="`Update ${sub.name}`"
                    @change="(e) => updateFlag(sub.id, 'u', (e.target as HTMLInputElement).checked)"
                  />
                  <span v-else class="text-slate-300 dark:text-slate-600">-</span>
                </td>

                <!-- D: Delete -->
                <td class="px-2 py-2.5 text-center">
                  <input
                    v-if="sub.allowedActions.d"
                    type="checkbox"
                    :checked="modelValue[String(sub.id)]?.d || false"
                    :disabled="readOnly"
                    class="rounded border-slate-300 text-teal-600 focus:ring-teal-500 disabled:opacity-50 cursor-pointer"
                    :aria-label="`Delete ${sub.name}`"
                    @change="(e) => updateFlag(sub.id, 'd', (e.target as HTMLInputElement).checked)"
                  />
                  <span v-else class="text-slate-300 dark:text-slate-600">-</span>
                </td>
              </tr>
            </tbody>

            <!-- Column Select All Footer matching legacy index.php -->
            <tfoot class="bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 font-bold">
              <tr>
                <td class="px-4 py-2 text-right text-slate-700 dark:text-slate-300">
                  Select All :
                </td>
                <td class="px-2 py-2 text-center">
                  <input
                    type="checkbox"
                    :checked="getColumnSelectionState(cat, 'c').isAll"
                    :indeterminate="getColumnSelectionState(cat, 'c').isIndeterminate"
                    :disabled="readOnly || getColumnSelectionState(cat, 'c').totalAllowed === 0"
                    class="rounded border-slate-300 text-teal-600 focus:ring-teal-500 disabled:opacity-50 cursor-pointer"
                    :aria-label="`Select all C in ${cat.name}`"
                    @change="toggleColumnAll(cat, 'c')"
                  />
                </td>
                <td class="px-2 py-2 text-center">
                  <input
                    type="checkbox"
                    :checked="getColumnSelectionState(cat, 'r').isAll"
                    :indeterminate="getColumnSelectionState(cat, 'r').isIndeterminate"
                    :disabled="readOnly || getColumnSelectionState(cat, 'r').totalAllowed === 0"
                    class="rounded border-slate-300 text-teal-600 focus:ring-teal-500 disabled:opacity-50 cursor-pointer"
                    :aria-label="`Select all R in ${cat.name}`"
                    @change="toggleColumnAll(cat, 'r')"
                  />
                </td>
                <td class="px-2 py-2 text-center">
                  <input
                    type="checkbox"
                    :checked="getColumnSelectionState(cat, 'u').isAll"
                    :indeterminate="getColumnSelectionState(cat, 'u').isIndeterminate"
                    :disabled="readOnly || getColumnSelectionState(cat, 'u').totalAllowed === 0"
                    class="rounded border-slate-300 text-teal-600 focus:ring-teal-500 disabled:opacity-50 cursor-pointer"
                    :aria-label="`Select all U in ${cat.name}`"
                    @change="toggleColumnAll(cat, 'u')"
                  />
                </td>
                <td class="px-2 py-2 text-center">
                  <input
                    type="checkbox"
                    :checked="getColumnSelectionState(cat, 'd').isAll"
                    :indeterminate="getColumnSelectionState(cat, 'd').isIndeterminate"
                    :disabled="readOnly || getColumnSelectionState(cat, 'd').totalAllowed === 0"
                    class="rounded border-slate-300 text-teal-600 focus:ring-teal-500 disabled:opacity-50 cursor-pointer"
                    :aria-label="`Select all D in ${cat.name}`"
                    @change="toggleColumnAll(cat, 'd')"
                  />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
