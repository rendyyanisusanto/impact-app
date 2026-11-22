<script setup lang="ts">
import { Plus, Trash2, Tag } from 'lucide-vue-next'
import { formatCurrency } from '@/shared/utils/formatters'

interface AdditionalCostItem {
  komponen: string
  jumlah: number
}

defineProps<{
  costs: AdditionalCostItem[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'add-cost'): void
  (e: 'remove-cost', index: number): void
  (e: 'update-cost', index: number, field: 'komponen' | 'jumlah', value: unknown): void
}>()
</script>

<template>
  <div
    class="additional-costs-card bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4"
  >
    <div class="flex items-center justify-between border-b border-slate-100 pb-3">
      <div class="flex items-center gap-2">
        <Tag class="w-4 h-4 text-teal-600" />
        <h3 class="text-xs font-semibold text-slate-800 uppercase tracking-wider text-slate-500">
          Biaya Tambahan (Komponen Tambahan)
        </h3>
      </div>

      <button
        v-if="!disabled"
        type="button"
        class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
        @click="emit('add-cost')"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>Tambah Biaya</span>
      </button>
    </div>

    <!-- Empty State -->
    <div
      v-if="costs.length === 0"
      class="py-6 text-center text-slate-400 text-xs italic bg-slate-50/50 rounded-lg border border-dashed border-slate-200"
    >
      Tidak ada biaya tambahan (ongkos kirim, jasa bordir, atau modifikasi komponen).
    </div>

    <!-- Table of Additional Costs -->
    <div v-else class="overflow-x-auto">
      <table class="w-full text-left text-xs border-collapse">
        <thead
          class="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-semibold"
        >
          <tr>
            <th class="w-12 py-2 px-3 text-center">No</th>
            <th class="py-2 px-3">Nama Komponen / Keterangan</th>
            <th class="w-48 py-2 px-3 text-right">Jumlah (Rp)</th>
            <th v-if="!disabled" class="w-16 py-2 px-3 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="(item, idx) in costs" :key="idx" class="hover:bg-slate-50/70">
            <td class="py-2 px-3 text-center text-slate-400 font-mono">{{ idx + 1 }}</td>
            <td class="py-1 px-2">
              <input
                v-if="!disabled"
                :value="item.komponen"
                type="text"
                placeholder="Contoh: ONGKIR GRESIK / TAMBAH TINGGI KAKI U"
                class="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none text-slate-800"
                @input="
                  emit('update-cost', idx, 'komponen', ($event.target as HTMLInputElement).value)
                "
              />
              <span v-else class="font-medium text-slate-800">{{ item.komponen }}</span>
            </td>
            <td class="py-1 px-2 text-right">
              <input
                v-if="!disabled"
                :value="item.jumlah"
                type="number"
                min="0"
                step="5000"
                placeholder="0"
                class="w-full py-1.5 px-2.5 text-right font-mono text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none text-slate-800"
                @input="
                  emit(
                    'update-cost',
                    idx,
                    'jumlah',
                    Number(($event.target as HTMLInputElement).value)
                  )
                "
              />
              <span v-else class="font-mono font-semibold text-slate-800">
                {{ formatCurrency(item.jumlah) }}
              </span>
            </td>
            <td v-if="!disabled" class="py-1 px-2 text-center">
              <button
                type="button"
                class="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                title="Hapus komponen ini"
                @click="emit('remove-cost', idx)"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
