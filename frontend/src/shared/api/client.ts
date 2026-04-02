const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export const toAssetUrl = (path?: string | null) => (path ? `${API_BASE}${path}` : '')

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  const response = await fetch(`${API_BASE}${path}`, { ...init, headers })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Request failed (${response.status})`)
  }

  return (await response.json()) as T
}
