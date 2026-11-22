import {
  MOCK_PROVINCES,
  MOCK_CITIES,
  MOCK_GUDANG,
  MOCK_SATUAN_PAKAI,
  MOCK_SATUAN_BELI,
  type Province,
  type City,
  type Gudang,
  type Satuan
} from '@/mocks/references/master-references.mock'
import {
  INITIAL_MOCK_WAREHOUSES,
  INITIAL_MOCK_MATERIAL_CATEGORIES,
  INITIAL_MOCK_PRODUCT_CATEGORIES,
  INITIAL_MOCK_SATUAN_BELI,
  INITIAL_MOCK_SATUAN_PAKAI,
  INITIAL_MOCK_SATUAN_BARANG
} from '@/mocks/references/master-seeds.mock'

export interface ReferenceOption {
  value: number
  label: string
  disabled?: boolean
}

export interface GenericReferenceItem {
  id: number
  nama?: string | null
  color?: string | null
  status?: number | null
  [key: string]: unknown
}

export class ReferenceService {
  private warehouses = new Map<number, GenericReferenceItem>()
  private materialCategories = new Map<number, GenericReferenceItem>()
  private productCategories = new Map<number, GenericReferenceItem>()
  private purchaseUnits = new Map<number, GenericReferenceItem>()
  private usageUnits = new Map<number, GenericReferenceItem>()
  private productUnits = new Map<number, GenericReferenceItem>()

  constructor() {
    this.reset()
  }

  /**
   * Resets all internal reference caches to initial deterministic mock states
   */
  reset(): void {
    this.warehouses.clear()
    this.materialCategories.clear()
    this.productCategories.clear()
    this.purchaseUnits.clear()
    this.usageUnits.clear()
    this.productUnits.clear()

    // 1. Seed Warehouses (combining legacy reference seeds 1-6 with master warehouse seeds 1000-1003)
    for (const g of MOCK_GUDANG) {
      this.warehouses.set(g.id, { id: g.id, nama: g.nama, status: 1 })
    }
    for (const w of INITIAL_MOCK_WAREHOUSES) {
      this.warehouses.set(w.id, { id: w.id, nama: w.nama, color: w.color, status: w.status ?? 1 })
    }

    // 2. Seed Material Categories
    for (const mc of INITIAL_MOCK_MATERIAL_CATEGORIES) {
      this.materialCategories.set(mc.id, {
        id: mc.id,
        nama: mc.nama,
        color: mc.color,
        status: mc.status
      })
    }

    // 3. Seed Product Categories
    for (const pc of INITIAL_MOCK_PRODUCT_CATEGORIES) {
      this.productCategories.set(pc.id, {
        id: pc.id,
        nama: pc.nama,
        color: pc.color,
        status: pc.status
      })
    }

    // 4. Seed Purchase Units (Satuan Beli)
    for (const sb of INITIAL_MOCK_SATUAN_BELI) {
      this.purchaseUnits.set(sb.id, { id: sb.id, nama: sb.nama, status: sb.status })
    }
    for (const sb of MOCK_SATUAN_BELI) {
      if (!this.purchaseUnits.has(sb.id)) {
        this.purchaseUnits.set(sb.id, { id: sb.id, nama: sb.nama, status: 1 })
      }
    }

    // 5. Seed Usage Units (Satuan Pakai)
    for (const sp of INITIAL_MOCK_SATUAN_PAKAI) {
      this.usageUnits.set(sp.id, { id: sp.id, nama: sp.nama, satuan_beli_id: sp.satuan_beli_id })
    }
    for (const sp of MOCK_SATUAN_PAKAI) {
      if (!this.usageUnits.has(sp.id)) {
        this.usageUnits.set(sp.id, { id: sp.id, nama: sp.nama })
      }
    }

    // 6. Seed Product Units (Satuan Barang)
    for (const sbar of INITIAL_MOCK_SATUAN_BARANG) {
      this.productUnits.set(sbar.id, { id: sbar.id, nama: sbar.nama, status: sbar.status })
    }
  }

