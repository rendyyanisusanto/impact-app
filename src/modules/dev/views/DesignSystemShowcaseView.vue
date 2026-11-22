<script setup lang="ts">
import { ref } from 'vue'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppTabs from '@/shared/components/navigation/AppTabs.vue'
import AppCard from '@/shared/components/ui/AppCard.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppIconButton from '@/shared/components/ui/AppIconButton.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppTextarea from '@/shared/components/ui/AppTextarea.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import AppCheckbox from '@/shared/components/ui/AppCheckbox.vue'
import AppRadio from '@/shared/components/ui/AppRadio.vue'
import AppBadge from '@/shared/components/ui/AppBadge.vue'
import AppStatusBadge from '@/shared/components/data/AppStatusBadge.vue'
import AppDivider from '@/shared/components/ui/AppDivider.vue'
import AppSpinner from '@/shared/components/ui/AppSpinner.vue'
import AppSkeleton from '@/shared/components/ui/AppSkeleton.vue'
import AppFormField from '@/shared/components/ui/AppFormField.vue'
import AppFormSection from '@/shared/components/ui/AppFormSection.vue'
import AppAlert from '@/shared/components/feedback/AppAlert.vue'
import AppEmptyState from '@/shared/components/feedback/AppEmptyState.vue'
import AppLoadingState from '@/shared/components/feedback/AppLoadingState.vue'
import AppDataTable from '@/shared/components/data/AppDataTable.vue'
import AppTableToolbar from '@/shared/components/data/AppTableToolbar.vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppDropdown from '@/shared/components/navigation/AppDropdown.vue'
import { useToast } from '@/shared/composables/useToast'
import { useConfirm } from '@/shared/composables/useConfirm'
import type { TableColumn } from '@/shared/types/table.types'
import {
  Plus as PlusIcon,
  Search as SearchIcon,
  Trash2 as TrashIcon,
  Edit2 as EditIcon,
  Sparkles as SparklesIcon,
  Bell as BellIcon,
  HelpCircle as HelpIcon,
  Download as DownloadIcon
} from 'lucide-vue-next'

const toast = useToast()
const { confirm } = useConfirm()

const activeTab = ref('buttons')
const showcaseTabs = [
  { id: 'buttons', label: 'Buttons & Icons' },
  { id: 'forms', label: 'Form Controls' },
  { id: 'feedback', label: 'Alerts & Feedback' },
  { id: 'data', label: 'Data Table & Badges' },
  { id: 'tokens', label: 'Colors & Typography' }
]

// Form states
const sampleInput = ref('Impact Furniture')
const sampleClearable = ref('Teks yang dapat dihapus')
const sampleError = ref('Data salah')
const sampleSelect = ref('jepara')
const sampleTextarea = ref('Catatan pesanan furniture custom meja makan kayu jati.')
const sampleCheckbox = ref(true)
const sampleRadio = ref('option1')

// Modal state
const isModalOpen = ref(false)
const modalSize = ref<'sm' | 'md' | 'lg' | 'xl'>('md')

// Table sample
interface ShowcaseItem {
  id: number
  code: string
  name: string
  category: string
  price: number
  status: string
}

const sampleColumns: TableColumn<ShowcaseItem>[] = [
  { key: 'code', label: 'Kode Produk', sortable: true, width: '120px' },
  { key: 'name', label: 'Nama Produk', sortable: true },
  { key: 'category', label: 'Kategori', sortable: true },
  {
    key: 'price',
    label: 'Harga Satuan',
    sortable: true,
    align: 'right',
    formatter: (val: unknown) => `Rp ${Number(val).toLocaleString('id-ID')}`
  },
  { key: 'status', label: 'Status', sortable: true, align: 'center' }
]

