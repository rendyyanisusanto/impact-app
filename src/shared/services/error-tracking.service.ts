import type { App } from 'vue'
import { apiClient } from './api-client'

interface CapturedClientError {
  message: string
  stackTrace?: string
  errorType?: string
  pageUrl?: string
  component?: string
  metadata?: Record<string, unknown>
}

// In-memory set to prevent spamming identical errors in quick succession
const reportedFingerprints = new Map<string, number>()
const THROTTLE_MS = 30000 // 30 seconds

function getErrorFingerprint(msg: string, stack?: string): string {
  const norm = (msg + (stack || '')).slice(0, 150)
  return norm
}

export async function reportClientError(payload: CapturedClientError): Promise<void> {
  const fp = getErrorFingerprint(payload.message, payload.stackTrace)
  const now = Date.now()
  const lastReported = reportedFingerprints.get(fp)

  if (lastReported && now - lastReported < THROTTLE_MS) {
    return
  }
  reportedFingerprints.set(fp, now)

  try {
    await apiClient('/client-errors', {
      method: 'POST',
      body: JSON.stringify({
        message: payload.message,
        stackTrace: payload.stackTrace || null,
        errorType: payload.errorType || 'ClientError',
        pageUrl: payload.pageUrl || (typeof window !== 'undefined' ? window.location.href : null),
        module: 'frontend',
        context: {
          component: payload.component,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          screenResolution: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : null,
          ...payload.metadata
        }
      })
    })
  } catch {
    // Fail silently to avoid cascade loop
  }
}

export function initGlobalErrorTracking(app: App): void {
  if (typeof window === 'undefined') return

  // 1. Vue Global Error Handler
  const prevErrorHandler = app.config.errorHandler
  app.config.errorHandler = (err, instance, info) => {
    if (prevErrorHandler) {
      prevErrorHandler(err, instance, info)
    }

    const message = err instanceof Error ? err.message : String(err)
    const stackTrace = err instanceof Error ? err.stack : undefined
    const component = instance?.$options?.name || instance?.$options?.__name || 'UnknownComponent'

    reportClientError({
      message,
      stackTrace,
      errorType: 'VueError',
      component,
      metadata: { vueLifecycleHook: info }
    })
  }

  // 2. Global Uncaught Script Error
  window.addEventListener('error', (event: ErrorEvent) => {
    // Ignore harmless browser extension errors
    if (event.filename && event.filename.includes('extension://')) return

    const message = event.message || (event.error instanceof Error ? event.error.message : 'Unknown Script Error')
    const stackTrace = event.error instanceof Error ? event.error.stack : undefined

    reportClientError({
      message,
      stackTrace,
      errorType: 'UncaughtError',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    })
  })

  // 3. Global Unhandled Promise Rejection
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reason = event.reason
    const message = reason instanceof Error ? reason.message : String(reason || 'Unhandled Promise Rejection')
    const stackTrace = reason instanceof Error ? reason.stack : undefined

    reportClientError({
      message,
      stackTrace,
      errorType: 'UnhandledRejection'
    })
  })
}

