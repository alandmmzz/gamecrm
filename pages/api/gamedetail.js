export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { title } = req.query
  if (!title) return res.status(400).json({ error: 'title required' })

  try {
    const apiKey = process.env.RAWG_API_KEY
    if (!apiKey) return res.status(200).json({ cover_url: null, description: null, genres: [], trailer_url: null })

    // Search for game
    const searchRes = await fetch(`https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(title)}&page_size=3`)
    const searchData = await searchRes.json()

    // Pick best match (exact title match preferred)
    const results = searchData.results || []
    const exact = results.find(g => g.name.toLowerCase() === title.toLowerCase())
    const game = exact || results[0]

    if (!game) return res.status(200).json({ cover_url: null, description: null, genres: [], trailer_url: null })

    // Fetch detail + movies in parallel
    const [detailRes, moviesRes] = await Promise.all([
      fetch(`https://api.rawg.io/api/games/${game.id}?key=${apiKey}`),
      fetch(`https://api.rawg.io/api/games/${game.id}/movies?key=${apiKey}`),
    ])

    const detail = await detailRes.json()
    const moviesData = await moviesRes.json()

    const rawDesc = detail.description_raw || detail.description || ''
    const description = rawDesc.replace(/<[^>]+>/g, '').trim() || null
    const genres = (detail.genres || []).map(g => g.name)
    const platforms = (detail.platforms || []).map(p => p.platform.name).slice(0, 5)
    const developers = (detail.developers || []).map(d => d.name)
    const publishers = (detail.publishers || []).map(p => p.name)
    const released = detail.released || null
    const rating = detail.rating || null
    const ratings_count = detail.ratings_count || 0

    // Get trailer — prefer mp4, fallback to YouTube search query
    let trailer_url = null
    let trailer_type = null // 'mp4' | 'youtube'
    const movies = moviesData.results || []
    if (movies.length > 0) {
      const mp4 = movies[0].data?.max || movies[0].data?.['480'] || null
      if (mp4) { trailer_url = mp4; trailer_type = 'mp4' }
    }
    // If no RAWG trailer, provide a YouTube search query as fallback
    if (!trailer_url) {
      trailer_url = `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' official trailer')}`
      trailer_type = 'youtube_search'
    }

    return res.status(200).json({
      rawg_id: game.id,
      cover_url: game.background_image || null,
      background_url: detail.background_image_additional || game.background_image || null,
      description,
      genres,
      platforms,
      developers,
      publishers,
      released,
      rating,
      ratings_count,
      trailer_url,
      trailer_type,
      metacritic: detail.metacritic || null,
      website: detail.website || null,
    })
  } catch (e) {
    return res.status(200).json({ cover_url: null, description: null, genres: [], trailer_url: null, error: e.message })
  }
}
