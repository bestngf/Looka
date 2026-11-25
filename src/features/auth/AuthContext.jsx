import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

// session : undefined = chargement, null = déconnecté.
// profileStatus : 'loading' | 'ready' | 'empty' | 'error'
export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)
  const [profileStatus, setProfileStatus] = useState('loading')

  const loadProfile = useCallback(async (userId) => {
    if (!userId) { setProfile(null); setProfileStatus('empty'); return }
    setProfileStatus('loading')
    const { data, error } = await supabase
      .from('lokaa_profiles').select('id, full_name, phone, city, account_type, username').eq('id', userId).maybeSingle()
    if (error) { setProfileStatus('error'); return }
    setProfile(data)
    setProfileStatus(data ? 'ready' : 'empty')
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null)).catch(() => setSession(null))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s ?? null))
    return () => sub.subscription.unsubscribe()
  }, [])

  const userId = session?.user?.id
  useEffect(() => { if (session !== undefined) loadProfile(userId) }, [userId, session === undefined, loadProfile])

  const signOut = () => supabase.auth.signOut()
  const refreshProfile = () => loadProfile(userId)

  return <Ctx.Provider value={{ session, user: session?.user ?? null, profile, profileStatus, refreshProfile, signOut }}>{children}</Ctx.Provider>
}
