export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { title } = req.query
  if (!title) return res.status(400).json({ error: 'title required' })

  try {
    const apiKey = process.env.RAWG_API_KEY
    if (!apiKey) return res.status(200).json({ cover_url: null, description: null, genres: [] })

    const searchRes = await fetch(`https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(title)}&page_size=1`)
    const searchData = await searchRes.json()
    const game = searchData.results?.[0]

    if (!game) return res.status(200).json({ cover_url: null, description: null, genres: [] })

    const detailRes = await fetch(`https://api.rawg.io/api/games/${game.id}?key=${apiKey}`)
    const detail = await detailRes.json()

    const rawDesc = detail.description_raw || detail.description || ''
    const description = rawDesc.replace(/<[^>]+>/g, '').slice(0, 300).trim() || null
    const genres = (detail.genres || []).map(g => g.name).slice(0, 4)

    return res.status(200).json({
      cover_url: game.background_image || null,
      description: description || null,
      genres,
    })
  } catch (e) {
    return res.status(200).json({ cover_url: null, description: null, genres: [] })
  }
}
