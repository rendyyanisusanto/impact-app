import { ref, getCurrentInstance, onMounted } from 'vue'
import type { CrudService, ListQuery, BaseEntity } from '../types/crud.types'
import { useToast } from './useToast'
import { useConfirm } from './useConfirm'
import { usePermission } from './usePermission'

export interface UseCrudOptions {
  resourceName?: string
  entityLabel?: string
  defaultPageSize?: number
  defaultSortBy?: string
  defaultSortOrder?: 'asc' | 'desc'
  initialFilters?: Record<string, unknown>
  autoFetch?: boolean
}

export function useCrud<T extends BaseEntity, CreateDto = unknown, UpdateDto = unknown>(
  service: CrudService<T, CreateDto, UpdateDto>,
  options: UseCrudOptions = {}
) {
  const {
    resourceName = '',
    entityLabel = 'Data',
    defaultPageSize = 10,
    defaultSortBy = 'id',
    defaultSortOrder = 'desc',
    initialFilters = {},
    autoFetch = true
  } = options

  const toast = useToast()
  const { confirm } = useConfirm()
  const { hasPermission } = usePermission()

  // Table state
  const items = ref<T[]>([]) as { value: T[] }
  const totalItems = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(defaultPageSize)
  const searchQuery = ref('')
  const statusFilter = ref<string | number>('all')
  const sortBy = ref(defaultSortBy)
  const sortOrder = ref<'asc' | 'desc'>(defaultSortOrder)
  const extraFilters = ref<Record<string, unknown>>({ ...initialFilters })
  const isLoading = ref(true)
  const error = ref<string | null>(null)

  // Modals state
  const isFormOpen = ref(false)
  const isDetailOpen = ref(false)
  const isImportOpen = ref(false)
  const selectedItem = ref<T | null>(null) as { value: T | null }
  const formMode = ref<'create' | 'edit'>('create')
  const isSaving = ref(false)
  const isDeleting = ref(false)

  // Fetch list
  async function fetchList() {
    isLoading.value = true
    error.value = null

    const query: ListQuery = {
      page: currentPage.value,
      pageSize: pageSize.value,
      search: searchQuery.value.trim() || undefined,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
      status: statusFilter.value === 'all' ? undefined : statusFilter.value,
      ...extraFilters.value
    }

    try {
      const response = await service.list(query)
      items.value = response.data
      totalItems.value = response.total
      currentPage.value = response.page
      pageSize.value = response.pageSize
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Gagal memuat data ${entityLabel}`
      toast.error(error.value)
    } finally {
      isLoading.value = false
    }
  }

  // Search & Filter handlers
  function handleSearch(query: string) {
    searchQuery.value = query
    currentPage.value = 1
    fetchList()
  }

  function handleFilterStatus(status: string | number) {
    statusFilter.value = status
    currentPage.value = 1
    fetchList()
  }

  function handleFilter(key: string, value: unknown) {
    if (value === undefined || value === null || value === 'all' || value === '') {
      delete extraFilters.value[key]
    } else {
      extraFilters.value[key] = value
    }
    currentPage.value = 1
    fetchList()
  }

  function handleSort(key: string) {
    if (sortBy.value === key) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy.value = key
      sortOrder.value = 'asc'
    }
    fetchList()
  }

  function handlePageChange(page: number) {
    currentPage.value = page
    fetchList()
  }

  function handlePageSizeChange(size: number) {
    pageSize.value = size
    currentPage.value = 1
    fetchList()
  }

  // Modal open/close
  function openCreate() {
    if (resourceName && !hasPermission(resourceName, 'create')) {
      toast.error('Anda tidak memiliki izin untuk menambah data.')
      return
    }
    selectedItem.value = null
    formMode.value = 'create'
    isFormOpen.value = true
  }

  function openEdit(item: T) {
    if (resourceName && !hasPermission(resourceName, 'update')) {
      toast.error('Anda tidak memiliki izin untuk mengubah data.')
      return
    }
    selectedItem.value = { ...item }
    formMode.value = 'edit'
    isFormOpen.value = true
  }

  function openDetail(item: T) {
    if (resourceName && !hasPermission(resourceName, 'read')) {
      toast.error('Anda tidak memiliki izin untuk melihat detail data.')
      return
    }
    selectedItem.value = { ...item }
    isDetailOpen.value = true
  }

  function closeForm() {
    isFormOpen.value = false
    selectedItem.value = null
  }

  function closeDetail() {
    isDetailOpen.value = false
    selectedItem.value = null
  }

  // Save handler (Create / Update)
  async function saveItem(payload: CreateDto | UpdateDto): Promise<boolean> {
    isSaving.value = true
    try {
      if (formMode.value === 'create') {
        await service.create(payload as CreateDto)
        toast.success(`${entityLabel} berhasil ditambahkan.`)
      } else if (selectedItem.value) {
        await service.update(selectedItem.value.id, payload as UpdateDto)
        toast.success(`${entityLabel} berhasil diperbarui.`)
      }
      closeForm()
      await fetchList()
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : `Gagal menyimpan ${entityLabel}`
      toast.error(msg)
      return false
    } finally {
      isSaving.value = false
    }
  }

  // Delete handler
  async function handleDelete(item: T, displayName?: string): Promise<boolean> {
    if (resourceName && !hasPermission(resourceName, 'delete')) {
      toast.error('Anda tidak memiliki izin untuk menghapus data.')
      return false
    }

    const label = displayName || `item ID #${item.id}`
    const confirmed = await confirm({
      title: `Hapus ${entityLabel}`,
      message: `Apakah Anda yakin ingin menghapus "${label}"? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Hapus Data',
      cancelText: 'Batal',
      variant: 'danger'
    })

    if (!confirmed) return false

    isDeleting.value = true
    try {
      await service.delete(item.id)
      toast.success(`${entityLabel} berhasil dihapus.`)
      await fetchList()
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : `Gagal menghapus ${entityLabel}`
      toast.error(msg)
      return false
    } finally {
      isDeleting.value = false
    }
  }

  if (autoFetch && getCurrentInstance()) {
    onMounted(() => {
      fetchList()
    })
  }

  return {
    // State
    items,
    totalItems,
    currentPage,
    pageSize,
    searchQuery,
    statusFilter,
    extraFilters,
    sortBy,
    sortOrder,
    isLoading,
    error,
    isSaving,
    isDeleting,

    // Modals
    isFormOpen,
    isDetailOpen,
    isImportOpen,
    selectedItem,
    formMode,

    // Actions
    fetchList,
    handleSearch,
    handleFilterStatus,
    handleFilter,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
    openCreate,
    openEdit,
    openDetail,
    closeForm,
    closeDetail,
    saveItem,
    handleDelete
  }
}
