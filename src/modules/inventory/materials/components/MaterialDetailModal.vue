<script setup lang="ts">
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppBadge from '@/shared/components/ui/AppBadge.vue'
import AppStatusBadge from '@/shared/components/data/AppStatusBadge.vue'
import type { MasterDataBahan } from '../types/material.types'
import { AlertTriangle } from 'lucide-vue-next'

defineProps<{
  modelValue: boolean
  material?: MasterDataBahan | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
}>()
</script>

<template>
  <AppModal
    :model-value="modelValue"
    title="Detail Master Data Bahan"
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="material" class="space-y-4 text-xs text-slate-700">
      <!-- Header Summary Card -->
      <div
        class="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between gap-3"
      >
        <div>
          <span class="text-[10px] font-bold text-teal-800 tracking-wider uppercase">
            {{ material.kode || 'TANPA KODE' }}
          </span>
          <h3 class="text-sm font-bold text-slate-800 mt-0.5">
            {{ material.nama }}
          </h3>
          <p class="text-[11px] text-slate-500 mt-0.5">
            Gudang: {{ material.gudang_nama || 'Belum Ditentukan' }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <!-- Low Stock Alert Badge -->
          <AppBadge
            v-if="
              material.qty !== null && material.min_qty !== null && material.qty <= material.min_qty
            "
            variant="danger"
            size="sm"
          >
            <template #icon>
              <AlertTriangle class="w-3 h-3 text-rose-600" />
            </template>
            Stok Limit
          </AppBadge>

          <AppStatusBadge :status="material.status === 1 ? 'active' : 'inactive'" />
        </div>
      </div>

      <!-- Inventory & Price Metrics Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div class="p-2.5 rounded-lg bg-teal-50/60 border border-teal-200/80 text-center">
          <p class="text-[10px] text-teal-700 font-semibold uppercase">Stok Tersedia</p>
          <p class="text-base font-bold text-teal-900 mt-0.5">
            {{ material.qty ?? 0 }}
            <span class="text-[11px] font-normal text-teal-700">{{
              material.satuan_pakai_nama || ''
            }}</span>
          </p>
        </div>

        <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
          <p class="text-[10px] text-slate-500 font-semibold uppercase">Batas Minimum</p>
          <p class="text-base font-bold text-slate-800 mt-0.5">
            {{ material.min_qty ?? 0 }}
            <span class="text-[11px] font-normal text-slate-500">{{
              material.satuan_pakai_nama || ''
            }}</span>
          </p>
        </div>

        <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
          <p class="text-[10px] text-slate-500 font-semibold uppercase">Satuan Beli</p>
          <p class="text-sm font-bold text-slate-800 mt-1">
            {{ material.satuan_beli_nama || '-' }}
          </p>
        </div>

        <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
          <p class="text-[10px] text-slate-500 font-semibold uppercase">Harga Satuan</p>
          <p class="text-xs font-bold text-teal-800 mt-1">
            {{ material.harga_satuan_formatted || '-' }}
          </p>
        </div>
      </div>

      <!-- Additional Details Grid -->
      <div class="grid grid-cols-2 gap-3 bg-white border border-slate-200 rounded-lg p-3">
        <div>
          <p class="text-[10px] text-slate-400 font-semibold uppercase">
            Lokasi Gudang Penyimpanan
          </p>
          <p class="font-medium text-slate-800 mt-0.5">{{ material.gudang_nama || '-' }}</p>
        </div>

        <div>
          <p class="text-[10px] text-slate-400 font-semibold uppercase">Foto / Visual Produk</p>
          <div v-if="material.foto" class="mt-1">
            <img
              :src="material.foto"
              :alt="material.nama || 'Foto Bahan'"
              class="w-24 h-24 object-cover rounded-lg border border-slate-200 shadow-2xs bg-white"
            />
          </div>
          <p v-else class="font-medium text-slate-400 italic mt-0.5">Tidak ada foto</p>
        </div>

        <div class="col-span-2">
          <p class="text-[10px] text-slate-400 font-semibold uppercase">
            Deskripsi & Spesifikasi Material
          </p>
          <p class="font-medium text-slate-800 mt-0.5 whitespace-pre-wrap">
            {{ material.deskripsi || '-' }}
          </p>
        </div>
      </div>

      <!-- Unit Conversion Section -->
      <div class="space-y-2">
        <h4 class="text-xs font-bold text-slate-800">
          Aturan Konversi Satuan (konversi_satuan_bahan)
        </h4>

        <div
          v-if="!material.konversi_satuan || material.konversi_satuan.length === 0"
          class="p-2.5 text-center bg-slate-50 border border-slate-200 rounded-md text-slate-400 text-xs"
        >
          Tidak ada aturan konversi khusus. Kuantitas beli setara dengan kuantitas pakai.
        </div>

        <div v-else class="border border-slate-200 rounded-lg overflow-hidden">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th class="py-2 px-3">Satuan Pembelian</th>
                <th class="py-2 px-3">Faktor Konversi (Satuan Pakai)</th>
                <th class="py-2 px-3 text-center">Status Bawaan</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="item in material.konversi_satuan"
                :key="item.id || item.satuan_id"
                class="hover:bg-slate-50/50"
              >
                <td class="py-2 px-3 font-medium text-slate-700">1 {{ item.satuan_nama }}</td>
                <td class="py-2 px-3 text-slate-800">
                  = <strong>{{ item.nilai }}</strong> {{ material.satuan_pakai_nama }}
                </td>
                <td class="py-2 px-3 text-center">
                  <AppBadge :variant="item.default === 1 ? 'info' : 'neutral'" size="xs">
                    {{ item.default === 1 ? 'Default' : 'Alternatif' }}
                  </AppBadge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Audit Metadata Footer -->
      <div
        class="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400"
      >
        <span>Dibuat: {{ material.created_at || '-' }}</span>
        <span>Diperbarui: {{ material.updated_at || '-' }}</span>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end w-full">
        <AppButton variant="secondary" size="sm" @click="emit('update:modelValue', false)">
          Tutup
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>
