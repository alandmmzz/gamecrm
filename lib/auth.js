import { supabase } from './supabase'

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function signOut() {
  await supabase.auth.signOut()
}

// Check if user has a linked profile — returns profile or null
export async function getProfile(session) {
  if (!session) return null

  const { data: existing } = await supabase
    .from('friends')
    .select('*')
    .eq('user_id', session.user.id)
    .single()

  return existing || null
}
