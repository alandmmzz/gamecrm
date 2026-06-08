export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { game, description, hltb_main, hltb_extra, hltb_complete } = req.body
  if (!game || !description) return res.status(400).json({ error: 'game and description required' })

  const hltbInfo = hltb_main
    ? `HowLongToBeat data: main story ${hltb_main}h, extras ${hltb_extra}h, completionist ${hltb_complete}h.`
    : ''

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
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `The player is playing "${game}". ${hltbInfo}
They describe their progress: "${description}"

Based on this, estimate:
1. Completion percentage (0-100)
2. Hours already played (approximate)
3. Hours remaining to finish main story

Reply ONLY with JSON, no markdown: {"pct": N, "hours_played": N, "hours_remaining": N, "reasoning": "one short sentence"}`,
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
