export class ServiceConfigurationError extends Error {
  constructor(serviceName: string) {
    super(
      `Service "${serviceName}" tidak dapat diinisialisasi dalam mode HTTP: Adapter backend NestJS belum diimplementasikan untuk Sprint 1. Aktifkan mock mode dengan VITE_USE_MOCK=true.`
    )
    this.name = 'ServiceConfigurationError'
    Object.setPrototypeOf(this, ServiceConfigurationError.prototype)
  }
}

export function isMockModeEnabled(): boolean {
  // In unit test environment, always enable mock mode
  if (import.meta.env?.MODE === 'test') {
    return true
  }
  // If explicitly set to 'false', mock mode is disabled
  const envVal = import.meta.env?.VITE_USE_MOCK
  if (String(envVal).toLowerCase() === 'false') {
    return false
  }
  return true
}

export function createService<T>(
  serviceName: string,
  mockFactory: () => T,
  httpFactory?: () => T
): T {
  if (isMockModeEnabled()) {
    return mockFactory()
  }

  if (httpFactory) {
    return httpFactory()
  }

  throw new ServiceConfigurationError(serviceName)
}
