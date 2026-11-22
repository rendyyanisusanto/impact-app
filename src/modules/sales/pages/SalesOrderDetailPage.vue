<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppSkeleton from '@/shared/components/ui/AppSkeleton.vue'
import { salesOrderTransactionService } from '../services/sales-order-transaction.service'
import type { SalesOrderWithDetails, SalesOrderVariantKey } from '../types/sales-order.types'
import { getVariantConfig } from '../config/sales-order-variants'
import { useToast } from '@/shared/composables/useToast'
import { formatCurrency, formatDate, formatNumber } from '@/shared/utils/formatters'
import { formatPaymentStatusLabel, getPaymentStatusBadgeClass } from '../utils/sales-order-calculations'
import {
  ArrowLeft,
  Receipt,
  Printer,
  Edit2,
  FileCheck,
  CreditCard,
  Truck,
  Factory,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle2
} from 'lucide-vue-next'
import type {
  LinkedProductionsResponse,
  ProductionRequirementAnalysis
} from '../types/sales-order.types'

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

// Linked Productions state (Sprint 10)
const linkedProductionsData = ref<LinkedProductionsResponse | null>(null)
const productionRequirements = ref<ProductionRequirementAnalysis | null>(null)
const isSyncingProduction = ref(false)
const isLoadingProductions = ref(false)

async function loadProductionData(): Promise<void> {
  isLoadingProductions.value = true
  try {
    const [prods, reqs] = await Promise.all([
      salesOrderTransactionService.getLinkedProductions(orderId.value).catch(() => null),
      salesOrderTransactionService.getProductionRequirements(orderId.value).catch(() => null)
    ])
    linkedProductionsData.value = prods
    productionRequirements.value = reqs
  } finally {
    isLoadingProductions.value = false
  }
}

