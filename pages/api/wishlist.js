export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { steamid } = req.query
  if (!steamid) return res.status(400).json({ error: 'steamid required' })

  try {
    const r = await fetch(
      `https://store.steampowered.com/wishlist/profiles/${steamid}/wishlistdata/?p=0`,
      { headers: { 'Accept-Language': 'es-ES,es;q=0.9' } }
    )

    if (!r.ok) return res.status(200).json({ games: [], error: 'Perfil privado o no encontrado' })

    const data = await r.json()

    // data is { appid: { name, capsule, priority, ... }, ... }
    const games = Object.entries(data)
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
