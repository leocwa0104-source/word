import { create } from "zustand"

type AuthUser = {
  username: string
}

type AuthState = {
  isReady: boolean
  user: AuthUser | null
  token: string | null
  bootstrap: () => Promise<void>
  register: (input: { username: string; password: string }) => Promise<{ ok: true } | { ok: false; error: string }>
  login: (input: { username: string; password: string }) => Promise<{ ok: true } | { ok: false; error: string }>
  logout: () => Promise<void>
}

const STORAGE_KEY = "word.auth.v1"

function saveSession(session: { token: string; user: AuthUser } | null) {
  if (!session) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

function loadSession(): { token: string; user: AuthUser } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as any
    if (!v?.token || typeof v.token !== "string") return null
    if (!v?.user?.username || typeof v.user.username !== "string") return null
    return { token: v.token, user: { username: v.user.username } }
  } catch {
    return null
  }
}

async function postJson<T>(url: string, body: unknown, token?: string | null): Promise<T> {
  const headers: Record<string, string> = { "content-type": "application/json" }
  if (token) headers.authorization = `Bearer ${token}`
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) })
  const json = (await res.json()) as T
  return json
}

async function getJson<T>(url: string, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {}
  if (token) headers.authorization = `Bearer ${token}`
  const res = await fetch(url, { method: "GET", headers })
  const json = (await res.json()) as T
  return json
}

export const useAuthStore = create<AuthState>((set, get) => {
  return {
    isReady: false,
    user: null,
    token: null,
    bootstrap: async () => {
      const cached = loadSession()
      if (!cached) {
        set({ isReady: true, user: null, token: null })
        return
      }
      try {
        const me = await getJson<{ success: boolean; user?: AuthUser }>("/api/auth/me", cached.token)
        if (!me.success || !me.user?.username) {
          saveSession(null)
          set({ isReady: true, user: null, token: null })
          return
        }
        saveSession({ token: cached.token, user: { username: me.user.username } })
        set({ isReady: true, user: { username: me.user.username }, token: cached.token })
      } catch {
        saveSession(null)
        set({ isReady: true, user: null, token: null })
      }
    },
    register: async ({ username, password }) => {
      try {
        const r = await postJson<{ success: boolean; token?: string; user?: AuthUser; error?: string }>(
          "/api/auth/register",
          { username, password },
        )
        if (!r.success || !r.token || !r.user?.username) return { ok: false, error: r.error || "register_failed" }
        saveSession({ token: r.token, user: { username: r.user.username } })
        set({ user: { username: r.user.username }, token: r.token })
        return { ok: true }
      } catch {
        return { ok: false, error: "network_error" }
      }
    },
    login: async ({ username, password }) => {
      try {
        const r = await postJson<{ success: boolean; token?: string; user?: AuthUser; error?: string }>(
          "/api/auth/login",
          { username, password },
        )
        if (!r.success || !r.token || !r.user?.username) return { ok: false, error: r.error || "login_failed" }
        saveSession({ token: r.token, user: { username: r.user.username } })
        set({ user: { username: r.user.username }, token: r.token })
        return { ok: true }
      } catch {
        return { ok: false, error: "network_error" }
      }
    },
    logout: async () => {
      const { token } = get()
      saveSession(null)
      set({ user: null, token: null })
      if (!token) return
      try {
        await postJson("/api/auth/logout", {}, token)
      } catch {
        return
      }
    },
  }
})

