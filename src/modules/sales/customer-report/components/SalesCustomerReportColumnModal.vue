<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, RotateCcw } from 'lucide-vue-next'
import type { ReportColumnConfig } from '../types/sales-customer-report.types'

const props = defineProps<{
  show: boolean
  columns: ReportColumnConfig[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update', columns: ReportColumnConfig[]): void
  (e: 'reset'): void
}>()

const localColumns = ref<ReportColumnConfig[]>([])

watch(
  () => props.columns,
  (val) => {
    localColumns.value = JSON.parse(JSON.stringify(val))
  },
  { immediate: true, deep: true }
)

function toggleColumn(col: ReportColumnConfig) {
  if (col.key === 'no' || col.key === 'kode' || col.key === 'aksi') return
  col.visible = !col.visible
}

function handleSave() {
  emit('update', localColumns.value)
  emit('close')
}

function handleReset() {
  emit('reset')
  emit('close')
}
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
  >
    <div
      class="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
        <div>
          <h3 class="text-sm font-bold text-slate-800">
            Atur Tampilan Kolom
          </h3>
          <p class="text-xs text-slate-500">
            Pilih kolom yang ingin ditampilkan pada tabel laporan
          </p>
        </div>
        <button
          type="button"
          class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          @click="emit('close')"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-5 max-h-[60vh] overflow-y-auto space-y-2">
        <label
          v-for="col in localColumns"
          :key="col.key"
          class="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition select-none"
          :class="{
            'opacity-60 cursor-not-allowed': col.key === 'no' || col.key === 'kode' || col.key === 'aksi'
          }"
        >
          <input
            type="checkbox"
            :checked="col.visible"
            :disabled="col.key === 'no' || col.key === 'kode' || col.key === 'aksi'"
            class="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
            @change="toggleColumn(col)"
          />
          <span class="text-xs font-medium text-slate-700">{{ col.label }}</span>
          <span
            v-if="col.key === 'no' || col.key === 'kode' || col.key === 'aksi'"
            class="text-[10px] text-slate-400 ml-auto"
          >
            Wajib
          </span>
        </label>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
          @click="handleReset"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          <span>Reset Default</span>
        </button>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
            @click="emit('close')"
          >
            Batal
          </button>
          <button
            type="button"
            class="px-3.5 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition"
            @click="handleSave"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
