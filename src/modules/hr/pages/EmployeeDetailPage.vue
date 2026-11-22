<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppSkeleton from '@/shared/components/ui/AppSkeleton.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import EmployeeStatusBadge from '../components/EmployeeStatusBadge.vue'
import { employeeService } from '../services/employee.service'
import type { Employee } from '../types/employee.types'
import { usePermission } from '@/shared/composables/usePermission'
import {
  User,
  ArrowLeft,
  Edit2,
  Power,
  Trash2,
  Fingerprint,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Users2,
  Calendar,
  Clock
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const { hasPermission } = usePermission()

const employeeId = Number(route.params.id)
const employee = ref<Employee | null>(null)
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)

// Confirmation dialogs
const showStatusConfirm = ref(false)
const showDeleteConfirm = ref(false)

const canUpdate = computed(() => hasPermission('hr:update') || hasPermission('hr.employees:update'))
const canDelete = computed(() => hasPermission('hr:delete') || hasPermission('hr.employees:delete'))

async function loadEmployee() {
  isLoading.value = true
  try {
    const data = await employeeService.getById(employeeId)
    if (!data) {
      errorMessage.value = `Data karyawan #${employeeId} tidak ditemukan.`
    } else {
      employee.value = data
    }
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Gagal memuat detail karyawan'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadEmployee()
})

function handleBack() {
  router.push('/hr/employees')
}

function handleEdit() {
  router.push(`/hr/employees/${employeeId}/edit`)
}

async function confirmToggleStatus() {
  if (!employee.value) return
  try {
    await employeeService.toggleStatus(employeeId)
    showStatusConfirm.value = false
    await loadEmployee()
  } catch (err) {
    console.error('Failed to toggle employee status:', err)
  }
}

