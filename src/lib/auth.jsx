import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api, apiFetch } from './api'

const AuthContext = createContext(null)

const STORAGE_KEY = 'ilmconnect_session'
const USER_KEY = 'ilmconnect_user'
const VALID_ROLES = new Set(['admin', 'teacher', 'parent', 'student'])

function normalizeRole(role) {
  const normalized = String(role || '').trim().toLowerCase()
  return VALID_ROLES.has(normalized) ? normalized : ''
}

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
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

function buildAuthFallbackUser(userId, authUser = {}) {
  const userMetadata = authUser?.user_metadata || {}
  const appMetadata = authUser?.app_metadata || {}

  return {
    id: userId || authUser?.id || '',
    full_name: userMetadata.full_name || userMetadata.fullName || authUser?.email?.split('@')[0] || '',
    email: authUser?.email || '',
    role: normalizeRole(userMetadata.role || appMetadata.role),
    avatar_url: userMetadata.avatar_url || '',
  }
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

  const fetchProfile = useCallback(async (userId, authUser, accessToken) => {
    const fallback = buildAuthFallbackUser(userId, authUser)
    const data = await apiFetch(api.profile(userId), accessToken ? {
      headers: { Authorization: `Bearer ${accessToken}` },
    } : undefined).catch(() => ({ profile: null }))
    const profile = data?.profile || {}
    return {
      ...profile,
      id: fallback.id || profile.id,
      full_name: profile.full_name || fallback.full_name,
      email: profile.email || fallback.email,
      role: normalizeRole(profile.role || fallback.role),
      avatar_url: profile.avatar_url || fallback.avatar_url,
    }
  }, [])

  const applySession = useCallback(async (sess, userId, authUser) => {
    const profile = await fetchProfile(userId, authUser, sess?.access_token)
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
    await applySession(nextSession, userId, data?.user)
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
          await applySession(stored, data.user.id, data.user)
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
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    })
    const sess = data.session
    const userId = data?.user?.id
    if (!sess?.access_token || !userId) {
      throw new Error('Login failed')
    }
    return applySession(sess, userId, data?.user)
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
