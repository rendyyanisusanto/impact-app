<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import { employeeService } from '../services/employee.service'
import type { Employee } from '../types/employee.types'
import { UserPlus, AlertCircle } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
  groupId: number
  groupName: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'assigned', count: number): void
}>()

const availableEmployees = ref<Employee[]>([])
const selectedIds = ref<number[]>([])
const searchQuery = ref('')
const isLoading = ref(false)
const isAssigning = ref(false)
const errorMessage = ref<string | null>(null)

watch(
  () => props.modelValue,
  async isOpen => {
    if (isOpen && props.groupId) {
      searchQuery.value = ''
      selectedIds.value = []
      errorMessage.value = null
      await loadAvailableEmployees()
    }
  }
)

async function loadAvailableEmployees() {
  isLoading.value = true
  try {
    availableEmployees.value = employeeService.getNonMembersByGroupId(props.groupId)
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Gagal memuat daftar karyawan'
  } finally {
    isLoading.value = false
  }
}

const filteredEmployees = computed(() => {
  if (!searchQuery.value.trim()) return availableEmployees.value
  const q = searchQuery.value.trim().toLowerCase()
  return availableEmployees.value.filter(
    e =>
      e.nama.toLowerCase().includes(q) ||
      (e.kode && e.kode.toLowerCase().includes(q)) ||
      (e.jabatan_nama && e.jabatan_nama.toLowerCase().includes(q))
  )
})

const isAllSelected = computed(() => {
  return (
    filteredEmployees.value.length > 0 &&
    selectedIds.value.length === filteredEmployees.value.length
  )
})

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = filteredEmployees.value.map(e => e.id)
  }
}

function toggleSelect(id: number) {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(id)
  }
}

async function handleAssign() {
  if (selectedIds.value.length === 0 || isAssigning.value) return
  isAssigning.value = true
  errorMessage.value = null

  try {
    await employeeService.bulkAssignGroup(selectedIds.value, props.groupId)
    emit('assigned', selectedIds.value.length)
    emit('update:modelValue', false)
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Gagal menambahkan anggota ke grup'
  } finally {
    isAssigning.value = false
  }
}
</script>

<template>
  <AppModal
    :model-value="modelValue"
    :title="`Tambah Anggota Grup — ${groupName}`"
    size="lg"
    @update:model-value="val => emit('update:modelValue', val)"
  >
    <div class="space-y-4">
      <p class="text-xs text-secondary-text">
        Pilih karyawan aktif untuk dimasukkan ke dalam grup <b>{{ groupName }}</b
        >. Karyawan yang dipindahkan akan diperbarui penugasan grup kerjanya.
      </p>

      <div
        v-if="errorMessage"
        class="bg-rose-50 border border-rose-200 rounded p-2 text-xs text-rose-700 flex items-center gap-1.5"
      >
        <AlertCircle class="w-4 h-4" /> {{ errorMessage }}
      </div>

      <!-- Search Bar -->
      <div class="relative">
        <AppInput
          v-model="searchQuery"
          placeholder="Cari karyawan berdasarkan nama, kode, atau jabatan..."
          class="w-full text-xs"
        />
      </div>

      <!-- Employee Selection Table -->
      <div class="border border-border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
        <div v-if="isLoading" class="p-6 text-center text-xs text-secondary-text">
          Memuat data karyawan...
        </div>
        <div
          v-else-if="filteredEmployees.length === 0"
          class="p-6 text-center text-xs text-secondary-text"
        >
          Tidak ada data karyawan yang dapat ditambahkan.
        </div>
        <table v-else class="w-full text-left text-xs border-collapse">
          <thead
            class="bg-slate-50 border-b border-border text-[11px] text-secondary-text uppercase tracking-wider sticky top-0"
          >
            <tr>
              <th class="w-8 px-3 py-2 text-center">
                <input
                  type="checkbox"
                  class="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                  :checked="isAllSelected"
                  @change="toggleSelectAll"
                />
              </th>
              <th class="px-3 py-2">Kode</th>
              <th class="px-3 py-2">Nama Karyawan</th>
              <th class="px-3 py-2">Jabatan</th>
              <th class="px-3 py-2">Grup Saat Ini</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr
              v-for="emp in filteredEmployees"
              :key="emp.id"
              class="hover:bg-slate-50/70 transition-colors cursor-pointer"
              :class="{ 'bg-emerald-50/30': selectedIds.includes(emp.id) }"
              @click="toggleSelect(emp.id)"
            >
              <td class="px-3 py-2 text-center" @click.stop>
                <input
                  type="checkbox"
                  class="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                  :checked="selectedIds.includes(emp.id)"
                  @change="toggleSelect(emp.id)"
                />
              </td>
              <td class="px-3 py-2 font-mono text-secondary-text">{{ emp.kode || '-' }}</td>
              <td class="px-3 py-2 font-medium text-text">{{ emp.nama }}</td>
              <td class="px-3 py-2">
                <span
                  class="text-[11px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200"
                >
                  {{ emp.jabatan_nama }}
                </span>
              </td>
              <td class="px-3 py-2 text-secondary-text">
                <span
                  v-if="emp.grup_karyawan_nama && emp.grup_karyawan_nama !== 'Tanpa Grup'"
                  class="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[11px] border border-amber-200"
                >
                  Pindah dari {{ emp.grup_karyawan_nama }}
                </span>
                <span v-else class="text-slate-400 italic text-[11px]"> Tanpa Grup </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer & Action Buttons -->
      <div class="border-t border-border pt-4 flex items-center justify-between">
        <span class="text-xs text-secondary-text">
          Dipilih: <b class="text-text">{{ selectedIds.length }}</b> karyawan
        </span>
        <div class="flex items-center gap-2">
          <AppButton
            variant="outline"
            size="sm"
            type="button"
            @click="emit('update:modelValue', false)"
          >
            Batal
          </AppButton>
          <AppButton
            variant="primary"
            size="sm"
            type="button"
            :disabled="selectedIds.length === 0"
            :loading="isAssigning"
            class="flex items-center gap-1.5"
            @click="handleAssign"
          >
            <UserPlus class="w-4 h-4" /> Masukkan ke Grup ({{ selectedIds.length }})
          </AppButton>
        </div>
      </div>
    </div>
  </AppModal>
</template>
