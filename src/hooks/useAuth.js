import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { migrateFromLocalStorage } from '../lib/migrate'

export function useAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!cancelled) {
        setSession(s)
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setLoading(false)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) return
    migrateFromLocalStorage(userId).catch(err => {
      console.warn('Migrace z localStorage selhala:', err)
    })
  }, [session?.user?.id])

  const signIn = useCallback(async (email, password) => {
    setAuthError(null)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setAuthError(error.message)
      return { error }
    }
    return { data }
  }, [])

  const signUp = useCallback(async (email, password) => {
    setAuthError(null)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setAuthError(error.message)
      return { error }
    }
    // Bez potvrzovacího e-mailu (Auth → Providers → Email → Confirm email OFF)
    // je session hned k dispozici. Jinak uživatel zůstane na přihlášení.
    if (!data.session) {
      setAuthError(
        'Účet je vytvořen, ale chybí session. V Supabase vypni Confirm email (Authentication → Providers → Email).'
      )
    }
    return { data }
  }, [])

  const signOut = useCallback(async () => {
    setAuthError(null)
    await supabase.auth.signOut()
  }, [])

  return {
    session,
    user: session?.user ?? null,
    loading,
    authError,
    setAuthError,
    signIn,
    signUp,
    signOut,
  }
}
