<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import { positionService } from '@/modules/settings/positions/services/position.service'
import { employeeStatusService } from '@/modules/settings/employee-statuses/services/employee-status.service'
import { employeeGroupService } from '../services/employee-group.service'
import { RotateCcw } from 'lucide-vue-next'

defineProps<{
  searchQuery: string
  jabatanFilter: number | 'all'
  statusKaryawanFilter: number | 'all'
  grupFilter: number | 'all'
  statusAktifFilter: number | 'all' | string
}>()

const emit = defineEmits<{
  (e: 'update:searchQuery', val: string): void
  (e: 'update:jabatanFilter', val: number | 'all'): void
  (e: 'update:statusKaryawanFilter', val: number | 'all'): void
  (e: 'update:grupFilter', val: number | 'all'): void
  (e: 'update:statusAktifFilter', val: number | 'all' | string): void
  (e: 'reset'): void
}>()

const jabatanOptions = ref<{ value: number | 'all'; label: string }[]>([
  { value: 'all', label: 'Semua Jabatan' }
])
const statusKaryawanOptions = ref<{ value: number | 'all'; label: string }[]>([
  { value: 'all', label: 'Semua Status Karyawan' }
])
const grupOptions = ref<{ value: number | 'all'; label: string }[]>([
  { value: 'all', label: 'Semua Grup' },
  { value: 0, label: 'Tanpa Grup' }
])

const statusAktifOptions = [
  { value: 'all', label: 'Semua Status Aktif' },
  { value: '1', label: 'Aktif' },
  { value: '0', label: 'Nonaktif' }
]

onMounted(async () => {
  try {
    const posRes = await positionService.getAll()
    const positions = Array.isArray(posRes) ? posRes : posRes.data
    jabatanOptions.value = [
      { value: 'all', label: 'Semua Jabatan' },
      ...positions
        .filter(j => (j.is_deleted ?? 1) === 1)
        .map(j => ({ value: j.id, label: j.nama || `Jabatan #${j.id}` }))
    ]

    const stRes = await employeeStatusService.getAll()
    const statuses = Array.isArray(stRes) ? stRes : stRes.data
    statusKaryawanOptions.value = [
      { value: 'all', label: 'Semua Status Karyawan' },
      ...statuses.map(s => ({ value: s.id, label: s.nama || `Status #${s.id}` }))
    ]

    const groups = await employeeGroupService.getAll()
    grupOptions.value = [
      { value: 'all', label: 'Semua Grup' },
      { value: 0, label: 'Tanpa Grup' },
      ...groups.map(g => ({ value: g.id, label: g.nama }))
    ]
  } catch (err) {
    console.error('Failed to load filter reference options:', err)
  }
})
</script>

<template>
  <div class="bg-surface rounded-lg border border-border p-4 shadow-sm mb-4">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
      <!-- Search Input -->
      <div class="lg:col-span-1">
        <label
          class="block text-xs font-semibold text-secondary-text mb-1 uppercase tracking-wider"
        >
          Pencarian
        </label>
        <div class="relative">
          <AppInput
            :model-value="searchQuery"
            placeholder="Cari nama, NIK, kode..."
            class="w-full text-xs"
            @update:model-value="val => emit('update:searchQuery', String(val))"
          />
        </div>
      </div>

      <!-- Filter Jabatan -->
      <div>
        <label
          class="block text-xs font-semibold text-secondary-text mb-1 uppercase tracking-wider"
        >
          Jabatan
        </label>
        <AppSelect
          :model-value="String(jabatanFilter)"
          :options="jabatanOptions.map(o => ({ value: String(o.value), label: o.label }))"
          class="w-full text-xs"
          @update:model-value="
            val => emit('update:jabatanFilter', val === 'all' ? 'all' : Number(val))
          "
        />
      </div>

      <!-- Filter Status Karyawan -->
      <div>
        <label
          class="block text-xs font-semibold text-secondary-text mb-1 uppercase tracking-wider"
        >
          Status Karyawan
        </label>
        <AppSelect
          :model-value="String(statusKaryawanFilter)"
          :options="statusKaryawanOptions.map(o => ({ value: String(o.value), label: o.label }))"
          class="w-full text-xs"
          @update:model-value="
            val => emit('update:statusKaryawanFilter', val === 'all' ? 'all' : Number(val))
          "
        />
      </div>

      <!-- Filter Grup Karyawan -->
      <div>
        <label
          class="block text-xs font-semibold text-secondary-text mb-1 uppercase tracking-wider"
        >
          Grup
        </label>
        <AppSelect
          :model-value="String(grupFilter)"
          :options="grupOptions.map(o => ({ value: String(o.value), label: o.label }))"
          class="w-full text-xs"
          @update:model-value="
            val => emit('update:grupFilter', val === 'all' ? 'all' : Number(val))
          "
        />
      </div>

      <!-- Filter Status Aktif & Reset -->
      <div class="flex items-center gap-2">
        <div class="flex-1">
          <label
            class="block text-xs font-semibold text-secondary-text mb-1 uppercase tracking-wider"
          >
            Status Aktif
          </label>
          <AppSelect
            :model-value="String(statusAktifFilter)"
            :options="statusAktifOptions"
            class="w-full text-xs"
            @update:model-value="val => emit('update:statusAktifFilter', val)"
          />
        </div>
        <div class="pt-5">
          <AppButton
            variant="ghost"
            size="sm"
            class="h-9 px-2 text-secondary-text hover:text-primary"
            title="Reset Semua Filter"
            @click="emit('reset')"
          >
            <RotateCcw class="w-4 h-4" />
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>