const sampleTableData = ref<ShowcaseItem[]>([
  {
    id: 1,
    code: 'PRD-001',
    name: 'Sofa Minimalis 3-Seater Beludru',
    category: 'Sofa',
    price: 4500000,
    status: 'active'
  },
  {
    id: 2,
    code: 'PRD-002',
    name: 'Meja Makan Jati Solid 6 Kursi',
    category: 'Meja',
    price: 8200000,
    status: 'active'
  },
  {
    id: 3,
    code: 'PRD-003',
    name: 'Lemari Pakaian 4 Pintu Sliding',
    category: 'Lemari',
    price: 6750000,
    status: 'pending'
  },
  {
    id: 4,
    code: 'PRD-004',
    name: 'Kursi Kerja Ergonomis Mesh',
    category: 'Kursi',
    price: 1850000,
    status: 'completed'
  },
  {
    id: 5,
    code: 'PRD-005',
    name: 'Credenza TV Scandinavian 180cm',
    category: 'Credenza',
    price: 3200000,
    status: 'inactive'
  },
  {
    id: 6,
    code: 'PRD-006',
    name: 'Tempat Tidur King Size Headboard Busa',
    category: 'Tempat Tidur',
    price: 7900000,
    status: 'active'
  },
  {
    id: 7,
    code: 'PRD-007',
    name: 'Nakas Samping Tempat Tidur 2 Laci',
    category: 'Nakas',
    price: 950000,
    status: 'active'
  },
  {
    id: 8,
    code: 'PRD-008',
    name: 'Partisi Ruangan Minimalis Kisi Kayu',
    category: 'Partisi',
    price: 2800000,
    status: 'draft'
  }
])

const selectedTableRows = ref<ShowcaseItem[]>([])
const tableSearchQuery = ref('')

async function handleTestConfirm(variant: 'primary' | 'danger' | 'warning') {
  const result = await confirm({
    title: variant === 'danger' ? 'Hapus Data Produk?' : 'Konfirmasi Tindakan',
    message:
      variant === 'danger'
        ? 'Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.'
        : 'Apakah Anda ingin melanjutkan proses penyimpanan perubahan data ini ke server?',
    confirmText: variant === 'danger' ? 'Hapus Permanen' : 'Ya, Lanjutkan',
    cancelText: 'Batalkan',
    variant
  })

  if (result) {
    toast.success('Aksi berhasil dikonfirmasi!')
  } else {
    toast.info('Aksi dibatalkan pengguna.')
  }
}
</script>

