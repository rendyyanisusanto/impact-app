<script setup lang="ts">
import { computed } from 'vue'
import type { CalculatedMaterialRequirement } from '../types/production.types'
import { Layers, CheckCircle2, AlertTriangle, Info, PackageCheck, PackageX } from 'lucide-vue-next'
import { formatNumber } from '@/shared/utils/formatters'

const props = defineProps<{
  requirements: CalculatedMaterialRequirement[]
  hasUnassignedBom?: boolean
  loading?: boolean
}>()

const totalItems = computed(() => props.requirements.length)

const shortItems = computed(() => {
  return props.requirements.filter(r => r.status === 'KURANG')
})

const isAllSufficient = computed(() => {
  return totalItems.value > 0 && shortItems.value.length === 0
})
</script>

<template>
  <div
    class="production-requirements-panel bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs"
  >
    <!-- Panel Header -->
    <div
      class="px-5 py-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700"
        >
          <Layers class="w-4 h-4" />
        </div>
        <div>
          <h3 class="text-sm font-semibold text-slate-800">
            Estimasi Kebutuhan Bahan Baku (BoM Preview)
          </h3>
          <p class="text-xs text-slate-500">
            Kalkulasi otomatis kebutuhan material per batch produksi berdasarkan Template BoM aktif
          </p>
        </div>
      </div>

      <!-- Live Sufficiency Indicator -->
      <div v-if="totalItems > 0" class="flex items-center gap-2">
        <span
          v-if="isAllSufficient"
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
        >
          <PackageCheck class="w-3.5 h-3.5 text-emerald-600" />
          <span>Stok Bahan Lengkap</span>
        </span>
        <span
          v-else
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"
        >
          <PackageX class="w-3.5 h-3.5 text-amber-600" />
          <span>{{ shortItems.length }} Bahan Kurang</span>
        </span>
      </div>
    </div>

    <!-- Alert for unassigned BoM -->
    <div
      v-if="hasUnassignedBom"
      class="mx-5 mt-4 p-3 rounded-lg bg-amber-50/80 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800"
    >
      <AlertTriangle class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <div>
        <p class="font-medium">Sebagian produk belum memiliki Template BoM aktif</p>
        <p class="text-amber-700 mt-0.5">
          Kebutuhan bahan baku hanya dihitung untuk produk yang telah memiliki resep BoM aktif di
          sistem. Transaksi produksi tetap dapat disimpan tanpa memblokir input.
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="p-8 text-center text-slate-400">
      <div
        class="inline-block animate-spin w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full mb-2"
      />
      <p class="text-xs">Menghitung kebutuhan bahan baku dari template BoM...</p>
    </div>

    <!-- Empty Requirements State -->
    <div v-else-if="requirements.length === 0" class="p-8 text-center text-slate-400">
      <Layers class="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
      <p class="text-xs font-medium text-slate-600">Belum ada estimasi bahan baku</p>
      <p class="text-[11px] text-slate-400 mt-0.5">
        Pilih produk pada spreadsheet di atas untuk melihat simulasi kebutuhan material secara
        real-time.
      </p>
    </div>

    <!-- Requirements Table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full text-left text-xs border-collapse">
        <thead
          class="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-semibold tracking-wider"
        >
          <tr>
            <th class="py-2.5 px-4 w-12 text-center">No</th>
            <th class="py-2.5 px-4 w-32">Kode Bahan</th>
            <th class="py-2.5 px-4">Nama Bahan Baku</th>
            <th class="py-2.5 px-4 w-24 text-center">Satuan</th>
            <th class="py-2.5 px-4 w-32 text-right">Kebutuhan Total</th>
            <th class="py-2.5 px-4 w-32 text-right">Stok Gudang</th>
            <th class="py-2.5 px-4 w-36 text-center">Status Stok</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 bg-white">
          <tr
            v-for="(req, idx) in requirements"
            :key="req.bahan_id"
            class="hover:bg-slate-50/70 transition-colors"
            :class="req.status === 'KURANG' ? 'bg-amber-50/30' : ''"
          >
            <td class="py-2 px-4 text-center text-slate-400 text-[11px]">{{ idx + 1 }}</td>
            <td class="py-2 px-4 font-mono font-medium text-slate-700">{{ req.kode_bahan }}</td>
            <td class="py-2 px-4 font-medium text-slate-800">{{ req.nama_bahan }}</td>
            <td class="py-2 px-4 text-center text-slate-500 font-mono">{{ req.satuan_nama }}</td>
            <td class="py-2 px-4 text-right font-mono font-semibold text-indigo-700">
              {{ formatNumber(req.total_kebutuhan) }}
            </td>
            <td class="py-2 px-4 text-right font-mono text-slate-600">
              {{ formatNumber(req.stok_tersedia) }}
            </td>
            <td class="py-2 px-4 text-center">
              <span
                v-if="req.status === 'CUKUP'"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
              >
                <CheckCircle2 class="w-3 h-3 text-emerald-600" />
                <span>Cukup</span>
              </span>
              <span
                v-else
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200"
                :title="`Kekurangan: ${formatNumber(req.kekurangan)} ${req.satuan_nama}`"
              >
                <AlertTriangle class="w-3 h-3 text-amber-600" />
                <span>Kurang {{ formatNumber(req.kekurangan) }}</span>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Panel Footer Note -->
    <div
      class="px-5 py-2.5 border-t border-slate-100 bg-slate-50/60 flex items-center gap-2 text-[11px] text-slate-500"
    >
      <Info class="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <span>
        Perhitungan bersifat preview/simulasi. Pengurangan stok bahan baku hanya diposting ke kartu
        stok saat status produksi diubah ke <b>Selesai</b>.
      </span>
    </div>
  </div>
</template>
