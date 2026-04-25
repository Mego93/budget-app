import { ref } from 'vue'
import { getItem, setItem, setStorageLocal } from '../lib/storage'

const TOKEN_KEY = 'budget_token'
const API_URL = import.meta.env.VITE_API_URL ?? ''

export const syncStatus = ref<'idle' | 'syncing' | 'error'>('idle')

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function getToken(): string {
  return getItem<string>(TOKEN_KEY, '')
}

async function pushToAPI(data: unknown, attempt = 1): Promise<void> {
  const token = getToken()
  if (!token) return

  try {
    syncStatus.value = 'syncing'
    const resp = await fetch(`${API_URL}/api/v1/budget`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (resp.ok) {
      syncStatus.value = 'idle'
    } else if (resp.status === 401) {
      setItem(TOKEN_KEY, '')
      syncStatus.value = 'idle'
    } else {
      throw new Error(`HTTP ${resp.status}`)
    }
  } catch {
    if (attempt < 3) {
      setTimeout(() => pushToAPI(data, attempt + 1), 2000 * attempt)
    } else {
      syncStatus.value = 'error'
    }
  }
}

export function queueSync(data: unknown): void {
  // Always write to localStorage immediately
  setStorageLocal(data)

  if (!getToken()) return

  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    pushToAPI(data)
  }, 800)
}
