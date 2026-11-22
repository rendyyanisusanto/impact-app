<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import { employeeGroupService } from '../services/employee-group.service'
import { validateEmployeeGroup } from '../utils/employee-group-validation'
import type {
  CreateEmployeeGroupDto,
  EmployeeGroupValidationErrors
} from '../types/employee-group.types'
import { Users2, ArrowLeft, Save, AlertCircle } from 'lucide-vue-next'

const router = useRouter()
const isSubmitting = ref(false)
const errors = ref<EmployeeGroupValidationErrors>({})

const formData = ref<CreateEmployeeGroupDto>({
  kode: '',
  nama: '',
  color: '#0F766E',
  status_aktif: 1
})

const statusOptions = [
  { value: '1', label: 'AKTIF' },
  { value: '0', label: 'TIDAK AKTIF' }
]

onMounted(async () => {
  const groups = await employeeGroupService.getAll()
  formData.value.kode = `GRP${groups.length + 1}`
})

async function handleSubmit() {
  if (isSubmitting.value) return
  const allGroups = await employeeGroupService.getAll()
  const validation = validateEmployeeGroup(formData.value, allGroups)
  if (!validation.isValid) {
    errors.value = validation.errors
    return
  }

  isSubmitting.value = true
  try {
    await employeeGroupService.create(formData.value)
    router.push('/hr/employee-groups')
  } catch (err: unknown) {
    errors.value = {
      nama: err instanceof Error ? err.message : 'Gagal menyimpan grup'
    }
  } finally {
    isSubmitting.value = false
  }
}

function handleCancel() {
  router.push('/hr/employee-groups')
}
</script>

<template>
  <div>
    <AppPageHeader
      title="Tambah Grup Karyawan"
      subtitle="Input grup regu kerja baru, warna penanda, dan pengaturan status."
    >
      <template #icon>
        <Users2 class="w-6 h-6 text-primary" />
      </template>
      <template #actions>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-text bg-surface hover:bg-slate-50 transition-colors"
          @click="handleCancel"
        >
          <ArrowLeft class="w-4 h-4" /> Kembali ke Daftar
        </button>
      </template>
    </AppPageHeader>

    <div class="max-w-2xl bg-surface rounded-lg border border-border p-6 shadow-sm">
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <!-- Kode Grup -->
        <div>
          <label class="block text-xs font-semibold text-text mb-1">
            Kode Grup <span class="text-rose-500">*</span>
          </label>
          <AppInput
            v-model="formData.kode"
            placeholder="Contoh: GRP1"
            :class="{ 'border-rose-500': errors.kode }"
            class="w-full text-xs"
          />
          <p v-if="errors.kode" class="text-xs text-rose-500 mt-1 flex items-center gap-1">
            <AlertCircle class="w-3.5 h-3.5" /> {{ errors.kode }}
          </p>
        </div>

        <!-- Nama Grup -->
        <div>
          <label class="block text-xs font-semibold text-text mb-1">
            Nama Grup Karyawan <span class="text-rose-500">*</span>
          </label>
          <AppInput
            v-model="formData.nama"
            placeholder="Contoh: Group Gudang, Grup Driver Totok"
            :class="{ 'border-rose-500': errors.nama }"
            class="w-full text-xs"
          />
          <p v-if="errors.nama" class="text-xs text-rose-500 mt-1 flex items-center gap-1">
            <AlertCircle class="w-3.5 h-3.5" /> {{ errors.nama }}
          </p>
        </div>

        <!-- Warna Tag -->
        <div>
          <label class="block text-xs font-semibold text-text mb-1">
            Warna Tag / Identifikasi <span class="text-rose-500">*</span>
          </label>
          <div class="flex items-center gap-3">
            <input
              v-model="formData.color"
              type="color"
              class="h-9 w-14 rounded border border-border cursor-pointer p-0.5 bg-surface"
            />
            <AppInput
              v-model="formData.color"
              placeholder="#0F766E"
              class="w-36 text-xs font-mono"
            />
            <span
              class="inline-block w-4 h-4 rounded-full border border-border"
              :style="{ backgroundColor: formData.color || '#0F766E' }"
            />
          </div>
        </div>

        <!-- Status Aktif -->
        <div>
          <label class="block text-xs font-semibold text-text mb-1">
            Status <span class="text-rose-500">*</span>
          </label>
          <AppSelect
            :model-value="String(formData.status_aktif)"
            :options="statusOptions"
            class="w-full text-xs"
            @update:model-value="val => (formData.status_aktif = Number(val))"
          />
        </div>

        <div class="border-t border-border pt-5 flex items-center justify-between">
          <AppButton variant="outline" type="button" @click="handleCancel"> Batalkan </AppButton>
          <AppButton
            variant="primary"
            type="submit"
            :loading="isSubmitting"
            class="flex items-center gap-1.5"
          >
            <Save class="w-4 h-4" /> Simpan Data Grup
          </AppButton>
        </div>
      </form>
    </div>
  </div>
</template>
