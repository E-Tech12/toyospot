// Thin fetch wrapper for the FastAPI backend. Handles attaching the access
// token, retrying once with a refreshed token on 401, and normalizing
// errors so callers can just `await` and catch.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const ACCESS_KEY = 'toyospot_access_token'
const REFRESH_KEY = 'toyospot_refresh_token'

export function getTokens() {
  return {
    accessToken: localStorage.getItem(ACCESS_KEY),
    refreshToken: localStorage.getItem(REFRESH_KEY)
  }
}

export function setTokens({ access_token, refresh_token }) {
  if (access_token) localStorage.setItem(ACCESS_KEY, access_token)
  if (refresh_token) localStorage.setItem(REFRESH_KEY, refresh_token)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export class ApiError extends Error {
  constructor(message, status, detail) {
    super(message)
    this.status = status
    this.detail = detail
  }
}

let refreshPromise = null

async function refreshAccessToken() {
  const { refreshToken } = getTokens()
  if (!refreshToken) throw new ApiError('Not authenticated', 401)

  // Coalesce concurrent 401s into a single refresh call.
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    })
      .then(async (res) => {
        if (!res.ok) throw new ApiError('Session expired', res.status)
        const data = await res.json()
        setTokens(data)
        return data
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

/**
 * @param {string} path - e.g. '/foods' or '/orders/123'
 * @param {object} options - { method, body, auth } - auth defaults to true
 */
export async function apiFetch(path, { method = 'GET', body, auth = true, retry = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const { accessToken } = getTokens()
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  })

  if (res.status === 401 && auth && retry) {
    try {
      await refreshAccessToken()
      return apiFetch(path, { method, body, auth, retry: false })
    } catch {
      clearTokens()
      throw new ApiError('Session expired, please log in again.', 401)
    }
  }

  if (res.status === 204) return null

  let data = null
  try {
    data = await res.json()
  } catch {
    // no JSON body
  }

  if (!res.ok) {
    const message = data?.detail || data?.message || `Request failed (${res.status})`
    throw new ApiError(typeof message === 'string' ? message : 'Request failed', res.status, data)
  }

  return data
}

export const api = {
  get: (path) => apiFetch(path, { method: 'GET' }),
  post: (path, body, opts = {}) => apiFetch(path, { method: 'POST', body, ...opts }),
  patch: (path, body) => apiFetch(path, { method: 'PATCH', body }),
  del: (path) => apiFetch(path, { method: 'DELETE' })
}

export { API_BASE_URL }

export function getWsBaseUrl() {
  return API_BASE_URL.replace(/^http/, 'ws')
}