  // --- Dynamic Mutators called by corresponding Master Data Services ---
  syncFromLookups(lookups?: {
    warehouses?: Array<{ id: number; nama?: string | null; color?: string | null; status?: number | null }>
    buyUnits?: Array<{ id: number; nama?: string | null; kode?: string | null }>
    usageUnits?: Array<{ id: number; nama?: string | null; pembagi?: unknown; satuanBeliId?: number | null }>
  }): void {
    if (!lookups) return

    if (Array.isArray(lookups.warehouses)) {
      for (const w of lookups.warehouses) {
        if (w.id) {
          this.warehouses.set(w.id, {
            id: w.id,
            nama: w.nama || `Gudang #${w.id}`,
            color: w.color,
            status: w.status ?? 1
          })
        }
      }
    }

    if (Array.isArray(lookups.buyUnits)) {
      for (const b of lookups.buyUnits) {
        if (b.id) {
          this.purchaseUnits.set(b.id, {
            id: b.id,
            nama: b.nama || `Satuan #${b.id}`,
            status: 1
          })
        }
      }
    }

    if (Array.isArray(lookups.usageUnits)) {
      for (const u of lookups.usageUnits) {
        if (u.id) {
          this.usageUnits.set(u.id, {
            id: u.id,
            nama: u.nama || `Satuan #${u.id}`,
            satuan_beli_id: u.satuanBeliId
          })
        }
      }
    }
  }

  setWarehouse(warehouse: GenericReferenceItem): void {
    this.warehouses.set(warehouse.id, { ...warehouse })
  }

  removeWarehouse(id: number): void {
    this.warehouses.delete(Number(id))
  }

  setMaterialCategory(category: GenericReferenceItem): void {
    this.materialCategories.set(category.id, { ...category })
  }

  removeMaterialCategory(id: number): void {
    this.materialCategories.delete(Number(id))
  }

  setProductCategory(category: GenericReferenceItem): void {
    this.productCategories.set(category.id, { ...category })
  }

  removeProductCategory(id: number): void {
    this.productCategories.delete(Number(id))
  }

  setPurchaseUnit(unit: GenericReferenceItem): void {
    this.purchaseUnits.set(unit.id, { ...unit })
  }

  removePurchaseUnit(id: number): void {
    this.purchaseUnits.delete(Number(id))
  }

  setUsageUnit(unit: GenericReferenceItem): void {
    this.usageUnits.set(unit.id, { ...unit })
  }

  removeUsageUnit(id: number): void {
    this.usageUnits.delete(Number(id))
  }

  setProductUnit(unit: GenericReferenceItem): void {
    this.productUnits.set(unit.id, { ...unit })
  }

  removeProductUnit(id: number): void {
    this.productUnits.delete(Number(id))
  }

  // --- Standardized ReferenceService Contract (Async Dropdowns) ---
  async getWarehouses(): Promise<ReferenceOption[]> {
    return Array.from(this.warehouses.values()).map(w => ({
      value: w.id,
      label: w.nama || '',
      disabled: w.status === 0
    }))
  }

  async getMaterialCategories(): Promise<ReferenceOption[]> {
    return Array.from(this.materialCategories.values()).map(c => ({
      value: c.id,
      label: c.nama || '',
      disabled: c.status === 0
    }))
  }

  async getProductCategories(): Promise<ReferenceOption[]> {
    return Array.from(this.productCategories.values()).map(c => ({
      value: c.id,
      label: c.nama || '',
      disabled: c.status === 0
    }))
  }

  async getPurchaseUnits(): Promise<ReferenceOption[]> {
    return Array.from(this.purchaseUnits.values()).map(u => ({
      value: u.id,
      label: u.nama || '',
      disabled: u.status === 0
    }))
  }

  async getUsageUnits(): Promise<ReferenceOption[]> {
    return Array.from(this.usageUnits.values()).map(u => ({
      value: u.id,
      label: u.nama || ''
    }))
  }

  async getProductUnits(): Promise<ReferenceOption[]> {
    return Array.from(this.productUnits.values()).map(u => ({
      value: u.id,
      label: u.nama || '',
      disabled: u.status === 0
    }))
  }

  private cachedProvinces = new Map<number, Province>()
  private cachedCities = new Map<number, City>()

