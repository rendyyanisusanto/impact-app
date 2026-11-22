import { apiClient } from './api-client'
import type { CrudService, ListQuery, PaginatedResponse } from '@/shared/types/crud.types'

export interface ApiCrudOptions<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transformItem?: (item: any) => T
}

export function createApiCrudService<T extends { id: number }, CreateDto = unknown, UpdateDto = unknown>(
  endpoint: string,
  options?: ApiCrudOptions<T>
): CrudService<T, CreateDto, UpdateDto> & {
  getAll: (query?: ListQuery) => Promise<PaginatedResponse<T>>
} {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transform = options?.transformItem ?? ((x: any) => x as T)

  return {
    async list(query?: ListQuery): Promise<PaginatedResponse<T>> {
      return this.getAll(query)
    },

    async getAll(query?: ListQuery): Promise<PaginatedResponse<T>> {
      const params = new URLSearchParams()
      if (query?.page) params.append('page', String(query.page))
      if (query?.pageSize) params.append('pageSize', String(query.pageSize))
      if (query?.search) params.append('search', query.search)
      if (query?.sortBy) params.append('sortBy', query.sortBy)
      if (query?.sortOrder) params.append('sortOrder', query.sortOrder)
      if (query?.status !== undefined && query.status !== 'all' && query.status !== '') {
        params.append('status', String(query.status))
      }

      if (query) {
        for (const [key, value] of Object.entries(query)) {
          if (
            !['page', 'pageSize', 'search', 'sortBy', 'sortOrder', 'status'].includes(key) &&
            value !== undefined &&
            value !== null &&
            value !== ''
          ) {
            params.append(key, String(value))
          }
        }
      }

      const queryString = params.toString() ? `?${params.toString()}` : ''
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await apiClient<any[]>(`${endpoint}${queryString}`)

      const totalItems = res.meta?.totalItems ?? res.data.length
      const page = res.meta?.page ?? query?.page ?? 1
      const pageSize = res.meta?.pageSize ?? query?.pageSize ?? 10
      const totalPages = res.meta?.totalPages ?? (Math.ceil(totalItems / pageSize) || 1)

      return {
        data: res.data.map(transform),
        total: totalItems,
        page,
        pageSize,
        totalPages
      }
    },

    async getById(id: number): Promise<T> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await apiClient<any>(`${endpoint}/${id}`)
      return transform(res.data)
    },

    async create(payload: CreateDto): Promise<T> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await apiClient<any>(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      return transform(res.data)
    },

    async update(id: number, payload: UpdateDto): Promise<T> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await apiClient<any>(`${endpoint}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      })
      return transform(res.data)
    },

    async delete(id: number): Promise<boolean> {
      await apiClient<{ id: number }>(`${endpoint}/${id}`, {
        method: 'DELETE'
      })
      return true
    },

    async exportAll(query?: ListQuery): Promise<T[]> {
      const res = await this.getAll({ ...query, page: 1, pageSize: 100000 })
      return res.data
    },

    async importBatch(items: CreateDto[]) {
      let imported = 0
      let failed = 0
      const errors: string[] = []

      for (let i = 0; i < items.length; i++) {
        try {
          await this.create(items[i])
          imported++
        } catch (err: unknown) {
          failed++
          errors.push((err as Error).message || `Baris ${i + 1} gagal diimpor`)
        }
      }

      return { importedCount: imported, imported, failed, errors }
    }
  }
}
