const KEY = 'budget_data'
const TOKEN_KEY = 'budget_token'
const API_URL = import.meta.env.VITE_API_URL ?? ''

function getToken(): string {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    return raw ? JSON.parse(raw) : ''
  } catch {
    return ''
  }
}

export async function getStorage<T>(fallback: T): Promise<T> {
  const token = getToken()
  if (token) {
    try {
      const resp = await fetch(`${API_URL}/api/v1/budget`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (resp.ok) {
        const data = await resp.json()
        if (data && Object.keys(data).length > 0) return data as T
      }
    } catch {
      // Offline — fall through to localStorage
    }
  }

  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function setStorageLocal<T>(value: T): void {
  localStorage.setItem(KEY, JSON.stringify(value))
}

export function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}