  async getProvinces(): Promise<Province[]> {
    const isMock = import.meta.env.MODE === 'test' || String(import.meta.env.VITE_USE_MOCK) === 'true'
    if (!isMock) {
      try {
        const { apiClient } = await import('./api-client')
        const res = await apiClient<Province[]>('/locations/provinces')
        if (Array.isArray(res.data) && res.data.length > 0) {
          for (const p of res.data) {
            this.cachedProvinces.set(p.id, p)
          }
          return res.data
        }
      } catch {
        // Fallback to seeds on network error
      }
    }

    for (const p of MOCK_PROVINCES) {
      this.cachedProvinces.set(p.id, p)
    }
    return [...MOCK_PROVINCES]
  }

  async getProvincesAsOptions(): Promise<ReferenceOption[]> {
    const list = await this.getProvinces()
    return list.map(p => ({ value: p.id, label: p.name }))
  }

  async getCities(provinceId?: number): Promise<City[]> {
    const isMock = import.meta.env.MODE === 'test' || String(import.meta.env.VITE_USE_MOCK) === 'true'
    if (!isMock) {
      try {
        const { apiClient } = await import('./api-client')
        const query = provinceId ? `?provinceId=${provinceId}` : ''
        const res = await apiClient<City[]>(`/locations/cities${query}`)
        if (Array.isArray(res.data) && res.data.length > 0) {
          for (const c of res.data) {
            this.cachedCities.set(c.id, c)
          }
          return res.data
        }
      } catch {
        // Fallback to seeds on network error
      }
    }

    const list =
      provinceId !== undefined && provinceId !== null
        ? MOCK_CITIES.filter(c => c.province_id === Number(provinceId))
        : [...MOCK_CITIES]

    for (const c of list) {
      this.cachedCities.set(c.id, c)
    }
    return list
  }

  async getCitiesAsOptions(provinceId?: number): Promise<ReferenceOption[]> {
    const list = await this.getCities(provinceId)
    return list.map(c => ({ value: c.id, label: c.name }))
  }

  // --- Legacy Compatibility Methods (Synchronous Lists for Existing Pages) ---
  async getGudangList(): Promise<Gudang[]> {
    return Array.from(this.warehouses.values()).map(w => ({ id: w.id, nama: w.nama || '' }))
  }

  async getSatuanPakaiList(): Promise<Satuan[]> {
    return Array.from(this.usageUnits.values()).map(u => ({ id: u.id, nama: u.nama || '' }))
  }

  async getSatuanBeliList(): Promise<Satuan[]> {
    return Array.from(this.purchaseUnits.values()).map(u => ({ id: u.id, nama: u.nama || '' }))
  }

  // --- Synchronous Lookup Helpers (Cache) ---
  getProvinceName(id?: number | null): string {
    if (!id) return '-'
    const cached = this.cachedProvinces.get(Number(id))
    if (cached) return cached.name
    const p = MOCK_PROVINCES.find(prov => prov.id === Number(id))
    return p ? p.name : String(id)
  }

  getCityName(id?: number | null): string {
    if (!id) return '-'
    const cached = this.cachedCities.get(Number(id))
    if (cached) return cached.name
    const c = MOCK_CITIES.find(city => city.id === Number(id))
    return c ? c.name : String(id)
  }

  getWarehouseName(id?: number | null): string {
    if (!id) return '-'
    const w = this.warehouses.get(Number(id))
    return w?.nama || String(id)
  }

  getGudangName(id?: number | null): string {
    return this.getWarehouseName(id)
  }

  getMaterialCategoryName(id?: number | null): string {
    if (!id) return '-'
    const c = this.materialCategories.get(Number(id))
    return c?.nama || String(id)
  }

  getProductCategoryName(id?: number | null): string {
    if (!id) return '-'
    const c = this.productCategories.get(Number(id))
    return c?.nama || String(id)
  }

  getPurchaseUnitName(id?: number | null): string {
    if (!id) return '-'
    const u = this.purchaseUnits.get(Number(id))
    return u?.nama || String(id)
  }

  getSatuanBeliName(id?: number | null): string {
    return this.getPurchaseUnitName(id)
  }

  getUsageUnitName(id?: number | null): string {
    if (!id) return '-'
    const u = this.usageUnits.get(Number(id))
    return u?.nama || String(id)
  }

