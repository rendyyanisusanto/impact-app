<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppSkeleton from '@/shared/components/ui/AppSkeleton.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import EmployeeStatusBadge from '../components/EmployeeStatusBadge.vue'
import EmployeeGroupFormModal from '../components/EmployeeGroupFormModal.vue'
import EmployeeGroupMemberPickerModal from '../components/EmployeeGroupMemberPickerModal.vue'
import EmployeeGroupMembersTable from '../components/EmployeeGroupMembersTable.vue'
import { employeeGroupService } from '../services/employee-group.service'
import type { EmployeeGroup } from '../types/employee-group.types'
import { usePermission } from '@/shared/composables/usePermission'
import { Users2, ArrowLeft, Edit2, UserPlus, Power, Trash2, Clock, Users } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const { hasPermission } = usePermission()

const groupId = Number(route.params.id)
const group = ref<EmployeeGroup | null>(null)
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)
const membersTableRef = ref<InstanceType<typeof EmployeeGroupMembersTable> | null>(null)

// Modal states
const isEditModalOpen = ref(false)
const isMemberPickerOpen = ref(false)
const showStatusConfirm = ref(false)
const showDeleteConfirm = ref(false)

const canUpdate = computed(
  () => hasPermission('hr:update') || hasPermission('hr.employee-groups:update')
)
const canDelete = computed(
  () => hasPermission('hr:delete') || hasPermission('hr.employee-groups:delete')
)

async function loadGroup() {
  isLoading.value = true
  try {
    const data = await employeeGroupService.getById(groupId)
    if (!data) {
      errorMessage.value = `Grup Karyawan #${groupId} tidak ditemukan.`
    } else {
      group.value = data
    }
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Gagal memuat detail grup'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadGroup()
})

function handleBack() {
  router.push('/hr/employee-groups')
}

function handleMembersAssigned() {
  loadGroup()
  membersTableRef.value?.reload()
}

function handleMemberRemoved() {
  loadGroup()
}

async function confirmToggleStatus() {
  if (!group.value) return
  try {
    await employeeGroupService.toggleStatus(groupId)
    showStatusConfirm.value = false
    await loadGroup()
  } catch (err) {
    console.error('Failed to toggle group status:', err)
  }
}

