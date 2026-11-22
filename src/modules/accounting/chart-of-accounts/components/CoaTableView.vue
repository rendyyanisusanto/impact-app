<script setup lang="ts">
import type { CoaAccount } from '../types/coa.types'
import {
  Eye,
  Edit2,
  Trash2,
  Power,
  PowerOff,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-vue-next'

defineProps<{
  accounts: CoaAccount[]
  isLoading?: boolean
  total: number
  currentPage: number
  pageSize: number
  totalPages: number
  sortBy: string
  sortOrder: 'ASC' | 'DESC'
  canUpdate?: boolean
  canDelete?: boolean
}>()

const emit = defineEmits<{
  (e: 'view', accountId: number): void
  (e: 'edit', accountId: number): void
  (e: 'toggle-status', account: CoaAccount): void
  (e: 'delete', account: CoaAccount): void
  (e: 'sort', field: string): void
  (e: 'page-change', page: number): void
  (e: 'page-size-change', size: number): void
}>()

function onSort(field: string) {
  emit('sort', field)
}
</script>

<template>
  <div class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
    <!-- Desktop Table View -->
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider select-none">
            <!-- Col 1: Kode Rekening -->
            <th
              class="py-3 px-4 cursor-pointer hover:bg-gray-100 transition-colors w-32"
              @click="onSort('no_ref')"
            >
              <div class="flex items-center space-x-1">
                <span>Kode</span>
                <ArrowUp v-if="sortBy === 'no_ref' && sortOrder === 'ASC'" class="w-3.5 h-3.5 text-teal-600" />
                <ArrowDown v-else-if="sortBy === 'no_ref' && sortOrder === 'DESC'" class="w-3.5 h-3.5 text-teal-600" />
                <ArrowUpDown v-else class="w-3 h-3 text-gray-400" />
              </div>
            </th>

            <!-- Col 2: Nama Rekening -->
            <th
              class="py-3 px-4 cursor-pointer hover:bg-gray-100 transition-colors min-w-[200px]"
              @click="onSort('nama')"
            >
              <div class="flex items-center space-x-1">
                <span>Nama Rekening</span>
                <ArrowUp v-if="sortBy === 'nama' && sortOrder === 'ASC'" class="w-3.5 h-3.5 text-teal-600" />
                <ArrowDown v-else-if="sortBy === 'nama' && sortOrder === 'DESC'" class="w-3.5 h-3.5 text-teal-600" />
                <ArrowUpDown v-else class="w-3 h-3 text-gray-400" />
              </div>
            </th>

            <!-- Col 3: Kelompok -->
            <th
              class="py-3 px-4 cursor-pointer hover:bg-gray-100 transition-colors w-36"
              @click="onSort('coa_name')"
            >
              <div class="flex items-center space-x-1">
                <span>Kelompok</span>
                <ArrowUp v-if="sortBy === 'coa_name' && sortOrder === 'ASC'" class="w-3.5 h-3.5 text-teal-600" />
                <ArrowDown v-else-if="sortBy === 'coa_name' && sortOrder === 'DESC'" class="w-3.5 h-3.5 text-teal-600" />
                <ArrowUpDown v-else class="w-3 h-3 text-gray-400" />
              </div>
            </th>

            <!-- Col 4: Induk Akun -->
            <th
              class="py-3 px-4 cursor-pointer hover:bg-gray-100 transition-colors w-44"
              @click="onSort('induk_nama')"
            >
              <div class="flex items-center space-x-1">
                <span>Induk Akun</span>
                <ArrowUp v-if="sortBy === 'induk_nama' && sortOrder === 'ASC'" class="w-3.5 h-3.5 text-teal-600" />
                <ArrowDown v-else-if="sortBy === 'induk_nama' && sortOrder === 'DESC'" class="w-3.5 h-3.5 text-teal-600" />
                <ArrowUpDown v-else class="w-3 h-3 text-gray-400" />
              </div>
            </th>

            <!-- Col 5: Saldo Normal -->
            <th
              class="py-3 px-4 cursor-pointer hover:bg-gray-100 transition-colors w-28 text-center"
              @click="onSort('saldo_normal')"
            >
              <div class="flex items-center justify-center space-x-1">
                <span>Saldo Normal</span>
                <ArrowUp v-if="sortBy === 'saldo_normal' && sortOrder === 'ASC'" class="w-3.5 h-3.5 text-teal-600" />
                <ArrowDown v-else-if="sortBy === 'saldo_normal' && sortOrder === 'DESC'" class="w-3.5 h-3.5 text-teal-600" />
                <ArrowUpDown v-else class="w-3 h-3 text-gray-400" />
              </div>
            </th>

            <!-- Col 6: Status -->
            <th
              class="py-3 px-4 cursor-pointer hover:bg-gray-100 transition-colors w-24 text-center"
              @click="onSort('is_active')"
            >
              <div class="flex items-center justify-center space-x-1">
                <span>Status</span>
                <ArrowUp v-if="sortBy === 'is_active' && sortOrder === 'ASC'" class="w-3.5 h-3.5 text-teal-600" />
                <ArrowDown v-else-if="sortBy === 'is_active' && sortOrder === 'DESC'" class="w-3.5 h-3.5 text-teal-600" />
                <ArrowUpDown v-else class="w-3 h-3 text-gray-400" />
              </div>
            </th>

            <!-- Col 7: Penggunaan -->
            <th class="py-3 px-4 w-36 text-center">
              <span>Digunakan</span>
            </th>

            <!-- Col 8: Aksi -->
            <th class="py-3 px-4 w-28 text-right">
              <span>Aksi</span>
            </th>
          </tr>
        </thead>

        <tbody class="divide-y divide-gray-100 text-gray-700">
          <!-- Loading State -->
          <tr v-if="isLoading" v-for="i in 5" :key="i" class="animate-pulse">
            <td v-for="j in 8" :key="j" class="py-3.5 px-4">
              <div class="h-4 bg-gray-200 rounded"></div>
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-else-if="accounts.length === 0">
            <td colspan="8" class="py-12 text-center text-gray-400">
              Tidak ada data rekening yang sesuai dengan kriteria filter.
            </td>
          </tr>

          <!-- Rows -->
          <tr
            v-else
            v-for="acct in accounts"
            :key="acct.id"
            class="hover:bg-teal-50/30 transition-colors"
          >
            <!-- Kode -->
            <td class="py-2.5 px-4 font-mono font-bold text-gray-900">
              {{ acct.no_ref }}
            </td>

            <!-- Nama Rekening -->
            <td class="py-2.5 px-4 font-medium text-gray-900">
              {{ acct.nama }}
            </td>

            <!-- Kelompok -->
            <td class="py-2.5 px-4 text-gray-600">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-2xs font-medium bg-gray-100 text-gray-700">
                {{ acct.coa_name || '-' }}
              </span>
            </td>

            <!-- Induk Akun -->
            <td class="py-2.5 px-4 text-gray-600">
              <span class="font-mono text-2xs text-indigo-700 mr-1">[{{ acct.induk_no_akun }}]</span>
              <span>{{ acct.induk_nama || '-' }}</span>
            </td>

            <!-- Saldo Normal -->
            <td class="py-2.5 px-4 text-center">
              <span
                :class="[
                  'inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold uppercase border',
                  acct.saldo_normal === 'D'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                ]"
              >
                {{ acct.saldo_normal === 'D' ? 'Debit (D)' : 'Kredit (K)' }}
              </span>
            </td>

            <!-- Status -->
            <td class="py-2.5 px-4 text-center">
              <span
                :class="[
                  'inline-flex items-center px-2 py-0.5 rounded text-2xs font-medium border',
                  acct.is_active === 1
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                ]"
              >
                {{ acct.is_active === 1 ? 'Aktif' : 'Nonaktif' }}
              </span>
            </td>

            <!-- Digunakan -->
            <td class="py-2.5 px-4 text-center">
              <span
                v-if="acct.is_used"
                class="inline-flex items-center px-2 py-0.5 rounded text-2xs font-medium bg-teal-50 text-teal-700 border border-teal-200"
                title="Digunakan dalam transaksi"
              >
                Terpakai ({{ acct.transaction_count }} tx)
              </span>
              <span
                v-else
                class="inline-flex items-center px-2 py-0.5 rounded text-2xs font-medium bg-slate-50 text-slate-500 border border-slate-200"
              >
                Belum Digunakan
              </span>
            </td>

            <!-- Aksi -->
            <td class="py-2.5 px-4 text-right">
              <div class="flex items-center justify-end space-x-1">
                <!-- Lihat -->
                <button
                  type="button"
                  class="p-1 text-gray-400 hover:text-teal-600 rounded transition-colors"
                  title="Lihat Detail"
                  @click="emit('view', acct.id)"
                >
                  <Eye class="w-3.5 h-3.5" />
                </button>

                <!-- Edit -->
                <button
                  v-if="canUpdate"
                  type="button"
                  class="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                  title="Edit Rekening"
                  @click="emit('edit', acct.id)"
                >
                  <Edit2 class="w-3.5 h-3.5" />
                </button>

                <!-- Toggle Status -->
                <button
                  v-if="canUpdate"
                  type="button"
                  :class="[
                    'p-1 rounded transition-colors',
                    acct.is_active === 1
                      ? 'text-gray-400 hover:text-amber-600'
                      : 'text-gray-400 hover:text-emerald-600'
                  ]"
                  :title="acct.is_active === 1 ? 'Nonaktifkan Rekening' : 'Aktifkan Rekening'"
                  @click="emit('toggle-status', acct)"
                >
                  <PowerOff v-if="acct.is_active === 1" class="w-3.5 h-3.5" />
                  <Power v-else class="w-3.5 h-3.5" />
                </button>

                <!-- Hapus (jika belum digunakan) -->
                <button
                  v-if="canDelete"
                  type="button"
                  :disabled="acct.is_used"
                  :class="[
                    'p-1 rounded transition-colors',
                    acct.is_used
                      ? 'text-gray-300 cursor-not-allowed opacity-50'
                      : 'text-gray-400 hover:text-red-600'
                  ]"
                  :title="acct.is_used ? 'Rekening tidak dapat dihapus karena sudah dipakai transaksi' : 'Hapus Rekening'"
                  @click="!acct.is_used && emit('delete', acct)"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination Footer -->
    <div class="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-600 gap-2">
      <div class="flex items-center space-x-2">
        <span>Menampilkan {{ accounts.length }} dari {{ total }} rekening</span>
        <span class="text-gray-300">|</span>
        <span>Per halaman:</span>
        <select
          :value="pageSize"
          class="border border-gray-300 rounded px-2 py-0.5 bg-white text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
          @change="emit('page-size-change', Number(($event.target as HTMLSelectElement).value))"
        >
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
      </div>

      <div class="flex items-center space-x-1">
        <button
          type="button"
          :disabled="currentPage <= 1"
          class="px-2.5 py-1 border border-gray-300 rounded bg-white text-xs text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          @click="emit('page-change', currentPage - 1)"
        >
          Sebelumnya
        </button>

        <span class="px-3 py-1 text-xs text-gray-600 font-medium">
          Halaman {{ currentPage }} dari {{ totalPages }}
        </span>

        <button
          type="button"
          :disabled="currentPage >= totalPages"
          class="px-2.5 py-1 border border-gray-300 rounded bg-white text-xs text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          @click="emit('page-change', currentPage + 1)"
        >
          Selanjutnya
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-2xs {
  font-size: 0.6875rem;
  line-height: 0.875rem;
}
</style>
