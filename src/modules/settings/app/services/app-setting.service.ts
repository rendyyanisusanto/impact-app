import type { CrudService, ListQuery, PaginatedResponse } from '@/shared/types/crud.types'
import type {
  AppSetting,
  CreateAppSettingDto,
  UpdateAppSettingDto
} from '../types/app-setting.types'

export const INITIAL_MOCK_APP_SETTINGS: AppSetting[] = [
  {
    id: 3,
    id_setting_table: 3,
    table: 'master_data_suplier',
    name: 'kode',
    value: 'SUP/{last_number_status}',
    keterangan: 'Format nomor otomatis suplier'
  },
  {
    id: 4,
    id_setting_table: 4,
    table: 'master_data_suplier',
    name: 'template_excel',
    value: 'master_data_suplier.xlsx',
    keterangan: 'Nama berkas template impor Excel suplier'
  },
  {
    id: 5,
    id_setting_table: 5,
    table: 'master_data_suplier',
    name: 'start_row_excel',
    value: '4',
    keterangan: 'Baris awal pembacaan data Excel suplier'
  },
  {
    id: 6,
    id_setting_table: 6,
    table: 'master_data_bahan',
    name: 'kode',
    value: 'Bahan/{year}{month}-{rand}',
    keterangan: 'Format nomor otomatis bahan baku'
  },
  {
    id: 7,
    id_setting_table: 7,
    table: 'master_data_bahan',
    name: 'template_excel',
    value: 'master_data_bahan.xlsx',
    keterangan: 'Nama berkas template impor Excel bahan'
  },
  {
    id: 8,
    id_setting_table: 8,
    table: 'master_data_bahan',
    name: 'start_row_excel',
    value: '4',
    keterangan: 'Baris awal pembacaan data Excel bahan'
  },
  {
    id: 9,
    id_setting_table: 9,
    table: 'master_barang_jadi',
    name: 'kode',
    value: 'MSB/{rand}/{month}/{date}',
    keterangan: 'Format kode otomatis barang jadi'
  },
  {
    id: 10,
    id_setting_table: 10,
    table: 'produk',
    name: 'template_excel',
    value: 'produk.xlsx',
    keterangan: 'Nama berkas template impor Excel produk'
  },
  {
    id: 11,
    id_setting_table: 11,
    table: 'produk',
    name: 'start_row_excel',
    value: '4',
    keterangan: 'Baris awal pembacaan data Excel produk'
  },
  {
    id: 12,
    id_setting_table: 12,
    table: 'master_data_customer',
    name: 'kode',
    value: 'C{last_number_status}',
    keterangan: 'Format kode nomor customer'
  },
  {
    id: 13,
    id_setting_table: 13,
    table: 'master_data_customer',
    name: 'template_excel',
    value: 'master_data_customer.xlsx',
    keterangan: 'Nama berkas template impor customer'
  },
  {
    id: 14,
    id_setting_table: 14,
    table: 'master_data_customer',
    name: 'start_row_excel',
    value: '4',
    keterangan: 'Baris awal pembacaan data Excel customer'
  },
  {
    id: 15,
    id_setting_table: 15,
    table: 'gudang',
    name: 'kode',
    value: 'GD-{rand}',
    keterangan: 'Format kode acak nomor gudang'
  }
]

export class AppSettingService implements CrudService<
  AppSetting,
  CreateAppSettingDto,
  UpdateAppSettingDto
> {
  private items: AppSetting[] = []

  constructor() {
    this.reset()
  }

  reset(): void {
    this.items = JSON.parse(JSON.stringify(INITIAL_MOCK_APP_SETTINGS))
  }

  async list(query?: ListQuery): Promise<PaginatedResponse<AppSetting>> {
    return this.getAll(query)
  }

  async getAll(query?: ListQuery): Promise<PaginatedResponse<AppSetting>> {
    let result = [...this.items]

    if (query?.search) {
      const term = query.search.toLowerCase()
      result = result.filter(
        s =>
          s.table?.toLowerCase().includes(term) ||
          s.name?.toLowerCase().includes(term) ||
          s.value?.toLowerCase().includes(term) ||
          s.keterangan?.toLowerCase().includes(term)
      )
    }

    const filters = (query?.filters || {}) as Record<string, unknown>
    if (filters.table !== undefined && filters.table !== 'all') {
      result = result.filter(s => s.table === filters.table)
    }

    if (query?.sortBy) {
      const field = query.sortBy as keyof AppSetting
      const order = query.sortOrder === 'desc' ? -1 : 1
      result.sort((a, b) => {
        const valA = a[field] ?? ''
        const valB = b[field] ?? ''
        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * order
        }
        return String(valA).localeCompare(String(valB)) * order
      })
    } else {
      result.sort((a, b) => a.id - b.id)
    }

    const total = result.length
    const page = query?.page ?? 1
    const pageSize = query?.pageSize ?? 10
    const start = (page - 1) * pageSize
    const paged = result.slice(start, start + pageSize)

    return {
      data: paged,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }

  async getById(id: number): Promise<AppSetting> {
    const item = this.items.find(s => s.id === Number(id))
    if (!item) {
      throw new Error(`Setting dengan ID ${id} tidak ditemukan`)
    }
    return item
  }

  async create(dto: CreateAppSettingDto): Promise<AppSetting> {
    const nextId = this.items.length > 0 ? Math.max(...this.items.map(s => s.id)) + 1 : 1

    const newSetting: AppSetting = {
      id: nextId,
      id_setting_table: nextId,
      table: dto.table.trim(),
      name: dto.name.trim(),
      value: dto.value.trim(),
      keterangan: dto.keterangan?.trim() || null
    }

    this.items.push(newSetting)
    return newSetting
  }

  async update(id: number, dto: UpdateAppSettingDto): Promise<AppSetting> {
    const index = this.items.findIndex(s => s.id === Number(id))
    if (index === -1) {
      throw new Error(`Setting dengan ID ${id} tidak ditemukan`)
    }

    const current = this.items[index]
    const updated: AppSetting = {
      ...current,
      ...(dto.table !== undefined && { table: dto.table.trim() }),
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.value !== undefined && { value: dto.value.trim() }),
      ...(dto.keterangan !== undefined && { keterangan: dto.keterangan?.trim() || null })
    }

    this.items[index] = updated
    return updated
  }

  async delete(id: number): Promise<boolean> {
    const index = this.items.findIndex(s => s.id === Number(id))
    if (index === -1) {
      throw new Error(`Setting dengan ID ${id} tidak ditemukan`)
    }
    this.items.splice(index, 1)
    return true
  }

  async exportAll(query?: ListQuery): Promise<AppSetting[]> {
    const res = await this.getAll({ ...query, page: 1, pageSize: 100000 })
    return res.data
  }

  async importBatch(
    items: CreateAppSettingDto[]
  ): Promise<{ importedCount: number; imported: number; failed: number; errors: string[] }> {
    let imported = 0
    let failed = 0
    const errors: string[] = []

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      try {
        if (!item.table || !item.name || !item.value) {
          throw new Error(`Baris ${i + 1}: Table, Name, dan Value wajib diisi`)
        }
        await this.create(item)
        imported++
      } catch (err: unknown) {
        failed++
        errors.push((err as Error).message || `Baris ${i + 1} gagal diimpor`)
      }
    }

    return { importedCount: imported, imported, failed, errors }
  }
}

export const appSettingService = new AppSettingService()
