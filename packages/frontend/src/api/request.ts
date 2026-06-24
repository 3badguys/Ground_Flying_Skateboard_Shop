import axios from 'axios'
import { ElMessage } from 'element-plus'
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from '../utils/auth'

// Capacitor: use __API_BASE__ (full URL for remote API)
// Browser:   use VITE_BASE + api (relative, matches nginx location)
const apiBase = (window as any).Capacitor
  ? ((window as any).__API_BASE__ || '/api')
  : `${import.meta.env.BASE_URL}api`

const request = axios.create({
  baseURL: apiBase,
  timeout: 30000,
})

// ── Request interceptor: attach access token ─────────────────
request.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Refresh token lock (prevents concurrent refresh calls) ───
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const token = getRefreshToken()
      if (!token) throw new Error('No refresh token')

      // Use raw axios to avoid interceptor loops
      const res = await axios.post(
        `${apiBase}/auth/refresh`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      )
      const data = res.data
      if (data.code !== 0) throw new Error(data.message)

      const accessToken: string = data.data.accessToken
      setTokens(accessToken, token!)
      return accessToken
    } catch {
      clearTokens()
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

// ── Response interceptor: unwrap data + handle 401 ───────────
request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code !== 0) {
      ElMessage.error(res.message || 'Request failed')
      return Promise.reject(new Error(res.message))
    }
    return res.data
  },
  async (error) => {
    const originalRequest = error.config

    // 401 — try refresh token
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/')
    ) {
      originalRequest._retry = true
      const newToken = await refreshAccessToken()

      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return request(originalRequest)
      }

      // Refresh failed — redirect to login
      clearTokens()
      const router = (await import('../router')).default
      router.push('/login')
      return Promise.reject(error)
    }

    const message =
      error.response?.data?.message || error.message || 'Network error'
    ElMessage.error(message)
    return Promise.reject(error)
  },
)

export default request
