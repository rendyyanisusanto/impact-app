<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
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
import type { EmployeeReference, UserDetail } from '../types/user.types'
import type { Group, SubmenuPermissionFlag } from '@/modules/system/groups/types/group.types'
import { useToast } from '@/shared/composables/useToast'
import {
  User as UserIcon,
  Save,
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldAlert
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const userId = Number(route.params.id)

// Data References
const employees = ref<(Employee | EmployeeReference)[]>([])
const groups = ref<Group[]>([])
const isLoadingUser = ref(true)
const userDetail = ref<UserDetail | null>(null)

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

const isSuperadmin = ref(false)

// Load User & References on mount
onMounted(async () => {
  isLoadingUser.value = true
  try {
    // Load employees directly from table karyawan
    try {
      const allEmps = await userService.getEmployees()
      employees.value = allEmps || []
    } catch (e) {
      console.error('Failed to load employees', e)
    }

    // Load groups
    try {
      const groupResult = await groupService.getAll({ page: 1, pageSize: 100 })
      groups.value = groupResult?.items || []
    } catch (e) {
      console.error('Failed to load groups', e)
      toast.error('Gagal memuat master referensi groups/role.')
    }

    // Load user detail
    const user = await userService.getById(userId)
    userDetail.value = user
    isSuperadmin.value = user.id === 1

    // Fill form
    form.value.employeeId = user.employeeId || ''
    form.value.firstName = user.firstName
    form.value.username = user.username
    form.value.email = user.email
    form.value.groupId = user.groupId
    form.value.active = user.active
    form.value.password = ''
    form.value.pin = ''

    // Set preview
    if (user.group) {
      selectedGroup.value = {
        id: user.group.id,
        name: user.group.name,
        description: user.group.description
      }
    }
    previewPermissions.value = user.permissions || {}
    previewDashboardWidgets.value = user.accessibleWidgets || []

    // Reset dirty flag after initial load
    setTimeout(() => {
      isDirty.value = false
    }, 50)
  } catch {
    toast.error('Gagal memuat detail user.')
    router.push('/system/users')
  } finally {
    isLoadingUser.value = false
  }
})

// Auto-fill when employee is changed
function handleEmployeeChange() {
  if (!form.value.employeeId) return
  const selectedEmp = employees.value.find(e => String(e.id) === String(form.value.employeeId))
  if (selectedEmp && !form.value.firstName.trim()) {
    form.value.firstName = selectedEmp.nama
  }
}

// Watch group change to update Role Access Preview dynamically
watch(
  () => form.value.groupId,
  async (newGroupId) => {
    if (!newGroupId) return
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
  }
)

// Mark form dirty when modified
watch(
  form,
  () => {
    if (!isLoadingUser.value) {
      isDirty.value = true
    }
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

  const payload = {
    employeeId: form.value.employeeId ? Number(form.value.employeeId) : null,
    firstName: form.value.firstName,
    username: form.value.username,
    email: form.value.email,
    groupId: Number(form.value.groupId),
    active: form.value.active,
    ...(form.value.password.trim() ? { password: form.value.password.trim() } : {}),
    ...(form.value.pin.trim() ? { pin: form.value.pin.trim() } : {})
  }

  isSubmitting.value = true

  try {
    const updatedUser = await userService.update(userId, payload)
    toast.success(`Profil user "${updatedUser.username}" berhasil diperbarui.`)
    isDirty.value = false
    router.push('/system/users')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memperbarui data user.'
    toast.error(msg)
    if (msg.toLowerCase().includes('username')) formErrors.value.username = msg
    else if (msg.toLowerCase().includes('email')) formErrors.value.email = msg
    else if (msg.toLowerCase().includes('password')) formErrors.value.password = msg
    else if (msg.toLowerCase().includes('pin')) formErrors.value.pin = msg
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <AppPageHeader
      :title="`Edit Profil User: ${userDetail?.username || '...'}`"
      subtitle="Perbarui data profil pengguna, relasi master karyawan, atau role groups."
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
            Simpan Perubahan
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <!-- Superadmin Protection Banner -->
    <div
      v-if="isSuperadmin"
      class="flex items-start gap-3 p-4 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800"
    >
      <ShieldAlert class="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
      <div>
        <span class="font-bold">Akun Superadmin Root:</span>
        Akun ini memiliki hak akses penuh terhadap seluruh modul sistem ERP. Status akun dan penugasan group diproteksi secara permanen dari penonaktifan atau penurunan wewenang.
      </div>
    </div>

    <div v-if="isLoadingUser" class="p-12 text-center text-slate-500">
      Memuat detail data user...
    </div>

    <div v-else class="space-y-6">
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
                help-text="Tautkan akun ini ke data master karyawan HR jika tersedia."
              >
                <AppSearchableSelect
                  v-model="form.employeeId"
                  :options="employeeOptions"
                  placeholder="-- Tidak Terhubung ke Karyawan --"
                  :disabled="isSuperadmin"
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
                help-text="Nama lengkap yang tampil pada antarmuka ERP."
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
                  :disabled="isSuperadmin"
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

            <!-- Row 3: Password & PIN (Optional on edit) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <!-- Password -->
              <AppFormField
                label="Ganti Password"
                :error="formErrors.password"
                help-text="Kosongkan jika tidak ingin mengubah password saat ini."
              >
                <div class="relative">
                  <AppInput
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="Kosongkan jika tidak diubah"
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

              <!-- PIN Transaksi -->
              <AppFormField
                label="Ganti PIN Transaksi"
                :error="formErrors.pin"
                help-text="Kosongkan jika tidak ingin mengubah PIN saat ini (4-8 angka)."
              >
                <div class="relative">
                  <AppInput
                    v-model="form.pin"
                    :type="showPin ? 'text' : 'password'"
                    maxlength="8"
                    placeholder="Kosongkan jika tidak diubah"
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
            </div>

            <!-- Row 4: Groups/Role -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                  :disabled="isSuperadmin"
                  :error="Boolean(formErrors.groupId)"
                  :limit="50"
                  :allow-clear="false"
                />
              </AppFormField>

              <!-- Status Akun -->
              <div>
                <label class="block text-xs font-semibold text-slate-800 mb-1.5">Status Akun</label>
                <div class="flex items-center gap-4 mt-2">
                  <label class="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      v-model="form.active"
                      type="radio"
                      :value="1"
                      class="text-teal-600 focus:ring-teal-500"
                      :disabled="isSuperadmin"
                    />
                    <span>AKTIF</span>
                  </label>
                  <label class="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      v-model="form.active"
                      type="radio"
                      :value="0"
                      class="text-teal-600 focus:ring-teal-500"
                      :disabled="isSuperadmin"
                    />
                    <span>NON AKTIF</span>
                  </label>
                </div>
                <p v-if="isSuperadmin" class="text-[11px] text-teal-600 mt-1">
                  Status akun Superadmin root tidak dapat diubah.
                </p>
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
          Simpan Perubahan
        </AppButton>
      </div>
    </div>
  </div>
</template>