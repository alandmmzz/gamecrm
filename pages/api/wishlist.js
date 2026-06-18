import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function fetchFromSteam(steamid) {
  const key = process.env.STEAM_API_KEY

  // Try official API first
  if (key) {
    try {
      const r = await fetch(`https://api.steampowered.com/IWishlistService/GetWishlist/v1/?key=${key}&steamid=${steamid}`)
      const data = await r.json()
      const items = data.response?.items || []
      if (items.length > 0) {
        return items.map(item => ({
          appid: String(item.appid),
          title: item.name || `App ${item.appid}`,
          cover_url: `https://cdn.cloudflare.steamstatic.com/steam/apps/${item.appid}/header.jpg`,
          priority: item.priority || 999,
        })).sort((a, b) => a.priority - b.priority).slice(0, 100)
      }
    } catch {}
  }

  // Fallback to public endpoint
  const r2 = await fetch(
    `https://store.steampowered.com/wishlist/profiles/${steamid}/wishlistdata/?p=0`,
    { headers: { 'Accept-Language': 'es-ES,es;q=0.9', 'Accept': 'application/json' } }
  )
  const text = await r2.text()
  if (!text || text.trim().startsWith('<')) return null
  const data2 = JSON.parse(text)
  return Object.entries(data2).map(([appid, info]) => ({
    appid,
    title: info.name,
    cover_url: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`,
    priority: info.priority || 999,
  })).sort((a, b) => a.priority - b.priority).slice(0, 100)
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { steamid, friend_id, stored_only } = req.query
  if (!steamid && !friend_id) return res.status(400).json({ error: 'steamid or friend_id required' })

  // If stored_only, just return from DB
  if (stored_only && friend_id) {
    const { data } = await supabase.from('wishlist_games').select('*').eq('friend_id', friend_id).order('created_at')
    return res.status(200).json({ games: data || [] })
  }

  try {
    const games = await fetchFromSteam(steamid)

    if (!games) {
      // Return stored games if Steam fails
      if (friend_id) {
        const { data } = await supabase.from('wishlist_games').select('*').eq('friend_id', friend_id)
        if (data?.length) return res.status(200).json({ games: data, cached: true })
      }
      return res.status(200).json({ games: [], error: 'Wishlist privada o no encontrada. Asegurate que "Detalles de los juegos" esté en Público en Steam.' })
    }

    // Sync to Supabase if friend_id provided
    if (friend_id && games.length > 0) {
      // Delete old and insert new
      await supabase.from('wishlist_games').delete().eq('friend_id', friend_id)
      const rows = games.map(g => ({
        friend_id,
        appid: g.appid,
        title: g.title,
        cover_url: g.cover_url,
      }))
      await supabase.from('wishlist_games').insert(rows)
    }

    return res.status(200).json({ games })
  } catch (e) {
    return res.status(200).json({ games: [], error: e.message })
  }
}
