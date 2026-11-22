<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  Clock,
  History,
  User,
  PlusCircle,
  Edit,
  Calendar,
  Printer,
  XCircle,
  Receipt
} from 'lucide-vue-next'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppSkeleton from '@/shared/components/ui/AppSkeleton.vue'
import type { SalesOrderListItem } from '../types/sales-order.types'
import type { HistoriTable } from '../types/sales-history.types'
import { salesOrderTransactionService } from '../services/sales-order-transaction.service'

const props = defineProps<{
  isOpen: boolean
  order: SalesOrderListItem | null
}>()

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void
}>()

const historyList = ref<HistoriTable[]>([])
const isLoading = ref(false)

async function loadHistory(): Promise<void> {
  if (!props.order) {
    historyList.value = []
    return
  }

  isLoading.value = true
  try {
    historyList.value = await salesOrderTransactionService.getHistory(props.order.id)
  } catch (error) {
    console.error('Failed to load history:', error)
  } finally {
    isLoading.value = false
  }
}

watch(
  () => [props.isOpen, props.order?.id],
  ([isOpen]) => {
    if (isOpen) {
      loadHistory()
    }
  }
)

function getMethodBadgeClass(metode: string): string {
  switch (metode) {
    case 'CREATE':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'UPDATE':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'EDIT_DATE':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'PRINT':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'CANCEL':
    case 'INVOICE_CANCEL':
      return 'bg-rose-100 text-rose-800 border-rose-200'
    case 'INVOICE_CREATE':
      return 'bg-teal-100 text-teal-800 border-teal-200'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

function getMethodIcon(metode: string) {
  switch (metode) {
    case 'CREATE':
      return PlusCircle
    case 'UPDATE':
      return Edit
    case 'EDIT_DATE':
      return Calendar
    case 'PRINT':
      return Printer
    case 'CANCEL':
    case 'INVOICE_CANCEL':
      return XCircle
    case 'INVOICE_CREATE':
      return Receipt
    default:
      return History
  }
}
</script>

<template>
  <AppModal
    :model-value="isOpen"
    title="History Sales Order"
    size="lg"
    @update:model-value="emit('update:isOpen', $event)"
  >
    <div class="space-y-4">
      <!-- Order Info Bar -->
      <div
        v-if="order"
        class="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2"
      >
        <div class="flex items-center gap-2">
          <span class="font-medium text-slate-500">Nomor Dokumen:</span>
          <span class="font-bold text-slate-800 font-mono">{{ order.kode }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="font-medium text-slate-500">Customer:</span>
          <span class="font-semibold text-slate-800">{{ order.customer_nama }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="font-medium text-slate-500">Tanggal:</span>
          <span class="font-medium text-slate-800 font-mono">{{ order.tanggal }}</span>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="space-y-3 py-4">
        <AppSkeleton class="h-16 w-full rounded-lg" />
        <AppSkeleton class="h-16 w-full rounded-lg" />
        <AppSkeleton class="h-16 w-full rounded-lg" />
      </div>

      <!-- Empty State -->
      <div
        v-else-if="historyList.length === 0"
        class="text-center py-10 px-4 border border-dashed border-slate-200 rounded-xl"
      >
        <Clock class="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p class="text-sm font-medium text-slate-700">Belum ada catatan histori</p>
        <p class="text-xs text-slate-500 mt-1">
          Aktivitas transaksi untuk dokumen ini akan tercatat otomatis di sini.
        </p>
      </div>

      <!-- History Timeline List -->
      <div v-else class="max-h-96 overflow-y-auto space-y-3 pr-1">
        <div
          v-for="item in historyList"
          :key="item.id"
          class="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-slate-300 transition-colors flex items-start gap-3"
        >
          <!-- Icon -->
          <div
            class="p-2 rounded-lg border shrink-0 mt-0.5"
            :class="getMethodBadgeClass(item.metode)"
          >
            <component :is="getMethodIcon(item.metode)" class="w-4 h-4" />
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <span
                class="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border"
                :class="getMethodBadgeClass(item.metode)"
              >
                {{ item.metode }}
              </span>
              <span class="text-xs text-slate-500 font-mono flex items-center gap-1">
                <Clock class="w-3.5 h-3.5 text-slate-400" />
                {{ item.created_at }}
              </span>
            </div>

            <p class="text-xs text-slate-700 mt-1.5 leading-relaxed font-normal">
              {{ item.keterangan }}
            </p>

            <div class="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500">
              <User class="w-3 h-3 text-slate-400" />
              <span
                >Oleh:
                <strong class="text-slate-700">{{
                  item.user_nama || `User #${item.user_id}`
                }}</strong></span
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end">
        <AppButton variant="outline" size="sm" @click="emit('update:isOpen', false)">
          Tutup
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>
