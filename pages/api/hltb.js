export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { q } = req.query
  if (!q || q.length < 2) return res.status(400).json({ error: 'query too short' })

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
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: `You are a HowLongToBeat assistant. The user searched for: "${q}".

Return ONLY a JSON array (no markdown, no extra text) of up to 4 matching games, ordered by relevance — the closest match to the search query MUST be first. Each item: {"title":"exact game title","main":N,"extra":N,"complete":N}. Hours as numbers. Use your knowledge of typical HowLongToBeat playtimes. If unsure about hours, estimate. Return only the JSON array.`,
        }],
      }),
    })

    const data = await response.json()
    const text = data.content?.find(b => b.type === 'text')?.text || '[]'
    const clean = text.replace(/```json|```/g, '').trim()
    let games = []
    try { games = JSON.parse(clean) } catch { games = [] }
    return res.status(200).json(games)
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