  getSatuanPakaiName(id?: number | null): string {
    return this.getUsageUnitName(id)
  }

  getProductUnitName(id?: number | null): string {
    if (!id) return '-'
    const u = this.productUnits.get(Number(id))
    return u?.nama || String(id)
  }

  getSatuanBarangName(id?: number | null): string {
    return this.getProductUnitName(id)
  }

  findProvinceByName(name: string): Province | undefined {
    const norm = name.trim().toLowerCase()
    return MOCK_PROVINCES.find(p => p.name.toLowerCase() === norm)
  }

  findCityByName(name: string, provinceId?: number): City | undefined {
    const norm = name.trim().toLowerCase()
    return MOCK_CITIES.find(c => {
      const matchName = c.name.toLowerCase() === norm || c.name.toLowerCase().includes(norm)
      return provinceId ? matchName && c.province_id === provinceId : matchName
    })
  }

  findGudangByName(name: string): Gudang | undefined {
    const norm = name.trim().toLowerCase()
    for (const w of this.warehouses.values()) {
      const wNama = w.nama || ''
      if (wNama.toLowerCase() === norm || wNama.toLowerCase().includes(norm)) {
        return { id: w.id, nama: wNama }
      }
    }
    return undefined
  }

  findSatuanPakaiByName(name: string): Satuan | undefined {
    const norm = name.trim().toLowerCase()
    for (const u of this.usageUnits.values()) {
      const uNama = u.nama || ''
      if (uNama.toLowerCase() === norm) {
        return { id: u.id, nama: uNama }
      }
    }
    return undefined
  }

  findSatuanBeliByName(name: string): Satuan | undefined {
    const norm = name.trim().toLowerCase()
    for (const u of this.purchaseUnits.values()) {
      const uNama = u.nama || ''
      if (uNama.toLowerCase() === norm) {
        return { id: u.id, nama: uNama }
      }
    }
    return undefined
  }

  addGudang(nama: string): Gudang {
    const trimmed = nama.trim()
    if (!trimmed) {
      throw new Error('Nama gudang tidak boleh kosong.')
    }
    for (const w of this.warehouses.values()) {
      const wNama = w.nama || ''
      if (wNama.toLowerCase() === trimmed.toLowerCase()) {
        return { id: w.id, nama: wNama }
      }
    }

    const maxId = this.warehouses.size > 0 ? Math.max(...Array.from(this.warehouses.keys())) : 0
    const newId = maxId >= 1000 ? maxId + 1 : 1000
    const newGudang = { id: newId, nama: trimmed, status: 1 }
    this.warehouses.set(newId, newGudang)
    return { id: newId, nama: trimmed }
  }

  addSatuan(nama: string): Satuan {
    const trimmed = nama.trim()
    if (!trimmed) {
      throw new Error('Nama satuan tidak boleh kosong.')
    }

    let foundUsage: GenericReferenceItem | undefined
    for (const u of this.usageUnits.values()) {
      const uNama = u.nama || ''
      if (uNama.toLowerCase() === trimmed.toLowerCase()) {
        foundUsage = u
        break
      }
    }

    if (!foundUsage) {
      const maxId = this.usageUnits.size > 0 ? Math.max(...Array.from(this.usageUnits.keys())) : 0
      const newId = maxId + 1
      foundUsage = { id: newId, nama: trimmed }
      this.usageUnits.set(newId, foundUsage)
    }

    let foundPurchase: GenericReferenceItem | undefined
    for (const u of this.purchaseUnits.values()) {
      const uNama = u.nama || ''
      if (uNama.toLowerCase() === trimmed.toLowerCase()) {
        foundPurchase = u
        break
      }
    }

    if (!foundPurchase) {
      const maxId =
        this.purchaseUnits.size > 0 ? Math.max(...Array.from(this.purchaseUnits.keys())) : 0
      const newId = maxId + 1
      foundPurchase = { id: newId, nama: trimmed }
      this.purchaseUnits.set(newId, foundPurchase)
    }

    return { id: foundUsage.id, nama: foundUsage.nama || trimmed }
  }
}

export const referenceService = new ReferenceService()
