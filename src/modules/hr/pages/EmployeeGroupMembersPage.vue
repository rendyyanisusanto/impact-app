<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppSkeleton from '@/shared/components/ui/AppSkeleton.vue'
import EmployeeGroupMembersTable from '../components/EmployeeGroupMembersTable.vue'
import EmployeeGroupMemberPickerModal from '../components/EmployeeGroupMemberPickerModal.vue'
import { employeeGroupService } from '../services/employee-group.service'
import type { EmployeeGroup } from '../types/employee-group.types'
import { usePermission } from '@/shared/composables/usePermission'
import { Users2, ArrowLeft, UserPlus } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const { hasPermission } = usePermission()

const groupId = Number(route.params.id)
const group = ref<EmployeeGroup | null>(null)
const isLoading = ref(true)
const isPickerOpen = ref(false)
const membersTableRef = ref<InstanceType<typeof EmployeeGroupMembersTable> | null>(null)

const canManage = computed(
  () => hasPermission('hr:update') || hasPermission('hr.employee-groups:update')
)

async function loadGroup() {
  isLoading.value = true
  try {
    group.value = await employeeGroupService.getById(groupId)
  } catch (err) {
    console.error('Failed to load group:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadGroup()
})

function handleBack() {
  router.push(`/hr/employee-groups/${groupId}`)
}

function handleAssigned() {
  loadGroup()
  membersTableRef.value?.reload()
}
</script>

<template>
  <div>
    <AppPageHeader
      :title="`Kelola Anggota — ${group ? group.nama : 'Grup Karyawan'}`"
      :subtitle="
        group
          ? `Kode: ${group.kode || '-'} • Anggota aktif: ${group.member_count ?? 0} orang`
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
            <ArrowLeft class="w-4 h-4" /> Kembali ke Detail
          </AppButton>

          <AppButton
            v-if="canManage && group"
            variant="primary"
            size="sm"
            class="flex items-center gap-1.5 text-xs"
            @click="isPickerOpen = true"
          >
            <UserPlus class="w-3.5 h-3.5" /> Tambah Anggota
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <div v-if="isLoading" class="bg-surface rounded-lg border border-border p-6">
      <AppSkeleton class="h-6 w-48 mb-4" />
      <AppSkeleton class="h-40 w-full" />
    </div>

    <div
      v-else-if="group"
      class="bg-surface rounded-lg border border-border p-5 shadow-sm space-y-4"
    >
      <EmployeeGroupMembersTable
        ref="membersTableRef"
        :group-id="groupId"
        :group-name="group.nama"
        :can-manage="canManage"
        @member-removed="loadGroup"
      />
    </div>

    <!-- Member Picker Modal -->
    <EmployeeGroupMemberPickerModal
      v-if="group"
      v-model="isPickerOpen"
      :group-id="groupId"
      :group-name="group.nama"
      @assigned="handleAssigned"
    />
  </div>
</template>
