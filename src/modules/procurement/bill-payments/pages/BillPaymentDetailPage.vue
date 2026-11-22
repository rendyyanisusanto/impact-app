<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import BillPaymentStatusBadge from '../components/BillPaymentStatusBadge.vue'
import { billPaymentService } from '../services/bill-payment.service'
import type {
  BillPaymentFormValues,
  BillPaymentDetail,
  EligibleGoodsReceiptForPayment
} from '../types/bill-payment.types'
import { usePermission } from '@/shared/composables/usePermission'
import { useToast } from '@/shared/composables/useToast'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import { exportToPdf } from '@/shared/utils/pdf-export'
import { ArrowLeft, Edit2, Printer, FileText, Building2, CreditCard } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const { hasPermission } = usePermission()

const paymentId = computed(() => Number(route.params.id))
const canUpdate = computed(() => hasPermission('procurement', 'update'))

const isLoading = ref(true)
const header = ref<
  | (BillPaymentFormValues & {
      nama_suplier: string
      total: number
      total_bayar: number
      subtotal: number
      total_ppn: number
      diskon: number
      status_label: string
      status_aktif?: number
    })
  | null
>(null)
const methods = ref<BillPaymentDetail[]>([])
const linkedPbs = ref<EligibleGoodsReceiptForPayment[]>([])

const totalAlokasi = computed(() => {
  return linkedPbs.value.reduce((sum, pb) => sum + (Number(pb.nominal_alokasi) || 0), 0)
})

