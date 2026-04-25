import { ref, computed } from 'vue'
import { getItem, setItem } from '../lib/storage'

const TOKEN_KEY = 'budget_token'
const API_URL = import.meta.env.VITE_API_URL ?? ''

const token = ref<string>(getItem<string>(TOKEN_KEY, ''))
const user = ref<{ id: string; email: string; name: string } | null>(null)

export const isLoggedIn = computed(() => !!token.value)
export const authUser = ref(user)
export const authToken = token

export function login() {
  window.location.href = `${API_URL}/auth/google`
}

export function logout() {
  token.value = ''
  user.value = null
  setItem(TOKEN_KEY, '')
}

export async function initAuth() {
  // Extract token from URL hash after OAuth redirect
  if (window.location.hash.includes('token=')) {
    const hash = window.location.hash.slice(1)
    const params = new URLSearchParams(hash)
    const t = params.get('token')
    if (t) {
      token.value = t
      setItem(TOKEN_KEY, t)
      history.replaceState(null, '', window.location.pathname)
    }
  }

  if (!token.value) return

  try {
    const resp = await fetch(`${API_URL}/api/v1/me`, {
      headers: { Authorization: `Bearer ${token.value}` },
    })
    if (!resp.ok) {
      logout()
      return
    }
    user.value = await resp.json()
  } catch {
    // Offline — keep existing token, user info unavailable until reconnected
  }
}
