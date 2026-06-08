export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { title } = req.query
  if (!title) return res.status(400).json({ error: 'title required' })

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `For the video game "${title}", return ONLY a JSON object (no markdown) with:
- "description": a 2-3 sentence spoiler-free description of the game
- "cover_url": a working direct image URL to the game's cover art from a reliable public source (try: https://www.igdb.com/games, or use the Steam CDN if it's a Steam game like https://cdn.cloudflare.steamstatic.com/steam/apps/APPID/header.jpg with the correct app ID, or any other reliable public URL). If you're not confident about the URL being real and working, set it to null.

Return only valid JSON: {"description":"...","cover_url":"...or null"}`,
        }],
      }),
    })

    const data = await response.json()
    const text = data.content?.find(b => b.type === 'text')?.text || '{}'
    const clean = text.replace(/```json|```/g, '').trim()
    let result = {}
    try { result = JSON.parse(clean) } catch { result = {} }
    return res.status(200).json(result)
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
