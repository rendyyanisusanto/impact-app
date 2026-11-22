import { ref, computed, onBeforeUnmount } from 'vue'
import { customerService } from '../customers/services/customer.service'
import type { MasterDataCustomer } from '../customers/types/customer.types'

const LIMIT = 10
const DEBOUNCE_MS = 300

/**
 * Lookup customer dari database: maksimal 10 data, pencarian dilakukan di server saat mengetik.
 */
export function useCustomerLookup() {
  const customers = ref<MasterDataCustomer[]>([])
  const selected = ref<{ id: number; label: string; description?: string } | null>(null)
  let timer: ReturnType<typeof setTimeout> | null = null
  let requestId = 0

  async function fetchCustomers(search = ''): Promise<void> {
    const current = ++requestId
    try {
      const res = await customerService.getAll({ page: 1, pageSize: LIMIT, search, status: 1 })
      if (current !== requestId) return
      customers.value = (res.data || []).filter(c => c.status === 1).slice(0, LIMIT)
    } catch (error) {
      console.error('Failed to load customers', error)
    }
  }

  function onSearch(query: string): void {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fetchCustomers(query), DEBOUNCE_MS)
  }

  function toOption(c: MasterDataCustomer) {
    return {
      value: c.id,
      label: `${c.kode} - ${c.nama}`,
      description: [c.alamat, c.no_hp].filter(Boolean).join(' • ')
    }
  }

  /** Simpan customer terpilih (mis. saat edit) agar labelnya tetap tampil walau di luar 10 hasil. */
  function setSelected(id: number | null | undefined, label?: string): void {
    selected.value = id && label ? { id, label } : null
  }

  /** Dipanggil saat user memilih customer, agar label tetap tampil walau daftar di-refresh. */
  function onSelect(id: string | number | null): void {
    const c = customers.value.find(x => String(x.id) === String(id))
    if (c) {
      const o = toOption(c)
      selected.value = { id: c.id, label: o.label, description: o.description }
    } else if (id === null) {
      selected.value = null
    }
  }

  const options = computed(() => {
    const opts = customers.value.map(toOption)
    const sel = selected.value
    if (sel && !opts.some(o => o.value === sel.id)) {
      opts.unshift({ value: sel.id, label: sel.label, description: sel.description ?? '' })
    }
    return opts
  })

  onBeforeUnmount(() => {
    if (timer) clearTimeout(timer)
  })

  return { customers, options, fetchCustomers, onSearch, setSelected, onSelect }
}

