import { HowLongToBeatService, HowLongToBeatEntry } from 'howlongtobeat'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { q } = req.query
  if (!q || q.length < 2) return res.status(400).json({ error: 'query too short' })

  try {
    const hltbService = new HowLongToBeatService()
    const results = await hltbService.search(q)

    if (!results || !results.length) return res.status(200).json([])

    const games = results.slice(0, 4).map(g => ({
      title: g.name,
      main: g.gameplayMain > 0 ? Math.round(g.gameplayMain * 10) / 10 : null,
      extra: g.gameplayMainExtra > 0 ? Math.round(g.gameplayMainExtra * 10) / 10 : null,
      complete: g.gameplayCompletionist > 0 ? Math.round(g.gameplayCompletionist * 10) / 10 : null,
    }))

    return res.status(200).json(games)
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
