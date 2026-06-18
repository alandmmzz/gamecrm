async function getBlizzardToken() {
  const creds = Buffer.from(`${process.env.BLIZZARD_CLIENT_ID}:${process.env.BLIZZARD_CLIENT_SECRET}`).toString('base64')
  const r = await fetch('https://oauth.battle.net/token', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  })
  const d = await r.json()
  return d.access_token
}

async function resolveRealmSlug(region, realmName, token) {
  // Strategy 1: query Blizzard realm index
  try {
    const locale = region === 'eu' ? 'es_ES' : 'en_US'
    const searchRes = await fetch(
      `https://${region}.api.blizzard.com/data/wow/realm/index?namespace=dynamic-${region}&locale=${locale}&access_token=${token}`
    )
    const searchData = await searchRes.json()
    const realms = searchData.realms || []
    const normalize = s => s.toLowerCase().replace(/[\s'`'''\-]/g, '')
    const match = realms.find(r =>
      normalize(r.name) === normalize(realmName) ||
      normalize(r.slug) === normalize(realmName)
    )
    if (match) return match.slug
  } catch {}

  // Strategy 2: spaces→hyphens, remove apostrophes (quel'thalas → quel-thalas)
  return realmName.toLowerCase().replace(/[''']/g, '').replace(/\s+/g, '-')
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { character, realm, region = 'us' } = req.query
  if (!character || !realm) return res.status(400).json({ error: 'character and realm required' })

  if (!process.env.BLIZZARD_CLIENT_ID) return res.status(500).json({ error: 'Blizzard API not configured' })

  try {
    const token = await getBlizzardToken()
    if (!token) return res.status(500).json({ error: 'No se pudo autenticar con Blizzard. Verificá las credenciales.' })
    const base = `https://${region}.api.blizzard.com`
    const charSlug = character.toLowerCase()
    const realmSlug = await resolveRealmSlug(region, realm, token)
    const locale = region === 'eu' ? 'es_ES' : 'en_US'
    const q = `?namespace=profile-${region}&locale=${locale}&access_token=${token}`

    // Fetch character summary
    const summaryUrl = `${base}/profile/wow/character/${realmSlug}/${charSlug}${q}`
    console.log('[WoW API] fetching:', summaryUrl.replace(token, 'TOKEN'))
    const [summaryRes, equipRes, raidsRes] = await Promise.all([
      fetch(summaryUrl),
      fetch(`${base}/profile/wow/character/${realmSlug}/${charSlug}/equipment${q}`),
      fetch(`${base}/profile/wow/character/${realmSlug}/${charSlug}/encounters/raids${q}`),
    ])
    const summaryText = await summaryRes.text()
    console.log('[WoW API] status:', summaryRes.status, 'body:', summaryText.slice(0,300))

    if (!summaryText || summaryText.trim() === '') {
      return res.status(500).json({ error: `HTTP ${summaryRes.status} — respuesta vacía de Blizzard. URL: /profile/wow/character/${realmSlug}/${charSlug}` })
    }

    let summary
    try { summary = JSON.parse(summaryText) }
    catch (e) { return res.status(500).json({ error: `Respuesta inválida de Blizzard (HTTP ${summaryRes.status}): ${summaryText.slice(0,200)}` }) }

    if (summary.code === 404 || summary.code === 403 || summary.status === 404) {
      return res.status(404).json({ error: `Personaje no encontrado. Realm: "${realmSlug}", Char: "${charSlug}". Respuesta: ${JSON.stringify(summary).slice(0,150)}` })
    }

    let equip = {}, raids = {}
    try { equip = await equipRes.json() } catch {}
    try { raids = await raidsRes.json() } catch {}

    // Get current raid progress (latest expansion)
    let raidProgress = null
    if (raids.expansions) {
      const latest = raids.expansions[raids.expansions.length - 1]
      if (latest?.instances) {
        raidProgress = latest.instances.map(inst => {
          const mythic = inst.modes?.find(m => m.difficulty?.type === 'MYTHIC')
          const heroic = inst.modes?.find(m => m.difficulty?.type === 'HEROIC')
          const normal = inst.modes?.find(m => m.difficulty?.type === 'NORMAL')
          const best = mythic || heroic || normal
          return {
            name: inst.instance?.name,
            progress: best ? `${best.progress?.completed_count || 0}/${best.progress?.total_count || 0}` : null,
            difficulty: best?.difficulty?.type?.toLowerCase() || null,
          }
        }).filter(r => r.progress)
      }
    }

    return res.status(200).json({
      name: summary.name,
      realm: summary.realm?.name,
      region: region.toUpperCase(),
      level: summary.level,
      race: summary.race?.name,
      class: summary.character_class?.name,
      spec: summary.active_spec?.name,
      ilvl: summary.equipped_item_level,
      avatar: summary.media?.assets?.find(a => a.key === 'avatar')?.value || null,
      raid_progress: raidProgress,
      achievement_points: summary.achievement_points,
      faction: summary.faction?.name,
    })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
