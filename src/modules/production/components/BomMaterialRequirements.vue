<script setup lang="ts">
import { ref, computed } from 'vue'
import type { BomTemplateWithItems, MaterialRequirementSimulation } from '../types/bom.types'
import { calculateMaterialRequirements } from '../utils/bom-calculations'
import { formatNumber, formatCurrency } from '@/shared/utils/formatters'
import { Calculator, CheckCircle2, AlertTriangle, Info } from 'lucide-vue-next'

const props = defineProps<{
  bom: BomTemplateWithItems
}>()

// Default target production = 10 units
const targetQty = ref<number>(10)

const simulation = computed<MaterialRequirementSimulation>(() => {
  return calculateMaterialRequirements(
    props.bom.id,
    props.bom.kode,
    props.bom.produk_id,
    props.bom.nama_produk,
    props.bom.items,
    targetQty.value || 0
  )
})

function onTargetInput(e: Event) {
  const target = e.target as HTMLInputElement
  const raw = target.value.trim()
  if (raw === '') {
    targetQty.value = 0
    return
  }
  const val = parseInt(raw, 10)
  targetQty.value = isNaN(val) ? 0 : Math.max(0, val)
}
</script>

<template>
  <div class="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
    <!-- Header with Target Qty Input -->
    <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
      <div class="flex items-center gap-2.5">
        <div class="p-2 bg-teal-50 text-teal-700 rounded-lg">
          <Calculator class="w-5 h-5" />
        </div>
        <div>
          <h3 class="text-sm font-semibold text-slate-800">
            Simulasi Kebutuhan Bahan Baku (MRP Preview)
          </h3>
          <p class="text-xs text-slate-500">
            Kalkulasi estimasi bahan dan ketersediaan stok berdasarkan target produksi
          </p>
        </div>
      </div>

      <!-- Target Production Input Control -->
      <div
        class="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200"
      >
        <label
          for="target-qty-input"
          class="text-xs font-semibold text-slate-700 whitespace-nowrap"
        >
          Target Produksi:
        </label>
        <div class="flex items-center gap-1">
          <input
            id="target-qty-input"
            type="number"
            min="1"
            :value="targetQty"
            class="w-20 px-2 py-1 text-xs font-bold font-mono text-right border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
            @input="onTargetInput"
          />
          <span class="text-xs text-slate-500 font-medium">unit</span>
        </div>
      </div>
    </div>

    <!-- Status & KPI Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <!-- Status Kelayakan -->
      <div
        :class="[
          'rounded-lg border p-3 flex items-center gap-3',
          simulation.status_kelayakan === 'SIAP_PRODUKSI'
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
            : 'bg-amber-50/70 border-amber-200 text-amber-800'
        ]"
      >
        <div
          :class="[
            'p-2 rounded-lg',
            simulation.status_kelayakan === 'SIAP_PRODUKSI'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700'
          ]"
        >
          <component
            :is="simulation.status_kelayakan === 'SIAP_PRODUKSI' ? CheckCircle2 : AlertTriangle"
            class="w-5 h-5"
          />
        </div>
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider block">Status Kelayakan</span>
          <span class="text-sm font-bold">
            {{ simulation.status_kelayakan === 'SIAP_PRODUKSI' ? 'SIAP PRODUKSI' : 'BAHAN KURANG' }}
          </span>
        </div>
      </div>

      <!-- Bahan Cukup -->
      <div class="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
        <span class="text-[11px] font-medium text-slate-500 block">Bahan Stok Cukup</span>
        <span class="text-lg font-bold font-mono text-emerald-600">
          {{ simulation.jumlah_bahan_cukup }} / {{ simulation.total_jenis_bahan }} jenis
        </span>
      </div>

      <!-- Bahan Kurang -->
      <div class="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
        <span class="text-[11px] font-medium text-slate-500 block">Bahan Perlu Pengadaan</span>
        <span
          :class="[
            'text-lg font-bold font-mono',
            simulation.jumlah_bahan_kurang > 0 ? 'text-rose-600' : 'text-slate-600'
          ]"
        >
          {{ simulation.jumlah_bahan_kurang }} jenis bahan
        </span>
      </div>

      <!-- Estimasi Total Biaya Bahan -->
      <div class="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
        <span class="text-[11px] font-medium text-slate-500 block">Est. Biaya Bahan Target</span>
        <span class="text-base font-bold font-mono text-slate-900 truncate block">
          {{ formatCurrency(simulation.total_estimasi_biaya) }}
        </span>
      </div>
    </div>

    <!-- Requirements Breakdown Table -->
    <div class="overflow-x-auto border border-slate-200 rounded-lg">
      <table class="w-full text-left text-xs border-collapse">
        <thead class="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
          <tr>
            <th class="w-10 px-3 py-2 text-center border-r border-slate-200">No</th>
            <th class="w-28 px-3 py-2 border-r border-slate-200">Kode Bahan</th>
            <th class="min-w-[180px] px-3 py-2 border-r border-slate-200">Nama Bahan Baku</th>
            <th class="w-20 px-2 py-2 text-center border-r border-slate-200">Satuan</th>
            <th class="w-24 px-2 py-2 text-right border-r border-slate-200">Per 1 Unit</th>
            <th
              class="w-28 px-2 py-2 text-right border-r border-slate-200 bg-teal-50/50 text-teal-900 font-bold"
            >
              Total Kebutuhan
            </th>
            <th class="w-24 px-2 py-2 text-right border-r border-slate-200 bg-slate-50">
              Stok Tersedia
            </th>
            <th class="w-24 px-2 py-2 text-center border-r border-slate-200 font-bold">
              Ketersediaan
            </th>
            <th
              class="w-24 px-2 py-2 text-right border-r border-slate-200 text-rose-700 font-semibold"
            >
              Kekurangan
            </th>
            <th class="w-28 px-2 py-2 text-right">Est. Biaya</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          <tr
            v-for="(item, idx) in simulation.items"
            :key="item.bahan_id"
            :class="[
              'hover:bg-slate-50/60 transition-colors',
              item.status_ketersediaan === 'KURANG' ? 'bg-rose-50/20' : ''
            ]"
          >
            <td
              class="px-3 py-2 text-center font-mono text-slate-500 border-r border-slate-200 bg-slate-50/30"
            >
              {{ idx + 1 }}
            </td>
            <td class="px-3 py-2 font-mono font-semibold text-slate-800 border-r border-slate-200">
              {{ item.kode_bahan }}
            </td>
            <td class="px-3 py-2 font-medium text-slate-900 border-r border-slate-200">
              {{ item.nama_bahan }}
            </td>
            <td class="px-2 py-2 text-center font-mono text-slate-600 border-r border-slate-200">
              {{ item.nama_satuan }}
            </td>
            <td class="px-2 py-2 text-right font-mono text-slate-600 border-r border-slate-200">
              {{ formatNumber(item.qty_per_unit) }}
            </td>
            <td
              class="px-2 py-2 text-right font-mono font-bold text-teal-800 border-r border-slate-200 bg-teal-50/30"
            >
              {{ formatNumber(item.total_kebutuhan) }}
            </td>
            <td
              class="px-2 py-2 text-right font-mono text-slate-700 border-r border-slate-200 bg-slate-50/40"
            >
              {{ formatNumber(item.stok_tersedia) }}
            </td>
            <td class="px-2 py-2 text-center border-r border-slate-200">
              <span
                v-if="item.status_ketersediaan === 'CUKUP'"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
              >
                <CheckCircle2 class="w-3 h-3" />
                CUKUP
              </span>
              <span
                v-else
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200"
              >
                <AlertTriangle class="w-3 h-3" />
                KURANG
              </span>
            </td>
            <td class="px-2 py-2 text-right font-mono font-bold border-r border-slate-200">
              <span v-if="item.kekurangan_qty > 0" class="text-rose-600">
                -{{ formatNumber(item.kekurangan_qty) }}
              </span>
              <span v-else class="text-slate-400">—</span>
            </td>
            <td class="px-2 py-2 text-right font-mono text-slate-800">
              {{ formatCurrency(item.estimasi_total_biaya) }}
            </td>
          </tr>
        </tbody>
        <tfoot class="bg-slate-100 font-semibold border-t-2 border-slate-300 text-slate-800">
          <tr>
            <td colspan="5" class="px-3 py-2.5 text-right font-bold border-r border-slate-200">
              Total Kebutuhan Bahan ({{ targetQty }} unit):
            </td>
            <td
              class="px-2 py-2.5 text-right font-mono font-bold text-teal-900 border-r border-slate-200"
            >
              {{ formatNumber(simulation.total_kebutuhan_qty) }}
            </td>
            <td
              colspan="3"
              class="px-3 py-2.5 text-slate-600 border-r border-slate-200 text-center"
            >
              Cukup: {{ simulation.jumlah_bahan_cukup }} | Kurang:
              {{ simulation.jumlah_bahan_kurang }}
            </td>
            <td class="px-2 py-2.5 text-right font-mono font-bold text-slate-900">
              {{ formatCurrency(simulation.total_estimasi_biaya) }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Non-destructive Simulation Notice -->
    <div
      class="bg-teal-50/60 border border-teal-200 rounded-lg p-3 flex items-start gap-2.5 text-xs text-teal-900"
    >
      <Info class="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
      <div>
        <span class="font-bold">Simulasi Read-Only:</span>
        Kalkulasi kebutuhan bahan di atas dihitung secara dinamis dari komposisi template produk
        (<span class="font-mono">Total = Qty x Target</span>). Panel ini berfungsi sebagai alat
        bantu perencanaan produksi (MRP) dan <strong>TIDAK memotong saldo stok riil gudang</strong>.
      </div>
    </div>
  </div>
</template>
