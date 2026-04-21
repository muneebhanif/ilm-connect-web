import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api, apiFetch } from './api'

const AuthContext = createContext(null)

const STORAGE_KEY = 'ilmconnect_session'
const USER_KEY = 'ilmconnect_user'

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function loadUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function saveSession(session) {
  if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  else localStorage.removeItem(STORAGE_KEY)
}

function saveUser(user) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  else localStorage.removeItem(USER_KEY)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  const clearAuth = useCallback(() => {
    setUser(null)
    setSession(null)
    saveSession(null)
    saveUser(null)
  }, [])

  const fetchProfile = useCallback(async (userId) => {
    const data = await apiFetch(api.profile(userId))
    const profile = data?.profile || {}
    return {
      ...profile,
      id: profile.id || userId,
      full_name: profile.full_name || '',
      email: profile.email || '',
      role: profile.role || '',
      avatar_url: profile.avatar_url || '',
    }
  }, [])

  const applySession = useCallback(async (sess, userId) => {
    const profile = await fetchProfile(userId)
    setSession(sess)
    setUser(profile)
    saveSession(sess)
    saveUser(profile)
    return profile
  }, [fetchProfile])

  const refreshSession = useCallback(async (refreshToken) => {
    const data = await apiFetch(api.refreshToken(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    const nextSession = data?.session
    const userId = data?.user?.id
    if (!nextSession?.access_token || !userId) {
      throw new Error('Unable to refresh session')
    }
    await applySession(nextSession, userId)
    return nextSession
  }, [applySession])

  // Restore session on mount
  useEffect(() => {
    const stored = loadSession()
    if (!stored?.access_token) {
      clearAuth()
      setLoading(false)
      return
    }

    // Verify the token is still valid
    fetch(api.verifySession(), {
      headers: { Authorization: `Bearer ${stored.access_token}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error('verify-failed')
        return r.json()
      })
      .then(async (data) => {
        if (data.valid && data.user?.id) {
          await applySession(stored, data.user.id)
        } else {
          throw new Error('invalid-session')
        }
      })
      .catch(async () => {
        if (stored?.refresh_token) {
          try {
            await refreshSession(stored.refresh_token)
            return
          } catch {
            clearAuth()
          }
        } else {
          clearAuth()
        }
      })
      .finally(() => setLoading(false))
  }, [applySession, clearAuth, refreshSession])

  const login = async (email, password) => {
    const data = await apiFetch(api.login(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const sess = data.session
    const userId = data?.user?.id
    if (!sess?.access_token || !userId) {
      throw new Error('Login failed')
    }
    return applySession(sess, userId)
  }

  const signup = async (role, body) => {
    const endpoints = {
      parent: api.signupParent(),
      teacher: api.signupTeacher(),
      student: api.signupStudent(),
    }
    const data = await apiFetch(endpoints[role], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return data
  }

  const logout = () => {
    clearAuth()
  }

  const token = session?.access_token || null

  return (
    <AuthContext.Provider value={{ user, token, session, loading, login, signup, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
