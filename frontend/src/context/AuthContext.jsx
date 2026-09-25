import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authApi } from '../lib/endpoints'
import { setTokens, clearTokens, getTokens } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // On first load, if we have a stored access token, verify it's still
  // valid (and pick up a refreshed one transparently via apiFetch's 401
  // retry) by fetching the current user.
  useEffect(() => {
    const { accessToken } = getTokens()
    if (!accessToken) {
      setIsLoading(false)
      return
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => {
        clearTokens()
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password)
    setTokens(data)
    setUser(data.user)
    return { ok: true }
  }, [])

  const signup = useCallback(async ({ firstName, lastName, email, phone, password }) => {
    await authApi.register({ first_name: firstName, last_name: lastName, email, phone, password })
    return { ok: true, pendingEmail: email, firstName, lastName }
  }, [])

  const resendOtp = useCallback(async (email) => {
    await authApi.resendOtp(email)
    return { ok: true }
  }, [])

  const verifyOtp = useCallback(async ({ email, code }) => {
    const data = await authApi.verifyOtp(email, code)
    setTokens(data)
    setUser(data.user)
    return { ok: true }
  }, [])

  const logout = useCallback(async () => {
    const { refreshToken } = getTokens()
    try {
      if (refreshToken) await authApi.logout(refreshToken)
    } catch {
      // Best-effort: clear local state regardless of whether the server call succeeded.
    }
    clearTokens()
    setUser(null)
  }, [])

  const forgotPassword = useCallback(async (email) => {
    await authApi.forgotPassword(email)
    return { ok: true }
  }, [])

  const resetPassword = useCallback(async (email, code, newPassword) => {
    await authApi.resetPassword(email, code, newPassword)
    return { ok: true }
  }, [])

  const refreshUser = useCallback(async () => {
    const fresh = await authApi.me()
    setUser(fresh)
    return fresh
  }, [])

  const updateProfile = useCallback(async (patch) => {
    const updated = await authApi.updateMe({
      first_name: patch.first_name,
      last_name: patch.last_name,
      phone: patch.phone
    })
    setUser(updated)
    return updated
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        resendOtp,
        verifyOtp,
        logout,
        forgotPassword,
        resetPassword,
        refreshUser,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
