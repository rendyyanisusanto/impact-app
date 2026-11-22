<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import { ref, onMounted, computed } from 'vue'
import type { GoodsReceiptFormValues, EligiblePurchaseOrder } from '../types/goods-receipt.types'
import { goodsReceiptService } from '../services/goods-receipt.service'
import { usePermission } from '@/shared/composables/usePermission'
import GoodsReceiptSettingTableModal from './GoodsReceiptSettingTableModal.vue'
import { Wand2, Settings, Building2, Truck, FileText } from 'lucide-vue-next'

const props = defineProps<{
  header: GoodsReceiptFormValues
  selectedPoInfo: {
    kode_po: string
    suplier_id: number | null
    nama_suplier: string
  }
  errors?: Record<string, string>
  disabled?: boolean
  isEditing?: boolean
}>()

const emit = defineEmits<{
  (e: 'generate-code'): void
  (e: 'po-changed', poId: number): void
}>()

const poOptions = ref<EligiblePurchaseOrder[]>([])
const warehouseOptions = ref<Array<{ id: number; nama: string; kode?: string }>>([])
const isLoadingLookups = ref(true)

const { hasPermission } = usePermission()
const canManageSettings = computed(() => hasPermission('procurement', 'update'))
const isSettingModalOpen = ref(false)

function onSettingSaved() {
  emit('generate-code')
}

onMounted(async () => {
  try {
    const [pos, warehouses] = await Promise.all([
      goodsReceiptService.getEligiblePurchaseOrders(),
      goodsReceiptService.getWarehouses()
    ])
    poOptions.value = pos
    warehouseOptions.value = warehouses
    if (!props.isEditing && warehouses.length > 0) {
      if (!props.header.gudang_id || !warehouses.some(w => w.id === props.header.gudang_id)) {
        props.header.gudang_id = warehouses[0].id
      }
    }
  } finally {
    isLoadingLookups.value = false
  }
})

function onPoSelect(event: Event) {
  const target = event.target as HTMLSelectElement
  const val = Number(target.value)
  if (val) {
    emit('po-changed', val)
  }
}
</script>

