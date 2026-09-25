import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authApi } from '../lib/endpoints'
import { setTokens, clearTokens, getTokens, ApiError } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const { accessToken } = getTokens()
    if (!accessToken) {
      setIsLoading(false)
      return
    }
    authApi
      .me()
      .then((u) => {
        if (u.role !== 'admin') {
          clearTokens()
          setUser(null)
        } else {
          setUser(u)
        }
      })
      .catch(() => {
        clearTokens()
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password)
    if (data.user.role !== 'admin') {
      throw new ApiError('This account does not have admin access.', 403)
    }
    setTokens(data)
    setUser(data.user)
  }, [])

  const logout = useCallback(async () => {
    const { refreshToken } = getTokens()
    try {
      if (refreshToken) await authApi.logout(refreshToken)
    } catch {
      // best-effort
    }
    clearTokens()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
