<script setup lang="ts">
import { computed } from 'vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppStatusBadge from '@/shared/components/data/AppStatusBadge.vue'
import type { MasterDataCustomer } from '../types/customer.types'

const props = defineProps<{
  modelValue: boolean
  customer?: MasterDataCustomer | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
}>()

const additionalDataList = computed(() => {
  if (!props.customer) return []
  const list =
    props.customer.additional_data ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (props.customer as any).additionalData ||
    []
  return Array.isArray(list) ? list : []
})
</script>

<template>
  <AppModal
    :model-value="modelValue"
    title="Detail Master Data Customer"
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="customer" class="space-y-4 text-xs text-slate-700">
      <!-- Header Summary Card -->
      <div
        class="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between gap-3"
      >
        <div>
          <span class="text-[10px] font-bold text-teal-800 tracking-wider uppercase">
            {{ customer.kode || 'TANPA KODE' }}
          </span>
          <h3 class="text-sm font-bold text-slate-800 mt-0.5">
            {{ customer.nama }}
          </h3>
          <p class="text-[11px] text-slate-500 mt-0.5">
            {{ customer.email || 'Email tidak terdaftar' }} &bull;
            {{ customer.no_hp || 'No. HP tidak terdaftar' }}
          </p>
        </div>

        <AppStatusBadge :status="customer.status === 1 ? 'active' : 'inactive'" />
      </div>

      <!-- Main Fields Grid -->
      <div class="grid grid-cols-2 gap-3 bg-white border border-slate-200 rounded-lg p-3">
        <div>
          <p class="text-[10px] text-slate-400 font-semibold uppercase">Provinsi</p>
          <p class="font-medium text-slate-800 mt-0.5">{{ customer.province_name || '-' }}</p>
        </div>

        <div>
          <p class="text-[10px] text-slate-400 font-semibold uppercase">Kota / Kabupaten</p>
          <p class="font-medium text-slate-800 mt-0.5">{{ customer.city_name || '-' }}</p>
        </div>

        <div class="col-span-2">
          <p class="text-[10px] text-slate-400 font-semibold uppercase">
            Alamat Pengiriman / Kantor
          </p>
          <p class="font-medium text-slate-800 mt-0.5 whitespace-pre-wrap">
            {{ customer.alamat || '-' }}
          </p>
        </div>

        <div class="col-span-2">
          <p class="text-[10px] text-slate-400 font-semibold uppercase">
            Deskripsi / Catatan Khusus
          </p>
          <p class="font-medium text-slate-800 mt-0.5">{{ customer.deskripsi || '-' }}</p>
        </div>
      </div>

      <!-- Additional Data Section -->
      <div class="space-y-2">
        <h4 class="text-xs font-bold text-slate-800">Informasi Tambahan (NPWP, PIC & Termin)</h4>

        <div
          v-if="additionalDataList.length === 0"
          class="p-2.5 text-center bg-slate-50 border border-slate-200 rounded-md text-slate-400 text-xs"
        >
          Tidak ada informasi tambahan terdaftar.
        </div>

        <div v-else class="border border-slate-200 rounded-lg overflow-hidden">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th class="py-2 px-3 w-1/3">Keterangan</th>
                <th class="py-2 px-3">Nilai / Detail</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="item in additionalDataList"
                :key="item.id || item.name"
                class="hover:bg-slate-50/50"
              >
                <td class="py-2 px-3 font-medium text-slate-700">{{ item.name }}</td>
                <td class="py-2 px-3 text-slate-800">{{ item.value }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Audit Metadata Footer -->
      <div
        class="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400"
      >
        <span>Dibuat: {{ customer.created_at || '-' }}</span>
        <span>Diperbarui: {{ customer.updated_at || '-' }}</span>
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
