<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppCard from '@/shared/components/ui/AppCard.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppBadge from '@/shared/components/ui/AppBadge.vue'
import UserRoleAccessPreview from '../components/UserRoleAccessPreview.vue'
import UserResetPasswordModal from '../components/UserResetPasswordModal.vue'
import UserResetPinModal from '../components/UserResetPinModal.vue'
import { userService } from '../services/user.service'
import type { UserDetail } from '../types/user.types'
import { usePermission } from '@/shared/composables/usePermission'
import { useToast } from '@/shared/composables/useToast'
import {
  User as UserIcon,
  ArrowLeft,
  Edit2,
  KeyRound,
  Shield,
  ExternalLink,
  Copy,
  Check
} from 'lucide-vue-next'

const route = useRoute()
const toast = useToast()
const { hasPermission } = usePermission()

const canUpdate = computed(() => hasPermission('system:update') || hasPermission('system.users:update'))

const userId = Number(route.params.id)
const user = ref<UserDetail | null>(null)
const isLoading = ref(true)

// Modals
const isResetPasswordModalOpen = ref(false)
const isResetPinModalOpen = ref(false)
const copiedKey = ref<string | null>(null)

async function loadData() {
  isLoading.value = true
  try {
    user.value = await userService.getById(userId)
  } catch (err: unknown) {
    toast.error(err instanceof Error ? err.message : 'Gagal memuat detail user.')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

function copyToClipboard(text: string, key: string) {
  navigator.clipboard.writeText(text)
  copiedKey.value = key
  toast.success(`"${text}" disalin ke clipboard.`)
  setTimeout(() => {
    if (copiedKey.value === key) copiedKey.value = null
  }, 2000)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <AppPageHeader
      :title="`Detail User: ${user?.username || '...'}`"
      subtitle="Informasi lengkap akun pengguna, relasi master karyawan, kredensial otorisasi, dan hak akses role."
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
            v-if="canUpdate"
            variant="outline"
            size="sm"
            @click="isResetPasswordModalOpen = true"
          >
            <KeyRound class="w-4 h-4 text-amber-500 mr-1.5" />
            Reset Password
          </AppButton>

          <AppButton
            v-if="canUpdate"
            variant="outline"
            size="sm"
            @click="isResetPinModalOpen = true"
          >
            <Shield class="w-4 h-4 text-teal-600 mr-1.5" />
            Reset PIN
          </AppButton>

          <router-link v-if="canUpdate" :to="`/system/users/${userId}/edit`">
            <AppButton variant="primary" size="sm">
              <Edit2 class="w-4 h-4 mr-1.5" />
              Edit User
            </AppButton>
          </router-link>
        </div>
      </template>
    </AppPageHeader>

    <div v-if="isLoading" class="p-12 text-center text-slate-500">
      Memuat informasi user...
    </div>

    <div v-else-if="user" class="space-y-6">
      <!-- HERO SUMMARY CARD -->
      <div class="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 border border-teal-900/60 rounded-2xl p-6 text-white shadow-md">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
              <UserIcon class="w-8 h-8" />
            </div>
            <div>
              <div class="flex items-center gap-3">
                <h2 class="text-xl font-bold">{{ user.firstName }}</h2>
                <span
                  class="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                  :class="user.active === 1 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-slate-700 text-slate-300'"
                >
                  {{ user.statusLabel }}
                </span>
              </div>
              <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-1 font-mono">
                <span>Username: <strong class="text-white">{{ user.username }}</strong></span>
                <span>•</span>
                <span>Email: <strong class="text-white">{{ user.email }}</strong></span>
                <span>•</span>
                <span>Role: <strong class="text-teal-300 uppercase">{{ user.groupName }}</strong></span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <router-link
              :to="`/system/groups/${user.groupId}`"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-200 bg-teal-900/40 border border-teal-500/40 rounded-lg hover:bg-teal-900/60 transition-colors"
            >
              <Shield class="w-3.5 h-3.5" />
              Kelola Master Group
            </router-link>
          </div>
        </div>
      </div>

      <!-- 2 TABLES: INFORMASI AKUN & INFORMASI AKSES/KARYAWAN -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Table 1: Informasi Akun -->
        <AppCard class="border border-slate-200 shadow-sm overflow-hidden">
          <template #header>
            <div class="flex items-center gap-2 p-4 bg-slate-50 border-b border-slate-200">
              <UserIcon class="w-4 h-4 text-teal-600" />
              <h3 class="text-sm font-semibold text-slate-800">Informasi Akun</h3>
            </div>
          </template>

          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left divide-y divide-slate-100">
              <tbody class="divide-y divide-slate-100">
                <tr>
                  <td class="py-2.5 px-4 font-medium text-slate-500 w-36 bg-slate-50/50">ID User</td>
                  <td class="py-2.5 px-4 font-mono font-bold text-slate-800 flex items-center justify-between">
                    <span>{{ user.id }}</span>
                    <button
                      type="button"
                      class="text-slate-400 hover:text-slate-600"
                      title="Salin ID"
                      @click="copyToClipboard(String(user.id), 'id')"
                    >
                      <component :is="copiedKey === 'id' ? Check : Copy" class="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>

                <tr>
                  <td class="py-2.5 px-4 font-medium text-slate-500 bg-slate-50/50">Username</td>
                  <td class="py-2.5 px-4 font-mono font-semibold text-slate-800 flex items-center justify-between">
                    <span>{{ user.username }}</span>
                    <button
                      type="button"
                      class="text-slate-400 hover:text-slate-600"
                      title="Salin Username"
                      @click="copyToClipboard(user.username, 'username')"
                    >
                      <component :is="copiedKey === 'username' ? Check : Copy" class="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>

                <tr>
                  <td class="py-2.5 px-4 font-medium text-slate-500 bg-slate-50/50">Email</td>
                  <td class="py-2.5 px-4 text-slate-800 flex items-center justify-between">
                    <span>{{ user.email }}</span>
                    <button
                      type="button"
                      class="text-slate-400 hover:text-slate-600"
                      title="Salin Email"
                      @click="copyToClipboard(user.email, 'email')"
                    >
                      <component :is="copiedKey === 'email' ? Check : Copy" class="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>

                <tr>
                  <td class="py-2.5 px-4 font-medium text-slate-500 bg-slate-50/50">Nama Lengkap</td>
                  <td class="py-2.5 px-4 font-semibold text-slate-800">{{ user.firstName }}</td>
                </tr>

                <tr>
                  <td class="py-2.5 px-4 font-medium text-slate-500 bg-slate-50/50">Status Akun</td>
                  <td class="py-2.5 px-4">
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                      :class="user.active === 1 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'"
                    >
                      {{ user.statusLabel }}
                    </span>
                  </td>
                </tr>

                <tr>
                  <td class="py-2.5 px-4 font-medium text-slate-500 bg-slate-50/50">IP Address Terakhir</td>
                  <td class="py-2.5 px-4 font-mono text-slate-700">{{ user.ipAddress || '-' }}</td>
                </tr>

                <tr>
                  <td class="py-2.5 px-4 font-medium text-slate-500 bg-slate-50/50">Terakhir Login</td>
                  <td class="py-2.5 px-4 text-slate-700">
                    <span v-if="user.lastLogin" class="font-mono">{{ user.lastLogin }}</span>
                    <span v-else class="text-slate-400 italic">Belum pernah login</span>
                  </td>
                </tr>

                <tr>
                  <td class="py-2.5 px-4 font-medium text-slate-500 bg-slate-50/50">Tanggal Dibuat</td>
                  <td class="py-2.5 px-4 font-mono text-slate-700">{{ user.createdOn }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </AppCard>

        <!-- Table 2: Informasi Akses & Karyawan Terkait -->
        <AppCard class="border border-slate-200 shadow-sm overflow-hidden">
          <template #header>
            <div class="flex items-center gap-2 p-4 bg-slate-50 border-b border-slate-200">
              <Shield class="w-4 h-4 text-teal-600" />
              <h3 class="text-sm font-semibold text-slate-800">Informasi Akses & Karyawan Terkait</h3>
            </div>
          </template>

          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left divide-y divide-slate-100">
              <tbody class="divide-y divide-slate-100">
                <tr>
                  <td class="py-2.5 px-4 font-medium text-slate-500 w-36 bg-slate-50/50">Groups / Role</td>
                  <td class="py-2.5 px-4">
                    <div class="flex items-center justify-between">
                      <div>
                        <AppBadge variant="info" class="font-mono text-xs uppercase font-bold">
                          {{ user.group.name }}
                        </AppBadge>
                        <div class="text-[11px] text-slate-500 mt-1">{{ user.group.description }}</div>
                      </div>
                      <router-link
                        :to="`/system/groups/${user.group.id}`"
                        class="text-teal-600 hover:text-teal-700 inline-flex items-center gap-1 text-xs font-medium"
                      >
                        Lihat <ExternalLink class="w-3 h-3" />
                      </router-link>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td class="py-2.5 px-4 font-medium text-slate-500 bg-slate-50/50">PIN Transaksi</td>
                  <td class="py-2.5 px-4">
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                      :class="user.isPinSet ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'"
                    >
                      {{ user.isPinSet ? 'Sudah diset' : 'Belum diset' }}
                    </span>
                    <span class="text-[10px] text-slate-400 ml-2">(Kredensial PIN dienkripsi)</span>
                  </td>
                </tr>

                <tr v-if="user.employee">
                  <td class="py-2.5 px-4 font-medium text-slate-500 bg-slate-50/50">Kode Karyawan</td>
                  <td class="py-2.5 px-4 font-mono font-bold text-slate-800">{{ user.employee.kode }}</td>
                </tr>

                <tr v-if="user.employee">
                  <td class="py-2.5 px-4 font-medium text-slate-500 bg-slate-50/50">Nama Karyawan</td>
                  <td class="py-2.5 px-4 font-semibold text-slate-800">{{ user.employee.nama }}</td>
                </tr>

                <tr v-if="user.employee">
                  <td class="py-2.5 px-4 font-medium text-slate-500 bg-slate-50/50">Jabatan</td>
                  <td class="py-2.5 px-4 text-slate-700">{{ user.employee.jabatan }}</td>
                </tr>

                <tr v-if="user.employee">
                  <td class="py-2.5 px-4 font-medium text-slate-500 bg-slate-50/50">Status Karyawan</td>
                  <td class="py-2.5 px-4">
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                      :class="user.employee.status === 1 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'"
                    >
                      {{ user.employee.statusLabel }}
                    </span>
                  </td>
                </tr>

                <tr v-if="user.employee">
                  <td class="py-2.5 px-4 font-medium text-slate-500 bg-slate-50/50">No. HP</td>
                  <td class="py-2.5 px-4 font-mono text-slate-700">{{ user.employee.no_hp }}</td>
                </tr>

                <tr v-if="user.employee">
                  <td class="py-2.5 px-4 font-medium text-slate-500 bg-slate-50/50">Alamat</td>
                  <td class="py-2.5 px-4 text-slate-600">{{ user.employee.alamat }}</td>
                </tr>

                <tr v-if="!user.employee">
                  <td class="py-2.5 px-4 font-medium text-slate-500 bg-slate-50/50">Data Karyawan</td>
                  <td class="py-2.5 px-4 text-slate-400 italic">Akun ini tidak terhubung ke master data karyawan.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </AppCard>
      </div>

      <!-- ROLE ACCESS PREVIEW -->
      <UserRoleAccessPreview
        :group-id="user.group.id"
        :group-name="user.group.name.toUpperCase()"
        :group-description="user.group.description"
        :permissions="user.permissions"
        :dashboard-widgets="user.accessibleWidgets"
      />
    </div>

    <!-- Modals -->
    <UserResetPasswordModal
      :is-open="isResetPasswordModalOpen"
      :user="user"
      @close="isResetPasswordModalOpen = false"
      @saved="loadData"
    />

    <UserResetPinModal
      :is-open="isResetPinModalOpen"
      :user="user"
      @close="isResetPinModalOpen = false"
      @saved="loadData"
    />
  </div>
</template>