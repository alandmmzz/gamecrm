import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  // GET /api/reviews — all reviews, or ?game_title=X for a specific game
  if (req.method === 'GET') {
    const { game_title } = req.query
    let query = supabase
      .from('reviews')
      .select('*, friend:friends(id, name, avatar_url), review_likes(id, friend_id, type)')
      .order('created_at', { ascending: false })

    if (game_title) {
      query = query.ilike('game_title', game_title)
    }

    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data || [])
  }

  // POST /api/reviews — create or update (upsert by friend_id + game_title)
  if (req.method === 'POST') {
    const { friend_id, game_title, game_cover, rating, comment, no_apto_angelitos } = req.body
    if (!friend_id || !game_title || !rating) {
      return res.status(400).json({ error: 'friend_id, game_title and rating required' })
    }

    const { data, error } = await supabase
      .from('reviews')
      .upsert(
        { friend_id, game_title, game_cover: game_cover || null, rating, comment: comment || null, no_apto_angelitos: no_apto_angelitos || false },
        { onConflict: 'friend_id,game_title' }
      )
      .select('*, friend:friends(id, name, avatar_url)')
      .single()

    if (error) return res.status(500).json({ error: error.message })

    // Notify friends who have this game in their library
    const { data: friendsWithGame } = await supabase
      .from('games')
      .select('friend_id')
      .ilike('title', game_title)
      .neq('friend_id', friend_id)

    if (friendsWithGame?.length) {
      const notifs = friendsWithGame.map(g => ({
        to_friend_id: g.friend_id,
        from_friend_id: friend_id,
        type: 'review_on_your_game',
        review_id: data.id,
        game_title,
      }))
      await supabase.from('notifications').insert(notifs)
    }

    // Notify friends who have this game in their wishlist
    const { data: friendsWithWishlist } = await supabase
      .from('wishlist_games')
      .select('friend_id')
      .ilike('title', game_title)
      .neq('friend_id', friend_id)

    if (friendsWithWishlist?.length) {
      const wishlistNotifs = friendsWithWishlist
        .filter(w => !friendsWithGame?.find(g => g.friend_id === w.friend_id)) // avoid double notif
        .map(w => ({
          to_friend_id: w.friend_id,
          from_friend_id: friend_id,
          type: 'review_on_wishlist',
          review_id: data.id,
          game_title,
        }))
      if (wishlistNotifs.length) await supabase.from('notifications').insert(wishlistNotifs)
    }

    return res.status(201).json(data)
  }

  // DELETE /api/reviews?id=xxx
  if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id required' })
    const { error } = await supabase.from('reviews').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  res.status(405).end()
}
