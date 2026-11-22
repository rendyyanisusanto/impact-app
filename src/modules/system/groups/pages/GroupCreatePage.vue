<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import GroupDashboardAccess from '../components/GroupDashboardAccess.vue'
import GroupPermissionMatrix from '../components/GroupPermissionMatrix.vue'
import GroupPermissionSummary from '../components/GroupPermissionSummary.vue'
import { groupService } from '../services/group.service'
import { createDefaultPermissions, calculatePermissionSummary } from '../utils/permission-registry'
import type { SubmenuPermissionFlag, GroupFormDto } from '../types/group.types'
import { useToast } from '@/shared/composables/useToast'
import { ArrowLeft, Save, AlertCircle } from 'lucide-vue-next'

const router = useRouter()
const toast = useToast()

const name = ref('')
const description = ref('')
const dashboardIds = ref<(number | string)[]>([])
const permissions = ref<Record<string, SubmenuPermissionFlag>>(createDefaultPermissions())

const isSubmitting = ref(false)
const validationErrors = ref<Record<string, string>>({})
const isSaved = ref(false)

// Unsaved changes dialog
const isLeaveConfirmOpen = ref(false)
let pendingNext: (() => void) | null = null

const isDirty = computed(() => {
  if (isSaved.value) return false
  if (name.value.trim() !== '') return true
  if (description.value.trim() !== '') return true
  if (dashboardIds.value.length > 0) return true
  const hasAnyChecked = Object.values(permissions.value).some(
    (p) => p.c || p.r || p.u || p.d
  )
  return hasAnyChecked
})

onBeforeRouteLeave((_to, _from, next) => {
  if (isDirty.value && !isSaved.value) {
    isLeaveConfirmOpen.value = true
    pendingNext = next
  } else {
    next()
  }
})

function confirmLeave() {
  isLeaveConfirmOpen.value = false
  isSaved.value = true
  if (pendingNext) pendingNext()
}

function cancelLeave() {
  isLeaveConfirmOpen.value = false
  pendingNext = null
}

const summary = computed(() => {
  return calculatePermissionSummary(permissions.value, dashboardIds.value)
})

function handleCancel() {
  router.push('/system/groups')
}

async function handleSubmit() {
  validationErrors.value = {}
  isSubmitting.value = true

  const dto: GroupFormDto = {
    name: name.value,
    description: description.value,
    dashboardIds: dashboardIds.value,
    permissions: permissions.value
  }

  try {
    const created = await groupService.create(dto)
    isSaved.value = true
    toast.success(`Data groups "${created.name}" berhasil ditambahkan`)
    router.push('/system/groups')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Data groups gagal ditambahkan'
    toast.error(msg)
    if (msg.includes('Nama Groups')) {
      validationErrors.value.name = msg
    } else if (msg.includes('Keterangan')) {
      validationErrors.value.description = msg
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <AppPageHeader
      title="Master Data Groups - TAMBAH DATA"
      subtitle="Definisikan nama role grup pengguna, hak akses widget dashboard, dan matrix permission CRUD"
      :breadcrumbs="[
        { label: 'System Setting', to: '/system/groups' },
        { label: 'Master Data Groups (Role)', to: '/system/groups' },
        { label: 'Tambah Data' }
      ]"
    >
      <template #actions>
        <div class="flex items-center gap-2">
          <AppButton
            variant="outline"
            size="sm"
            @click="handleCancel"
          >
            <ArrowLeft class="w-4 h-4 mr-1.5" />
            Batalkan
          </AppButton>
          <AppButton
            variant="primary"
            size="sm"
            :is-loading="isSubmitting"
            @click="handleSubmit"
          >
            <Save class="w-4 h-4 mr-1.5" />
            Simpan Data
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <!-- Permission Metrics Summary -->
    <GroupPermissionSummary :summary="summary" />

    <!-- Form Container -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-8">
      <!-- Section 1: Informasi Groups -->
      <div class="space-y-4">
        <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">
          Informasi Groups :
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Nama -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nama : <span class="text-red-500">*</span>
            </label>
            <input
              v-model="name"
              type="text"
              maxlength="20"
              placeholder="Contoh: Staff Gudang"
              class="w-full px-3.5 py-2 text-xs rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              :class="validationErrors.name ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'"
            />
            <p v-if="validationErrors.name" class="text-[11px] text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle class="w-3 h-3" /> {{ validationErrors.name }}
            </p>
            <p v-else class="text-[11px] text-slate-400 mt-1">
              Maksimal 20 karakter sesuai skema database legacy.
            </p>
          </div>

          <!-- Keterangan -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Keterangan : <span class="text-red-500">*</span>
            </label>
            <input
              v-model="description"
              type="text"
              maxlength="100"
              placeholder="Contoh: Khusus administrasi gudang dan logistik"
              class="w-full px-3.5 py-2 text-xs rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              :class="validationErrors.description ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'"
            />
            <p v-if="validationErrors.description" class="text-[11px] text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle class="w-3 h-3" /> {{ validationErrors.description }}
            </p>
            <p v-else class="text-[11px] text-slate-400 mt-1">
              Deskripsi ringkas tanggung jawab role (maksimal 100 karakter).
            </p>
          </div>
        </div>
      </div>

      <hr class="border-slate-200 dark:border-slate-800" />

      <!-- Section 2: Dashboard Access -->
      <GroupDashboardAccess v-model="dashboardIds" />

      <hr class="border-slate-200 dark:border-slate-800" />

      <!-- Section 3: Role Access Permission Matrix -->
      <div class="space-y-4">
        <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Role Access (Matrix Permission Submenu) :
        </h3>

        <GroupPermissionMatrix v-model="permissions" />
      </div>

      <!-- Bottom Sticky Footer Actions -->
      <div class="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
        <AppButton
          variant="outline"
          @click="handleCancel"
        >
          Batalkan
        </AppButton>
        <AppButton
          variant="primary"
          :is-loading="isSubmitting"
          @click="handleSubmit"
        >
          <Save class="w-4 h-4 mr-1.5" />
          Simpan Data
        </AppButton>
      </div>
    </div>

    <!-- Unsaved Changes Confirm Dialog -->
    <AppConfirmDialog
      :model-value="isLeaveConfirmOpen"
      title="Perubahan Belum Disimpan"
      message="Anda memiliki perubahan formulir group yang belum disimpan. Apakah Anda yakin ingin meninggalkan halaman ini?"
      confirm-text="Tinggalkan Halaman"
      cancel-text="Tetap Mengedit"
      variant="warning"
      @confirm="confirmLeave"
      @cancel="cancelLeave"
    />
  </div>
</template>

