import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { friend_id, title, status, pct, hours_played, hltb_main, hltb_extra, hltb_complete, cover_url, description, started_at, finished_at } = req.body
    if (!friend_id || !title) return res.status(400).json({ error: 'friend_id and title required' })

    const { data, error } = await supabase
      .from('games')
      .insert({ friend_id, title, status: status || 'playing', pct: pct || 0, hours_played: hours_played || 0, hltb_main: hltb_main || null, hltb_extra: hltb_extra || null, hltb_complete: hltb_complete || null, cover_url: cover_url || null, description: description || null, started_at: started_at || null, finished_at: finished_at || null })
      .select().single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  if (req.method === 'PATCH') {
    const { id, ...updates } = req.body
    if (!id) return res.status(400).json({ error: 'id required' })
    const { data, error } = await supabase.from('games').update(updates).eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id required' })
    const { error } = await supabase.from('games').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  res.status(405).end()
}