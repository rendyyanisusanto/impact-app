import { ApiError, type ApiErrorCode } from './api-error'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
const TOKEN_KEY = 'smm_access_token'

export function getAuthToken(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export interface ApiResponseWrapper<T> {
  data: T
  meta?: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  } | null
  message?: string
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponseWrapper<T>> {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  }

  const token = getAuthToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err
    }
    if ((err as Error)?.name === 'AbortError') {
      throw err
    }
    throw new ApiError({
      code: 'NETWORK_ERROR',
      message: err instanceof Error ? err.message : 'Koneksi ke server backend terputus.'
    })
  }

  let body: Record<string, unknown> | null = null
  try {
    body = (await response.json()) as Record<string, unknown>
  } catch {
    body = null
  }

  if (!response.ok || (body && body.success === false)) {
    const message =
      typeof body?.message === 'string'
        ? body.message
        : response.statusText || 'Terjadi kesalahan pada request API.'
    const status = response.status
    let code: ApiErrorCode = 'SERVER_ERROR'
    if (status === 401) code = 'UNAUTHORIZED'
    else if (status === 403) code = 'FORBIDDEN'
    else if (status === 404) code = 'NOT_FOUND'
    else if (status === 400 || status === 422) code = 'VALIDATION_ERROR'

    throw new ApiError({
      code,
      message,
      fieldErrors: body?.errors as Record<string, string[]> | undefined,
      status
    })
  }

  return {
    data: (body?.data !== undefined ? body.data : body) as T,
    meta: body?.meta as ApiResponseWrapper<T>['meta'],
    message: typeof body?.message === 'string' ? body.message : undefined
  }
}
