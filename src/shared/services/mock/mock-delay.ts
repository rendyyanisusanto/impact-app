let globalMockLatency = typeof process !== 'undefined' && process.env.NODE_ENV === 'test' ? 0 : 150

export function setGlobalMockLatency(ms: number): void {
  globalMockLatency = Math.max(0, ms)
}

export function getGlobalMockLatency(): number {
  return globalMockLatency
}

export async function simulateDelay(customLatencyMs?: number): Promise<void> {
  const ms = customLatencyMs !== undefined ? Math.max(0, customLatencyMs) : globalMockLatency
  if (ms > 0) {
    await new Promise(resolve => setTimeout(resolve, ms))
  }
}
