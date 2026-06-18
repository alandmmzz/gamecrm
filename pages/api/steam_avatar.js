export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const { steamid } = req.query
  if (!steamid) return res.status(400).json({ error: 'steamid required' })

  const key = process.env.STEAM_API_KEY
  if (!key) return res.status(500).json({ error: 'no key' })

  try {
    const r = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${key}&steamids=${steamid}`)
    const d = await r.json()
    const player = d.response?.players?.[0]
    return res.status(200).json({
      avatar: player?.avatarfull || null,
      username: player?.personaname || null,
    })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
