<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import AppTextarea from '@/shared/components/ui/AppTextarea.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import { positionService } from '@/modules/settings/positions/services/position.service'
import { employeeStatusService } from '@/modules/settings/employee-statuses/services/employee-status.service'
import { employeeGroupService } from '../services/employee-group.service'
import { referenceService } from '@/shared/services/reference.service'
import { employeeService } from '../services/employee.service'
import { validateEmployee } from '../utils/employee-validation'
import type { Employee, CreateEmployeeDto, EmployeeValidationErrors } from '../types/employee.types'
import { ArrowLeft, Save, AlertCircle, Fingerprint } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    mode?: 'create' | 'edit'
    initialData?: Employee | null
  }>(),
  {
    mode: 'create',
    initialData: null
  }
)

const emit = defineEmits<{
  (e: 'submit', data: CreateEmployeeDto): void
  (e: 'cancel'): void
}>()

// Form Data state
const formData = ref<CreateEmployeeDto>({
  kode: '',
  nik: '',
  nama: '',
  jk: 'Laki-Laki',
  no_hp: '',
  alamat: '',
  province_id: null,
  city_id: null,
  email: '',
  jabatan_id: 0,
  tanggal_masuk: new Date().toISOString().substring(0, 10),
  status: 1,
  status_karyawan_id: 0,
  uid_fingerprint: 0,
  grup_karyawan_id: null
})

const errors = ref<EmployeeValidationErrors>({})
const isSubmitting = ref(false)
const isDirty = ref(false)
const showCancelConfirm = ref(false)

// Select options
const jabatanOptions = ref<{ value: string; label: string }[]>([])
const statusKaryawanOptions = ref<{ value: string; label: string }[]>([])
const groupOptions = ref<{ value: string; label: string }[]>([
  { value: '0', label: '- Tanpa Grup -' }
])
const provinceOptions = ref<{ value: string; label: string }[]>([
  { value: '0', label: '- Pilih Provinsi -' }
])
const cityOptions = ref<{ value: string; label: string }[]>([
  { value: '0', label: '- Pilih Kota -' }
])

const genderOptions = [
  { value: 'Laki-Laki', label: 'Laki-Laki' },
  { value: 'Perempuan', label: 'Perempuan' }
]

const statusAktifOptions = [
  { value: '1', label: 'AKTIF' },
  { value: '0', label: 'TIDAK AKTIF' }
]

// Load References
onMounted(async () => {
  try {
    const posRes = await positionService.getAll()
    const positions = Array.isArray(posRes) ? posRes : posRes.data
    jabatanOptions.value = [
      { value: '0', label: '- Pilih Jabatan -' },
      ...positions
        .filter(j => (j.is_deleted ?? 1) === 1)
        .map(j => ({ value: String(j.id), label: j.nama || `Jabatan #${j.id}` }))
    ]

    const stRes = await employeeStatusService.getAll()
    const statuses = Array.isArray(stRes) ? stRes : stRes.data
    statusKaryawanOptions.value = [
      { value: '0', label: '- Pilih Status Karyawan -' },
      ...statuses.map(s => ({ value: String(s.id), label: s.nama || `Status #${s.id}` }))
    ]

    const groups = await employeeGroupService.getAll()
    groupOptions.value = [
      { value: '0', label: '- Tanpa Grup -' },
      ...groups
        .filter(
          g =>
            g.status_aktif === 1 ||
            (props.initialData && props.initialData.grup_karyawan_id === g.id)
        )
        .map(g => ({ value: String(g.id), label: g.nama }))
    ]

    const provinces = await referenceService.getProvinces()
    provinceOptions.value = [
      { value: '0', label: '- Pilih Provinsi -' },
      ...provinces.map(p => ({ value: String(p.id), label: p.name }))
    ]

    // Set initial values if edit mode
    if (props.initialData) {
      populateForm(props.initialData)
    } else {
      // Auto-suggest next UID fingerprint
      const employees = await employeeService.getAll()
      const maxUid = employees.reduce((max, e) => {
        const uid = Number(e.uid_fingerprint)
        return uid > max ? uid : max
      }, 0)
      formData.value.uid_fingerprint = maxUid + 1
      formData.value.kode = `EMP-${String(maxUid + 1).padStart(3, '0')}`
    }
  } catch (err) {
    console.error('Error loading employee form references:', err)
  }
})

