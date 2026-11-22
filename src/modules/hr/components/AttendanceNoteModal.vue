<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import type { AttendanceRecordViewModel, AttendanceTargetType, UpdateAttendanceNoteDto } from '../types/attendance.types'
import type { EmployeeGroup } from '../types/employee-group.types'
import { employeeGroupService } from '../services/employee-group.service'

const props = defineProps<{
  isOpen: boolean
  record: AttendanceRecordViewModel | null
  isLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', payload: UpdateAttendanceNoteDto): void
}>()

const ditujukan = ref<AttendanceTargetType>('KARYAWAN')
const selectedGroupId = ref<number | undefined>(undefined)
const keteranganText = ref('')
const groups = ref<EmployeeGroup[]>([])

onMounted(async () => {
  groups.value = await employeeGroupService.getAll()
})

watch(
  () => props.record,
  (rec) => {
    if (rec) {
      ditujukan.value = 'KARYAWAN'
      keteranganText.value = rec.keterangan || ''
      selectedGroupId.value = rec.grupId || (groups.value[0]?.id ?? undefined)
    }
  },
  { immediate: true }
)

function handleSubmit() {
  if (!props.record) return

  emit('save', {
    ditujukan: ditujukan.value,
    tanggal: props.record.tanggal,
    keterangan: keteranganText.value.trim(),
    karyawanId: props.record.karyawanId,
    grupId: ditujukan.value === 'GRUP' ? selectedGroupId.value : undefined
  })
}
</script>

<template>
  <AppModal
    :model-value="isOpen"
    title="Tambah Keterangan"
    size="md"
    @close="emit('close')"
  >
    <div v-if="record" class="space-y-4">
      <!-- Target Summary -->
      <div class="bg-gray-50 dark:bg-gray-800/60 p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-sm">
        <div class="flex justify-between items-center mb-1">
          <span class="text-gray-500 dark:text-gray-400">Karyawan:</span>
          <span class="font-semibold text-gray-900 dark:text-white">{{ record.kode }} - {{ record.nama }}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-gray-500 dark:text-gray-400">Tanggal:</span>
          <span class="font-medium text-gray-800 dark:text-gray-200">{{ record.tanggalFormatted }}</span>
        </div>
      </div>

      <!-- Keterangan Textarea -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Keterangan <span class="text-red-500">*</span>
        </label>
        <textarea
          v-model="keteranganText"
          rows="3"
          placeholder="Masukkan keterangan kehadiran atau lembur..."
          class="w-full px-3 py-2 border rounded-md text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          required
        />
      </div>

      <!-- Ditujukan Select -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Ditujukan <span class="text-red-500">*</span>
        </label>
        <select
          v-model="ditujukan"
          class="w-full px-3 py-2 border rounded-md text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
        >
          <option value="KARYAWAN">KARYAWAN (Hanya karyawan ini)</option>
          <option value="GRUP">GRUP (Seluruh anggota grup)</option>
          <option value="SEMUA">SEMUA (Seluruh karyawan aktif)</option>
        </select>
      </div>

      <!-- Grup Selector if GRUP -->
      <div v-if="ditujukan === 'GRUP'">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Pilih Grup <span class="text-red-500">*</span>
        </label>
        <select
          v-model="selectedGroupId"
          class="w-full px-3 py-2 border rounded-md text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
        >
          <option v-for="g in groups" :key="g.id" :value="g.id">
            {{ g.kode }} - {{ g.nama }}
          </option>
        </select>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <AppButton variant="secondary" @click="emit('close')">
          Batal
        </AppButton>
        <AppButton
          variant="primary"
          :is-loading="isLoading"
          :disabled="isLoading || !keteranganText.trim()"
          @click="handleSubmit"
        >
          Simpan
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>
