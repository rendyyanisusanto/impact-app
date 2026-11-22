<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import { ref, onMounted, computed } from 'vue'
import type { PurchaseOrderFormValues } from '../types/purchase-order.types'
import { purchaseOrderService } from '../services/purchase-order.service'
import { usePermission } from '@/shared/composables/usePermission'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import AppSearchableSelect from '@/shared/components/ui/AppSearchableSelect.vue'
import AppCheckbox from '@/shared/components/ui/AppCheckbox.vue'
import AppTextarea from '@/shared/components/ui/AppTextarea.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import PurchaseOrderSettingTableModal from './PurchaseOrderSettingTableModal.vue'
import { Sparkles, Settings } from 'lucide-vue-next'

defineProps<{
  header: PurchaseOrderFormValues
  errors?: Record<string, string>
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'generate-code'): void
}>()

const { hasPermission } = usePermission()
const isSettingModalOpen = ref(false)
const canManageSettings = computed(
  () => hasPermission('procurement', 'update') || hasPermission('procurement', 'create')
)

function handleSettingSaved() {
  emit('generate-code')
}

const supplierOptions = ref<Array<{ value: number; label: string }>>([])
const statusTransaksiOptions = ref<Array<{ value: number; label: string }>>([])
const activeTaxRate = ref(11)

onMounted(async () => {
  const [suppliers, stList, taxes] = await Promise.all([
    purchaseOrderService.getSuppliers(),
    purchaseOrderService.getStatusTransaksiList(),
    purchaseOrderService.getTaxes()
  ])

  supplierOptions.value = suppliers.map(s => ({
    value: s.id,
    label: `${s.nama} (${s.kode || 'SUP'})`
  }))

  statusTransaksiOptions.value = stList.map(st => ({
    value: st.id,
    label: st.status_transaksi
  }))

  const activeTax = taxes.find(t => t.is_active === 1)
  if (activeTax) {
    activeTaxRate.value = activeTax.nama
  }
})
</script>

<template>
  <div class="bg-white rounded-lg border border-slate-200 shadow-sm p-4 md:p-6 mb-6">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
      <!-- Left Column -->
      <div class="space-y-4">
        <!-- Kode PO with Auto Generate Button -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Kode PO <span class="text-rose-500">*</span>
          </label>
          <div class="flex items-center gap-2">
            <div class="flex-1">
              <AppInput
                v-model="header.kode"
                placeholder="Contoh: PO/30-12-24-0001"
                :disabled="disabled"
                :error="errors?.kode"
              />
            </div>
            <AppButton
              type="button"
              variant="outline"
              size="md"
              class="whitespace-nowrap"
              title="Generate Kode Otomatis"
              :disabled="disabled"
              @click="emit('generate-code')"
            >
              <Sparkles class="w-4 h-4 mr-1 text-teal-600" />
              Generate
            </AppButton>
            <AppButton
              v-if="canManageSettings"
              type="button"
              variant="outline"
              size="md"
              class="whitespace-nowrap"
              title="Pengaturan Format Kode Purchase Order"
              :disabled="disabled"
              @click="isSettingModalOpen = true"
            >
              <Settings class="w-4 h-4 mr-1 text-slate-600" />
              Setting Table
            </AppButton>
          </div>
          <p v-if="errors?.kode" class="text-xs text-rose-600 mt-1">{{ errors.kode }}</p>
        </div>

        <!-- Supplier Select -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Supplier <span class="text-rose-500">*</span>
          </label>
          <AppSearchableSelect
            v-model="header.suplier_id"
            :options="supplierOptions"
            placeholder="Pilih Supplier..."
            :disabled="disabled"
          />
          <p v-if="errors?.suplier_id" class="text-xs text-rose-600 mt-1">
            {{ errors.suplier_id }}
          </p>
        </div>

        <!-- Tanggal PO -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Tanggal PO <span class="text-rose-500">*</span>
          </label>
          <AppInput
            v-model="header.tanggal"
            type="date"
            :disabled="disabled"
            :error="errors?.tanggal"
          />
          <p v-if="errors?.tanggal" class="text-xs text-rose-600 mt-1">{{ errors.tanggal }}</p>
        </div>
      </div>

      <!-- Right Column -->
      <div class="space-y-4">
        <!-- Keterangan -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Keterangan / Catatan
          </label>
          <AppTextarea
            v-model="header.keterangan"
            placeholder="Catatan tambahan untuk purchase order..."
            :rows="2"
            :disabled="disabled"
          />
        </div>

        <!-- PPN & Status Transaksi in compact row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Status Transaksi (CASH / JATUH TEMPO) -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Status Transaksi <span class="text-rose-500">*</span>
            </label>
            <AppSelect
              v-model="header.status_transaksi_id"
              :options="statusTransaksiOptions"
              placeholder="Pilih Status..."
              :disabled="disabled"
            />
            <p v-if="errors?.status_transaksi_id" class="text-xs text-rose-600 mt-1">
              {{ errors.status_transaksi_id }}
            </p>
          </div>

          <!-- Status Dokumen (Draft / Disetujui) -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Status Dokumen
            </label>
            <AppSelect
              v-model="header.status"
              :options="[
                { value: 0, label: 'Draft' },
                { value: 1, label: 'Disetujui' }
              ]"
              :disabled="disabled"
            />
          </div>
        </div>

        <!-- PPN Checkbox -->
        <div class="pt-2">
          <label class="inline-flex items-center gap-3 cursor-pointer select-none">
            <AppCheckbox v-model="header.is_ppn" :disabled="disabled" />
            <span class="text-sm font-medium text-slate-800">
              Dikenakan PPN ({{ activeTaxRate }}%)
            </span>
          </label>
          <p class="text-xs text-slate-500 ml-7">
            Centang jika transaksi ini memungut PPN sesuai tarif perpajakan aktif.
          </p>
        </div>
      </div>
    </div>

    <!-- Modal Setting Table (Sprint 15 Fitur Baru) -->
    <PurchaseOrderSettingTableModal
      v-model="isSettingModalOpen"
      @saved="handleSettingSaved"
    />
  </div>
</template>
