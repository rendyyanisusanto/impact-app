<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { X, Printer, Loader2 } from 'lucide-vue-next'
import { salesProductReportService } from '../services/sales-product-report.service'
import type { ProductReportFilterParams } from '../types/sales-product-report.types'
import { useToast } from '@/shared/composables/useToast'

const props = defineProps<{
  show: boolean
  filters: ProductReportFilterParams
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const toast = useToast()
const loading = ref(true)
const printHtml = ref<string>('')
const iframeRef = ref<HTMLIFrameElement | null>(null)

async function loadPrintContent() {
  loading.value = true
  try {
    const url = salesProductReportService.getPrintUrl(props.filters)
    const token = localStorage.getItem('token') || ''
    const fullUrl = token ? `${url}&token=${encodeURIComponent(token)}` : url

    const res = await fetch(fullUrl, { credentials: 'include' })
    if (!res.ok) throw new Error('Gagal memuat template cetak')
    printHtml.value = await res.text()
  } catch (err) {
    toast.error('Gagal memuat pratinjau cetak')
    emit('close')
  } finally {
    loading.value = false
  }
}

function handlePrint() {
  if (iframeRef.value?.contentWindow) {
    iframeRef.value.contentWindow.focus()
    iframeRef.value.contentWindow.print()
  }
}

onMounted(() => {
  if (props.show) {
    loadPrintContent()
  }
})
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
  >
    <div
      class="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50/80">
        <div class="flex items-center gap-2">
          <Printer class="w-5 h-5 text-primary-600" />
          <h3 class="text-sm font-bold text-slate-800">
            Pratinjau Cetak Laporan Penjualan Per Produk
          </h3>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
            :disabled="loading"
            @click="handlePrint"
          >
            <Printer class="w-4 h-4" />
            Cetak Sekarang
          </button>

          <button
            type="button"
            class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition"
            @click="emit('close')"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Preview Area -->
      <div class="flex-1 bg-slate-100 p-4 relative overflow-hidden flex items-center justify-center">
        <div v-if="loading" class="flex flex-col items-center gap-2 text-slate-500">
          <Loader2 class="w-8 h-8 animate-spin text-primary-600" />
          <span class="text-xs font-medium">Menyiapkan Pratinjau Dokumen...</span>
        </div>

        <iframe
          v-show="!loading"
          ref="iframeRef"
          :srcdoc="printHtml"
          class="w-full h-full bg-white rounded-lg shadow-md border border-slate-200"
          title="Pratinjau Dokumen Cetak"
        />
      </div>

      <!-- Footer Info -->
      <div class="px-6 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <span>Gunakan orientasi Landscape saat mencetak untuk hasil terbaik (A4).</span>
        <button
          type="button"
          class="text-slate-600 hover:text-slate-800 font-medium"
          @click="emit('close')"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
</template>