function populateForm(emp: Employee) {
  formData.value = {
    kode: emp.kode || '',
    nik: emp.nik || '',
    nama: emp.nama || '',
    jk: emp.jk || 'Laki-Laki',
    no_hp: emp.no_hp && emp.no_hp !== '-' ? emp.no_hp : '',
    alamat: emp.alamat && emp.alamat !== '-' ? emp.alamat : '',
    province_id: emp.province_id || null,
    city_id: emp.city_id || null,
    email: emp.email && emp.email !== '-' ? emp.email : '',
    jabatan_id: emp.jabatan_id || 0,
    tanggal_masuk: emp.tanggal_masuk || new Date().toISOString().substring(0, 10),
    status: emp.status !== undefined ? emp.status : 1,
    status_karyawan_id: emp.status_karyawan_id || 0,
    uid_fingerprint: emp.uid_fingerprint || 0,
    grup_karyawan_id: emp.grup_karyawan_id || null
  }

  if (emp.province_id) {
    loadCities(emp.province_id)
  }
  isDirty.value = false
}

// Watch initialData prop
watch(
  () => props.initialData,
  newVal => {
    if (newVal) populateForm(newVal)
  }
)

// Watch province changes to cascade city options
watch(
  () => formData.value.province_id,
  async newProvId => {
    if (newProvId && Number(newProvId) > 0) {
      await loadCities(Number(newProvId))
    } else {
      cityOptions.value = [{ value: '0', label: '- Pilih Kota -' }]
      formData.value.city_id = null
    }
  }
)

async function loadCities(provinceId: number) {
  try {
    const cities = await referenceService.getCities(provinceId)
    cityOptions.value = [
      { value: '0', label: '- Pilih Kota -' },
      ...cities.map(c => ({ value: String(c.id), label: c.name }))
    ]
  } catch {
    cityOptions.value = [{ value: '0', label: '- Pilih Kota -' }]
  }
}

// Track dirtiness
function markDirty() {
  isDirty.value = true
}

async function handleSubmit() {
  if (isSubmitting.value) return

  // Validate
  const allEmployees = await employeeService.getAll()
  const validation = validateEmployee(formData.value, allEmployees, props.initialData?.id)

  if (!validation.isValid) {
    errors.value = validation.errors
    return
  }

  errors.value = {}
  isSubmitting.value = true

  try {
    const payload: CreateEmployeeDto = {
      ...formData.value,
      province_id:
        formData.value.province_id && Number(formData.value.province_id) > 0
          ? Number(formData.value.province_id)
          : null,
      city_id:
        formData.value.city_id && Number(formData.value.city_id) > 0
          ? Number(formData.value.city_id)
          : null,
      grup_karyawan_id:
        formData.value.grup_karyawan_id && Number(formData.value.grup_karyawan_id) > 0
          ? Number(formData.value.grup_karyawan_id)
          : null,
      jabatan_id: Number(formData.value.jabatan_id),
      status_karyawan_id: Number(formData.value.status_karyawan_id),
      uid_fingerprint: Number(formData.value.uid_fingerprint),
      status: Number(formData.value.status)
    }

    emit('submit', payload)
    isDirty.value = false
  } finally {
    isSubmitting.value = false
  }
}

function handleCancel() {
  if (isDirty.value) {
    showCancelConfirm.value = true
  } else {
    emit('cancel')
  }
}