async function confirmDelete() {
  if (!group.value) return
  try {
    await employeeGroupService.delete(groupId)
    showDeleteConfirm.value = false
    router.push('/hr/employee-groups')
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Gagal menghapus grup'
  }
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <AppPageHeader
      :title="group ? group.nama : 'Detail Grup Karyawan'"
      :subtitle="
        group
          ? `Kode: ${group.kode || '-'} • Anggota: ${group.member_count ?? 0} orang`
          : 'Memuat data...'
      "
    >
      <template #icon>
        <Users2 class="w-6 h-6 text-primary" />
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
            v-if="canUpdate && group"
            variant="primary"
            size="sm"
            class="flex items-center gap-1.5 text-xs"
            @click="isMemberPickerOpen = true"
          >
            <UserPlus class="w-4 h-4" /> Tambah Anggota
          </AppButton>

          <AppButton
            v-if="canUpdate && group"
            variant="outline"
            size="sm"
            class="flex items-center gap-1.5 text-xs"
            @click="isEditModalOpen = true"
          >
            <Edit2 class="w-3.5 h-3.5" /> Ubah Grup
          </AppButton>

          <AppButton
            v-if="canUpdate && group"
            :variant="group.status_aktif === 1 ? 'outline' : 'primary'"
            size="sm"
            class="flex items-center gap-1.5 text-xs"
            :class="
              group.status_aktif === 1
                ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
            "
            @click="showStatusConfirm = true"
          >
            <Power class="w-3.5 h-3.5" />
            {{ group.status_aktif === 1 ? 'Nonaktifkan' : 'Aktifkan' }}
          </AppButton>

          <AppButton
            v-if="canDelete && group"
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

    <div
      v-if="errorMessage"
      class="mb-4 bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700"
    >
      {{ errorMessage }}
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="bg-surface rounded-lg border border-border p-6 space-y-4">
      <AppSkeleton class="h-6 w-48 mb-4" />
      <AppSkeleton class="h-32 w-full" />
    </div>

    <!-- Detail Content -->
    <div v-else-if="group" class="space-y-6">
      <!-- Section 1: Overview Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Info Card -->
        <div
          class="md:col-span-2 bg-surface rounded-lg border border-border p-5 shadow-sm space-y-4"
        >
          <div class="flex items-center justify-between border-b border-border/60 pb-3">
            <div class="flex items-center gap-3">
              <span
                class="w-6 h-6 rounded-full border border-black/10 inline-block"
                :style="{ backgroundColor: group.color || '#0F766E' }"
              />
              <h2 class="text-sm font-bold text-text">{{ group.nama }}</h2>
            </div>
            <EmployeeStatusBadge type="active" :status="group.status_aktif" />
          </div>

          <div class="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span class="text-secondary-text block mb-1">Kode Grup:</span>
              <span
                class="font-mono font-semibold text-text bg-slate-100 px-2 py-0.5 rounded border border-slate-200"
              >
                {{ group.kode || '-' }}
              </span>
            </div>
            <div>
              <span class="text-secondary-text block mb-1">Jumlah Anggota Aktif:</span>
              <span class="font-bold text-primary flex items-center gap-1.5">
                <Users class="w-4 h-4" /> {{ group.member_count ?? 0 }} karyawan
              </span>
            </div>
          </div>
        </div>

        <!-- Audit Card -->
        <div class="bg-surface rounded-lg border border-border p-5 shadow-sm space-y-3 text-xs">
          <h3
            class="font-semibold text-text text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-border/60 pb-2"
          >
            <Clock class="w-3.5 h-3.5 text-primary" /> Jejak Audit
          </h3>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-secondary-text">Dibuat Pada</span>
              <span class="font-mono text-text">{{ group.created_at || '-' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-secondary-text">Dibuat Oleh</span>
              <span class="text-text">{{ group.creator_name || '-' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-secondary-text">Diperbarui</span>
              <span class="font-mono text-text">{{ group.updated_at || '-' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-secondary-text">Diperbarui Oleh</span>
              <span class="text-text">{{ group.updater_name || '-' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 2: Anggota Grup -->
      <div class="bg-surface rounded-lg border border-border p-5 shadow-sm space-y-4">
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3"
        >
          <div>
            <h3 class="text-sm font-bold text-text flex items-center gap-2">
              <Users class="w-4 h-4 text-primary" /> Anggota Grup Karyawan
            </h3>
            <p class="text-xs text-secondary-text mt-0.5">
              Daftar personalia yang ditugaskan ke dalam regu kerja {{ group.nama }}.
            </p>
          </div>
          <AppButton
            v-if="canUpdate"
            variant="primary"
            size="sm"
            class="flex items-center gap-1.5 text-xs self-start sm:self-auto"
            @click="isMemberPickerOpen = true"
          >
            <UserPlus class="w-3.5 h-3.5" /> Tambah Anggota
          </AppButton>
        </div>

        <EmployeeGroupMembersTable
          ref="membersTableRef"
          :group-id="groupId"
          :group-name="group.nama"
          :can-manage="canUpdate"
          @member-removed="handleMemberRemoved"
        />
      </div>
    </div>

    <!-- Edit Group Modal -->
    <EmployeeGroupFormModal
      v-model="isEditModalOpen"
      mode="edit"
      :initial-data="group"
      @success="loadGroup"
    />

    <!-- Member Picker Modal -->
    <EmployeeGroupMemberPickerModal
      v-if="group"
      v-model="isMemberPickerOpen"
      :group-id="groupId"
      :group-name="group.nama"
      @assigned="handleMembersAssigned"
    />

    <!-- Toggle Status Confirm -->
    <AppConfirmDialog
      v-model="showStatusConfirm"
      :title="group?.status_aktif === 1 ? 'Nonaktifkan Grup?' : 'Aktifkan Grup?'"
      :message="
        group?.status_aktif === 1
          ? `Apakah Anda yakin ingin menonaktifkan grup '${group?.nama}'?`
          : `Apakah Anda yakin ingin mengaktifkan kembali grup '${group?.nama}'?`
      "
      :confirm-text="group?.status_aktif === 1 ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'"
      :confirm-variant="group?.status_aktif === 1 ? 'danger' : 'primary'"
      @confirm="confirmToggleStatus"
    />

    <!-- Delete Confirm -->
    <AppConfirmDialog
      v-model="showDeleteConfirm"
      title="Hapus Grup Karyawan?"
      :message="`Apakah Anda yakin ingin menghapus grup '${group?.nama}'? Penghapusan akan dicegah jika masih terdapat karyawan yang menjadi anggota.`"
      confirm-text="Ya, Hapus Grup"
      cancel-text="Batal"
      confirm-variant="danger"
      @confirm="confirmDelete"
    />
  </div>
</template>
