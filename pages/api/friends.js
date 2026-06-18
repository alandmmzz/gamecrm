import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('friends')
      .select(`
        *,
        games (*)
      `)
      .order('name')

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { name, username, user_id, gender } = req.body
    if (!name) return res.status(400).json({ error: 'name required' })

    const { data, error } = await supabase
      .from('friends')
      .insert({ name, username: username || name.toLowerCase().replace(/\s+/g, '_'), user_id: user_id || null, gender: gender || null })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  if (req.method === 'PATCH') {
    const { id, avatar_url, name, user_id, role_title, steam_id, wow_character, wow_realm, wow_region } = req.body
    if (!id) return res.status(400).json({ error: 'id required' })
    const patch = {}
    if (avatar_url !== undefined) patch.avatar_url = avatar_url
    if (name) patch.name = name
    if (user_id !== undefined) patch.user_id = user_id
    if (role_title !== undefined) patch.role_title = role_title
    if (steam_id !== undefined) patch.steam_id = steam_id
    if (wow_character !== undefined) patch.wow_character = wow_character
    if (wow_realm !== undefined) patch.wow_realm = wow_realm
    if (wow_region !== undefined) patch.wow_region = wow_region
    const { data, error } = await supabase.from('friends').update(patch).eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }


  if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id required' })
    // Delete games first
    await supabase.from('games').delete().eq('friend_id', id)
    const { error } = await supabase.from('friends').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  res.status(405).end()
}
