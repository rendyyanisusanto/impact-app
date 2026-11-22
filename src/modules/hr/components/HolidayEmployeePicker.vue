<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Search, CheckSquare, Square, X, UserCheck } from 'lucide-vue-next'
import AppButton from '@/shared/components/ui/AppButton.vue'
import { employeeService } from '../services/employee.service'
import { employeeGroupService } from '../services/employee-group.service'
import type { Employee } from '../types/employee.types'
import type { EmployeeGroup } from '../types/employee-group.types'

const props = withDefaults(
  defineProps<{
    modelValue: number[]
    disabled?: boolean
  }>(),
  {
    modelValue: () => [],
    disabled: false
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: number[]): void
}>()

const employees = ref<Employee[]>([])
const groups = ref<EmployeeGroup[]>([])
const searchQuery = ref('')
const selectedGroupFilter = ref<number | 'all'>('all')
const groupToAdd = ref<number | ''>('')
const isLoading = ref(false)

onMounted(async () => {
  isLoading.value = true
  try {
    const [allEmps, allGroups] = await Promise.all([
      employeeService.getAll(),
      employeeGroupService.getActiveGroups()
    ])
    // Only active employees (status === 1)
    employees.value = allEmps.filter(e => e.status === 1)
    groups.value = allGroups
  } catch (err) {
    console.error('Failed to load employees or groups:', err)
  } finally {
    isLoading.value = false
  }
})

// Filtered list based on search and optional group filter
const filteredEmployees = computed(() => {
  let list = employees.value

  if (selectedGroupFilter.value !== 'all') {
    list = list.filter(e => e.grup_karyawan_id === Number(selectedGroupFilter.value))
  }

  if (searchQuery.value.trim() !== '') {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(
      e =>
        e.nama.toLowerCase().includes(q) ||
        (e.kode && e.kode.toLowerCase().includes(q)) ||
        (e.jabatan_nama && e.jabatan_nama.toLowerCase().includes(q))
    )
  }

  return list
})

// Enriched selected employees
const selectedEmployees = computed(() => {
  const set = new Set(props.modelValue)
  return employees.value.filter(e => set.has(e.id))
})

const isAllVisibleSelected = computed(() => {
  if (filteredEmployees.value.length === 0) return false
  return filteredEmployees.value.every(e => props.modelValue.includes(e.id))
})

// Toggle single employee
function toggleEmployee(id: number) {
  if (props.disabled) return
  const current = [...props.modelValue]
  const idx = current.indexOf(id)
  if (idx > -1) {
    current.splice(idx, 1)
  } else {
    current.push(id)
  }
  emit('update:modelValue', current)
}

// Remove single employee
function removeEmployee(id: number) {
  if (props.disabled) return
  emit(
    'update:modelValue',
    props.modelValue.filter(val => val !== id)
  )
}

// Select all currently visible
function toggleSelectAllVisible() {
  if (props.disabled) return
  if (isAllVisibleSelected.value) {
    // Unselect visible
    const visibleIds = new Set(filteredEmployees.value.map(e => e.id))
    emit(
      'update:modelValue',
      props.modelValue.filter(id => !visibleIds.has(id))
    )
  } else {
    // Select visible (union)
    const set = new Set([...props.modelValue, ...filteredEmployees.value.map(e => e.id)])
    emit('update:modelValue', Array.from(set))
  }
}

// Clear all selections
function clearAll() {
  if (props.disabled) return
  emit('update:modelValue', [])
}

// Group-assisted quick selection: Appends all members of the selected group
function handleAddGroupMembers() {
  if (props.disabled || !groupToAdd.value) return
  const grpId = Number(groupToAdd.value)
  const groupMembers = employees.value.filter(e => e.grup_karyawan_id === grpId)
  const newSet = new Set([...props.modelValue, ...groupMembers.map(e => e.id)])
  emit('update:modelValue', Array.from(newSet))
  groupToAdd.value = ''
}
</script>

