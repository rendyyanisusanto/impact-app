<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, Check, RotateCcw } from 'lucide-vue-next'
import type { ReportColumnConfig } from '../types/purchase-report.types'

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
  col.visible = !col.visible
}

function selectAll(val: boolean) {
  localColumns.value.forEach(c => {
    c.visible = val
  })
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
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
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
          <p class="text-xs text-slate-500 mt-0.5">
            Pilih kolom yang ingin ditampilkan pada tabel laporan
          </p>
        </div>
        <button
          type="button"
          class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
          @click="emit('close')"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Quick Toggle Buttons -->
      <div class="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <span class="text-xs text-slate-500 font-medium">Pilihan Cepat:</span>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="text-xs text-teal-600 hover:text-teal-700 font-semibold"
            @click="selectAll(true)"
          >
            Pilih Semua
          </button>
          <span class="text-slate-300">|</span>
          <button
            type="button"
            class="text-xs text-slate-500 hover:text-slate-700 font-medium"
            @click="selectAll(false)"
          >
            Hapus Semua
          </button>
        </div>
      </div>

      <!-- Columns List -->
      <div class="p-5 max-h-72 overflow-y-auto space-y-2">
        <div
          v-for="col in localColumns"
          :key="col.key"
          class="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50/80 cursor-pointer transition select-none"
          @click="toggleColumn(col)"
        >
          <span class="text-xs font-medium text-slate-700">
            {{ col.label }}
          </span>
          <div
            class="w-4 h-4 rounded border flex items-center justify-center transition-colors"
            :class="col.visible ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 bg-white'"
          >
            <Check v-if="col.visible" class="w-3 h-3 stroke-[3]" />
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1.5 rounded transition"
          @click="handleReset"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          Kembalikan Default
        </button>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-lg transition"
            @click="emit('close')"
          >
            Batal
          </button>
          <button
            type="button"
            class="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition"
            @click="handleSave"
          >
            Simpan Kolom
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