<template>
  <div class="space-y-6">
    <AppPageHeader
      title="Design System Showcase"
      subtitle="Katalog komponen reusable, tokens warna, varian visual, dan interaksi Impact Design System"
    >
      <template #actions>
        <AppBadge variant="primary" size="md">
          <SparklesIcon class="w-3.5 h-3.5 mr-1" />
          Sprint 1 Internal Deliverable
        </AppBadge>
      </template>
    </AppPageHeader>

    <!-- Navigation Tabs -->
    <AppTabs v-model="activeTab" :tabs="showcaseTabs" />

    <!-- TAB 1: BUTTONS & ICONS -->
    <div v-if="activeTab === 'buttons'" class="space-y-6">
      <AppCard
        title="AppButton Variants"
        subtitle="Tombol aksi standar dengan variasi hierarki visual"
      >
        <div class="flex flex-wrap items-center gap-3">
          <AppButton variant="primary"> Primary </AppButton>
          <AppButton variant="secondary"> Secondary </AppButton>
          <AppButton variant="outline"> Outline </AppButton>
          <AppButton variant="ghost"> Ghost </AppButton>
          <AppButton variant="danger"> Danger </AppButton>
          <AppButton variant="primary" disabled> Disabled </AppButton>
          <AppButton variant="primary" loading> Loading </AppButton>
        </div>

        <AppDivider label="Ukuran Tombol (Sizes)" />

        <div class="flex flex-wrap items-center gap-3">
          <AppButton size="xs" variant="primary"> Extra Small (xs) </AppButton>
          <AppButton size="sm" variant="primary"> Small (sm) </AppButton>
          <AppButton size="md" variant="primary"> Medium (md) </AppButton>
          <AppButton size="lg" variant="primary"> Large (lg) </AppButton>
        </div>

        <AppDivider label="Tombol dengan Icon" />

        <div class="flex flex-wrap items-center gap-3">
          <AppButton variant="primary">
            <template #left-icon>
              <PlusIcon class="w-4 h-4" />
            </template>
            Tambah Transaksi
          </AppButton>

          <AppButton variant="outline">
            <template #left-icon>
              <DownloadIcon class="w-4 h-4" />
            </template>
            Ekspor Excel
          </AppButton>

          <AppButton variant="danger">
            <template #left-icon>
              <TrashIcon class="w-4 h-4" />
            </template>
            Hapus Pilihan
          </AppButton>
        </div>
      </AppCard>

      <AppCard
        title="AppIconButton"
        subtitle="Tombol ringkas berbasis ikon dengan aksesibilitas aria-label"
      >
        <div class="flex items-center gap-3">
          <AppIconButton label="Edit Data" variant="ghost">
            <EditIcon class="w-4 h-4" />
          </AppIconButton>
          <AppIconButton label="Hapus Item" variant="ghost">
            <TrashIcon class="w-4 h-4 text-semantic-danger" />
          </AppIconButton>
          <AppIconButton label="Bantuan" variant="secondary">
            <HelpIcon class="w-4 h-4" />
          </AppIconButton>
          <AppIconButton label="Notifikasi" variant="outline">
            <BellIcon class="w-4 h-4" />
          </AppIconButton>
          <AppIconButton label="Loading State" loading variant="primary">
            <EditIcon class="w-4 h-4" />
          </AppIconButton>
        </div>
      </AppCard>

      <AppCard
        title="AppDropdown"
        subtitle="Menu navigasi & tindakan dengan keyboard navigation & click outside"
      >
        <div class="flex items-center gap-4">
          <AppDropdown width="w-48">
            <template #trigger="{ isOpen }">
              <AppButton variant="secondary" size="sm">
                Opsi Tindakan
                <template #right-icon>
                  <span class="text-xs transition-transform" :class="{ 'rotate-180': isOpen }"
                    >▼</span
                  >
                </template>
              </AppButton>
            </template>
            <div class="py-1">
              <button
                type="button"
                role="menuitem"
                class="w-full text-left px-3.5 py-2 text-xs hover:bg-slate-50 text-content-primary flex items-center gap-2 cursor-pointer"
                @click="toast.info('Ekspor PDF dipilih')"
              >
                <DownloadIcon class="w-3.5 h-3.5 text-slate-400" />
                Ekspor PDF
              </button>
              <button
                type="button"
                role="menuitem"
                class="w-full text-left px-3.5 py-2 text-xs hover:bg-slate-50 text-content-primary flex items-center gap-2 cursor-pointer"
                @click="toast.info('Cetak Surat Jalan')"
              >
                <SparklesIcon class="w-3.5 h-3.5 text-slate-400" />
                Cetak Surat Jalan
              </button>
              <AppDivider />
              <button
                type="button"
                role="menuitem"
                class="w-full text-left px-3.5 py-2 text-xs hover:bg-red-50 text-semantic-danger flex items-center gap-2 cursor-pointer"
                @click="toast.error('Arsipkan Data')"
              >
                <TrashIcon class="w-3.5 h-3.5" />
                Arsipkan Dokumen
              </button>
            </div>
          </AppDropdown>
        </div>
      </AppCard>

      <AppCard
        title="AppDropdown"
        subtitle="Menu navigasi & tindakan dengan keyboard navigation & click outside"
      >
        <div class="flex items-center gap-4">
          <AppDropdown width="w-48">
            <template #trigger="{ isOpen }">
              <AppButton variant="secondary" size="sm">
                Opsi Tindakan
                <template #right-icon>
                  <span class="text-xs transition-transform" :class="{ 'rotate-180': isOpen }"
                    >▼</span
                  >
                </template>
              </AppButton>
            </template>
            <div class="py-1">
              <button
                type="button"
                role="menuitem"
                class="w-full text-left px-3.5 py-2 text-xs hover:bg-slate-50 text-content-primary flex items-center gap-2 cursor-pointer"
                @click="toast.info('Ekspor PDF dipilih')"
              >
                <DownloadIcon class="w-3.5 h-3.5 text-slate-400" />
                Ekspor PDF
              </button>
              <button
                type="button"
                role="menuitem"
                class="w-full text-left px-3.5 py-2 text-xs hover:bg-slate-50 text-content-primary flex items-center gap-2 cursor-pointer"
                @click="toast.info('Cetak Surat Jalan')"
              >
                <SparklesIcon class="w-3.5 h-3.5 text-slate-400" />
                Cetak Surat Jalan
              </button>
              <AppDivider />
              <button
                type="button"
                role="menuitem"
                class="w-full text-left px-3.5 py-2 text-xs hover:bg-red-50 text-semantic-danger flex items-center gap-2 cursor-pointer"
                @click="toast.error('Arsipkan Data')"
              >
                <TrashIcon class="w-3.5 h-3.5" />
                Arsipkan Dokumen
              </button>
            </div>
          </AppDropdown>
        </div>
      </AppCard>
    </div>

    <!-- TAB 2: FORM CONTROLS -->
    <div v-if="activeTab === 'forms'" class="space-y-6">
      <AppCard
        title="Form Fields & Controls"
        subtitle="Komponen input data enterprise dengan validasi dan tata letak konsisten"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <AppFormField
            label="Nama Produk"
            required
            helper-text="Masukkan nama lengkap produk furnitur"
          >
            <AppInput v-model="sampleInput" placeholder="Contoh: Meja Makan Jati Solid" />
          </AppFormField>

          <AppFormField label="Kode SKU (Clearable)" required>
            <AppInput v-model="sampleClearable" clearable placeholder="SKU-XXX" />
          </AppFormField>

          <AppFormField label="Pencarian Cepat" helper-text="Input dengan icon prefix">
            <AppInput placeholder="Cari nama bahan...">
              <template #prefix>
                <SearchIcon class="w-4 h-4" />
              </template>
            </AppInput>
          </AppFormField>

          <AppFormField
            label="Input dengan Error State"
            required
            error="Kode sudah terdaftar dalam sistem database"
          >
            <AppInput v-model="sampleError" error="Kode sudah terdaftar" />
          </AppFormField>

          <AppFormField label="Kota Gudang / Pabrik" required>
            <AppSelect
              v-model="sampleSelect"
              :options="[
                { label: 'Jepara (Pusat Produksi Kayu)', value: 'jepara' },
                { label: 'Semarang (Pabrik Busa & Logam)', value: 'semarang' },
                { label: 'Surabaya (Gudang Distribusi)', value: 'surabaya' },
                { label: 'Jakarta (Showroom & Gudang)', value: 'jakarta' }
              ]"
            />
          </AppFormField>

          <AppFormField label="Input Nonaktif (Disabled)">
            <AppInput model-value="DATA_KUNCI_TIDAK_DAPAT_DIUBAH" disabled />
          </AppFormField>
        </div>

        <div class="mt-5">
          <AppFormField
            label="Spesifikasi & Catatan Bahan"
            helper-text="Deskripsi detail kebutuhan material dan instruksi kerja"
          >
            <AppTextarea v-model="sampleTextarea" :rows="3" />
          </AppFormField>
        </div>

        <AppDivider label="Selection Controls" />

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <AppFormSection title="Checkbox Options" description="Pilihan multi-seleksi">
              <div class="space-y-2">
                <AppCheckbox v-model="sampleCheckbox" label="Terapkan PPN 11% otomatis" />
                <AppCheckbox label="Kirim notifikasi email ke bagian gudang" />
                <AppCheckbox label="Opsi dinonaktifkan" disabled />
              </div>
            </AppFormSection>
          </div>

          <div>
            <AppFormSection title="Radio Group Options" description="Pilihan tunggal eksklusif">
              <div class="space-y-2">
                <AppRadio
                  v-model="sampleRadio"
                  value="option1"
                  name="sample_radio"
                  label="Pembayaran Tunai / Transfer Langsung"
                />
                <AppRadio
                  v-model="sampleRadio"
                  value="option2"
                  name="sample_radio"
                  label="Termin Kredit (30 Hari)"
                />
                <AppRadio
                  v-model="sampleRadio"
                  value="option3"
                  name="sample_radio"
                  label="Konsinyasi / Titip Jual"
                />
              </div>
            </AppFormSection>
          </div>
        </div>
      </AppCard>
    </div>

    <!-- TAB 3: FEEDBACK -->
    <div v-if="activeTab === 'feedback'" class="space-y-6">
      <AppCard
        title="AppAlert Components"
        subtitle="Notifikasi konteks halaman dengan varian semantik"
      >
        <div class="space-y-3">
          <AppAlert variant="info" title="Informasi Sistem">
            Sistem ERP Impact Furniture v2 berada pada tahap Sprint 1. Seluruh modul backend akan
            dihubungkan secara bertahap.
          </AppAlert>

          <AppAlert variant="success" title="Penyimpanan Berhasil">
            Data konfigurasi gudang baru berhasil diperbarui tanpa kendala.
          </AppAlert>

          <AppAlert variant="warning" title="Peringatan Stok">
            4 bahan baku telah mencapai ambang batas minimum stok gudang.
          </AppAlert>

          <AppAlert variant="danger" title="Terjadi Kegagalan" dismissible>
            Gagal menghubungkan ke server mock simulasi. Silakan periksa koneksi Anda.
          </AppAlert>
        </div>
      </AppCard>

      <AppCard
        title="Global Toasts & Confirm Dialogs"
        subtitle="Sistem notifikasi mengambang dan dialog konfirmasi interaktif"
      >
        <div class="space-y-4">
          <div>
            <h4 class="text-xs font-semibold text-content-primary mb-2 uppercase tracking-wider">
              Uji Coba Toast Global (useToast)
            </h4>
            <div class="flex flex-wrap items-center gap-2.5">
              <AppButton
                variant="primary"
                size="sm"
                @click="toast.success('Data transaksi berhasil disimpan!', 'Sukses')"
              >
                Trigger Success Toast
              </AppButton>
              <AppButton
                variant="danger"
                size="sm"
                @click="toast.error('Gagal memproses permintaan validasi.', 'Kesalahan')"
              >
                Trigger Error Toast
              </AppButton>
              <AppButton
                variant="outline"
                size="sm"
                @click="toast.warning('Batas kredit pelanggan hampir tercapai.', 'Peringatan')"
              >
                Trigger Warning Toast
              </AppButton>
              <AppButton
                variant="secondary"
                size="sm"
                @click="toast.info('Sinkronisasi data latar belakang selesai.', 'Informasi')"
              >
                Trigger Info Toast
              </AppButton>
            </div>
          </div>

          <AppDivider />

          <div>
            <h4 class="text-xs font-semibold text-content-primary mb-2 uppercase tracking-wider">
              Uji Coba Confirm Dialog (useConfirm)
            </h4>
            <div class="flex flex-wrap items-center gap-2.5">
              <AppButton variant="danger" size="sm" @click="handleTestConfirm('danger')">
                Konfirmasi Hapus Data (Danger)
              </AppButton>
              <AppButton variant="primary" size="sm" @click="handleTestConfirm('primary')">
                Konfirmasi Simpan (Primary)
              </AppButton>
              <AppButton variant="outline" size="sm" @click="handleTestConfirm('warning')">
                Konfirmasi Batalkan Pesanan (Warning)
              </AppButton>
            </div>
          </div>
        </div>
      </AppCard>

      <AppCard
        title="AppModal Dialog"
        subtitle="Dialog modal accessible dengan focus trap, backdrop close, dan ukuran dinamis"
      >
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-3">
            <AppButton
              variant="primary"
              size="sm"
              @click="
                () => {
                  modalSize = 'sm'
                  isModalOpen = true
                }
              "
            >
              Buka Modal (sm)
            </AppButton>
            <AppButton
              variant="secondary"
              size="sm"
              @click="
                () => {
                  modalSize = 'md'
                  isModalOpen = true
                }
              "
            >
              Buka Modal (md)
            </AppButton>
            <AppButton
              variant="outline"
              size="sm"
              @click="
                () => {
                  modalSize = 'lg'
                  isModalOpen = true
                }
              "
            >
              Buka Modal (lg)
            </AppButton>
            <AppButton
              variant="ghost"
              size="sm"
              @click="
                () => {
                  modalSize = 'xl'
                  isModalOpen = true
                }
              "
            >
              Buka Modal (xl)
            </AppButton>
          </div>

          <AppModal
            v-model="isModalOpen"
            :size="modalSize"
            title="Form Input Bahan Baku"
            description="Lengkapi detail spesifikasi bahan baku furnitur sebelum disimpan ke sistem inventaris."
          >
            <div class="space-y-3.5">
              <AppFormField label="Kode Bahan" required>
                <AppInput placeholder="Contoh: BHN-001" />
              </AppFormField>
              <AppFormField label="Nama Bahan Kayu" required>
                <AppInput placeholder="Contoh: Kayu Jati Perhutani Grade A" />
              </AppFormField>
              <AppFormField label="Catatan Tambahan">
                <AppTextarea placeholder="Keterangan spesifikasi..." />
              </AppFormField>
            </div>

            <template #footer>
              <AppButton variant="secondary" size="sm" @click="isModalOpen = false">
                Batal
              </AppButton>
              <AppButton
                variant="primary"
                size="sm"
                @click="
                  () => {
                    isModalOpen = false
                    toast.success('Data bahan baku berhasil disimpan!')
                  }
                "
              >
                Simpan Data
              </AppButton>
            </template>
          </AppModal>
        </div>
      </AppCard>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AppCard title="AppEmptyState" subtitle="Tampilan ketika data kosong">
          <AppEmptyState
            title="Belum Ada Transaksi"
            description="Tidak ada data faktur penjualan yang ditemukan untuk periode ini."
          >
            <template #action>
              <AppButton variant="primary" size="sm"> Buat Faktur Baru </AppButton>
            </template>
          </AppEmptyState>
        </AppCard>

        <AppCard
          title="AppLoadingState, AppSpinner & AppSkeleton"
          subtitle="Komponen pemuatan data dan indikator loading"
        >
          <div class="space-y-4">
            <AppLoadingState text="Memuat daftar inventaris pabrik..." />
            <AppDivider label="Ukuran Spinner & Skeleton" />
            <div class="flex items-center gap-4 justify-center">
              <AppSpinner size="xs" />
              <AppSpinner size="sm" />
              <AppSpinner size="md" />
              <AppSpinner size="lg" />
            </div>
            <div class="space-y-2 pt-2">
              <AppSkeleton type="line" height="14px" width="80%" />
              <AppSkeleton type="line" height="14px" width="60%" />
            </div>
          </div>
        </AppCard>
      </div>
    </div>

    <!-- TAB 4: DATA TABLE & BADGES -->
    <div v-if="activeTab === 'data'" class="space-y-6">
      <AppCard
        title="AppBadge & AppStatusBadge"
        subtitle="Komponen label status standar untuk transaksi ERP"
      >
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <AppBadge variant="neutral"> Neutral </AppBadge>
            <AppBadge variant="primary"> Primary </AppBadge>
            <AppBadge variant="success"> Success </AppBadge>
            <AppBadge variant="warning"> Warning </AppBadge>
            <AppBadge variant="danger"> Danger </AppBadge>
            <AppBadge variant="info"> Info </AppBadge>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <AppStatusBadge status="active" />
            <AppStatusBadge status="completed" />
            <AppStatusBadge status="pending" />
            <AppStatusBadge status="in_progress" />
            <AppStatusBadge status="cancelled" />
            <AppStatusBadge status="inactive" />
          </div>
        </div>
      </AppCard>

      <div>
        <h3 class="text-sm font-semibold text-content-primary mb-2">
          AppDataTable Interaktif (Sorting, Seleksi, Paginasi, Toolbar)
        </h3>
        <AppDataTable
          :columns="sampleColumns"
          :data="sampleTableData"
          selectable
          :selected-rows="selectedTableRows"
          :page-size="5"
          @update:selected-rows="selectedTableRows = $event"
        >
          <template #toolbar>
            <AppTableToolbar
              v-model:search-query="tableSearchQuery"
              search-placeholder="Cari kode atau nama produk..."
            >
              <template #actions>
                <span
                  v-if="selectedTableRows.length > 0"
                  class="text-xs text-primary font-medium mr-2"
                >
                  {{ selectedTableRows.length }} terpilih
                </span>
                <AppButton variant="primary" size="sm">
                  <template #left-icon>
                    <PlusIcon class="w-3.5 h-3.5" />
                  </template>
                  Tambah Produk
                </AppButton>
              </template>
            </AppTableToolbar>
          </template>

          <template #cell-status="{ value }">
            <AppStatusBadge :status="String(value)" />
          </template>

          <template #actions="{ row }">
            <div class="flex items-center justify-end gap-1">
              <AppIconButton label="Edit" size="sm" @click="toast.info(`Edit ${row.name}`)">
                <EditIcon class="w-3.5 h-3.5 text-slate-500" />
              </AppIconButton>
              <AppIconButton label="Hapus" size="sm" @click="toast.warning(`Hapus ${row.name}`)">
                <TrashIcon class="w-3.5 h-3.5 text-semantic-danger" />
              </AppIconButton>
            </div>
          </template>
        </AppDataTable>
      </div>
    </div>

    <!-- TAB 5: TOKENS & TYPOGRAPHY -->
    <div v-if="activeTab === 'tokens'" class="space-y-6">
      <AppCard
        title="Impact Design Tokens — Warna Dasar"
        subtitle="Warna yang didefinisikan secara baku pada tokens.css dan tailwind.config.js"
      >
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div class="p-3 rounded-card bg-navbar-dark text-white">
            <p class="font-bold">Navbar Dark</p>
            <p class="font-mono text-[11px] opacity-80">#34454F</p>
          </div>
          <div class="p-3 rounded-card bg-primary text-white">
            <p class="font-bold">Primary (Teal)</p>
            <p class="font-mono text-[11px] opacity-80">#0F766E</p>
          </div>
          <div class="p-3 rounded-card bg-primary-hover text-white">
            <p class="font-bold">Primary Hover</p>
            <p class="font-mono text-[11px] opacity-80">#115E59</p>
          </div>
          <div class="p-3 rounded-card bg-background border border-border text-content-primary">
            <p class="font-bold">Background</p>
            <p class="font-mono text-[11px] text-content-secondary">#F5F7FA</p>
          </div>
          <div class="p-3 rounded-card bg-surface border border-border text-content-primary">
            <p class="font-bold">Surface</p>
            <p class="font-mono text-[11px] text-content-secondary">#FFFFFF</p>
          </div>
          <div class="p-3 rounded-card bg-slate-100 border border-border text-content-primary">
            <p class="font-bold">Border</p>
            <p class="font-mono text-[11px] text-content-secondary">#D9E0E7</p>
          </div>
          <div class="p-3 rounded-card bg-slate-800 text-white">
            <p class="font-bold">Text Primary</p>
            <p class="font-mono text-[11px] opacity-80">#1F2937</p>
          </div>
          <div class="p-3 rounded-card bg-slate-500 text-white">
            <p class="font-bold">Text Secondary</p>
            <p class="font-mono text-[11px] opacity-80">#64748B</p>
          </div>
        </div>

        <AppDivider label="Warna Semantik (Status)" />

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div class="p-3 rounded-card bg-semantic-success text-white">
            <p class="font-bold">Success</p>
            <p class="font-mono text-[11px] opacity-80">#16A34A</p>
          </div>
          <div class="p-3 rounded-card bg-semantic-warning text-white">
            <p class="font-bold">Warning</p>
            <p class="font-mono text-[11px] opacity-80">#D97706</p>
          </div>
          <div class="p-3 rounded-card bg-semantic-danger text-white">
            <p class="font-bold">Danger</p>
            <p class="font-mono text-[11px] opacity-80">#DC2626</p>
          </div>
          <div class="p-3 rounded-card bg-semantic-info text-white">
            <p class="font-bold">Info</p>
            <p class="font-mono text-[11px] opacity-80">#2563EB</p>
          </div>
        </div>

        <AppDivider label="Border Radii Enterprise Tokens" />

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-center">
          <div class="p-3 bg-slate-100 border border-border rounded-input">
            <p class="font-bold">Input Radius</p>
            <p class="text-[11px] text-content-secondary">6px</p>
          </div>
          <div class="p-3 bg-slate-100 border border-border rounded-btn">
            <p class="font-bold">Button Radius</p>
            <p class="text-[11px] text-content-secondary">6px</p>
          </div>
          <div class="p-3 bg-slate-100 border border-border rounded-card">
            <p class="font-bold">Card Radius</p>
            <p class="text-[11px] text-content-secondary">8px</p>
          </div>
          <div class="p-3 bg-slate-100 border border-border rounded-modal">
            <p class="font-bold">Modal Radius</p>
            <p class="text-[11px] text-content-secondary">10px</p>
          </div>
        </div>
      </AppCard>
    </div>
  </div>
</template>
