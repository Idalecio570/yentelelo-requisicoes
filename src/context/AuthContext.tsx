import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import type { Profile } from "@/types"

export interface AuthContextValue {
  session:         Session | null
  user:            User | null
  profile:         Profile | null
  loading:         boolean
  profileLoading:  boolean
  isAuthenticated: boolean
  signOut:         () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  // Efeito 1: sessão inicial — define loading=false assim que a resposta chega
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
  }, [])

  // Efeito 2: reage a mudanças de sessão (callback síncrono — sem await)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setSession(session)
        if (!session) setProfile(null)
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  // Efeito 3: carrega o perfil sempre que o userId muda
  // session?.user?.id é primitivo (string) — estável enquanto o utilizador não muda
  useEffect(() => {
    const userId = session?.user?.id
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!userId) { setProfile(null); return }
    setProfileLoading(true)
    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        setProfile(data ?? null)
        setProfileLoading(false)
      })
  }, [session?.user?.id])

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user:            session?.user ?? null,
    profile,
    loading,
    profileLoading,
    isAuthenticated: !!session,
    signOut,
  }), [session, profile, loading, profileLoading, signOut])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/** Hook interno — use `useAuth` (de hooks/useAuth.ts) nos componentes da app */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuthContext deve ser usado dentro de AuthProvider")
  return ctx
}
