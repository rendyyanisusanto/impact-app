<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CoaTreeNodeGroup, CoaTreeNodeAccount } from '../types/coa.types'
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  Eye,
  Edit2,
  Trash2,
  Power,
  PowerOff,
  Plus
} from 'lucide-vue-next'

const props = defineProps<{
  tree: CoaTreeNodeGroup[]
  isLoading?: boolean
  canCreate?: boolean
  canUpdate?: boolean
  canDelete?: boolean
}>()

const emit = defineEmits<{
  (e: 'view', accountId: number): void
  (e: 'edit-account', accountId: number): void
  (e: 'edit-parent', parentId: number): void
  (e: 'edit-group', groupId: number): void
  (e: 'add-account-to-parent', parentId: number, coaId: number): void
  (e: 'toggle-status', account: CoaTreeNodeAccount): void
  (e: 'delete-account', account: CoaTreeNodeAccount): void
}>()

// State expanded nodes
const expandedGroups = ref<Set<number>>(new Set())
const expandedParents = ref<Set<number>>(new Set())

// Auto-expand all groups and parents by default
watch(
  () => props.tree,
  (newTree) => {
    if (newTree && newTree.length > 0 && expandedGroups.value.size === 0) {
      expandAll()
    }
  },
  { immediate: true }
)

function toggleGroup(groupId: number) {
  if (expandedGroups.value.has(groupId)) {
    expandedGroups.value.delete(groupId)
  } else {
    expandedGroups.value.add(groupId)
  }
}

function toggleParent(parentId: number) {
  if (expandedParents.value.has(parentId)) {
    expandedParents.value.delete(parentId)
  } else {
    expandedParents.value.add(parentId)
  }
}

function expandAll() {
  const gSet = new Set<number>()
  const pSet = new Set<number>()
  for (const g of props.tree) {
    gSet.add(g.id)
    for (const p of g.parents) {
      pSet.add(p.id)
    }
  }
  expandedGroups.value = gSet
  expandedParents.value = pSet
}

function collapseAll() {
  expandedGroups.value = new Set()
  expandedParents.value = new Set()
}

defineExpose({
  expandAll,
  collapseAll
})
</script>

