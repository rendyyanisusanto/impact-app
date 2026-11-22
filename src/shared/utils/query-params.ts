export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  }

  const str = searchParams.toString()
  return str ? `?${str}` : ''
}

export function parseQueryString(queryString: string): Record<string, string> {
  const search = queryString.startsWith('?') ? queryString.substring(1) : queryString
  const searchParams = new URLSearchParams(search)
  const result: Record<string, string> = {}

  searchParams.forEach((val, key) => {
    result[key] = val
  })

  return result
}
