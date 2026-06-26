import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import api, { TOKEN_KEY } from '../api/client'

interface Admin {
  id: number
  name: string
  email: string
  phone?: string
  role?: string
}

interface AuthContextType {
  admin: Admin | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setAdmin: (admin: Admin) => void
  refetch: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = async () => {
    const token = (() => {
      try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
    })()
    if (!token) {
      setAdmin(null)
      return
    }
    try {
      const res = await api.get('/auth/admin/me')
      setAdmin(res.data.admin)
    } catch {
      setAdmin(null)
    }
  }

  useEffect(() => {
    refetch().finally(() => setLoading(false))
  }, [])

  const login = async (username: string, password: string) => {
    const res = await api.post('/auth/admin/login', { username, password })
    try {
      if (res.data.token) localStorage.setItem(TOKEN_KEY, res.data.token)
    } catch {
      /* ignore */
    }
    setAdmin(res.data.admin)
  }

  const logout = async () => {
    try {
      await api.post('/auth/admin/logout')
    } finally {
      try { localStorage.removeItem(TOKEN_KEY) } catch { /* ignore */ }
      setAdmin(null)
    }
  }

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, setAdmin, refetch }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