<template>
  <div class="space-y-3">
    <!-- Header Controls & Group-assisted helper -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
      <!-- Search Input -->
      <div class="relative flex-1">
        <Search class="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
        <input
          v-model="searchQuery"
          type="text"
          :disabled="disabled"
          placeholder="Cari nama, NIK/kode, atau jabatan..."
          class="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] disabled:bg-slate-100"
        />
      </div>

      <!-- Group Helper: Append all members of a group -->
      <div class="flex items-center space-x-1.5 shrink-0">
        <select
          v-model="groupToAdd"
          :disabled="disabled"
          class="h-8 py-1 px-2.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-[#0F766E] disabled:bg-slate-100 cursor-pointer"
          @change="handleAddGroupMembers"
        >
          <option value="">+ Tambah Berdasarkan Grup...</option>
          <option v-for="g in groups" :key="g.id" :value="g.id">
            Grup: {{ g.nama }} ({{ g.member_count ?? 0 }})
          </option>
        </select>

        <AppButton
          variant="secondary"
          size="xs"
          :disabled="disabled || modelValue.length === 0"
          title="Hapus semua pilihan pengecualian"
          @click="clearAll"
        >
          Reset
        </AppButton>
      </div>
    </div>

    <!-- Active Selection Summary & Chips -->
    <div
      v-if="selectedEmployees.length > 0"
      class="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5"
    >
      <div class="flex items-center justify-between text-xs text-slate-600 font-medium">
        <span class="flex items-center space-x-1 text-emerald-800">
          <UserCheck class="w-3.5 h-3.5" />
          <strong>{{ selectedEmployees.length }}</strong> karyawan dikecualikan (tetap masuk):
        </span>
        <button
          type="button"
          :disabled="disabled"
          class="text-[11px] text-slate-400 hover:text-red-600 transition-colors"
          @click="clearAll"
        >
          Kosongkan
        </button>
      </div>

      <div class="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
        <span
          v-for="emp in selectedEmployees"
          :key="emp.id"
          class="inline-flex items-center pl-2 pr-1 py-0.5 rounded text-xs bg-white border border-slate-200 shadow-2xs text-slate-800"
        >
          <span
            v-if="emp.grup_karyawan_color"
            class="w-1.5 h-1.5 rounded-full mr-1.5 shrink-0"
            :style="{ backgroundColor: emp.grup_karyawan_color }"
          />
          <span class="font-medium mr-1">{{ emp.nama }}</span>
          <span class="text-slate-400 text-[10px] mr-1 font-mono">({{ emp.kode }})</span>
          <button
            type="button"
            :disabled="disabled"
            class="p-0.5 text-slate-400 hover:text-red-500 rounded transition-colors"
            @click="removeEmployee(emp.id)"
          >
            <X class="w-3 h-3" />
          </button>
        </span>
      </div>
    </div>

    <!-- Employee List Card with Checkboxes -->
    <div class="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <!-- Subheader: Select All & Count -->
      <div
        class="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600"
      >
        <button
          type="button"
          :disabled="disabled || filteredEmployees.length === 0"
          class="inline-flex items-center space-x-1.5 text-slate-700 hover:text-slate-900 font-semibold"
          @click="toggleSelectAllVisible"
        >
          <CheckSquare v-if="isAllVisibleSelected" class="w-4 h-4 text-[#0F766E]" />
          <Square v-else class="w-4 h-4 text-slate-400" />
          <span>Pilih Semua yang Tampil ({{ filteredEmployees.length }})</span>
        </button>

        <!-- Filter by Group Dropdown -->
        <div class="flex items-center space-x-1.5">
          <span class="text-slate-400">Filter:</span>
          <select
            v-model="selectedGroupFilter"
            :disabled="disabled"
            class="border-0 bg-transparent text-xs text-slate-700 font-medium focus:outline-hidden py-0 cursor-pointer"
          >
            <option value="all">Semua Grup</option>
            <option v-for="g in groups" :key="g.id" :value="g.id">
              {{ g.nama }}
            </option>
          </select>
        </div>
      </div>

      <!-- Scrollable List of Employees -->
      <div class="max-h-60 overflow-y-auto divide-y divide-slate-100">
        <div v-if="isLoading" class="p-4 space-y-2">
          <div v-for="i in 4" :key="i" class="h-6 bg-slate-100 rounded animate-pulse" />
        </div>

        <div
          v-else-if="filteredEmployees.length === 0"
          class="p-6 text-center text-xs text-slate-400 italic"
        >
          Tidak ada karyawan yang sesuai kriteria pencarian.
        </div>

        <template v-else>
          <div
            v-for="emp in filteredEmployees"
            :key="emp.id"
            class="flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-50 transition-colors cursor-pointer select-none"
            @click="toggleEmployee(emp.id)"
          >
            <div class="flex items-center space-x-2.5">
              <input
                type="checkbox"
                :checked="modelValue.includes(emp.id)"
                :disabled="disabled"
                class="w-4 h-4 rounded text-[#0F766E] border-slate-300 focus:ring-[#0F766E] pointer-events-none"
              />
              <div
                v-if="emp.grup_karyawan_color"
                class="w-2.5 h-2.5 rounded-full shrink-0"
                :style="{ backgroundColor: emp.grup_karyawan_color }"
                :title="emp.grup_karyawan_nama || 'Grup'"
              />
              <div>
                <span class="font-medium text-slate-900">{{ emp.nama }}</span>
                <span class="text-slate-400 font-mono ml-1.5"
                  >({{ emp.kode || emp.nik || `#${emp.id}` }})</span
                >
              </div>
            </div>

            <div class="flex items-center space-x-2">
              <span class="text-slate-500 text-[11px]">{{ emp.jabatan_nama || '-' }}</span>
              <span
                v-if="emp.grup_karyawan_nama"
                class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600"
              >
                {{ emp.grup_karyawan_nama }}
              </span>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
