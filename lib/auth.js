import { supabase } from './supabase'

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function signOut() {
  await supabase.auth.signOut()
}

// Get or create a friend profile linked to the authenticated user
export async function getOrCreateProfile(session) {
  if (!session) return null

  const userId = session.user.id
  const name = session.user.user_metadata?.name || 
               session.user.user_metadata?.full_name ||
               session.user.user_metadata?.login ||
               session.user.email?.split('@')[0] ||
               'Usuario'
  const username = session.user.user_metadata?.login ||
                   session.user.user_metadata?.preferred_username ||
                   session.user.email?.split('@')[0] ||
                   userId.slice(0, 8)
  const avatarUrl = session.user.user_metadata?.avatar_url || null

  // Check if user already has a linked friend
  const { data: existing } = await supabase
    .from('friends')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (existing) return existing

  // Create new friend profile
  const { data: created } = await supabase
    .from('friends')
    .insert({ 
      name, 
      username, 
      user_id: userId,
      avatar_url: avatarUrl,
    })
    .select()
    .single()

  return created
}