function confirmCancel() {
  showCancelConfirm.value = false
  emit('cancel')
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div class="bg-surface rounded-lg border border-border shadow-sm p-6 mb-6">
      <div class="border-b border-border pb-4 mb-6 flex items-center justify-between">
        <div>
          <h2 class="text-base font-semibold text-text">
            {{ mode === 'create' ? 'Tambah Master Data Karyawan' : 'Ubah Data Karyawan' }}
          </h2>
          <p class="text-xs text-secondary-text mt-0.5">
            Lengkapi informasi identitas, nomor fingerprint biometrik, jabatan, dan klasifikasi
            kepegawaian.
          </p>
        </div>
      </div>

      <!-- 2-Column Responsive Form Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- COLUMN 1: Identitas & Kontak -->
        <div class="space-y-4">
          <div class="border-b border-border/60 pb-2">
            <h3
              class="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5"
            >
              <span>A. Identitas & Informasi Kontak</span>
            </h3>
          </div>

          <!-- Kode Karyawan -->
          <div>
            <label class="block text-xs font-semibold text-text mb-1">
              Kode Karyawan <span class="text-rose-500">*</span>
            </label>
            <AppInput
              v-model="formData.kode"
              placeholder="Contoh: EMP-001"
              :class="{ 'border-rose-500': errors.kode }"
              class="w-full text-xs"
              @update:model-value="markDirty"
            />
            <p v-if="errors.kode" class="text-xs text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle class="w-3.5 h-3.5" /> {{ errors.kode }}
            </p>
          </div>

          <!-- UID Fingerprint -->
          <div>
            <label
              class="block text-xs font-semibold text-text mb-1 flex items-center justify-between"
            >
              <span>UID Fingerprint <span class="text-rose-500">*</span></span>
              <span class="text-[11px] text-secondary-text font-normal flex items-center gap-1">
                <Fingerprint class="w-3 h-3 text-primary" /> Integrasi Mesin Absensi
              </span>
            </label>
            <AppInput
              v-model.number="formData.uid_fingerprint"
              type="number"
              placeholder="Nomor ID mesin fingerprint"
              :class="{ 'border-rose-500': errors.uid_fingerprint }"
              class="w-full text-xs"
              @update:model-value="markDirty"
            />
            <p
              v-if="errors.uid_fingerprint"
              class="text-xs text-rose-500 mt-1 flex items-center gap-1"
            >
              <AlertCircle class="w-3.5 h-3.5" /> {{ errors.uid_fingerprint }}
            </p>
            <div
              class="mt-1.5 bg-slate-50 border border-slate-200 rounded p-2 text-[11px] text-secondary-text"
            >
              <span class="font-medium text-slate-700">Catatan:</span> UID Fingerprint menghubungkan
              karyawan dengan terminal absensi. Pastikan nomor UID unik untuk setiap karyawan.
            </div>
          </div>

          <!-- NIK -->
          <div>
            <label class="block text-xs font-semibold text-text mb-1">
              NIK (Nomor Induk Kependudukan / Karyawan)
            </label>
            <AppInput
              v-model="formData.nik"
              placeholder="Masukkan NIK"
              :class="{ 'border-rose-500': errors.nik }"
              class="w-full text-xs"
              @update:model-value="markDirty"
            />
            <p v-if="errors.nik" class="text-xs text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle class="w-3.5 h-3.5" /> {{ errors.nik }}
            </p>
          </div>

          <!-- Nama Lengkap -->
          <div>
            <label class="block text-xs font-semibold text-text mb-1">
              Nama Lengkap <span class="text-rose-500">*</span>
            </label>
            <AppInput
              v-model="formData.nama"
              placeholder="Nama lengkap karyawan"
              :class="{ 'border-rose-500': errors.nama }"
              class="w-full text-xs"
              @update:model-value="markDirty"
            />
            <p v-if="errors.nama" class="text-xs text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle class="w-3.5 h-3.5" /> {{ errors.nama }}
            </p>
          </div>

          <!-- Jenis Kelamin -->
          <div>
            <label class="block text-xs font-semibold text-text mb-1"> Jenis Kelamin </label>
            <AppSelect
              v-model="formData.jk"
              :options="genderOptions"
              class="w-full text-xs"
              @update:model-value="markDirty"
            />
          </div>

          <!-- Kontak: No. HP & Email -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-text mb-1"> No. HP </label>
              <AppInput
                v-model="formData.no_hp"
                placeholder="08..."
                class="w-full text-xs"
                @update:model-value="markDirty"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-text mb-1"> Email </label>
              <AppInput
                v-model="formData.email"
                type="email"
                placeholder="nama@email.com"
                :class="{ 'border-rose-500': errors.email }"
                class="w-full text-xs"
                @update:model-value="markDirty"
              />
              <p v-if="errors.email" class="text-xs text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle class="w-3.5 h-3.5" /> {{ errors.email }}
              </p>
            </div>
          </div>

          <!-- Alamat -->
          <div>
            <label class="block text-xs font-semibold text-text mb-1"> Alamat Domisili </label>
            <AppTextarea
              v-model="formData.alamat"
              :rows="2"
              placeholder="Alamat tempat tinggal karyawan"
              class="w-full text-xs"
              @update:model-value="markDirty"
            />
          </div>

          <!-- Provinsi & Kota -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-text mb-1"> Provinsi </label>
              <AppSelect
                :model-value="String(formData.province_id || 0)"
                :options="provinceOptions"
                class="w-full text-xs"
                @update:model-value="
                  val => {
                    formData.province_id = Number(val) > 0 ? Number(val) : null
                    markDirty()
                  }
                "
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-text mb-1"> Kota / Kabupaten </label>
              <AppSelect
                :model-value="String(formData.city_id || 0)"
                :options="cityOptions"
                :disabled="!formData.province_id"
                class="w-full text-xs"
                @update:model-value="
                  val => {
                    formData.city_id = Number(val) > 0 ? Number(val) : null
                    markDirty()
                  }
                "
              />
            </div>
          </div>
        </div>

        <!-- COLUMN 2: Kepegawaian & Status Penempatan -->
        <div class="space-y-4">
          <div class="border-b border-border/60 pb-2">
            <h3
              class="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5"
            >
              <span>B. Penempatan & Status Kepegawaian</span>
            </h3>
          </div>

          <!-- Tanggal Masuk -->
          <div>
            <label class="block text-xs font-semibold text-text mb-1"> Tanggal Masuk Kerja </label>
            <AppInput
              v-model="formData.tanggal_masuk"
              type="date"
              class="w-full text-xs"
              @update:model-value="markDirty"
            />
          </div>

          <!-- Jabatan -->
          <div>
            <label class="block text-xs font-semibold text-text mb-1">
              Jabatan (Role Organisasi) <span class="text-rose-500">*</span>
            </label>
            <AppSelect
              :model-value="String(formData.jabatan_id || 0)"
              :options="jabatanOptions"
              :class="{ 'border-rose-500': errors.jabatan_id }"
              class="w-full text-xs"
              @update:model-value="
                val => {
                  formData.jabatan_id = Number(val)
                  markDirty()
                }
              "
            />
            <p v-if="errors.jabatan_id" class="text-xs text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle class="w-3.5 h-3.5" /> {{ errors.jabatan_id }}
            </p>
          </div>

          <!-- Status Karyawan -->
          <div>
            <label class="block text-xs font-semibold text-text mb-1">
              Status Karyawan (Jenis Kepegawaian) <span class="text-rose-500">*</span>
            </label>
            <AppSelect
              :model-value="String(formData.status_karyawan_id || 0)"
              :options="statusKaryawanOptions"
              :class="{ 'border-rose-500': errors.status_karyawan_id }"
              class="w-full text-xs"
              @update:model-value="
                val => {
                  formData.status_karyawan_id = Number(val)
                  markDirty()
                }
              "
            />
            <p
              v-if="errors.status_karyawan_id"
              class="text-xs text-rose-500 mt-1 flex items-center gap-1"
            >
              <AlertCircle class="w-3.5 h-3.5" /> {{ errors.status_karyawan_id }}
            </p>
            <p class="text-[11px] text-secondary-text mt-1">
              Contoh: Harian, Borongan, Bulanan (Tetap), Kontrak (PKWT). Dikelola di Master Status
              Karyawan.
            </p>
          </div>

          <!-- Grup Karyawan -->
          <div>
            <label class="block text-xs font-semibold text-text mb-1">
              Grup Karyawan (Regu Kerja / Tim Driver)
            </label>
            <AppSelect
              :model-value="String(formData.grup_karyawan_id || 0)"
              :options="groupOptions"
              class="w-full text-xs"
              @update:model-value="
                val => {
                  formData.grup_karyawan_id = Number(val) > 0 ? Number(val) : null
                  markDirty()
                }
              "
            />
            <p class="text-[11px] text-secondary-text mt-1">
              Grup menentukan regu kerja untuk operasional produksi, pengiriman, dan penugasan
              jadwal.
            </p>
          </div>

          <!-- Status Aktif Record -->
          <div>
            <label class="block text-xs font-semibold text-text mb-1">
              Status Record Karyawan <span class="text-rose-500">*</span>
            </label>
            <AppSelect
              :model-value="String(formData.status)"
              :options="statusAktifOptions"
              class="w-full text-xs"
              @update:model-value="
                val => {
                  formData.status = Number(val)
                  markDirty()
                }
              "
            />
            <p class="text-[11px] text-secondary-text mt-1">
              Pilih <b>TIDAK AKTIF</b> jika karyawan telah berhenti bekerja, resign, atau non-aktif
              agar tidak muncul pada transaksi baru.
            </p>
          </div>
        </div>
      </div>

      <!-- Action Buttons Footer -->
      <div class="border-t border-border mt-8 pt-4 flex items-center justify-between">
        <AppButton
          variant="outline"
          type="button"
          class="flex items-center gap-1.5"
          @click="handleCancel"
        >
          <ArrowLeft class="w-4 h-4" /> Batalkan
        </AppButton>

        <AppButton
          variant="primary"
          type="submit"
          :loading="isSubmitting"
          class="flex items-center gap-1.5 shadow-sm"
        >
          <Save class="w-4 h-4" />
          {{ mode === 'create' ? 'Simpan Data Karyawan' : 'Perbarui Data Karyawan' }}
        </AppButton>
      </div>
    </div>

    <!-- Confirm Cancel Unsaved Changes Dialog -->
    <AppConfirmDialog
      v-model="showCancelConfirm"
      title="Batalkan Perubahan?"
      message="Perubahan yang telah Anda masukkan belum disimpan dan akan hilang jika Anda meninggalkan halaman ini."
      confirm-text="Ya, Batalkan"
      cancel-text="Lanjutkan Mengisi"
      confirm-variant="danger"
      @confirm="confirmCancel"
    />
  </form>
</template>