async function loadData() {
  isLoading.value = true
  try {
    const res = await billPaymentService.getById(paymentId.value)
    header.value = res.header
    methods.value = res.methods
    linkedPbs.value = res.linkedPbs
  } catch (err: unknown) {
    toast.error((err as Error).message || 'Gagal memuat detail Pembayaran Tagihan.')
    router.push('/procurement/bill-payments')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

function navigateBack() {
  router.push('/procurement/bill-payments')
}

function navigateToEdit() {
  router.push(`/procurement/bill-payments/${paymentId.value}/edit`)
}

function handlePrint() {
  window.print()
}

function handleExportPdf() {
  if (!header.value) return
  try {
    const exportData = linkedPbs.value.map((pb, idx) => ({
      no: idx + 1,
      kode_pb: pb.kode,
      no_po: pb.no_po || '-',
      tanggal: formatDate(pb.tanggal),
      nilai_pb: formatCurrency(pb.total_pb || 0),
      sudah_dibayar: formatCurrency(pb.sudah_dibayar || 0),
      alokasi: formatCurrency(pb.nominal_alokasi || 0),
      sisa_setelah: formatCurrency(Math.max(0, (pb.sisa_tagihan || 0) - (pb.nominal_alokasi || 0)))
    }))

    exportToPdf({
      title: `BUKTI PEMBAYARAN TAGIHAN SUPPLIER - ${header.value.kode}`,
      subtitle: `Supplier: ${header.value.nama_suplier} | No. Tagihan: ${header.value.no_tagihan} | Tgl Bayar: ${formatDate(header.value.tanggal)} | Total Bayar: ${formatCurrency(header.value.total_bayar)}`,
      filename: `Pembayaran-Tagihan-${header.value.kode}.pdf`,
      columns: [
        { label: 'No', key: 'no' },
        { label: 'Kode PB', key: 'kode_pb' },
        { label: 'No. PO', key: 'no_po' },
        { label: 'Tanggal', key: 'tanggal' },
        { label: 'Nilai PB', key: 'nilai_pb' },
        { label: 'Sudah Dibayar', key: 'sudah_dibayar' },
        { label: 'Nominal Alokasi', key: 'alokasi' },
        { label: 'Sisa Akhir', key: 'sisa_setelah' }
      ],
      data: exportData
    })
    toast.success('File PDF berhasil dibuat.')
  } catch (err: unknown) {
    toast.error((err as Error).message || 'Gagal membuat file PDF.')
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header & Action Buttons -->
    <AppPageHeader
      :title="`Detail Pembayaran: ${header?.kode || ''}`"
      description="Lihat rincian lengkap pembayaran faktur supplier dan alokasi penerimaan barang."
      :breadcrumbs="[
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Pengadaan', to: '/procurement/purchase-orders' },
        { label: 'Pembayaran Tagihan', to: '/procurement/bill-payments' },
        { label: header?.kode || 'Detail' }
      ]"
    >
      <template #actions>
        <div class="flex items-center gap-2">
          <!-- Back Button -->
          <AppButton variant="outline" size="md" @click="navigateBack">
            <ArrowLeft class="w-4 h-4 mr-1.5" />
            <span>Kembali</span>
          </AppButton>

          <!-- Edit Button -->
          <AppButton
            v-if="canUpdate && header?.status !== 1 && header?.status_aktif !== 0"
            variant="primary"
            size="md"
            @click="navigateToEdit"
          >
            <Edit2 class="w-4 h-4 mr-1.5" />
            <span>Edit Pembayaran</span>
          </AppButton>

          <!-- Export PDF -->
          <AppButton variant="outline" size="md" @click="handleExportPdf">
            <FileText class="w-4 h-4 mr-1.5 text-rose-600" />
            <span>Ekspor PDF</span>
          </AppButton>

          <!-- Print -->
          <AppButton
            variant="outline"
            size="md"
            title="Cetak Bukti Pembayaran"
            @click="handlePrint"
          >
            <Printer class="w-4 h-4 text-slate-600" />
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <div v-if="isLoading" class="p-12 text-center text-slate-400 text-xs">
      Memuat detail pembayaran tagihan...
    </div>

    <template v-else-if="header">
      <!-- Section 1: Header Metadata Card -->
      <div class="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2">
            <Building2 class="w-5 h-5 text-teal-700" />
            <h2 class="text-sm font-semibold text-slate-800 uppercase tracking-wider">
              Informasi Bukti Pembayaran
            </h2>
          </div>
          <BillPaymentStatusBadge
            :status="header.status"
            :status-aktif="header.status_aktif"
          />
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <div class="text-slate-500 font-medium">Kode Pembayaran:</div>
            <div class="font-mono font-bold text-slate-900 mt-0.5 text-sm">
              {{ header.kode }}
            </div>
          </div>

          <div>
            <div class="text-slate-500 font-medium">Tanggal Bayar:</div>
            <div class="font-semibold text-slate-800 mt-0.5">
              {{ formatDate(header.tanggal) }}
            </div>
          </div>

          <div>
            <div class="text-slate-500 font-medium">No. Tagihan / Invoice:</div>
            <div class="font-mono font-bold text-slate-800 mt-0.5">
              {{ header.no_tagihan }}
            </div>
          </div>

          <div>
            <div class="text-slate-500 font-medium">Jatuh Tempo:</div>
            <div class="text-slate-800 mt-0.5">
              {{ header.jatuh_tempo ? formatDate(header.jatuh_tempo) : '-' }}
            </div>
          </div>

          <div>
            <div class="text-slate-500 font-medium">Supplier:</div>
            <div class="font-bold text-teal-900 mt-0.5">
              {{ header.nama_suplier }}
            </div>
          </div>

          <div>
            <div class="text-slate-500 font-medium">Penagih / Kolektor:</div>
            <div class="text-slate-800 mt-0.5">
              {{ header.penagih || '-' }}
            </div>
          </div>

          <div class="md:col-span-2">
            <div class="text-slate-500 font-medium">Keterangan:</div>
            <div class="text-slate-700 mt-0.5">
              {{ header.keterangan || '-' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Section 2: Dokumen PB yang Dibayar -->
      <div class="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-3">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2">
            <FileText class="w-5 h-5 text-teal-700" />
            <h2 class="text-sm font-semibold text-slate-800 uppercase tracking-wider">
              Dokumen Penerimaan Barang (PB) Terkait & Alokasi Pembayaran
            </h2>
          </div>
          <span class="text-xs text-slate-500 font-medium">
            {{ linkedPbs.length }} Dokumen PB
          </span>
        </div>

        <div class="overflow-x-auto border border-slate-200 rounded-lg">
          <table class="w-full text-xs text-left">
            <thead class="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th class="px-3 py-2.5">No</th>
                <th class="px-3 py-2.5">Kode PB</th>
                <th class="px-3 py-2.5">No. PO</th>
                <th class="px-3 py-2.5">Tanggal</th>
                <th class="px-3 py-2.5 text-right">Nilai PB</th>
                <th class="px-3 py-2.5 text-right">Sudah Dibayar</th>
                <th class="px-3 py-2.5 text-right">Sisa Sebelum</th>
                <th class="px-3 py-2.5 text-right text-teal-800">Nominal Alokasi</th>
                <th class="px-3 py-2.5 text-right">Sisa Sesudah</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              <tr v-for="(pb, idx) in linkedPbs" :key="pb.id">
                <td class="px-3 py-2 text-slate-500">{{ idx + 1 }}</td>
                <td class="px-3 py-2 font-mono font-medium text-teal-800">{{ pb.kode }}</td>
                <td class="px-3 py-2 font-mono text-slate-600">{{ pb.no_po || '-' }}</td>
                <td class="px-3 py-2 whitespace-nowrap">{{ formatDate(pb.tanggal) }}</td>
                <td class="px-3 py-2 text-right font-mono">{{ formatCurrency(pb.total_pb) }}</td>
                <td class="px-3 py-2 text-right font-mono text-slate-500">
                  {{ formatCurrency(pb.sudah_dibayar) }}
                </td>
                <td class="px-3 py-2 text-right font-mono text-rose-700 font-semibold">
                  {{ formatCurrency(pb.sisa_tagihan) }}
                </td>
                <td class="px-3 py-2 text-right font-mono font-bold text-teal-700 bg-teal-50/50">
                  {{ formatCurrency(pb.nominal_alokasi || 0) }}
                </td>
                <td class="px-3 py-2 text-right font-mono">
                  <span
                    :class="
                      Math.max(0, pb.sisa_tagihan - (pb.nominal_alokasi || 0)) <= 0
                        ? 'text-emerald-700 font-semibold'
                        : 'text-slate-700'
                    "
                  >
                    {{ formatCurrency(Math.max(0, pb.sisa_tagihan - (pb.nominal_alokasi || 0))) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Section 3: Rincian Metode Pembayaran -->
      <div class="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-3">
        <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
          <CreditCard class="w-5 h-5 text-teal-700" />
          <h2 class="text-sm font-semibold text-slate-800 uppercase tracking-wider">
            Rincian Metode Pembayaran
          </h2>
        </div>

        <div class="overflow-x-auto border border-slate-200 rounded-lg">
          <table class="w-full text-xs text-left">
            <thead class="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th class="px-3 py-2.5">No</th>
                <th class="px-3 py-2.5">Metode Pembayaran</th>
                <th class="px-3 py-2.5">Rekening Bank</th>
                <th class="px-3 py-2.5 text-right">Nominal Bayar</th>
                <th class="px-3 py-2.5">Catatan</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              <tr v-for="(m, idx) in methods" :key="m.id">
                <td class="px-3 py-2 text-slate-500">{{ idx + 1 }}</td>
                <td class="px-3 py-2 font-medium">{{ m.metode_pembayaran }}</td>
                <td class="px-3 py-2 text-slate-600">
                  {{ m.bank_id ? `Bank ID #${m.bank_id}` : '-' }}
                </td>
                <td class="px-3 py-2 text-right font-mono font-bold text-emerald-700">
                  {{ formatCurrency(m.jumlah || 0) }}
                </td>
                <td class="px-3 py-2 text-slate-600">{{ m.keterangan || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Section 4: Ringkasan Finansial Card -->
      <div class="bg-slate-900 text-white rounded-lg p-5 shadow-sm">
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <div class="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
              Total Tagihan Dokumen
            </div>
            <div class="text-sm font-semibold font-mono mt-1 text-slate-100">
              {{ formatCurrency(header.total) }}
            </div>
          </div>

          <div>
            <div class="text-[11px] text-teal-300 font-medium uppercase tracking-wider">
              Total Alokasi Dokumen
            </div>
            <div class="text-sm font-semibold font-mono mt-1 text-teal-300">
              {{ formatCurrency(totalAlokasi) }}
            </div>
          </div>

          <div>
            <div class="text-[11px] text-emerald-400 font-medium uppercase tracking-wider">
              Nominal Dibayarkan
            </div>
            <div class="text-base font-bold font-mono mt-1 text-emerald-400">
              {{ formatCurrency(header.total_bayar) }}
            </div>
          </div>

          <div>
            <div class="text-[11px] text-amber-400 font-medium uppercase tracking-wider">
              Sisa Tagihan Akhir
            </div>
            <div class="text-sm font-semibold font-mono mt-1 text-amber-300">
              {{ formatCurrency(Math.max(0, header.total - header.total_bayar)) }}
            </div>
          </div>

          <div>
            <div class="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
              Status Pelunasan
            </div>
            <div class="mt-1">
              <span
                v-if="header.status_aktif === 0"
                class="inline-block px-2.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-400/30 rounded-full text-xs font-semibold"
              >
                Dibatalkan
              </span>
              <span
                v-else-if="header.status === 1"
                class="inline-block px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-semibold"
              >
                Lunas
              </span>
              <span
                v-else-if="header.total_bayar > 0"
                class="inline-block px-2.5 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-400/30 rounded-full text-xs font-semibold"
              >
                Parsial
              </span>
              <span
                v-else
                class="inline-block px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded-full text-xs font-semibold"
              >
                Belum Lunas
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
