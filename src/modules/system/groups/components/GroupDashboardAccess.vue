<script setup lang="ts">
import { computed } from 'vue'
import { DASHBOARD_WIDGETS } from '../utils/permission-registry'
import { LayoutDashboard } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: (number | string)[]
  readOnly?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: (number | string)[]): void
}>()

const selectedSet = computed(() => new Set(props.modelValue.map(String)))

const isAllSelected = computed(() => {
  return DASHBOARD_WIDGETS.every((w) => selectedSet.value.has(String(w.id)))
})

const isIndeterminate = computed(() => {
  const count = DASHBOARD_WIDGETS.filter((w) => selectedSet.value.has(String(w.id))).length
  return count > 0 && count < DASHBOARD_WIDGETS.length
})

function toggleAll() {
  if (props.readOnly) return
  if (isAllSelected.value) {
    emit('update:modelValue', [])
  } else {
    emit(
      'update:modelValue',
      DASHBOARD_WIDGETS.map((w) => w.id)
    )
  }
}

function toggleItem(id: number | string) {
  if (props.readOnly) return
  const idStr = String(id)
  const current = [...props.modelValue]
  const idx = current.findIndex((item) => String(item) === idStr)
  if (idx !== -1) {
    current.splice(idx, 1)
  } else {
    current.push(id)
  }
  emit('update:modelValue', current)
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <LayoutDashboard class="w-4 h-4 text-teal-600 dark:text-teal-400" />
        <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Dashboard / Grafik Access :
        </h3>
      </div>
      <button
        v-if="!readOnly"
        type="button"
        class="text-xs text-teal-600 hover:text-teal-800 dark:text-teal-400 font-semibold cursor-pointer"
        @click="toggleAll"
      >
        {{ isAllSelected ? 'Batalkan Semua' : 'Pilih Semua Widget' }}
      </button>
    </div>

    <!-- Legacy style striped framed table modernised -->
    <div class="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
      <table class="w-full text-xs text-left">
        <thead class="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
          <tr>
            <th class="w-12 px-4 py-3 text-center">
              <input
                type="checkbox"
                :checked="isAllSelected"
                :indeterminate="isIndeterminate"
                :disabled="readOnly"
                class="rounded border-slate-300 text-teal-600 focus:ring-teal-500 disabled:opacity-50 cursor-pointer"
                aria-label="Pilih semua widget dashboard"
                @change="toggleAll"
              />
            </th>
            <th class="px-4 py-3 w-56">Nama</th>
            <th class="px-4 py-3">Keterangan</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
          <tr
            v-for="widget in DASHBOARD_WIDGETS"
            :key="widget.id"
            :class="[
              'transition-colors',
              selectedSet.has(String(widget.id))
                ? 'bg-teal-50/40 dark:bg-teal-950/20'
                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
            ]"
          >
            <td class="px-4 py-2.5 text-center">
              <input
                type="checkbox"
                :checked="selectedSet.has(String(widget.id))"
                :disabled="readOnly"
                class="rounded border-slate-300 text-teal-600 focus:ring-teal-500 disabled:opacity-50 cursor-pointer"
                :aria-label="`Pilih widget ${widget.name}`"
                @change="toggleItem(widget.id)"
              />
            </td>
            <td class="px-4 py-2.5 font-semibold text-slate-900 dark:text-white">
              {{ widget.name }}
            </td>
            <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">
              {{ widget.keterangan }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

