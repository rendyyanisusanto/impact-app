<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppCard from '@/shared/components/ui/AppCard.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppFormField from '@/shared/components/ui/AppFormField.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppSearchableSelect, { type SearchableOption } from '@/shared/components/ui/AppSearchableSelect.vue'
import UserRoleAccessPreview from '../components/UserRoleAccessPreview.vue'
import { userService } from '../services/user.service'
import { groupService } from '@/modules/system/groups/services/group.service'
import type { Employee } from '@/modules/hr/types/employee.types'
import type { EmployeeReference } from '../types/user.types'
import type { Group, SubmenuPermissionFlag } from '@/modules/system/groups/types/group.types'
import { useToast } from '@/shared/composables/useToast'
import {
  User as UserIcon,
  Save,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-vue-next'

const router = useRouter()
const toast = useToast()

// Data References
const employees = ref<(Employee | EmployeeReference)[]>([])
const groups = ref<Group[]>([])
const isLoadingReferences = ref(true)

const employeeOptions = computed<SearchableOption[]>(() => {
  if (!Array.isArray(employees.value)) return []
  return employees.value.map(emp => {
    const kode = emp.kode ? `[${emp.kode}] ` : ''
    const jabatan = emp.jabatan_nama ? ` - ${emp.jabatan_nama}` : ''
    return {
      label: `${kode}${emp.nama}${jabatan}`,
      value: emp.id,
      description: emp.email || undefined
    }
  })
})

const groupOptions = computed<SearchableOption[]>(() => {
  if (!Array.isArray(groups.value)) return []
  return groups.value.map(g => {
    const name = g.name ? String(g.name).toUpperCase() : `GROUP #${g.id}`
    const desc = g.description ? String(g.description) : ''
    return {
      label: desc ? `${name} - ${desc}` : name,
      value: g.id,
      description: desc || undefined
    }
  })
})

// Form State
const form = ref({
  employeeId: '' as string | number,
  firstName: '',
  username: '',
  email: '',
  password: '',
  passwordConfirm: '',
  pin: '',
  groupId: '' as string | number,
  active: 1 as 1 | 0
})

const showPassword = ref(false)
const showPin = ref(false)
const isSubmitting = ref(false)
const formErrors = ref<Record<string, string>>({})
const isDirty = ref(false)

// Role Access Preview State
const previewLoading = ref(false)
const selectedGroup = ref<Group | null>(null)
const previewPermissions = ref<Record<string, SubmenuPermissionFlag>>({})
const previewDashboardWidgets = ref<(string | number)[]>([])

// Load Employees & Groups on mount
onMounted(async () => {
  isLoadingReferences.value = true
  try {
    try {
      const allEmps = await userService.getEmployees()
      employees.value = (allEmps || []).filter(e => e.status === 1)
    } catch (e) {
      console.error('Failed to load employees', e)
    }

    try {
      const groupResult = await groupService.getAll({ page: 1, pageSize: 100 })
      groups.value = groupResult?.items || []
    } catch (e) {
      console.error('Failed to load groups', e)
      toast.error('Gagal memuat master referensi groups/role.')
    }

    // Default select first non-superadmin group or admin if only one
    if (groups.value.length > 0 && !form.value.groupId) {
      const defaultGroup = groups.value.find(g => g.id !== 1) || groups.value[0]
      form.value.groupId = defaultGroup.id
    }
  } finally {
    isLoadingReferences.value = false
  }
})

// Auto-fill when employee is selected
function handleEmployeeChange() {
  if (!form.value.employeeId) return
  const selectedEmp = employees.value.find(e => String(e.id) === String(form.value.employeeId))
  if (selectedEmp) {
    // Fill nama lengkap
    form.value.firstName = selectedEmp.nama

    // Suggest email if not yet filled
    if (!form.value.email.trim()) {
      if (selectedEmp.email) {
        form.value.email = selectedEmp.email
      } else {
        const cleanName = selectedEmp.nama.toLowerCase().replace(/[^a-z0-9]/g, '')
        form.value.email = `${cleanName || 'karyawan'}@impactfurniture.co.id`
      }
    }

    // Suggest username if not yet filled
    if (!form.value.username.trim()) {
      const cleanName = selectedEmp.nama.toLowerCase().replace(/[^a-z0-9]/g, '.')
      form.value.username = cleanName
    }
  }
}

// Watch group change to update Role Access Preview dynamically
watch(
  () => form.value.groupId,
  async (newGroupId) => {
    if (!newGroupId) {
      selectedGroup.value = null
      previewPermissions.value = {}
      previewDashboardWidgets.value = []
      return
    }

    previewLoading.value = true
    try {
      const groupData = await groupService.getById(Number(newGroupId))
      selectedGroup.value = groupData.group
      previewPermissions.value = groupData.permissions
      previewDashboardWidgets.value = groupData.dashboardIds
    } catch {
      toast.error('Gagal memuat preview role access untuk group ini.')
    } finally {
      previewLoading.value = false
    }
  },
  { immediate: true }
)

// Mark form dirty when modified
watch(
  form,
  () => {
    isDirty.value = true
  },
  { deep: true }
)

// Unsaved changes navigation guard
onBeforeRouteLeave((_to, _from, next) => {
  if (isDirty.value && !isSubmitting.value) {
    const answer = window.confirm(
      'Anda memiliki perubahan yang belum disimpan. Yakin ingin meninggalkan halaman ini?'
    )
    if (answer) {
      next()
    } else {
      next(false)
    }
  } else {
    next()
  }
})

// Form submit handler
async function handleSubmit() {
  formErrors.value = {}

  // Local payload
  const payload = {
    employeeId: form.value.employeeId ? Number(form.value.employeeId) : null,
    firstName: form.value.firstName,
    username: form.value.username,
    email: form.value.email,
    password: form.value.password,
    passwordConfirm: form.value.passwordConfirm,
    pin: form.value.pin,
    groupId: Number(form.value.groupId),
    active: form.value.active
  }

  isSubmitting.value = true

  try {
    const newUser = await userService.create(payload)
    toast.success(`User "${newUser.username}" berhasil ditambahkan.`)
    isDirty.value = false
    router.push('/system/users')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menyimpan data user baru.'
    toast.error(msg)
    // Extract field if matches
    if (msg.toLowerCase().includes('username')) formErrors.value.username = msg
    else if (msg.toLowerCase().includes('email')) formErrors.value.email = msg
    else if (msg.toLowerCase().includes('password')) formErrors.value.password = msg
    else if (msg.toLowerCase().includes('pin')) formErrors.value.pin = msg
    else if (msg.toLowerCase().includes('karyawan')) formErrors.value.employeeId = msg
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <AppPageHeader
      title="Tambah User Baru"
      subtitle="Buat akun pengguna ERP baru, tautkan ke master karyawan dan tentukan role groups."
    >
      <template #actions>
        <div class="flex items-center gap-2">
          <router-link to="/system/users">
            <AppButton variant="outline" size="sm">
              <ArrowLeft class="w-4 h-4 mr-1.5" />
              Kembali ke Daftar
            </AppButton>
          </router-link>

          <AppButton
            variant="primary"
            size="sm"
            :is-loading="isSubmitting"
            @click="handleSubmit"
          >
            <Save class="w-4 h-4 mr-1.5" />
            Simpan User
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <div class="space-y-6">
      <!-- CARD 1: INFORMASI AKUN -->
      <AppCard class="border border-slate-200 shadow-sm overflow-hidden">
        <template #header>
          <div class="flex items-center gap-2.5 p-4 bg-slate-50 border-b border-slate-200">
            <div class="p-2 bg-teal-50 text-teal-700 rounded-lg border border-teal-200">
              <UserIcon class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-semibold text-slate-800">Card 1 — Informasi Akun</h3>
              <p class="text-xs text-slate-500 mt-0.5">
                Kredensial login, relasi master karyawan, dan penugasan group role.
              </p>
            </div>
          </div>
        </template>

        <div class="p-6">
          <form class="space-y-5" @submit.prevent="handleSubmit">
            <!-- Row 1: Karyawan & Nama Lengkap -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <!-- Karyawan Dropdown -->
              <AppFormField
                label="Karyawan"
                required
                :error="formErrors.employeeId"
                help-text="Pilih data karyawan aktif. Nama lengkap dan email akan terisi otomatis."
              >
                <AppSearchableSelect
                  v-model="form.employeeId"
                  :options="employeeOptions"
                  placeholder="-- Cari atau Pilih Karyawan --"
                  :disabled="isLoadingReferences"
                  :error="Boolean(formErrors.employeeId)"
                  :limit="50"
                  :allow-clear="true"
                  @change="handleEmployeeChange"
                />
              </AppFormField>

              <!-- Nama Lengkap -->
              <AppFormField
                label="Nama Lengkap"
                required
                :error="formErrors.firstName"
                help-text="Nama lengkap akun pengguna yang akan tampil pada antarmuka."
              >
                <AppInput
                  v-model="form.firstName"
                  placeholder="Masukkan nama lengkap"
                  :has-error="Boolean(formErrors.firstName)"
                />
              </AppFormField>
            </div>

            <!-- Row 2: Username & Email -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <!-- Username -->
              <AppFormField
                label="Username"
                required
                :error="formErrors.username"
                help-text="Digunakan saat login. Huruf kecil, angka, titik, atau garis bawah."
              >
                <AppInput
                  v-model="form.username"
                  placeholder="Contoh: ahmad.fauzi"
                  autocomplete="username"
                  :has-error="Boolean(formErrors.username)"
                />
              </AppFormField>

              <!-- Email -->
              <AppFormField
                label="Email"
                required
                :error="formErrors.email"
                help-text="Alamat email aktif untuk notifikasi sistem ERP."
              >
                <AppInput
                  v-model="form.email"
                  type="email"
                  placeholder="user@impactfurniture.co.id"
                  autocomplete="email"
                  :has-error="Boolean(formErrors.email)"
                />
              </AppFormField>
            </div>

            <!-- Row 3: Password & Konfirmasi Password -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <!-- Password -->
              <AppFormField
                label="Password"
                required
                :error="formErrors.password"
                help-text="Minimal 6 karakter."
              >
                <div class="relative">
                  <AppInput
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="Masukkan password baru"
                    autocomplete="new-password"
                    :has-error="Boolean(formErrors.password)"
                  />
                  <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    @click="showPassword = !showPassword"
                  >
                    <component :is="showPassword ? EyeOff : Eye" class="w-4 h-4" />
                  </button>
                </div>
              </AppFormField>

              <!-- Konfirmasi Password -->
              <AppFormField
                label="Konfirmasi Password"
                required
                help-text="Ulangi password di samping untuk verifikasi ketik."
              >
                <AppInput
                  v-model="form.passwordConfirm"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Ulangi password"
                  autocomplete="new-password"
                />
              </AppFormField>
            </div>

            <!-- Row 4: PIN & Groups/Role -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <!-- PIN Transaksi -->
              <AppFormField
                label="PIN Otorisasi Transaksi"
                required
                :error="formErrors.pin"
                help-text="4 hingga 8 digit angka rahasia untuk otorisasi tindakan penting."
              >
                <div class="relative">
                  <AppInput
                    v-model="form.pin"
                    :type="showPin ? 'text' : 'password'"
                    maxlength="8"
                    placeholder="Contoh: 101711"
                    autocomplete="off"
                    :has-error="Boolean(formErrors.pin)"
                  />
                  <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    @click="showPin = !showPin"
                  >
                    <component :is="showPin ? EyeOff : Eye" class="w-4 h-4" />
                  </button>
                </div>
              </AppFormField>

              <!-- Groups/Role -->
              <AppFormField
                label="Groups / Role"
                required
                :error="formErrors.groupId"
                help-text="Pilih kelompok wewenang. Hak akses pada Card 2 akan terisi otomatis."
              >
                <AppSearchableSelect
                  v-model="form.groupId"
                  :options="groupOptions"
                  placeholder="-- Cari atau Pilih Groups/Role --"
                  :disabled="isLoadingReferences"
                  :error="Boolean(formErrors.groupId)"
                  :limit="50"
                  :allow-clear="false"
                />
              </AppFormField>
            </div>

            <!-- Row 5: Status Akun -->
            <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <label class="text-xs font-semibold text-slate-800">Status Akun</label>
                <p class="text-[11px] text-slate-500">
                  User nonaktif tidak diizinkan masuk ke sistem.
                </p>
              </div>
              <div class="flex items-center gap-4">
                <label class="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    v-model="form.active"
                    type="radio"
                    :value="1"
                    class="text-teal-600 focus:ring-teal-500"
                  />
                  <span>AKTIF</span>
                </label>
                <label class="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    v-model="form.active"
                    type="radio"
                    :value="0"
                    class="text-teal-600 focus:ring-teal-500"
                  />
                  <span>NON AKTIF</span>
                </label>
              </div>
            </div>
          </form>
        </div>
      </AppCard>

      <!-- CARD 2: PREVIEW ROLE ACCESS -->
      <UserRoleAccessPreview
        :group-id="Number(form.groupId) || null"
        :group-name="selectedGroup?.name?.toUpperCase() || 'Belum Dipilih'"
        :group-description="selectedGroup?.description || 'Pilih Groups/Role di Card 1 untuk menampilkan daftar hak akses menu.'"
        :permissions="previewPermissions"
        :dashboard-widgets="previewDashboardWidgets"
        :is-loading="previewLoading"
      />

      <!-- Bottom action buttons -->
      <div class="flex items-center justify-end gap-3 pt-4">
        <router-link to="/system/users">
          <AppButton variant="outline">
            Batalkan
          </AppButton>
        </router-link>

        <AppButton
          variant="primary"
          :is-loading="isSubmitting"
          @click="handleSubmit"
        >
          <Save class="w-4 h-4 mr-1.5" />
          Simpan Data User
        </AppButton>
      </div>
    </div>
  </div>
</template>