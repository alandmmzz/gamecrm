export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { genres, gender } = req.body
  if (!genres?.length) return res.status(400).json({ error: 'genres required' })

  const genderHint = gender === 'female'
    ? 'El título debe estar en femenino (ej: "Reina", "Cazadora", "Maestra").'
    : gender === 'male'
    ? 'El título debe estar en masculino (ej: "Rey", "Cazador", "Maestro").'
    : 'El título puede ser neutro o no marcado en género.'

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
        messages: [{ role: 'user', content: `Creá UN título de rol épico y creativo (máximo 4 palabras en español) para un gamer cuyos géneros favoritos son: ${genres.join(', ')}. ${genderHint} Solo devolvé el título, sin explicación ni comillas ni puntos.` }]
      })
    })
    const d = await r.json()
    const title = d.content?.[0]?.text?.trim()
    return res.status(200).json({ title: title || null })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
