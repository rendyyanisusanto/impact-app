<script setup lang="ts">
import { ref } from 'vue'
import { X, Printer, Download } from 'lucide-vue-next'

defineProps<{
  show: boolean
  printUrl: string
  title?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'export-pdf'): void
}>()

const iframeRef = ref<HTMLIFrameElement | null>(null)

function handlePrint() {
  if (iframeRef.value?.contentWindow) {
    iframeRef.value.contentWindow.print()
  }
}
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs"
  >
    <div
      class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
        <div>
          <h3 class="text-base font-bold text-slate-800">
            {{ title || 'Preview Cetak Laporan Per Customer' }}
          </h3>
          <p class="text-xs text-slate-500">
            Tata letak dokumen resmi siap cetak (A4 Landscape)
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            @click="emit('export-pdf')"
          >
            <Download class="w-3.5 h-3.5 text-slate-500" />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition"
            @click="handlePrint"
          >
            <Printer class="w-4 h-4" />
            <span>Cetak Sekarang</span>
          </button>

          <button
            type="button"
            class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition ml-2"
            @click="emit('close')"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Iframe Preview -->
      <div class="flex-1 bg-slate-200/50 p-2 sm:p-4 overflow-hidden relative">
        <iframe
          ref="iframeRef"
          :src="printUrl"
          class="w-full h-full rounded-xl bg-white shadow-sm border border-slate-200"
        ></iframe>
      </div>
    </div>
  </div>
</template>
