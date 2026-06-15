import { supabase } from '../../lib/supabase'

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
    const { name, username, user_id } = req.body
    if (!name) return res.status(400).json({ error: 'name required' })

    const { data, error } = await supabase
      .from('friends')
      .insert({ name, username: username || name.toLowerCase().replace(/\s+/g, '_'), user_id: user_id || null })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  if (req.method === 'PATCH') {
    const { id, avatar_url, name, user_id } = req.body
    if (!id) return res.status(400).json({ error: 'id required' })
    const patch = {}
    if (avatar_url !== undefined) patch.avatar_url = avatar_url
    if (name) patch.name = name
    if (user_id !== undefined) patch.user_id = user_id
    const { data, error } = await supabase.from('friends').update(patch).eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }


  if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id required' })
    const { error } = await supabase.from('friends').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  res.status(405).end()
}
