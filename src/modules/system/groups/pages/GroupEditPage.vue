<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import GroupDashboardAccess from '../components/GroupDashboardAccess.vue'
import GroupPermissionMatrix from '../components/GroupPermissionMatrix.vue'
import GroupPermissionSummary from '../components/GroupPermissionSummary.vue'
import { groupService } from '../services/group.service'
import { calculatePermissionSummary } from '../utils/permission-registry'
import type { SubmenuPermissionFlag, GroupFormDto, Group } from '../types/group.types'
import { useToast } from '@/shared/composables/useToast'
import { ArrowLeft, Save, AlertCircle, Shield, RefreshCw } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const groupId = Number(route.params.id)
const group = ref<Group | null>(null)
const isLoading = ref(true)

const name = ref('')
const description = ref('')
const dashboardIds = ref<(number | string)[]>([])
const permissions = ref<Record<string, SubmenuPermissionFlag>>({})

// Initial snapshot to detect changes
let initialSnapshot = ''
const isSubmitting = ref(false)
const validationErrors = ref<Record<string, string>>({})
const isSaved = ref(false)

// Unsaved changes dialog
const isLeaveConfirmOpen = ref(false)
let pendingNext: (() => void) | null = null

async function loadGroupData() {
  isLoading.value = true
  try {
    const res = await groupService.getById(groupId)
    group.value = res.group
    name.value = res.group.name
    description.value = res.group.description
    dashboardIds.value = [...res.dashboardIds]
    permissions.value = JSON.parse(JSON.stringify(res.permissions))

    initialSnapshot = JSON.stringify({
      name: name.value,
      description: description.value,
      dashboardIds: dashboardIds.value,
      permissions: permissions.value
    })
  } catch (err: unknown) {
    toast.error(err instanceof Error ? err.message : 'Gagal memuat data group.')
    router.push('/system/groups')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadGroupData()
})

const isDirty = computed(() => {
  if (isSaved.value || isLoading.value) return false
  const currentSnapshot = JSON.stringify({
    name: name.value,
    description: description.value,
    dashboardIds: dashboardIds.value,
    permissions: permissions.value
  })
  return currentSnapshot !== initialSnapshot
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
    const updated = await groupService.update(groupId, dto)
    isSaved.value = true
    toast.success(`Data groups "${updated.name}" berhasil diperbarui`)
    router.push('/system/groups')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Data groups gagal diperbarui'
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
      :title="`Master Data Groups - EDIT DATA ${group?.name ? `(${group.name.toUpperCase()})` : ''}`"
      subtitle="Perbarui konfigurasi role, hak akses submenu, dan widget dashboard terkait"
      :breadcrumbs="[
        { label: 'System Setting', to: '/system/groups' },
        { label: 'Master Data Groups (Role)', to: '/system/groups' },
        { label: 'Edit Data' }
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
            Simpan Perubahan
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
      <RefreshCw class="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
      <p class="text-sm text-slate-500">Memuat konfigurasi groups...</p>
    </div>

    <template v-else-if="group">
      <!-- Superadmin notice if ID 1 -->
      <div
        v-if="group.id === 1"
        class="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3 text-amber-800 dark:text-amber-200 text-xs"
      >
        <Shield class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p class="font-bold text-sm">Role Default Sistem: Super Administrator</p>
          <p>
            Group ini adalah entitas root sistem. Nama default dilindungi dan seluruh hak akses utama dipastikan selalu aktif untuk mencegah penguncian sistem (lock-out).
          </p>
        </div>
      </div>

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
                :disabled="group.id === 1"
                class="w-full px-3.5 py-2 text-xs rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-60 disabled:cursor-not-allowed"
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
            Simpan Perubahan
          </AppButton>
        </div>
      </div>
    </template>

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

