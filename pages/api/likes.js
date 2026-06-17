import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  // POST /api/likes — toggle like or dislike
  // body: { review_id, friend_id, type: 'like'|'dislike' }
  if (req.method === 'POST') {
    const { review_id, friend_id, type } = req.body
    if (!review_id || !friend_id || !type) {
      return res.status(400).json({ error: 'review_id, friend_id and type required' })
    }

    // Check if already exists
    const { data: existing } = await supabase
      .from('review_likes')
      .select('id, type')
      .eq('review_id', review_id)
      .eq('friend_id', friend_id)
      .single()

    if (existing) {
      if (existing.type === type) {
        // Same type — remove (toggle off)
        await supabase.from('review_likes').delete().eq('id', existing.id)
        return res.status(200).json({ action: 'removed', type })
      } else {
        // Different type — switch
        await supabase.from('review_likes').update({ type }).eq('id', existing.id)
        return res.status(200).json({ action: 'switched', type })
      }
    }

    // New like
    await supabase.from('review_likes').insert({ review_id, friend_id, type })
    return res.status(201).json({ action: 'added', type })
  }

  res.status(405).end()
}
