import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  // GET /api/notifications?friend_id=xxx
  if (req.method === 'GET') {
    const { friend_id } = req.query
    if (!friend_id) return res.status(400).json({ error: 'friend_id required' })

    const { data, error } = await supabase
      .from('notifications')
      .select('*, from_friend:friends!notifications_from_friend_id_fkey(id, name, avatar_url)')
      .eq('to_friend_id', friend_id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data || [])
  }

  // POST /api/notifications — create one
  if (req.method === 'POST') {
    const { to_friend_id, from_friend_id, type, review_id, game_title } = req.body
    if (!to_friend_id || !from_friend_id || !type) {
      return res.status(400).json({ error: 'to_friend_id, from_friend_id, type required' })
    }
    // Don't notify yourself
    if (to_friend_id === from_friend_id) return res.status(200).json({ ok: true })

    // Avoid duplicate unread notifications of same type for same review
    if (review_id) {
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('to_friend_id', to_friend_id)
        .eq('from_friend_id', from_friend_id)
        .eq('type', type)
        .eq('review_id', review_id)
        .eq('read', false)
        .single()
      if (existing) return res.status(200).json({ ok: true, skipped: true })
    }

    const { error } = await supabase.from('notifications').insert({
      to_friend_id, from_friend_id, type, review_id: review_id || null, game_title: game_title || null
    })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json({ ok: true })
  }

  // PATCH /api/notifications — mark all as read for a friend
  if (req.method === 'PATCH') {
    const { friend_id } = req.body
    if (!friend_id) return res.status(400).json({ error: 'friend_id required' })
    await supabase.from('notifications').update({ read: true }).eq('to_friend_id', friend_id).eq('read', false)
    return res.status(200).json({ ok: true })
  }

  res.status(405).end()
}
