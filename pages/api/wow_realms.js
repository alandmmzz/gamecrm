export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { region = 'us', search } = req.query

  try {
    const creds = Buffer.from(`${process.env.BLIZZARD_CLIENT_ID}:${process.env.BLIZZARD_CLIENT_SECRET}`).toString('base64')
    const tokenRes = await fetch('https://oauth.battle.net/token', {
      method: 'POST',
      headers: { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials'
    })
    const tokenData = await tokenRes.json()
    const token = tokenData.access_token
    if (!token) return res.status(500).json({ error: 'No token' })

    const r = await fetch(`https://${region}.api.blizzard.com/data/wow/realm/index?namespace=dynamic-${region}&locale=en_US&access_token=${token}`)
    const data = await r.json()
    let realms = data.realms || []

    if (search) {
      const q = search.toLowerCase().replace(/[\s''-]/g, '')
      realms = realms.filter(r => r.name.toLowerCase().replace(/[\s''-]/g, '').includes(q) || r.slug.includes(q))
    }

    return res.status(200).json(realms.map(r => ({ name: r.name, slug: r.slug })))
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
