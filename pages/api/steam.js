export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { steamid } = req.query
  if (!steamid) return res.status(400).json({ error: 'steamid required' })

  const key = process.env.STEAM_API_KEY
  if (!key) return res.status(500).json({ error: 'STEAM_API_KEY not configured' })

  try {
    // Resolve vanity URL to steamid64 if needed
    let resolvedId = steamid
    if (!/^\d{17}$/.test(steamid)) {
      const vanity = steamid.replace(/.*\/id\/([^/]+)\/?$/, '$1').replace(/.*\/profiles\/(\d+)\/?$/, '$1')
      if (!/^\d{17}$/.test(vanity)) {
        const r = await fetch(`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${key}&vanityurl=${encodeURIComponent(vanity)}`)
        const d = await r.json()
        if (d.response?.success !== 1) return res.status(404).json({ error: 'Usuario de Steam no encontrado. Asegurate que el perfil sea público.' })
        resolvedId = d.response.steamid
      } else {
        resolvedId = vanity
      }
    }

    // GetRecentlyPlayedGames gives rtime_last_played for recent ones
    // GetOwnedGames with include_appinfo gives rtime_last_played too
    const gamesRes = await fetch(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${key}&steamid=${resolvedId}&include_appinfo=true&include_played_free_games=true&format=json`
    )
    const gamesData = await gamesRes.json()

    if (!gamesData.response?.games) {
      return res.status(404).json({ error: 'No se encontraron juegos. El perfil debe ser público.' })
    }

    const toISODate = (ts) => {
      if (!ts || ts === 0) return null
      return new Date(ts * 1000).toISOString().slice(0, 10)
    }

    const games = gamesData.response.games
      .filter(g => g.playtime_forever > 0)
      .sort((a, b) => (b.rtime_last_played || 0) - (a.rtime_last_played || 0))
      .map(g => ({
        title: g.name,
        hours_played: Math.round(g.playtime_forever / 60 * 10) / 10,
        cover_url: `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/header.jpg`,
        appid: g.appid,
        last_played: toISODate(g.rtime_last_played),
      }))

    return res.status(200).json({ games, total: games.length })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