async function confirmDelete() {
  if (!employee.value) return
  try {
    await employeeService.delete(employeeId)
    showDeleteConfirm.value = false
    router.push('/hr/employees')
  } catch (err) {
    console.error('Failed to delete employee:', err)
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <AppPageHeader
      :title="employee ? employee.nama : 'Detail Karyawan'"
      :subtitle="
        employee
          ? `Kode: ${employee.kode || '-'} • UID FP: ${employee.uid_fingerprint ?? '-'}`
          : 'Memuat data...'
      "
    >
      <template #icon>
        <User class="w-6 h-6 text-primary" />
      </template>
      <template #actions>
        <div class="flex items-center gap-2">
          <AppButton
            variant="outline"
            size="sm"
            class="flex items-center gap-1.5 text-xs"
            @click="handleBack"
          >
            <ArrowLeft class="w-4 h-4" /> Kembali
          </AppButton>

          <AppButton
            v-if="canUpdate && employee"
            variant="primary"
            size="sm"
            class="flex items-center gap-1.5 text-xs"
            @click="handleEdit"
          >
            <Edit2 class="w-3.5 h-3.5" /> Ubah Data
          </AppButton>

          <AppButton
            v-if="canUpdate && employee"
            :variant="employee.status === 1 ? 'outline' : 'primary'"
            size="sm"
            class="flex items-center gap-1.5 text-xs"
            :class="
              employee.status === 1
                ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
            "
            @click="showStatusConfirm = true"
          >
            <Power class="w-3.5 h-3.5" />
            {{ employee.status === 1 ? 'Nonaktifkan' : 'Aktifkan' }}
          </AppButton>

          <AppButton
            v-if="canDelete && employee"
            variant="ghost"
            size="sm"
            class="flex items-center gap-1.5 text-xs text-rose-600 hover:bg-rose-50"
            @click="showDeleteConfirm = true"
          >
            <Trash2 class="w-3.5 h-3.5" /> Hapus
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <!-- Error state -->
    <div
      v-if="errorMessage"
      class="mb-4 bg-rose-50 border border-rose-200 rounded-lg p-4 text-xs text-rose-700"
    >
      {{ errorMessage }}
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="bg-surface rounded-lg border border-border p-6 space-y-4">
      <AppSkeleton class="h-6 w-48 mb-4" />
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AppSkeleton class="h-44 w-full" />
        <AppSkeleton class="h-44 w-full" />
      </div>
    </div>

    <!-- Detail Content -->
    <div v-else-if="employee" class="space-y-6">
      <!-- Top Overview Badge Bar -->
      <div
        class="bg-surface rounded-lg border border-border p-4 shadow-sm flex flex-wrap items-center justify-between gap-4"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg"
          >
            {{ employee.nama.charAt(0) }}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-base font-bold text-text">{{ employee.nama }}</h1>
              <EmployeeStatusBadge type="active" :status="employee.status" />
            </div>
            <p class="text-xs text-secondary-text mt-0.5">
              Kode: <span class="font-medium text-text">{{ employee.kode || '-' }}</span>
              <span class="mx-1.5">•</span>
              NIK: <span class="font-medium text-text">{{ employee.nik || '-' }}</span>
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="text-right">
            <span class="text-[11px] text-secondary-text block">Status Kepegawaian</span>
            <EmployeeStatusBadge
              type="employment"
              :label="employee.status_karyawan_nama"
              :color="employee.status_karyawan_color"
            />
          </div>
          <div class="text-right border-l border-border pl-3">
            <span class="text-[11px] text-secondary-text block">Jabatan</span>
            <span class="text-xs font-semibold text-text">{{ employee.jabatan_nama }}</span>
          </div>
        </div>
      </div>

      <!-- Detail Cards Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- CARD 1: Identitas & Biometrik -->
        <div class="bg-surface rounded-lg border border-border shadow-sm overflow-hidden">
          <div
            class="px-5 py-3.5 bg-slate-50/80 border-b border-border flex items-center justify-between"
          >
            <h3
              class="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2"
            >
              <Fingerprint class="w-4 h-4 text-primary" /> Identitas & Terminal Biometrik
            </h3>
          </div>
          <div class="p-5 space-y-3.5 text-xs">
            <div class="flex justify-between py-1 border-b border-border/50">
              <span class="text-secondary-text">Kode Karyawan</span>
              <span class="font-medium text-text font-mono">{{ employee.kode || '-' }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-border/50">
              <span class="text-secondary-text">UID Fingerprint (Mesin Absensi)</span>
              <span
                class="bg-emerald-50 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded border border-emerald-200"
              >
                {{ employee.uid_fingerprint ?? '-' }}
              </span>
            </div>
            <div class="flex justify-between py-1 border-b border-border/50">
              <span class="text-secondary-text">NIK (Nomor Induk)</span>
              <span class="font-medium text-text">{{ employee.nik || '-' }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-border/50">
              <span class="text-secondary-text">Nama Lengkap</span>
              <span class="font-medium text-text">{{ employee.nama }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-border/50">
              <span class="text-secondary-text">Jenis Kelamin</span>
              <span class="font-medium text-text">{{ employee.jk || '-' }}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-secondary-text">Tanggal Masuk Kerja</span>
              <span class="font-medium text-text flex items-center gap-1">
                <Calendar class="w-3.5 h-3.5 text-secondary-text" />
                {{ employee.tanggal_masuk || '-' }}
              </span>
            </div>
          </div>
        </div>

        <!-- CARD 2: Penempatan & Grup Kerja -->
        <div class="bg-surface rounded-lg border border-border shadow-sm overflow-hidden">
          <div
            class="px-5 py-3.5 bg-slate-50/80 border-b border-border flex items-center justify-between"
          >
            <h3
              class="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2"
            >
              <Briefcase class="w-4 h-4 text-primary" /> Penempatan, Jabatan & Regu Kerja
            </h3>
          </div>
          <div class="p-5 space-y-3.5 text-xs">
            <div class="flex justify-between items-center py-1 border-b border-border/50">
              <span class="text-secondary-text">Jabatan Organisasi</span>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border"
                :style="{
                  backgroundColor: `${employee.jabatan_color}15`,
                  borderColor: `${employee.jabatan_color}40`,
                  color: employee.jabatan_color || '#1e293b'
                }"
              >
                {{ employee.jabatan_nama }}
              </span>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-border/50">
              <span class="text-secondary-text">Status Karyawan (Jenis Kepegawaian)</span>
              <EmployeeStatusBadge
                type="employment"
                :label="employee.status_karyawan_nama"
                :color="employee.status_karyawan_color"
              />
            </div>
            <div class="flex justify-between items-center py-1 border-b border-border/50">
              <span class="text-secondary-text">Grup Karyawan (Regu Kerja)</span>
              <div v-if="employee.grup_karyawan_id" class="flex items-center gap-1.5">
                <router-link
                  :to="`/hr/employee-groups/${employee.grup_karyawan_id}`"
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition-colors"
                >
                  <Users2 class="w-3.5 h-3.5" /> {{ employee.grup_karyawan_nama }}
                </router-link>
              </div>
              <span v-else class="text-secondary-text italic">Tanpa Grup</span>
            </div>
            <div class="flex justify-between items-center py-1">
              <span class="text-secondary-text">Status Aktif Record</span>
              <EmployeeStatusBadge type="active" :status="employee.status" />
            </div>
          </div>
        </div>

        <!-- CARD 3: Kontak & Alamat Domisili -->
        <div class="bg-surface rounded-lg border border-border shadow-sm overflow-hidden">
          <div
            class="px-5 py-3.5 bg-slate-50/80 border-b border-border flex items-center justify-between"
          >
            <h3
              class="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2"
            >
              <Phone class="w-4 h-4 text-primary" /> Informasi Kontak & Domisili
            </h3>
          </div>
          <div class="p-5 space-y-3.5 text-xs">
            <div class="flex justify-between py-1 border-b border-border/50">
              <span class="text-secondary-text flex items-center gap-1">
                <Phone class="w-3.5 h-3.5" /> Nomor HP / WhatsApp
              </span>
              <span class="font-medium text-text">{{ employee.no_hp || '-' }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-border/50">
              <span class="text-secondary-text flex items-center gap-1">
                <Mail class="w-3.5 h-3.5" /> Alamat Email
              </span>
              <span class="font-medium text-text">{{ employee.email || '-' }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-border/50">
              <span class="text-secondary-text flex items-center gap-1">
                <MapPin class="w-3.5 h-3.5" /> Alamat Domisili
              </span>
              <span class="font-medium text-text text-right max-w-[60%]">{{
                employee.alamat || '-'
              }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-border/50">
              <span class="text-secondary-text">Kota / Kabupaten</span>
              <span class="font-medium text-text">{{ employee.city_name || '-' }}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-secondary-text">Provinsi</span>
              <span class="font-medium text-text">{{ employee.province_name || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- CARD 4: Audit Trail -->
        <div class="bg-surface rounded-lg border border-border shadow-sm overflow-hidden">
          <div
            class="px-5 py-3.5 bg-slate-50/80 border-b border-border flex items-center justify-between"
          >
            <h3
              class="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2"
            >
              <Clock class="w-4 h-4 text-primary" /> Jejak Audit Sistem (Audit Trail)
            </h3>
          </div>
          <div class="p-5 space-y-3.5 text-xs">
            <div class="flex justify-between py-1 border-b border-border/50">
              <span class="text-secondary-text">Dibuat Pada</span>
              <span class="font-medium text-text font-mono">{{ employee.created_at || '-' }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-border/50">
              <span class="text-secondary-text">Dibuat Oleh</span>
              <span class="font-medium text-text">{{ employee.creator_name || '-' }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-border/50">
              <span class="text-secondary-text">Terakhir Diperbarui</span>
              <span class="font-medium text-text font-mono">{{ employee.updated_at || '-' }}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-secondary-text">Diperbarui Oleh</span>
              <span class="font-medium text-text">{{ employee.updater_name || '-' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toggle Status Confirm Dialog -->
    <AppConfirmDialog
      v-model="showStatusConfirm"
      :title="employee?.status === 1 ? 'Nonaktifkan Karyawan?' : 'Aktifkan Karyawan?'"
      :message="
        employee?.status === 1
          ? `Apakah Anda yakin ingin menonaktifkan karyawan '${employee?.nama}'? Karyawan yang dinonaktifkan tidak akan disertakan pada penugasan transaksi baru.`
          : `Apakah Anda yakin ingin mengaktifkan kembali karyawan '${employee?.nama}'?`
      "
      :confirm-text="employee?.status === 1 ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'"
      :confirm-variant="employee?.status === 1 ? 'danger' : 'primary'"
      @confirm="confirmToggleStatus"
    />

    <!-- Delete Confirm Dialog -->
    <AppConfirmDialog
      v-model="showDeleteConfirm"
      title="Hapus Data Karyawan?"
      :message="`Apakah Anda yakin ingin menghapus data karyawan '${employee?.nama}'? Tindakan ini tidak dapat dibatalkan.`"
      confirm-text="Ya, Hapus Data"
      cancel-text="Batal"
      confirm-variant="danger"
      @confirm="confirmDelete"
    />
  </div>
</template>
