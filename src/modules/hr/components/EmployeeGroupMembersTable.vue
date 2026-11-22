<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import EmployeeStatusBadge from './EmployeeStatusBadge.vue'
import { employeeService } from '../services/employee.service'
import type { Employee } from '../types/employee.types'
import { UserMinus, Eye, Users } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    groupId: number
    groupName: string
    canManage?: boolean
  }>(),
  {
    canManage: true
  }
)

const emit = defineEmits<{
  (e: 'member-removed', emp: Employee): void
  (e: 'count-changed', newCount: number): void
}>()

const router = useRouter()
const members = ref<Employee[]>([])
const isLoading = ref(false)
const searchQuery = ref('')
const selectedMember = ref<Employee | null>(null)
const showRemoveConfirm = ref(false)
const isRemoving = ref(false)
const errorMessage = ref<string | null>(null)

async function loadMembers() {
  isLoading.value = true
  errorMessage.value = null
  try {
    members.value = employeeService.getMembersByGroupId(props.groupId)
    emit('count-changed', members.value.length)
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Gagal memuat anggota grup'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadMembers()
})

watch(
  () => props.groupId,
  () => {
    loadMembers()
  }
)

defineExpose({
  reload: loadMembers
})

const filteredMembers = computed(() => {
  if (!searchQuery.value.trim()) return members.value
  const q = searchQuery.value.trim().toLowerCase()
  return members.value.filter(
    m =>
      m.nama.toLowerCase().includes(q) ||
      (m.kode && m.kode.toLowerCase().includes(q)) ||
      (m.jabatan_nama && m.jabatan_nama.toLowerCase().includes(q)) ||
      (m.nik && m.nik.toLowerCase().includes(q))
  )
})

function promptRemove(emp: Employee) {
  selectedMember.value = emp
  showRemoveConfirm.value = true
}

async function confirmRemove() {
  if (!selectedMember.value) return
  isRemoving.value = true
  try {
    const updated = await employeeService.removeMemberFromGroup(selectedMember.value.id)
    showRemoveConfirm.value = false
    emit('member-removed', updated)
    await loadMembers()
  } catch (err: unknown) {
    errorMessage.value =
      err instanceof Error ? err.message : 'Gagal mengeluarkan karyawan dari grup'
  } finally {
    isRemoving.value = false
    selectedMember.value = null
  }
}

function handleViewEmployee(id: number) {
  router.push(`/hr/employees/${id}`)
}
</script>

<template>
  <div class="space-y-3">
    <!-- Toolbar Search & Count -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
      <div class="w-full sm:w-72">
        <AppInput
          v-model="searchQuery"
          placeholder="Cari anggota dalam grup ini..."
          class="w-full text-xs"
        />
      </div>
      <div class="text-xs text-secondary-text">
        Total Anggota: <b class="text-text">{{ members.length }}</b> orang
      </div>
    </div>

    <div
      v-if="errorMessage"
      class="bg-rose-50 border border-rose-200 rounded p-2.5 text-xs text-rose-700"
    >
      {{ errorMessage }}
    </div>

    <!-- Table -->
    <div class="border border-border rounded-lg overflow-hidden bg-surface shadow-sm">
      <div v-if="isLoading" class="p-8 text-center text-xs text-secondary-text">
        Memuat daftar anggota...
      </div>
      <div
        v-else-if="filteredMembers.length === 0"
        class="p-8 text-center text-xs text-secondary-text"
      >
        <Users class="w-8 h-8 text-slate-300 mx-auto mb-2" />
        Belum ada anggota karyawan di grup ini.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead
            class="bg-slate-50 border-b border-border text-[11px] text-secondary-text font-semibold uppercase tracking-wider"
          >
            <tr>
              <th class="px-3 py-2.5 w-10 text-center">No.</th>
              <th class="px-3 py-2.5">Kode</th>
              <th class="px-3 py-2.5">UID FP</th>
              <th class="px-3 py-2.5">Nama Karyawan</th>
              <th class="px-3 py-2.5">No. HP</th>
              <th class="px-3 py-2.5">Jabatan</th>
              <th class="px-3 py-2.5">Status Karyawan</th>
              <th class="px-3 py-2.5 text-center">Status</th>
              <th v-if="canManage" class="px-3 py-2.5 text-center w-28">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr
              v-for="(member, index) in filteredMembers"
              :key="member.id"
              class="hover:bg-slate-50/70 transition-colors"
            >
              <td class="px-3 py-2.5 text-center text-secondary-text">{{ index + 1 }}</td>
              <td class="px-3 py-2.5 font-mono text-secondary-text">{{ member.kode || '-' }}</td>
              <td class="px-3 py-2.5 font-mono text-slate-700">
                <span
                  class="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px] border border-slate-200"
                >
                  {{ member.uid_fingerprint ?? '-' }}
                </span>
              </td>
              <td class="px-3 py-2.5 font-medium text-text">
                <button
                  type="button"
                  class="hover:text-primary hover:underline text-left font-medium"
                  @click="handleViewEmployee(member.id)"
                >
                  {{ member.nama }}
                </button>
              </td>
              <td class="px-3 py-2.5 text-secondary-text">{{ member.no_hp || '-' }}</td>
              <td class="px-3 py-2.5">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border"
                  :style="{
                    backgroundColor: `${member.jabatan_color}15`,
                    borderColor: `${member.jabatan_color}40`,
                    color: member.jabatan_color || '#1e293b'
                  }"
                >
                  {{ member.jabatan_nama }}
                </span>
              </td>
              <td class="px-3 py-2.5">
                <EmployeeStatusBadge
                  type="employment"
                  :label="member.status_karyawan_nama"
                  :color="member.status_karyawan_color"
                />
              </td>
              <td class="px-3 py-2.5 text-center">
                <EmployeeStatusBadge type="active" :status="member.status" />
              </td>
              <td v-if="canManage" class="px-3 py-2.5 text-center">
                <div class="inline-flex items-center gap-1">
                  <button
                    type="button"
                    class="p-1 text-slate-500 hover:text-primary hover:bg-slate-100 rounded transition-colors"
                    title="Lihat Detail Karyawan"
                    @click="handleViewEmployee(member.id)"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    class="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                    title="Keluarkan dari Grup"
                    @click="promptRemove(member)"
                  >
                    <UserMinus class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Confirm Remove Member Dialog -->
    <AppConfirmDialog
      v-model="showRemoveConfirm"
      title="Keluarkan dari Grup?"
      :message="`Apakah Anda yakin ingin mengeluarkan karyawan '${selectedMember?.nama}' dari grup '${groupName}'? Data master karyawan TIDAK akan dihapus, melainkan status grupnya diubah menjadi Tanpa Grup.`"
      confirm-text="Ya, Keluarkan dari Grup"
      cancel-text="Batal"
      confirm-variant="danger"
      @confirm="confirmRemove"
    />
  </div>
</template>
