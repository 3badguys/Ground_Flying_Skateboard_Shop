import { ref } from 'vue'

const ACCESS_TOKEN_KEY = 'skateboard_access_token'
const REFRESH_TOKEN_KEY = 'skateboard_refresh_token'
const USER_KEY = 'skateboard_user'

export interface UserInfo {
  id: number
  username: string | null
  phone: string | null
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER'
  mustResetPassword: boolean
  createdAt: string
}

// ── Reactive user ref (shared across all components) ────────
export const currentUser = ref<UserInfo | null>(readUser())

function readUser(): UserInfo | null {
  try {
    const data = localStorage.getItem(USER_KEY)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

// ── Token helpers ───────────────────────────────────────────
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  currentUser.value = null
}

// ── User helpers ────────────────────────────────────────────
export function getUser(): UserInfo | null {
  return currentUser.value
}

export function setUser(user: UserInfo): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  currentUser.value = user
}

export function isLoggedIn(): boolean {
  return !!getAccessToken()
}

export function hasRole(...roles: string[]): boolean {
  return currentUser.value ? roles.includes(currentUser.value.role) : false
}
