<script setup lang="ts">
import type { CoaAccount } from '../types/coa.types'
import {
  FileText,
  Database,
  CheckCircle2,
  ExternalLink
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const props = defineProps<{
  isOpen: boolean
  account: CoaAccount | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'edit', accountId: number): void
}>()

const router = useRouter()

function formatDate(isoStr?: string | null) {
  if (!isoStr) return '-'
  return new Date(isoStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function navigateToGeneralLedger() {
  // General Ledger report link if route exists, or informational
  emit('close')
  router.push(`/accounting/general-ledger?account=${props.account?.id}`)
}
</script>

<template>
  <div
    v-if="isOpen && account"
    class="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-2xs flex items-center justify-center p-4"
    @click.self="emit('close')"
  >
    <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200">
      <!-- Header -->
      <div class="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700">
            <FileText class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-800">
                {{ account.no_ref }}
              </span>
              <h3 class="text-base font-bold text-gray-900">{{ account.nama }}</h3>
            </div>
            <p class="text-xs text-gray-500 mt-0.5">{{ account.coa_name }} &bull; {{ account.induk_nama }}</p>
          </div>
        </div>
        <button
          type="button"
          class="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
          @click="emit('close')"
        >
          &times;
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-5 text-xs text-gray-700">
        <!-- Grid Attributes -->
        <div class="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-lg border border-gray-200">
          <div>
            <span class="text-gray-400 block text-2xs uppercase tracking-wider font-semibold">Kelompok Akun</span>
            <span class="font-medium text-gray-900">{{ account.coa_name || '-' }}</span>
          </div>
          <div>
            <span class="text-gray-400 block text-2xs uppercase tracking-wider font-semibold">Induk Akun</span>
            <span class="font-medium text-gray-900">
              <span class="font-mono text-2xs mr-1">[{{ account.induk_no_akun }}]</span>
              {{ account.induk_nama || '-' }}
            </span>
          </div>
          <div>
            <span class="text-gray-400 block text-2xs uppercase tracking-wider font-semibold">Saldo Normal</span>
            <span
              :class="[
                'inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold uppercase mt-0.5 border',
                account.saldo_normal === 'D'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              ]"
            >
              {{ account.saldo_normal === 'D' ? 'Debit (D)' : 'Kredit (K)' }}
            </span>
          </div>
          <div>
            <span class="text-gray-400 block text-2xs uppercase tracking-wider font-semibold">Status Rekening</span>
            <span
              :class="[
                'inline-flex items-center px-2 py-0.5 rounded text-2xs font-medium mt-0.5 border',
                account.is_active === 1
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-gray-100 text-gray-600 border-gray-200'
              ]"
            >
              {{ account.is_active === 1 ? 'Aktif' : 'Nonaktif' }}
            </span>
          </div>
        </div>

        <!-- Transaction Usage Card -->
        <div class="border border-gray-200 rounded-lg p-4 space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="font-bold text-gray-900 flex items-center text-xs">
              <Database class="w-4 h-4 text-teal-600 mr-1.5" />
              Penggunaan dalam Transaksi Akuntansi
            </h4>
            <span
              v-if="account.is_used"
              class="inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold bg-teal-50 text-teal-700 border border-teal-200"
            >
              <CheckCircle2 class="w-3 h-3 mr-1 text-teal-600" />
              Sudah Digunakan
            </span>
            <span
              v-else
              class="inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold bg-slate-50 text-slate-500 border border-slate-200"
            >
              Belum Pernah Digunakan
            </span>
          </div>

          <div class="grid grid-cols-2 gap-3 text-xs pt-1">
            <div class="bg-white p-2.5 rounded border border-gray-100">
              <span class="text-gray-400 block text-2xs">Total Transaksi Tercatat</span>
              <span class="text-lg font-bold text-gray-900">{{ account.transaction_count || 0 }}</span>
              <span class="text-2xs text-gray-400 ml-1">entri jurnal / kas</span>
            </div>

            <div class="bg-white p-2.5 rounded border border-gray-100">
              <span class="text-gray-400 block text-2xs">Tanggal Transaksi Terakhir</span>
              <span class="font-medium text-gray-800 text-xs mt-1 block">
                {{ formatDate(account.last_transaction_date) }}
              </span>
            </div>
          </div>

          <p v-if="account.is_used" class="text-2xs text-gray-500 italic">
            * Rekening yang telah memiliki transaksi dilindungi dari penghapusan dan pengubahan kode akun demi integritas audit akuntansi.
          </p>
        </div>

        <!-- Timestamps -->
        <div class="text-2xs text-gray-400 flex items-center justify-between pt-1">
          <span>Dibuat: {{ formatDate(account.create_at) }}</span>
          <span v-if="account.updated_at">Diperbarui: {{ formatDate(account.updated_at) }}</span>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <button
          type="button"
          class="px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition-colors flex items-center"
          @click="navigateToGeneralLedger"
        >
          <ExternalLink class="w-3.5 h-3.5 mr-1" />
          Lihat di Buku Besar
        </button>

        <div class="flex items-center space-x-2">
          <button
            type="button"
            class="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            @click="emit('close')"
          >
            Tutup
          </button>
          <button
            type="button"
            class="px-4 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 shadow-sm"
            @click="emit('edit', account.id)"
          >
            Edit Rekening
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-2xs {
  font-size: 0.6875rem;
  line-height: 0.875rem;
}
</style>