<template>
  <div class="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
    <div class="border-b border-slate-100 pb-3 flex items-center justify-between">
      <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
        <FileText class="w-4 h-4 text-teal-600" />
        <span>Informasi Dokumen Penerimaan Barang</span>
      </h3>
      <span class="text-xs text-slate-500 font-medium">
        * Bidang bertanda bintang wajib diisi
      </span>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Left Column -->
      <div class="space-y-4">
        <!-- 1. Kode PB -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Kode PB <span class="text-rose-500">*</span>
          </label>
          <div class="flex items-center gap-2">
            <input
              v-model="header.kode"
              type="text"
              placeholder="Contoh: PB/2611-0001"
              :disabled="disabled"
              class="w-full px-3 py-1.5 text-xs bg-slate-50 border rounded font-mono focus:bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none transition-colors"
              :class="errors?.kode ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'"
            />
            <button
              v-if="!isEditing"
              type="button"
              class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium flex items-center gap-1 border border-slate-300 transition-colors"
              title="Buat kode otomatis"
              :disabled="disabled"
              @click="$emit('generate-code')"
            >
              <Wand2 class="w-3.5 h-3.5 text-teal-600" />
              <span>Auto</span>
            </button>
            <button
              v-if="!isEditing && canManageSettings"
              type="button"
              class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium flex items-center gap-1 border border-slate-300 transition-colors whitespace-nowrap"
              title="Pengaturan Format Kode Penerimaan Barang"
              :disabled="disabled"
              @click="isSettingModalOpen = true"
            >
              <Settings class="w-3.5 h-3.5 text-slate-600" />
              <span>Setting Table</span>
            </button>
          </div>
          <p v-if="errors?.kode" class="mt-1 text-[11px] text-rose-600">
            {{ errors.kode }}
          </p>
        </div>

        <!-- 2. Pilih Purchase Order -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Pilih Purchase Order (PO) <span class="text-rose-500">*</span>
          </label>
          <select
            :value="header.purchase_order_id || ''"
            :disabled="disabled || isEditing"
            class="w-full px-3 py-1.5 text-xs bg-white border rounded focus:ring-1 focus:ring-teal-500 focus:outline-none transition-colors"
            :class="
              errors?.purchase_order_id ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
            "
            @change="onPoSelect"
          >
            <option value="" disabled>-- Pilih Purchase Order yang disetujui --</option>
            <option
              v-for="po in poOptions"
              :key="po.id"
              :value="po.id"
              :disabled="po.fully_received && po.id !== header.purchase_order_id"
            >
              {{ po.kode }} - {{ po.nama_suplier }} ({{ po.tanggal }})
              {{ po.fully_received ? ' [Lengkap]' : '' }}
            </option>
          </select>
          <p v-if="errors?.purchase_order_id" class="mt-1 text-[11px] text-rose-600">
            {{ errors.purchase_order_id }}
          </p>
          <p v-if="isEditing" class="mt-1 text-[11px] text-slate-400 italic">
            Referensi PO tidak dapat diubah saat mengedit dokumen penerimaan barang.
          </p>
        </div>

        <!-- Contextual Supplier display -->
        <div
          v-if="selectedPoInfo.nama_suplier"
          class="p-2.5 bg-teal-50/70 border border-teal-200/80 rounded flex items-center justify-between text-xs"
        >
          <div class="flex items-center gap-2">
            <Building2 class="w-4 h-4 text-teal-700 shrink-0" />
            <div>
              <span class="text-slate-500 text-[11px] block">Supplier (dari PO):</span>
              <span class="font-bold text-slate-800">{{ selectedPoInfo.nama_suplier }}</span>
            </div>
          </div>
          <span
            class="text-[11px] font-mono text-teal-800 font-medium bg-white px-2 py-0.5 border border-teal-200 rounded"
          >
            {{ selectedPoInfo.kode_po }}
          </span>
        </div>

        <!-- 3. Tanggal Penerimaan -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Tanggal Penerimaan <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="header.tanggal"
            type="date"
            :disabled="disabled"
            class="w-full px-3 py-1.5 text-xs bg-white border rounded focus:ring-1 focus:ring-teal-500 focus:outline-none transition-colors"
            :class="errors?.tanggal ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'"
          />
          <p v-if="errors?.tanggal" class="mt-1 text-[11px] text-rose-600">
            {{ errors.tanggal }}
          </p>
        </div>

        <!-- 4. Gudang Tujuan -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Gudang Penerimaan <span class="text-rose-500">*</span>
          </label>
          <select
            v-model="header.gudang_id"
            :disabled="disabled"
            class="w-full px-3 py-1.5 text-xs bg-white border rounded focus:ring-1 focus:ring-teal-500 focus:outline-none transition-colors"
            :class="errors?.gudang_id ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'"
          >
            <option :value="null" disabled>-- Pilih Gudang Tujuan --</option>
            <option v-for="g in warehouseOptions" :key="g.id" :value="g.id">
              {{ g.nama }} ({{ g.kode || 'GD' }})
            </option>
          </select>
          <p v-if="errors?.gudang_id" class="mt-1 text-[11px] text-rose-600">
            {{ errors.gudang_id }}
          </p>
        </div>

        <!-- 5. Nomor Surat Jalan -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Nomor Surat Jalan (DO) <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="header.no_surat_jalan"
            type="text"
            placeholder="Contoh: SJ-2024-XXXX"
            :disabled="disabled"
            class="w-full px-3 py-1.5 text-xs bg-white border rounded focus:ring-1 focus:ring-teal-500 focus:outline-none transition-colors"
            :class="errors?.no_surat_jalan ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'"
          />
          <p v-if="errors?.no_surat_jalan" class="mt-1 text-[11px] text-rose-600">
            {{ errors.no_surat_jalan }}
          </p>
        </div>
      </div>

      <!-- Right Column -->
      <div class="space-y-4">
        <!-- 6. Nama Pengirim / Ekspedisi -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Nama Pengirim / Driver / Ekspedisi
          </label>
          <div class="relative">
            <Truck class="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              v-model="header.nama_pengirim"
              type="text"
              placeholder="Nama driver atau armada pengirim..."
              :disabled="disabled"
              class="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <!-- 7. PPN -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Pengaturan Pajak (PPN)
          </label>
          <div
            class="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between"
          >
            <div class="flex items-center gap-2">
              <input
                id="is-ppn-pb"
                v-model="header.is_ppn"
                type="checkbox"
                :disabled="disabled"
                class="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
              <label for="is-ppn-pb" class="text-xs text-slate-700 font-medium cursor-pointer">
                Kenakan PPN ({{ header.ppn_persen }}%)
              </label>
            </div>
            <span
              class="text-[11px] font-semibold px-2 py-0.5 rounded border"
              :class="
                header.is_ppn
                  ? 'bg-teal-50 text-teal-700 border-teal-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              "
            >
              {{ header.is_ppn ? 'PPN Aktif' : 'Non PPN' }}
            </span>
          </div>
        </div>

        <!-- 8. Status Dokumen -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1"> Status Penerimaan </label>
          <select
            v-model="header.status"
            :disabled="disabled"
            class="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none"
          >
            <option :value="1">Diterima (Final)</option>
            <option :value="0">Draft</option>
          </select>
          <p class="mt-1 text-[11px] text-slate-500">
            Penerimaan status "Diterima" menandakan barang fisik telah diverifikasi di gudang.
          </p>
        </div>

        <!-- 9. Keterangan / Catatan -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Catatan / Kondisi Barang Diterima
          </label>
          <textarea
            v-model="header.keterangan"
            rows="3"
            placeholder="Catatan kondisi fisik kemasan, surat jalan, atau keterangan penting lainnya..."
            :disabled="disabled"
            class="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none transition-colors resize-none"
          />
        </div>
      </div>
    </div>

    <!-- Setting Table Modal -->
    <GoodsReceiptSettingTableModal
      v-model="isSettingModalOpen"
      @saved="onSettingSaved"
    />
  </div>
</template>
