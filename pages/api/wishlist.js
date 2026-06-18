export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { steamid } = req.query
  if (!steamid) return res.status(400).json({ error: 'steamid required' })

  const key = process.env.STEAM_API_KEY

  try {
    // Try official Steam API first (requires API key, returns owned wishlist)
    if (key) {
      const r = await fetch(
        `https://api.steampowered.com/IWishlistService/GetWishlist/v1/?key=${key}&steamid=${steamid}`
      )
      const data = await r.json()
      const items = data.response?.items || []

      if (items.length > 0) {
        const games = items.map(item => ({
          appid: String(item.appid),
          title: item.name || `App ${item.appid}`,
          cover_url: `https://cdn.cloudflare.steamstatic.com/steam/apps/${item.appid}/header.jpg`,
          priority: item.priority || 999,
        })).sort((a, b) => a.priority - b.priority).slice(0, 100)

        return res.status(200).json({ games })
      }
    }

    // Fallback to public endpoint
    const r2 = await fetch(
      `https://store.steampowered.com/wishlist/profiles/${steamid}/wishlistdata/?p=0`,
      { headers: { 'Accept-Language': 'es-ES,es;q=0.9', 'Accept': 'application/json' } }
    )
    const text = await r2.text()
    if (!text || text.trim().startsWith('<')) {
      return res.status(200).json({ games: [], error: 'Wishlist privada o no encontrada. Asegurate que "Detalles de los juegos" esté en Público en Steam.' })
    }
    const data2 = JSON.parse(text)
    const games = Object.entries(data2)
      .map(([appid, info]) => ({
        appid,
        title: info.name,
        cover_url: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`,
        priority: info.priority || 999,
      }))
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 100)

    return res.status(200).json({ games })
  } catch (e) {
    return res.status(200).json({ games: [], error: e.message })
  }
}
