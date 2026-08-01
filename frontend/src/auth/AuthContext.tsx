/**
 * React auth context — provides authentication state and methods.
 *
 * Session is persisted by Supabase (localStorage) so it survives page refresh.
 * tokenStore keeps an in-memory copy of the access token for API calls.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from './supabaseClient'
import { clearTokens, getAccessToken, setTokens } from './tokenStore'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string
  email: string
  role: string
}

export interface AuthContextValue {
  user: AuthUser | null
  workspaceId: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  selectWorkspace: (id: string) => void
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null)

// Workspace ID persistence key
const WS_KEY = 'innova_workspace_id'

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [workspaceId, setWorkspaceId] = useState<string | null>(() => {
    // Restore workspace from localStorage on mount
    try { return localStorage.getItem(WS_KEY) } catch { return null }
  })
  const [isLoading, setIsLoading] = useState(true)
  // Track whether initial session check is done
  const initialised = useRef(false)

  // ── Session → user state ─────────────────────────────────────────────────

  const applySession = useCallback(
    (session: {
      access_token: string
      refresh_token: string
      user: { id: string; email?: string | null }
    } | null) => {
      if (!session) {
        clearTokens()
        setUser(null)
        return
      }
      setTokens(session.access_token, session.refresh_token)
      // Decode role from JWT payload
      let role = 'Viewer'
      try {
        const payload = JSON.parse(atob(session.access_token.split('.')[1]))
        role = (payload.role as string | undefined)
          ?? (payload.app_metadata?.role as string | undefined)
          ?? 'Viewer'
      } catch {
        // Malformed token — keep default role
      }
      setUser({
        id: session.user.id,
        email: session.user.email ?? '',
        role,
      })
    },
    []
  )

  // ── Subscribe to Supabase auth state ─────────────────────────────────────

  useEffect(() => {
    // Initial session check (handles page refresh + OAuth callback)
    supabase.auth.getSession().then(({ data }) => {
      applySession(data.session)
      setIsLoading(false)
      initialised.current = true
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Only apply state changes after initial check to avoid race conditions
        if (initialised.current) {
          applySession(session)
        }
      }
    )

    return () => { subscription.unsubscribe() }
  }, [applySession])

  // ── Auth methods ─────────────────────────────────────────────────────────

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data.session) applySession(data.session)
  }, [applySession])

  const register = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }, [])

  const logout = useCallback(async () => {
    const token = getAccessToken()
    if (token) await supabase.auth.signOut()
    clearTokens()
    setUser(null)
    setWorkspaceId(null)
    try { localStorage.removeItem(WS_KEY) } catch { /* ignore */ }
  }, [])

  const selectWorkspace = useCallback((id: string) => {
    setWorkspaceId(id)
    try { localStorage.setItem(WS_KEY, id) } catch { /* ignore */ }
  }, [])

  // ── Context value ────────────────────────────────────────────────────────

  const value: AuthContextValue = {
    user,
    workspaceId,
    isAuthenticated: user !== null,
    isLoading,
    login,
    register,
    logout,
    selectWorkspace,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