async function handleSyncProduction(): Promise<void> {
  if (isSyncingProduction.value) return
  isSyncingProduction.value = true
  try {
    const res = await salesOrderTransactionService.syncProduction(orderId.value)
    toast.success('Sinkronisasi Produksi', res.message)
    await loadProductionData()
    // Muat ulang data order agar status_produksi terbaru langsung tercermin
    const updatedOrder = await salesOrderTransactionService.getById(orderId.value)
    if (updatedOrder) {
      order.value = updatedOrder
    }
  } catch (err: unknown) {
    toast.error('Gagal Sinkronisasi Produksi', (err as Error).message)
  } finally {
    isSyncingProduction.value = false
  }
}

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
        `Sales order ini merupakan tipe ${data.variant.toUpperCase()} dan tidak dapat diakses di menu ${cfg.value.shortLabel}.`
      )
      router.push(cfg.value.routePrefix)
      return
    }

    order.value = data
    await loadProductionData()
  } catch (error) {
    toast.error('Gagal memuat data Sales Order.')
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <AppPageHeader
      :title="order ? `Detail ${order.kode}` : 'Detail Sales Order'"
      :subtitle="`Informasi lengkap transaksi ${cfg.shortLabel}.`"
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
          <span class="font-medium text-slate-700">{{ order?.kode || 'Detail' }}</span>
        </div>
      </template>

      <template #actions>
        <div v-if="order" class="flex flex-wrap items-center gap-2">
          <AppButton variant="outline" size="sm" @click="router.push(cfg.routePrefix)">
            <template #iconLeft>
              <ArrowLeft class="w-4 h-4" />
            </template>
            Kembali
          </AppButton>

          <AppButton
            variant="outline"
            size="sm"
            @click="router.push(`${cfg.routePrefix}/${order.id}/nota`)"
          >
            <template #iconLeft>
              <Receipt class="w-4 h-4 text-blue-600" />
            </template>
            Detail Nota
          </AppButton>

          <AppButton
            variant="outline"
            size="sm"
            @click="router.push(`${cfg.routePrefix}/${order.id}/print`)"
          >
            <template #iconLeft>
              <Printer class="w-4 h-4 text-indigo-600" />
            </template>
            Cetak Faktur
          </AppButton>

          <AppButton
            variant="primary"
            size="sm"
            @click="router.push(`${cfg.routePrefix}/${order.id}/edit`)"
          >
            <template #iconLeft>
              <Edit2 class="w-4 h-4" />
            </template>
            Edit Transaksi
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <!-- Skeleton Loading -->
    <div
      v-if="isLoading"
      class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4"
    >
      <AppSkeleton height="36px" width="30%" />
      <AppSkeleton height="100px" width="100%" />
      <AppSkeleton height="150px" width="100%" />
    </div>

    <template v-else-if="order">
      <!-- Status Badges Bar -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Document Status -->
        <div
          class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600"
            >
              <FileCheck class="w-5 h-5" />
            </div>
            <div>
              <p class="text-[11px] text-slate-500 font-medium uppercase">Status Dokumen</p>
              <p class="text-sm font-bold text-slate-800">
                {{ order.status === 1 ? 'SUCCEEDED (Posted)' : 'DRAFT' }}
              </p>
            </div>
          </div>
          <span
            class="px-2.5 py-1 text-xs font-semibold rounded-full"
            :class="
              order.status === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
            "
          >
            {{ order.status === 1 ? 'Terkunci' : 'Draft' }}
          </span>
        </div>

        <!-- Payment Status -->
        <div
          class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600"
            >
              <CreditCard class="w-5 h-5" />
            </div>
            <div>
              <p class="text-[11px] text-slate-500 font-medium uppercase">Status Pembayaran</p>
              <p class="text-sm font-bold text-slate-800">
                {{ formatPaymentStatusLabel(order.payment_status) }}
              </p>
            </div>
          </div>
          <span
            class="px-2.5 py-1 text-xs font-semibold rounded-full"
            :class="getPaymentStatusBadgeClass(order.payment_status)"
          >
            {{ formatPaymentStatusLabel(order.payment_status) }}
          </span>
        </div>

        <!-- Delivery Status -->
        <div
          class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"
            >
              <Truck class="w-5 h-5" />
            </div>
            <div>
              <p class="text-[11px] text-slate-500 font-medium uppercase">Status Pengiriman</p>
              <p class="text-sm font-bold text-slate-800">
                {{ order.delivery_status === 'TERKIRIM' ? 'Terkirim Penuh' : 'Belum Dikirim' }}
              </p>
            </div>
          </div>
          <span
            class="px-2.5 py-1 text-xs font-semibold rounded-full"
            :class="
              order.delivery_status === 'TERKIRIM'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-slate-100 text-slate-700'
            "
          >
            {{ order.delivery_status }}
          </span>
        </div>

        <!-- Production Status (Sprint 10) -->
        <div
          class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center"
              :class="[
                linkedProductionsData?.status_produksi_summary === 'SELESAI'
                  ? 'bg-emerald-50 text-emerald-600'
                  : linkedProductionsData?.status_produksi_summary === 'DALAM_PROSES'
                    ? 'bg-blue-50 text-blue-600'
                    : linkedProductionsData?.status_produksi_summary === 'MENUNGGU_PRODUKSI'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-slate-50 text-slate-600'
              ]"
            >
              <Factory class="w-5 h-5" />
            </div>
            <div>
              <p class="text-[11px] text-slate-500 font-medium uppercase">Status Produksi</p>
              <p class="text-sm font-bold text-slate-800">
                {{
                  linkedProductionsData?.status_produksi_summary === 'SELESAI'
                    ? 'Selesai (Posted)'
                    : linkedProductionsData?.status_produksi_summary === 'DALAM_PROSES'
                      ? 'Dalam Proses'
                      : linkedProductionsData?.status_produksi_summary === 'SEBAGIAN_SELESAI'
                        ? 'Sebagian Selesai'
                        : linkedProductionsData?.status_produksi_summary === 'MENUNGGU_PRODUKSI'
                          ? 'Perlu Produksi'
                          : 'Ambil Stok (Cukup)'
                }}
              </p>
            </div>
          </div>
          <span
            class="px-2.5 py-1 text-xs font-semibold rounded-full"
            :class="[
              linkedProductionsData?.status_produksi_summary === 'SELESAI'
                ? 'bg-emerald-100 text-emerald-800'
                : linkedProductionsData?.status_produksi_summary === 'DALAM_PROSES'
                  ? 'bg-blue-100 text-blue-800'
                  : linkedProductionsData?.status_produksi_summary === 'SEBAGIAN_SELESAI'
                    ? 'bg-indigo-100 text-indigo-800'
                    : linkedProductionsData?.status_produksi_summary === 'MENUNGGU_PRODUKSI'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
            ]"
          >
            {{
              linkedProductionsData?.status_produksi_summary === 'SELESAI'
                ? 'Selesai'
                : linkedProductionsData?.status_produksi_summary === 'DALAM_PROSES'
                  ? 'Proses'
                  : linkedProductionsData?.status_produksi_summary === 'SEBAGIAN_SELESAI'
                    ? 'Parsial'
                    : linkedProductionsData?.status_produksi_summary === 'MENUNGGU_PRODUKSI'
                      ? 'Pending'
                      : 'Ready'
            }}
          </span>
        </div>
      </div>

      <!-- Header Information Grid -->
      <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div class="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h3 class="text-xs font-semibold text-slate-800 uppercase tracking-wider text-slate-500">
            Rincian Informasi Transaksi
          </h3>
          <span class="text-xs font-mono text-slate-400">ID: #{{ order.id }}</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
          <!-- Dokumen -->
          <div class="space-y-1">
            <p class="text-slate-400 uppercase text-[10px] font-bold">No. Sales Order</p>
            <p class="text-sm font-mono font-bold text-slate-900">{{ order.kode }}</p>
            <p class="text-[11px] text-slate-500 mt-1">
              Tanggal: <b>{{ formatDate(order.tanggal) }}</b>
            </p>
          </div>

          <!-- Customer -->
          <div class="space-y-1">
            <p class="text-slate-400 uppercase text-[10px] font-bold">Customer</p>
            <p class="text-sm font-bold text-slate-900">{{ order.customer_nama }}</p>
            <p class="text-[11px] text-slate-500 leading-tight">
              {{ order.customer_alamat || 'Alamat tidak terdata' }}
            </p>
          </div>

          <!-- Salesman -->
          <div class="space-y-1">
            <p class="text-slate-400 uppercase text-[10px] font-bold">Salesman</p>
            <p class="text-sm font-bold text-slate-900">{{ order.sales_nama }}</p>
            <p class="text-[11px] text-slate-500">Penanggung Jawab Penjualan</p>
          </div>

          <!-- Pajak / Varian -->
          <div class="space-y-1">
            <p class="text-slate-400 uppercase text-[10px] font-bold">Varian & Pajak</p>
            <p class="text-sm font-bold text-slate-900">{{ cfg.label }}</p>
            <p v-if="cfg.hasTax" class="text-[11px] font-mono text-slate-600">
              Faktur Pajak: {{ order.no_faktur_pajak || '-' }}
            </p>
            <p v-else class="text-[11px] text-slate-500 italic">Bebas PPN (0%)</p>
          </div>
        </div>

        <div v-if="order.keterangan" class="pt-3 border-t border-slate-100 text-xs">
          <span class="text-slate-400 font-medium">Catatan / Keterangan:</span>
          <p class="text-slate-700 mt-0.5">{{ order.keterangan }}</p>
        </div>
      </div>

      <!-- Items Table -->
      <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div class="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h3 class="text-xs font-semibold text-slate-800 uppercase tracking-wider text-slate-500">
            Daftar Barang Pesanan
          </h3>
          <span class="text-xs text-slate-500"> {{ order.items.length }} baris item </span>
        </div>

        <div class="overflow-x-auto border border-slate-200 rounded-lg">
          <table class="w-full text-left text-xs border-collapse">
            <thead
              class="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-semibold"
            >
              <tr>
                <th class="py-2.5 px-3 w-12 text-center border-r border-slate-200">No</th>
                <th class="py-2.5 px-3 w-28 border-r border-slate-200">Kode</th>
                <th class="py-2.5 px-3 border-r border-slate-200">Nama Produk Furniture</th>
                <th class="py-2.5 px-3 w-24 text-center border-r border-slate-200">Jenis Stok</th>
                <th class="py-2.5 px-3 w-20 text-right border-r border-slate-200">Qty</th>
                <th class="py-2.5 px-3 w-32 text-right border-r border-slate-200">Harga</th>
                <th class="py-2.5 px-3 w-20 text-center border-r border-slate-200">Diskon</th>
                <th class="py-2.5 px-3 w-36 text-right border-r border-slate-200">Subtotal</th>
                <th class="py-2.5 px-3">Keterangan</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr v-for="(item, idx) in order.items" :key="item.id" class="hover:bg-slate-50/70">
                <td
                  class="py-2 px-3 text-center font-mono text-slate-400 border-r border-slate-200"
                >
                  {{ idx + 1 }}
                </td>
                <td class="py-2 px-3 font-mono text-slate-600 border-r border-slate-200">
                  {{ item.kode_produk || '-' }}
                </td>
                <td class="py-2 px-3 font-semibold text-slate-800 border-r border-slate-200">
                  {{ item.nama_produk }}
                </td>
                <td class="py-2 px-3 text-center border-r border-slate-200">
                  <span
                    class="px-2 py-0.5 rounded text-[10px] font-semibold"
                    :class="
                      item.status_produksi === 1
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'bg-emerald-50 text-emerald-700'
                    "
                  >
                    {{ item.status_produksi === 1 ? 'Produksi' : 'Ready Stock' }}
                  </span>
                </td>
                <td
                  class="py-2 px-3 text-right font-mono font-bold text-slate-800 border-r border-slate-200"
                >
                  {{ formatNumber(item.qty) }} {{ item.satuan_nama || 'Pcs' }}
                </td>
                <td class="py-2 px-3 text-right font-mono text-slate-700 border-r border-slate-200">
                  {{ formatCurrency(item.harga) }}
                </td>
                <td class="py-2 px-3 text-center font-mono border-r border-slate-200">
                  {{ item.diskon > 0 ? `${item.diskon}%` : '-' }}
                </td>
                <td
                  class="py-2 px-3 text-right font-mono font-bold text-slate-900 border-r border-slate-200"
                >
                  {{ formatCurrency(item.subtotal) }}
                </td>
                <td class="py-2 px-3 text-slate-500">
                  {{ item.keterangan || '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Referensi Perintah Produksi Terkait (Sprint 10) -->
      <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div class="border-b border-slate-100 pb-3 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Factory class="w-4 h-4" />
            </div>
            <div>
              <h3 class="text-xs font-semibold text-slate-800 uppercase tracking-wider text-slate-600">
                Referensi Perintah Produksi Terkait
              </h3>
              <p class="text-[11px] text-slate-400 mt-0.5">
                Sinkronisasi otomatis kekurangan stok Sales Order dengan transaksi SPK Produksi
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <AppButton
              variant="outline"
              size="sm"
              :disabled="isSyncingProduction || order.status_aktif === 0"
              @click="handleSyncProduction"
            >
              <template #iconLeft>
                <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isSyncingProduction }" />
              </template>
              {{ isSyncingProduction ? 'Menyelaraskan...' : 'Sinkronkan Produksi' }}
            </AppButton>
          </div>
        </div>

        <!-- Warning Shortage Banner jika kebutuhan belum ada SPK -->
        <div
          v-if="productionRequirements?.needs_production && (!linkedProductionsData || linkedProductionsData.productions.length === 0)"
          class="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-3 text-xs"
        >
          <AlertCircle class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p class="font-semibold">Kekurangan Stok Terdeteksi ({{ productionRequirements.total_shortage }} Unit)</p>
            <p class="text-amber-700 mt-0.5">
              Sales Order ini memerlukan produksi untuk barang yang melebihi stok bebas gudang. Klik tombol <b>Sinkronkan Produksi</b> untuk membuat SPK otomatis.
            </p>
          </div>
        </div>

        <!-- Table of Linked Productions -->
        <div
          v-if="linkedProductionsData && linkedProductionsData.productions.length > 0"
          class="overflow-x-auto border border-slate-200 rounded-lg"
        >
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-semibold">
              <tr>
                <th class="py-2.5 px-3 w-12 text-center border-r border-slate-200">No</th>
                <th class="py-2.5 px-3 w-36 border-r border-slate-200">No. Produksi (SPK)</th>
                <th class="py-2.5 px-3 w-28 border-r border-slate-200">Tanggal</th>
                <th class="py-2.5 px-3 border-r border-slate-200">Produk yang Diproduksi</th>
                <th class="py-2.5 px-3 w-24 text-right border-r border-slate-200">Total Qty</th>
                <th class="py-2.5 px-3 w-28 text-center border-r border-slate-200">Status Produksi</th>
                <th class="py-2.5 px-3 w-24 text-center border-r border-slate-200">Status Dokumen</th>
                <th class="py-2.5 px-3 w-28 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr
                v-for="(p, idx) in linkedProductionsData.productions"
                :key="p.id"
                class="hover:bg-slate-50/70"
              >
                <td class="py-2 px-3 text-center font-mono text-slate-400 border-r border-slate-200">
                  {{ idx + 1 }}
                </td>
                <td class="py-2 px-3 font-mono font-bold text-teal-700 border-r border-slate-200">
                  <router-link :to="`/production/orders/${p.id}`" class="hover:underline flex items-center gap-1">
                    <span>{{ p.kode }}</span>
                    <ExternalLink class="w-3 h-3 text-teal-500 inline" />
                  </router-link>
                </td>
                <td class="py-2 px-3 text-slate-600 border-r border-slate-200 font-mono">
                  {{ formatDate(p.tanggal) }}
                </td>
                <td class="py-2 px-3 border-r border-slate-200">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="it in p.items"
                      :key="it.id"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200 font-medium"
                    >
                      <span>{{ it.nama_produk }}</span>
                      <b class="text-teal-700">({{ formatNumber(it.qty) }} pcs)</b>
                    </span>
                  </div>
                </td>
                <td class="py-2 px-3 text-right font-mono font-bold text-slate-800 border-r border-slate-200">
                  {{ formatNumber(p.total_qty) }}
                </td>
                <td class="py-2 px-3 text-center border-r border-slate-200">
                  <span
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                    :class="[
                      p.status_produksi === 2
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : p.status_produksi === 1
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                    ]"
                  >
                    <span
                      class="w-1.5 h-1.5 rounded-full"
                      :class="[
                        p.status_produksi === 2
                          ? 'bg-emerald-500'
                          : p.status_produksi === 1
                            ? 'bg-blue-500'
                            : 'bg-amber-500'
                      ]"
                    />
                    {{ p.status_produksi_label }}
                  </span>
                </td>
                <td class="py-2 px-3 text-center border-r border-slate-200">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium"
                    :class="p.status === 1 ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-slate-100 text-slate-600'"
                  >
                    {{ p.status === 1 ? 'Posted' : 'Draft' }}
                  </span>
                </td>
                <td class="py-2 px-3 text-center">
                  <router-link
                    :to="`/production/orders/${p.id}`"
                    class="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold text-teal-700 hover:bg-teal-50 transition-colors"
                  >
                    <span>Buka SPK</span>
                    <ExternalLink class="w-3 h-3" />
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty state when no linked productions -->
        <div
          v-else-if="!isLoadingProductions && (!productionRequirements?.needs_production)"
          class="p-6 text-center text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200 text-xs"
        >
          <div class="inline-flex items-center justify-center w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 mb-2">
            <CheckCircle2 class="w-5 h-5" />
          </div>
          <p class="font-medium text-slate-700">Seluruh Produk Terpenuhi Dari Stok Gudang</p>
          <p class="text-slate-400 mt-0.5">
            Tidak ada transaksi produksi yang perlu dibuat. Sales Order dapat langsung diproses ke pengiriman (Ambil Stok).
          </p>
        </div>
      </div>

      <!-- Biaya Tambahan & Financial Summary -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Biaya Tambahan List -->
        <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div class="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3
              class="text-xs font-semibold text-slate-800 uppercase tracking-wider text-slate-500"
            >
              Biaya Tambahan
            </h3>
            <span class="text-xs text-slate-400"> {{ order.biaya_tambahan.length }} komponen </span>
          </div>

          <div
            v-if="order.biaya_tambahan.length === 0"
            class="py-6 text-center text-slate-400 text-xs italic"
          >
            Tidak ada komponen biaya tambahan.
          </div>

          <table
            v-else
            class="w-full text-left text-xs border-collapse border border-slate-200 rounded-lg overflow-hidden"
          >
            <thead
              class="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px]"
            >
              <tr>
                <th class="py-2 px-3 w-10 text-center border-r border-slate-200">No</th>
                <th class="py-2 px-3 border-r border-slate-200">Komponen</th>
                <th class="py-2 px-3 w-36 text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="(b, idx) in order.biaya_tambahan" :key="b.id">
                <td
                  class="py-2 px-3 text-center font-mono text-slate-400 border-r border-slate-200"
                >
                  {{ idx + 1 }}
                </td>
                <td class="py-2 px-3 font-medium text-slate-700 border-r border-slate-200">
                  {{ b.komponen }}
                </td>
                <td class="py-2 px-3 text-right font-mono font-bold text-slate-800">
                  {{ formatCurrency(b.jumlah) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Financial Summary -->
        <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div class="border-b border-slate-100 pb-3">
            <h3
              class="text-xs font-semibold text-slate-800 uppercase tracking-wider text-slate-500"
            >
              Ringkasan Pembayaran
            </h3>
          </div>

          <div class="space-y-2 text-xs">
            <div class="flex items-center justify-between text-slate-600">
              <span>Subtotal Item</span>
              <span class="font-mono font-medium text-slate-800">{{
                formatCurrency(order.subtotal)
              }}</span>
            </div>

            <div
              v-if="order.biaya_tambahan.length > 0"
              class="flex items-center justify-between text-slate-600"
            >
              <span>Biaya Tambahan</span>
              <span class="font-mono font-medium text-slate-800">
                {{ formatCurrency(order.biaya_tambahan.reduce((sum, b) => sum + b.jumlah, 0)) }}
              </span>
            </div>

            <div v-if="cfg.hasTax" class="flex items-center justify-between text-slate-600">
              <span>PPN ({{ order.ppn_persen || 11 }}%)</span>
              <span class="font-mono font-medium text-teal-700">{{
                formatCurrency(order.total_ppn)
              }}</span>
            </div>

            <div
              class="flex items-center justify-between text-sm font-bold text-slate-900 pt-3 border-t border-slate-200"
            >
              <span>TOTAL ORDER</span>
              <span class="font-mono text-base text-teal-700 font-bold">
                {{ formatCurrency(order.total) }}
              </span>
            </div>

            <div
              class="flex items-center justify-between text-slate-600 pt-2 border-t border-dashed border-slate-100"
            >
              <span>Jumlah Terbayar</span>
              <span class="font-mono font-medium text-emerald-700">{{
                formatCurrency(order.terbayar)
              }}</span>
            </div>

            <div class="flex items-center justify-between text-slate-600">
              <span>Sisa Tagihan</span>
              <span class="font-mono font-bold text-rose-700">{{
                formatCurrency(order.sisa)
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
