import { ref, computed } from 'vue'
import { getItem, setItem } from '../lib/storage'

const TOKEN_KEY = 'budget_token'
const API_URL = import.meta.env.VITE_API_URL ?? ''

const token = ref<string>(getItem<string>(TOKEN_KEY, ''))
export const authUser = ref<{ id: string; email: string; name: string } | null>(null)

export const isLoggedIn = computed(() => !!token.value)
export const authToken = token

export function login() {
  window.location.href = `${API_URL}/auth/google`
}

export function logout() {
  token.value = ''
  authUser.value = null
  setItem(TOKEN_KEY, '')
}

export async function initAuth() {
  // Exchange one-time auth_code for JWT after OAuth redirect
  const params = new URLSearchParams(window.location.search)
  const code = params.get('auth_code')
  if (code) {
    try {
      const resp = await fetch(`${API_URL}/auth/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      if (resp.ok) {
        const { token: t } = await resp.json()
        token.value = t
        setItem(TOKEN_KEY, t)
      }
    } catch {
      // Exchange failed — proceed without token
    }
    history.replaceState(null, '', window.location.pathname)
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
    authUser.value = await resp.json()
  } catch {
    // Offline — keep existing token, user info unavailable until reconnected
  }
}
