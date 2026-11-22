export type ApiErrorCode =
  | 'NETWORK_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR'

export interface ApiErrorPayload {
  code: ApiErrorCode
  message: string
  fieldErrors?: Record<string, string[]>
  status?: number
}

export class ApiError extends Error implements ApiErrorPayload {
  public code: ApiErrorCode
  public fieldErrors?: Record<string, string[]>
  public status?: number

  constructor(payload: ApiErrorPayload) {
    super(payload.message)
    this.name = 'ApiError'
    this.code = payload.code
    this.fieldErrors = payload.fieldErrors
    this.status = payload.status
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}

export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error
  }

  if (error instanceof Error) {
    return new ApiError({
      code: 'UNKNOWN_ERROR',
      message: error.message
    })
  }

  if (typeof error === 'string') {
    return new ApiError({
      code: 'UNKNOWN_ERROR',
      message: error
    })
  }

  return new ApiError({
    code: 'UNKNOWN_ERROR',
    message: 'Terjadi kesalahan sistem yang tidak terduga.'
  })
}
