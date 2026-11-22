import type { ApiResponse } from '@/shared/types/api.types'

export interface MockAdapterOptions {
  latencyMs?: number
  shouldFail?: boolean
  errorMessage?: string
}

const DEFAULT_LATENCY = process.env.NODE_ENV === 'test' ? 0 : 200

export async function simulateApiCall<T>(
  data: T,
  options?: MockAdapterOptions
): Promise<ApiResponse<T>> {
  const latency = options?.latencyMs ?? DEFAULT_LATENCY

  if (latency > 0) {
    await new Promise(resolve => setTimeout(resolve, latency))
  }

  if (options?.shouldFail) {
    throw new Error(options.errorMessage || 'Terjadi kesalahan pada server (simulasi)')
  }

  return {
    success: true,
    data
  }
}
