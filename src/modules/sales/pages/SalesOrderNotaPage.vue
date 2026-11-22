<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppSkeleton from '@/shared/components/ui/AppSkeleton.vue'
import SalesOrderNotaDocument from '../components/SalesOrderNotaDocument.vue'
import { salesOrderTransactionService } from '../services/sales-order-transaction.service'
import type { SalesOrderWithDetails, SalesOrderVariantKey } from '../types/sales-order.types'
import { getVariantConfig } from '../config/sales-order-variants'
import { useToast } from '@/shared/composables/useToast'
import { exportSalesOrderNotaPdf } from '../utils/sales-order-export'
import { ArrowLeft, Printer, FileDown, RotateCcw, Receipt } from 'lucide-vue-next'

const props = defineProps<{
  variant?: SalesOrderVariantKey
}>()

const router = useRouter()
const route = useRoute()
const toast = useToast()

const currentVariant = computed<SalesOrderVariantKey>(() => {
  if (props.variant) return props.variant
  const path = route.path
  if (path.includes('so-pola') || path.includes('/orders/pola')) return 'pola'
  if (path.includes('so-ks') || path.includes('/orders/ks')) return 'ks'
  return 'impact'
})

const cfg = computed(() => getVariantConfig(currentVariant.value))
const orderId = computed(() => Number(route.params.id))

const order = ref<SalesOrderWithDetails | null>(null)
const isLoading = ref(true)

async function loadData(): Promise<void> {
  isLoading.value = true
  try {
    const data = await salesOrderTransactionService.getById(orderId.value)
    if (!data) {
      toast.error('Sales Order tidak ditemukan.')
      router.push(cfg.value.routePrefix)
      return
    }

    if (data.variant !== currentVariant.value) {
      toast.error(
        `Sales order ini bertipe ${data.variant.toUpperCase()} dan tidak sesuai dengan menu ${cfg.value.shortLabel}.`
      )
      router.push(cfg.value.routePrefix)
      return
    }

    order.value = data
  } catch (error) {
    toast.error('Gagal memuat dokumen Nota Penjualan.')
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

async function handlePrint(): Promise<void> {
  if (!order.value) return
  try {
    const newCount = await salesOrderTransactionService.incrementPrintCount(order.value.id)
    order.value.count_print = newCount
    window.print()
  } catch (error) {
    console.error(error)
    window.print()
  }
}

async function handleResetCount(): Promise<void> {
  if (!order.value) return
  try {
    await salesOrderTransactionService.resetPrintCount(order.value.id)
    order.value.count_print = 0
    toast.success('Counter cetak nota berhasil di-reset menjadi 0.')
  } catch (error) {
    toast.error('Gagal me-reset counter cetak.')
    console.error(error)
  }
}

function handleExportPdf(): void {
  if (!order.value) return
  try {
    exportSalesOrderNotaPdf(order.value)
    toast.success('Dokumen Nota berhasil diekspor ke PDF.')
  } catch (error) {
    toast.error('Gagal mengekspor Nota ke PDF.')
    console.error(error)
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header with Breadcrumb & Print Controls -->
    <AppPageHeader
      :title="`Nota Penjualan - ${order?.kode || '...'}`"
      :subtitle="`Format resmi nota penjualan ${cfg.shortLabel} untuk pelanggan dan arsip internal.`"
      class="print:hidden"
    >
      <template #breadcrumb>
        <div class="flex items-center gap-2 text-xs text-slate-500">
          <router-link :to="cfg.routePrefix" class="hover:text-slate-800 transition-colors">
            Penjualan
          </router-link>
          <span>/</span>
          <router-link :to="cfg.routePrefix" class="hover:text-slate-800 transition-colors">
            {{ cfg.shortLabel }}
          </router-link>
          <span>/</span>
          <span class="font-medium text-slate-700">Detail Nota</span>
        </div>
      </template>

      <template #actions>
        <div v-if="order" class="flex flex-wrap items-center gap-2">
          <!-- Counter Badge -->
          <div
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700"
            title="Riwayat frekuensi cetak nota ini"
          >
            <Receipt class="w-3.5 h-3.5 text-slate-500" />
            <span
              >Dicetak: <b>{{ order.count_print }}</b> kali</span
            >
          </div>

          <!-- Reset Counter Button -->
          <AppButton
            variant="ghost"
            size="sm"
            class="text-slate-600"
            title="Reset counter cetak ke 0"
            @click="handleResetCount"
          >
            <template #iconLeft>
              <RotateCcw class="w-3.5 h-3.5" />
            </template>
            Reset Counter
          </AppButton>

          <!-- Export PDF -->
          <AppButton variant="outline" size="sm" @click="handleExportPdf">
            <template #iconLeft>
              <FileDown class="w-4 h-4 text-rose-600" />
            </template>
            Unduh PDF
          </AppButton>

          <!-- Cetak Button -->
          <AppButton variant="primary" size="sm" @click="handlePrint">
            <template #iconLeft>
              <Printer class="w-4 h-4" />
            </template>
            Cetak Nota
          </AppButton>

          <AppButton
            variant="outline"
            size="sm"
            @click="router.push(`${cfg.routePrefix}/${order.id}`)"
          >
            <template #iconLeft>
              <ArrowLeft class="w-4 h-4" />
            </template>
            Kembali
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <!-- Skeleton Loading -->
    <div
      v-if="isLoading"
      class="bg-white border border-slate-200 rounded-xl p-8 max-w-5xl mx-auto space-y-6"
    >
      <AppSkeleton height="40px" width="30%" />
      <AppSkeleton height="80px" width="100%" />
      <AppSkeleton height="200px" width="100%" />
    </div>

    <!-- Printable Nota Document Card -->
    <SalesOrderNotaDocument v-else-if="order" :order="order" />
  </div>
</template>
