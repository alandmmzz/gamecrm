export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { genres } = req.body
  if (!genres?.length) return res.status(400).json({ error: 'genres required' })

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 60,
        messages: [{ role: 'user', content: `Creá UN título de rol épico y creativo (máximo 4 palabras en español) para un gamer cuyos géneros favoritos son: ${genres.join(', ')}. Solo devolvé el título, sin explicación ni comillas ni puntos.` }]
      })
    })
    const d = await r.json()
    const title = d.content?.[0]?.text?.trim()
    return res.status(200).json({ title: title || null })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