<template>
  <div class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
    <!-- Toolbar Expand / Collapse -->
    <div class="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs text-gray-600">
      <div class="flex items-center space-x-2">
        <span class="font-medium text-gray-700">Tampilan Struktur Akuntansi Hierarkis</span>
        <span class="text-gray-400">|</span>
        <span>Kelompok &rarr; Induk &rarr; Rekening Detail</span>
      </div>
      <div class="flex items-center space-x-2">
        <button
          type="button"
          class="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          @click="expandAll"
        >
          Buka Semua (Expand All)
        </button>
        <button
          type="button"
          class="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          @click="collapseAll"
        >
          Tutup Semua (Collapse All)
        </button>
      </div>
    </div>

    <!-- Tree Content Loading -->
    <div v-if="isLoading" class="p-8 space-y-4">
      <div v-for="i in 5" :key="i" class="h-10 bg-gray-100 animate-pulse rounded"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!tree || tree.length === 0" class="p-12 text-center text-gray-500">
      <Folder class="w-12 h-12 mx-auto text-gray-300 mb-2" />
      <p class="font-medium text-gray-700">Tidak ada rekening akuntansi yang sesuai dengan filter.</p>
      <p class="text-xs text-gray-400 mt-1">Coba ubah kata kunci pencarian atau reset filter.</p>
    </div>

    <!-- Tree Nodes -->
    <div v-else class="divide-y divide-gray-100">
      <div v-for="group in tree" :key="group.id" class="select-none">
        <!-- Level 1: Kelompok Akun (Group) -->
        <div
          class="flex items-center justify-between px-4 py-3 bg-gray-50/80 hover:bg-teal-50/50 cursor-pointer transition-colors border-l-4 border-teal-600"
          @click="toggleGroup(group.id)"
        >
          <div class="flex items-center space-x-2">
            <button type="button" class="text-gray-500 hover:text-gray-700 p-0.5" @click.stop="toggleGroup(group.id)">
              <ChevronDown v-if="expandedGroups.has(group.id)" class="w-4 h-4 text-teal-700" />
              <ChevronRight v-else class="w-4 h-4 text-gray-400" />
            </button>
            <FolderOpen v-if="expandedGroups.has(group.id)" class="w-4 h-4 text-teal-600" />
            <Folder v-else class="w-4 h-4 text-teal-600" />
            <span class="font-bold text-gray-900 tracking-wide">
              {{ group.id }} &mdash; {{ group.name.toUpperCase() }}
            </span>
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
              {{ group.parent_count }} induk &bull; {{ group.account_count }} akun
            </span>
          </div>

          <div class="flex items-center space-x-1" @click.stop>
            <button
              v-if="canUpdate"
              type="button"
              class="p-1 text-gray-400 hover:text-teal-600 rounded transition-colors"
              title="Edit Kelompok Akun"
              @click="emit('edit-group', group.id)"
            >
              <Edit2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Level 2: Induk Akun (Parent) -->
        <div v-if="expandedGroups.has(group.id)" class="bg-white">
          <div v-for="parent in group.parents" :key="parent.id" class="border-b border-gray-100 last:border-b-0">
            <div
              class="flex items-center justify-between pl-8 pr-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
              @click="toggleParent(parent.id)"
            >
              <div class="flex items-center space-x-2">
                <button type="button" class="text-gray-400 hover:text-gray-600 p-0.5" @click.stop="toggleParent(parent.id)">
                  <ChevronDown v-if="expandedParents.has(parent.id)" class="w-3.5 h-3.5 text-gray-700" />
                  <ChevronRight v-else class="w-3.5 h-3.5 text-gray-400" />
                </button>
                <span class="font-mono font-semibold text-xs text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                  {{ parent.no_akun }}
                </span>
                <span class="font-semibold text-sm text-gray-800">
                  {{ parent.nama }}
                </span>
                <span class="text-xs text-gray-400">
                  ({{ parent.account_count }} rekening)
                </span>
              </div>

              <div class="flex items-center space-x-1" @click.stop>
                <button
                  v-if="canCreate"
                  type="button"
                  class="inline-flex items-center px-2 py-0.5 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded hover:bg-teal-100 transition-colors mr-2"
                  @click="emit('add-account-to-parent', parent.id, group.id)"
                >
                  <Plus class="w-3 h-3 mr-1" />
                  Tambah Akun
                </button>
                <button
                  v-if="canUpdate"
                  type="button"
                  class="p-1 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                  title="Edit Induk Akun"
                  @click="emit('edit-parent', parent.id)"
                >
                  <Edit2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- Level 3: Rekening Detail (Accounts) -->
            <div v-if="expandedParents.has(parent.id)" class="bg-gray-50/40 divide-y divide-gray-100">
              <div
                v-for="acct in parent.accounts"
                :key="acct.id"
                class="flex items-center justify-between pl-14 pr-4 py-2 hover:bg-white transition-colors"
              >
                <div class="flex items-center space-x-3">
                  <FileText class="w-3.5 h-3.5 text-gray-400" />
                  <span class="font-mono text-xs font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200 shadow-2xs">
                    {{ acct.no_ref }}
                  </span>
                  <span class="text-sm font-medium text-gray-800">
                    {{ acct.nama }}
                  </span>
                  
                  <!-- Saldo Normal Badge -->
                  <span
                    :class="[
                      'inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-semibold uppercase border',
                      acct.saldo_normal === 'D'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    ]"
                  >
                    {{ acct.saldo_normal === 'D' ? 'Debit (D)' : 'Kredit (K)' }}
                  </span>

                  <!-- Status Aktif / Nonaktif Badge -->
                  <span
                    :class="[
                      'inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-medium border',
                      acct.is_active === 1
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    ]"
                  >
                    {{ acct.is_active === 1 ? 'Aktif' : 'Nonaktif' }}
                  </span>

                  <!-- Status Digunakan Transaksi -->
                  <span
                    v-if="acct.is_used"
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-medium bg-teal-50 text-teal-700 border border-teal-200"
                    title="Rekening ini telah dipakai pada transaksi akuntansi"
                  >
                    Terpakai ({{ acct.transaction_count }} tx)
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-medium bg-slate-50 text-slate-500 border border-slate-200"
                  >
                    Belum Digunakan
                  </span>
                </div>

                <!-- Action Buttons -->
                <div class="flex items-center space-x-1">
                  <!-- Lihat Detail -->
                  <button
                    type="button"
                    class="p-1 text-gray-400 hover:text-teal-600 rounded transition-colors"
                    title="Lihat Detail Rekening"
                    @click="emit('view', acct.id)"
                  >
                    <Eye class="w-3.5 h-3.5" />
                  </button>

                  <!-- Edit Rekening -->
                  <button
                    v-if="canUpdate"
                    type="button"
                    class="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                    title="Edit Rekening"
                    @click="emit('edit-account', acct.id)"
                  >
                    <Edit2 class="w-3.5 h-3.5" />
                  </button>

                  <!-- Toggle Aktif/Nonaktif -->
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

                  <!-- Hapus Rekening (jika belum dipakai) -->
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
                    @click="!acct.is_used && emit('delete-account', acct)"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-2xs {
  font-size: 0.6875rem;
  line-height: 0.875rem;
}
.shadow-2xs {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
</style>
