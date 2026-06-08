import { useState, useEffect } from 'react'
import Head from 'next/head'

const COLORS = ['purple', 'teal', 'coral', 'blue', 'amber']
const COLOR_MAP = {
  purple: { bg: 'bg-purple-900/40', text: 'text-purple-300' },
  teal:   { bg: 'bg-teal-900/40',   text: 'text-teal-300' },
  coral:  { bg: 'bg-orange-900/40', text: 'text-orange-300' },
  blue:   { bg: 'bg-blue-900/40',   text: 'text-blue-300' },
  amber:  { bg: 'bg-amber-900/40',  text: 'text-amber-300' },
}
const initials = (n) => n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)

export default function Home() {
  const [friends, setFriends] = useState([])
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('friends')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [expandedGames, setExpandedGames] = useState({})

  // Friend form
  const [fName, setFName] = useState('')
  const [fUser, setFUser] = useState('')
  const [fStatus, setFStatus] = useState('offline')

  // Game form
  const [gName, setGName] = useState('')
  const [gStatus, setGStatus] = useState('playing')
  const [gPct, setGPct] = useState(0)
  const [gHours, setGHours] = useState('')
  const [gStartedAt, setGStartedAt] = useState('')
  const [gFinishedAt, setGFinishedAt] = useState('')
  const [hltbResults, setHltbResults] = useState([])
  const [hltbLoading, setHltbLoading] = useState(false)
  const [selectedHltb, setSelectedHltb] = useState(null)
  const [editGame, setEditGame] = useState(null)
  const [saving, setSaving] = useState(false)
  const [gameInfo, setGameInfo] = useState(null)
  const [gameInfoLoading, setGameInfoLoading] = useState(false)

  // AI estimate
  const [estimateDesc, setEstimateDesc] = useState('')
  const [estimating, setEstimating] = useState(false)
  const [estimateResult, setEstimateResult] = useState(null)

  const fetchFriends = async () => {
    const r = await fetch('/api/friends')
    const data = await r.json()
    setFriends(data || [])
    setLoading(false)
  }
  useEffect(() => { fetchFriends() }, [])

  const searchHltb = async (q) => {
    if (!q || q.length < 2) { setHltbResults([]); return }
    setHltbLoading(true)
    try {
      const r = await fetch(`/api/hltb?q=${encodeURIComponent(q)}`)
      const data = await r.json()
      const results = Array.isArray(data) ? data : []
      setHltbResults(results)
      if (results.length > 0) {
        setSelectedHltb(results[0])
        setGName(results[0].title)
        setGameInfoLoading(true)
        setGameInfo(null)
        fetch(`/api/gameinfo?title=${encodeURIComponent(results[0].title)}`)
          .then(r => r.json())
          .then(info => { setGameInfo(info); setGameInfoLoading(false) })
          .catch(() => setGameInfoLoading(false))
      } else {
        setSelectedHltb(null)
      }
    } catch { setHltbResults([]); setSelectedHltb(null) }
    setHltbLoading(false)
  }

  const handleGNameChange = (v) => {
    setGName(v)
    setSelectedHltb(null)
    setHltbResults([])
    setGameInfo(null)
    if (v.length >= 2) {
      setHltbLoading(true)
      clearTimeout(window._hltbTimer)
      window._hltbTimer = setTimeout(() => searchHltb(v), 800)
    }
  }

  const resetGameForm = () => {
    setGName(''); setGStatus('playing'); setGPct(0); setGHours('')
    setGStartedAt(''); setGFinishedAt(''); setSelectedHltb(null)
    setHltbResults([]); setGameInfo(null)
  }

  const addFriend = async () => {
    if (!fName.trim()) return
    setSaving(true)
    await fetch('/api/friends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: fName.trim(), username: fUser.trim(), status: fStatus }),
    })
    await fetchFriends()
    setModal(null); setFName(''); setFUser(''); setFStatus('offline')
    setSaving(false)
  }

  const deleteFriend = async (id) => {
    if (!confirm('¿Eliminar este amigo y todos sus juegos?')) return
    await fetch(`/api/friends?id=${id}`, { method: 'DELETE' })
    setSelected(null)
    await fetchFriends()
  }

  const addGame = async () => {
    if (!gName.trim() || !selected) return
    setSaving(true)
    await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        friend_id: selected,
        title: gName.trim(),
        status: gStatus,
        pct: parseInt(gPct) || 0,
        hours_played: parseFloat(gHours) || 0,
        hltb_main: selectedHltb?.main || null,
        hltb_extra: selectedHltb?.extra || null,
        hltb_complete: selectedHltb?.complete || null,
        cover_url: gameInfo?.cover_url || null,
        description: gameInfo?.description || null,
        started_at: gStartedAt || null,
        finished_at: gStatus === 'completed' ? (gFinishedAt || null) : null,
      }),
    })
    await fetchFriends()
    setModal(null); resetGameForm()
    setSaving(false)
  }

  const updateGame = async () => {
    if (!editGame) return
    setSaving(true)
    await fetch('/api/games', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editGame.id,
        status: gStatus,
        pct: parseInt(gPct) || 0,
        hours_played: parseFloat(gHours) || 0,
        started_at: gStartedAt || null,
        finished_at: gStatus === 'completed' ? (gFinishedAt || null) : null,
      }),
    })
    await fetchFriends()
    setModal(null); setEditGame(null)
    setSaving(false)
  }

  const deleteGame = async (id) => {
    if (!confirm('¿Eliminar este juego?')) return
    await fetch(`/api/games?id=${id}`, { method: 'DELETE' })
    await fetchFriends()
  }

  const openEditGame = (game) => {
    setEditGame(game)
    setGStatus(game.status)
    setGPct(game.pct)
    setGHours(game.hours_played)
    setGStartedAt(game.started_at ? game.started_at.slice(0,10) : '')
    setGFinishedAt(game.finished_at ? game.finished_at.slice(0,10) : '')
    setEstimateDesc(''); setEstimateResult(null)
    setModal('editGame')
  }

  const openEstimate = (game) => {
    setEditGame(game); setEstimateDesc(''); setEstimateResult(null)
    setModal('estimate')
  }

  const runEstimate = async () => {
    if (!estimateDesc.trim() || !editGame) return
    setEstimating(true); setEstimateResult(null)
    try {
      const r = await fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game: editGame.title, description: estimateDesc, hltb_main: editGame.hltb_main, hltb_extra: editGame.hltb_extra, hltb_complete: editGame.hltb_complete }),
      })
      setEstimateResult(await r.json())
    } catch {}
    setEstimating(false)
  }

  const applyEstimate = async () => {
    if (!estimateResult || !editGame) return
    setSaving(true)
    await fetch('/api/games', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editGame.id, pct: estimateResult.pct, hours_played: estimateResult.hours_played }),
    })
    await fetchFriends(); setModal(null); setSaving(false)
  }

  const handleStatusChange = (val, hltbData, editGameData) => {
    setGStatus(val)
    if (val === 'completed') {
      setGPct(100)
      const src = hltbData || editGameData
      if (src?.complete || src?.hltb_complete) setGHours(src.complete || src.hltb_complete)
      else if (src?.main || src?.hltb_main) setGHours(src.main || src.hltb_main)
      if (!gFinishedAt) setGFinishedAt(new Date().toISOString().slice(0,10))
    }
  }

  const selectedFriend = friends.find(f => f.id === selected)
  const activeGames = (selectedFriend?.games?.filter(g => g.status === 'playing') || []).sort((a,b) => (b.hours_played||0)-(a.hours_played||0))
  const history = (selectedFriend?.games?.filter(g => g.status !== 'playing') || []).sort((a,b) => { const da = b.finished_at||b.started_at||b.created_at||''; const db = a.finished_at||a.started_at||a.created_at||''; return da.localeCompare(db) })
  const allGames = friends.flatMap(f => (f.games||[]).map(g => ({...g, friendName:f.name, friendIdx:friends.findIndex(x=>x.id===f.id)})))
  const playing = friends.filter(f => f.games?.some(g => g.status==='playing')).length
  const totalHours = allGames.reduce((s,g) => s+(g.hours_played||0), 0)

  const statusDot = (s) => s==='online'?'bg-green-400':s==='away'?'bg-amber-400':'bg-gray-500'
  const statusLabel = (s) => s==='online'?'Online':s==='away'?'Ausente':'Offline'
  const gameBadge = (s) => s==='playing'?'bg-purple-900/60 text-purple-200':s==='completed'?'bg-teal-900/60 text-teal-200':'bg-red-900/40 text-red-300'
  const gameLabel = (s) => s==='playing'?'Jugando':s==='completed'?'Completado':'Abandonado'
  const progressColor = (p) => p<33?'bg-teal-500':p<66?'bg-amber-500':'bg-purple-500'
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-CL') : null

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50"

  return (
    <>
      <Head>
        <title>Game CRM</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <div className="min-h-screen" style={{fontFamily:'Inter,sans-serif'}}>
        <div className="max-w-6xl mx-auto px-4 py-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎮</span>
              <h1 className="text-xl font-semibold text-white">Game CRM</h1>
            </div>
            <div className="flex gap-2">
              {selected && (
                <button onClick={() => { resetGameForm(); setModal('game') }}
                  className="px-4 py-2 rounded-lg border border-white/10 text-sm text-gray-300 hover:bg-white/5 transition-colors">
                  + Juego
                </button>
              )}
              <button onClick={() => { setFName(''); setFUser(''); setFStatus('offline'); setModal('friend') }}
                className="px-4 py-2 rounded-lg border border-white/10 text-sm text-gray-300 hover:bg-white/5 transition-colors">
                + Amigo
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[{num:friends.length,label:'Amigos'},{num:playing,label:'Jugando ahora'},{num:`${Math.round(totalHours)}h`,label:'Horas totales'}].map(s => (
              <div key={s.label} className="rounded-xl border border-white/5 p-4" style={{background:'rgba(255,255,255,0.03)'}}>
                <div className="text-2xl font-semibold text-white">{s.num}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1 w-fit">
            {['friends','activity'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${tab===t?'bg-white/10 text-white font-medium':'text-gray-500 hover:text-gray-300'}`}>
                {t==='friends'?'Amigos':'Actividad'}
              </button>
            ))}
          </div>

          {/* Friends tab */}
          {tab==='friends' && (
            <div className="flex gap-4">
              <div className="flex-1">
                {loading ? (
                  <div className="text-gray-500 text-sm py-8 text-center">Cargando...</div>
                ) : friends.length===0 ? (
                  <div className="text-center py-16 text-gray-500"><div className="text-4xl mb-3">👾</div>Sin amigos aún.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {friends.map((f, idx) => {
                      const color = COLOR_MAP[COLORS[idx%COLORS.length]]
                      const actives = f.games?.filter(g => g.status==='playing') || []
                      return (
                        <div key={f.id} onClick={() => setSelected(selected===f.id?null:f.id)}
                          className={`rounded-xl border p-4 cursor-pointer transition-all ${selected===f.id?'border-purple-500/50 bg-purple-900/10':'border-white/5 hover:border-white/10'}`}
                          style={{background:selected===f.id?undefined:'rgba(255,255,255,0.02)'}}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${color.bg} ${color.text}`}>
                              {initials(f.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-white text-sm">{f.name}</div>
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <span className={`w-1.5 h-1.5 rounded-full ${statusDot(f.status)}`}></span>
                                {statusLabel(f.status)} · {f.games?.length||0} juego{f.games?.length!==1?'s':''}
                              </div>
                            </div>
                          </div>
                          {actives.length>0 ? (
                            <div className="space-y-2">
                              {actives.map(cur => {
                                const hoursLeft = cur.hltb_main ? Math.max(0, cur.hltb_main-(cur.hours_played||0)) : null
                                return (
                                  <div key={cur.id} className="rounded-lg p-3" style={{background:'rgba(255,255,255,0.04)'}}>
                                    <div className="flex items-center gap-2.5 mb-2">
                                      {cur.cover_url && <img src={cur.cover_url} alt={cur.title} className="w-8 h-10 rounded object-cover flex-shrink-0" onError={e=>e.target.style.display='none'} />}
                                      <div className="flex-1 min-w-0">
                                        <div className="text-xs text-gray-500 mb-0.5">Jugando</div>
                                        <div className="font-medium text-white text-sm truncate">{cur.title}</div>
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-gray-400 mb-1.5">
                                      <span>{cur.pct}% completado</span>
                                      {hoursLeft!==null && <span className="text-purple-400">~{Math.round(hoursLeft)}h restantes</span>}
                                    </div>
                                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                      <div className={`h-full rounded-full transition-all ${progressColor(cur.pct)}`} style={{width:`${cur.pct}%`}}></div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-600 px-1">Sin juego activo</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Detail panel */}
              {selectedFriend && (
                <div className="w-80 flex-shrink-0">
                  <div className="rounded-xl border border-white/5 p-4" style={{background:'rgba(255,255,255,0.02)'}}>
                    {(() => {
                      const idx = friends.findIndex(f => f.id===selected)
                      const color = COLOR_MAP[COLORS[idx%COLORS.length]]
                      return (
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-medium ${color.bg} ${color.text}`}>
                            {initials(selectedFriend.name)}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-white">{selectedFriend.name}</div>
                            <div className="text-xs text-gray-500">@{selectedFriend.username}</div>
                          </div>
                          <button onClick={() => deleteFriend(selectedFriend.id)} title="Eliminar"
                            className="text-gray-600 hover:text-red-400 text-xs px-2 py-1 rounded border border-white/5 hover:border-red-500/20 transition-colors">🗑️</button>
                        </div>
                      )
                    })()}

                    {activeGames.length>0 && (
                      <>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Jugando ahora</div>
                        <div className="space-y-4 mb-4">
                          {activeGames.map(g => (
                            <div key={g.id}>
                              <div className="flex gap-2.5 mb-2">
                                {g.cover_url && (
                                  <img src={g.cover_url} alt={g.title} className="w-12 h-16 rounded object-cover flex-shrink-0" onError={e=>e.target.style.display='none'} />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-1 mb-1">
                                    <div className="font-medium text-white text-sm leading-tight">{g.title}</div>
                                    <div className="flex gap-1 flex-shrink-0">
                                      <button onClick={()=>openEstimate(g)} title="Estimar con IA" className="text-purple-400 hover:text-purple-300 text-xs px-1.5 py-0.5 rounded border border-purple-500/20 hover:border-purple-500/40 transition-colors">✨</button>
                                      <button onClick={()=>openEditGame(g)} className="text-gray-600 hover:text-gray-400 text-xs px-1.5 py-0.5 rounded border border-white/5 hover:border-white/10 transition-colors">✏️</button>
                                      <button onClick={()=>deleteGame(g.id)} className="text-gray-600 hover:text-red-400 text-xs px-1.5 py-0.5 rounded border border-white/5 hover:border-red-500/20 transition-colors">✕</button>
                                    </div>
                                  </div>
                                  {g.started_at && <div className="text-xs text-gray-600">Desde {fmtDate(g.started_at)}</div>}
                                </div>
                              </div>
                              {g.description && (
                                <div className="mb-2">
                                  <button onClick={()=>setExpandedGames(p=>({...p,[g.id]:!p[g.id]}))}
                                    className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors">
                                    {expandedGames[g.id]?'▾':'▸'} descripción
                                  </button>
                                  {expandedGames[g.id] && <p className="text-xs text-gray-400 mt-1 leading-relaxed">{g.description}</p>}
                                </div>
                              )}
                              <div className="space-y-1 text-xs mb-2">
                                {[
                                  ['Horas jugadas', `${g.hours_played}h`],
                                  g.hltb_main && ['Historia (HLTB)', `${g.hltb_main}h`],
                                  g.hltb_main && ['Restantes', `~${Math.max(0,g.hltb_main-g.hours_played).toFixed(0)}h`],
                                ].filter(Boolean).map(([label,val]) => (
                                  <div key={label} className="flex justify-between">
                                    <span className="text-gray-500">{label}</span>
                                    <span className={label==='Restantes'?'text-purple-400 font-medium':'text-gray-300'}>{val}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Completitud</span><span>{g.pct}%</span></div>
                              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                                <div className={`h-full rounded-full ${progressColor(g.pct)}`} style={{width:`${g.pct}%`}}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-white/5 mb-4"></div>
                      </>
                    )}

                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Historial</div>
                    {history.length===0 ? (
                      <div className="text-xs text-gray-600">Sin juegos anteriores.</div>
                    ) : (
                      <div className="space-y-3">
                        {history.map(g => (
                          <div key={g.id} className="group">
                            <div className="flex items-center gap-2.5">
                              {g.cover_url && <img src={g.cover_url} alt={g.title} className="w-7 h-9 rounded object-cover flex-shrink-0" onError={e=>e.target.style.display='none'} />}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-sm text-gray-300 truncate">{g.title}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${gameBadge(g.status)}`}>{gameLabel(g.status)}</span>
                                </div>
                                <div className="text-xs text-gray-600">
                                  {g.hours_played}h
                                  {g.started_at && ` · inicio ${fmtDate(g.started_at)}`}
                                  {g.finished_at && ` · fin ${fmtDate(g.finished_at)}`}
                                </div>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={()=>openEditGame(g)} className="text-gray-600 hover:text-gray-400 text-xs">✏️</button>
                                <button onClick={()=>deleteGame(g.id)} className="text-gray-600 hover:text-red-400 text-xs">✕</button>
                              </div>
                            </div>
                            {g.description && (
                              <div className={g.cover_url?'ml-9 mt-1':'mt-1'}>
                                <button onClick={()=>setExpandedGames(p=>({...p,[g.id]:!p[g.id]}))}
                                  className="text-xs text-gray-600 hover:text-gray-400 flex items-center gap-1 transition-colors">
                                  {expandedGames[g.id]?'▾':'▸'} descripción
                                </button>
                                {expandedGames[g.id] && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{g.description}</p>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Activity tab */}
          {tab==='activity' && (
            <div className="space-y-2">
              {allGames.length===0 ? (
                <div className="text-center py-16 text-gray-500">Sin actividad registrada.</div>
              ) : allGames.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).map(g => {
                const color = COLOR_MAP[COLORS[g.friendIdx%COLORS.length]]
                return (
                  <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/5" style={{background:'rgba(255,255,255,0.02)'}}>
                    {g.cover_url
                      ? <img src={g.cover_url} alt={g.title} className="w-8 h-10 rounded object-cover flex-shrink-0" onError={e=>e.target.style.display='none'} />
                      : <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${color.bg} ${color.text}`}>{initials(g.friendName)}</div>
                    }
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-300"><span className="text-gray-500">{g.friendName}</span> — {g.title}</div>
                      <div className="text-xs text-gray-600">
                        {g.hours_played}h
                        {g.started_at && ` · inicio ${fmtDate(g.started_at)}`}
                        {g.finished_at && ` · terminado ${fmtDate(g.finished_at)}`}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${gameBadge(g.status)}`}>{gameLabel(g.status)}</span>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      </div>

      {/* Modals */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="rounded-2xl border border-white/10 p-6 w-full max-w-sm max-h-screen overflow-y-auto" style={{background:'#1a1a24'}}>

            {/* Add friend */}
            {modal==='friend' && (
              <>
                <h2 className="text-base font-semibold text-white mb-4">Agregar amigo</h2>
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1">Nombre</label>
                  <input value={fName} onChange={e=>setFName(e.target.value)} placeholder="ej. Rodrigo" className={inputCls} />
                </div>
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1">Usuario / alias</label>
                  <input value={fUser} onChange={e=>setFUser(e.target.value)} placeholder="ej. rod_plays" className={inputCls} />
                </div>
                <div className="mb-4">
                  <label className="block text-xs text-gray-500 mb-1">Estado</label>
                  <select value={fStatus} onChange={e=>setFStatus(e.target.value)} className={inputCls}>
                    <option value="online">Online</option>
                    <option value="away">Ausente</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={()=>setModal(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200">Cancelar</button>
                  <button onClick={addFriend} disabled={saving} className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg">
                    {saving?'Guardando...':'Agregar'}
                  </button>
                </div>
              </>
            )}

            {/* Add game */}
            {modal==='game' && (
              <>
                <h2 className="text-base font-semibold text-white mb-1">Agregar juego</h2>
                <p className="text-xs text-gray-500 mb-4">Para {selectedFriend?.name}</p>
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1">Juego</label>
                  <input value={gName} onChange={e=>handleGNameChange(e.target.value)} placeholder="Nombre del juego..." className={inputCls} autoComplete="off" />
                </div>
                {hltbLoading && (
                  <div className="mb-2 text-xs text-gray-500 flex items-center gap-2">
                    <span className="inline-block w-3 h-3 border border-gray-500 border-t-purple-400 rounded-full animate-spin"></span>
                    Buscando...
                  </div>
                )}
                {selectedHltb && (
                  <div className="mb-3 rounded-lg p-3 text-xs space-y-1" style={{background:'rgba(124,92,255,0.08)'}}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-purple-400 font-medium">HowLongToBeat — {selectedHltb.title}</span>
                      <button onClick={()=>{setSelectedHltb(null);setGameInfo(null)}} className="text-gray-600 hover:text-gray-400">✕</button>
                    </div>
                    {[['Historia',selectedHltb.main],['+ Extras',selectedHltb.extra],['100%',selectedHltb.complete]].map(([l,v])=>(
                      <div key={l} className="flex justify-between"><span className="text-gray-500">{l}</span><span className="text-gray-300">{v}h</span></div>
                    ))}
                  </div>
                )}
                {gameInfoLoading && <div className="text-xs text-gray-600 mb-2">Buscando portada e info...</div>}
                {gameInfo?.cover_url && (
                  <div className="flex items-center gap-2 mb-3">
                    <img src={gameInfo.cover_url} alt="" className="w-8 h-10 rounded object-cover" onError={e=>e.target.style.display='none'} />
                    <span className="text-xs text-gray-500">Portada encontrada ✓</span>
                  </div>
                )}
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1">Estado</label>
                  <select value={gStatus} onChange={e=>handleStatusChange(e.target.value, selectedHltb, null)} className={inputCls}>
                    <option value="playing">Jugando</option>
                    <option value="completed">Completado</option>
                    <option value="dropped">Abandonado</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">% Completado</label>
                    <input type="number" min="0" max="100" value={gPct} onChange={e=>setGPct(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Horas jugadas</label>
                    <input type="number" min="0" step="0.5" value={gHours} onChange={e=>setGHours(e.target.value)} placeholder="ej. 12" className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Fecha inicio</label>
                    <input type="date" value={gStartedAt} onChange={e=>setGStartedAt(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{gStatus==='completed'?'Fecha fin':'Fecha fin (si aplica)'}</label>
                    <input type="date" value={gFinishedAt} onChange={e=>setGFinishedAt(e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={()=>setModal(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200">Cancelar</button>
                  <button onClick={addGame} disabled={saving} className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg">
                    {saving?'Guardando...':'Guardar'}
                  </button>
                </div>
              </>
            )}

            {/* Edit game */}
            {modal==='editGame' && editGame && (
              <>
                <h2 className="text-base font-semibold text-white mb-1">Editar juego</h2>
                <p className="text-xs text-gray-500 mb-4">{editGame.title}</p>
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1">Estado</label>
                  <select value={gStatus} onChange={e=>handleStatusChange(e.target.value, null, editGame)} className={inputCls}>
                    <option value="playing">Jugando</option>
                    <option value="completed">Completado</option>
                    <option value="dropped">Abandonado</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">% Completado</label>
                    <input type="number" min="0" max="100" value={gPct} onChange={e=>setGPct(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Horas jugadas</label>
                    <input type="number" min="0" step="0.5" value={gHours} onChange={e=>setGHours(e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Fecha inicio</label>
                    <input type="date" value={gStartedAt} onChange={e=>setGStartedAt(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{gStatus==='completed'?'Fecha fin':'Fecha fin (si aplica)'}</label>
                    <input type="date" value={gFinishedAt} onChange={e=>setGFinishedAt(e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={()=>setModal(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200">Cancelar</button>
                  <button onClick={updateGame} disabled={saving} className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg">
                    {saving?'Guardando...':'Actualizar'}
                  </button>
                </div>
              </>
            )}

            {/* AI Estimate */}
            {modal==='estimate' && editGame && (
              <>
                <h2 className="text-base font-semibold text-white mb-1">✨ Estimar con IA</h2>
                <p className="text-xs text-gray-500 mb-4">{editGame.title}</p>
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1">¿Dónde estás en el juego?</label>
                  <textarea value={estimateDesc} onChange={e=>setEstimateDesc(e.target.value)}
                    placeholder='ej. "Acabo de terminar el segundo boss y tengo el mapa del tercer mundo"'
                    rows={4} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 resize-none" />
                </div>
                <button onClick={runEstimate} disabled={estimating||!estimateDesc.trim()}
                  className="w-full py-2 text-sm bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg mb-3">
                  {estimating?'Estimando...':'Estimar progreso'}
                </button>
                {estimateResult && (
                  <div className="rounded-lg p-3 mb-3 space-y-2" style={{background:'rgba(124,92,255,0.08)'}}>
                    <div className="text-purple-400 text-xs font-medium mb-1">Resultado</div>
                    {[['% Completado',`${estimateResult.pct}%`],['Horas jugadas',`~${estimateResult.hours_played}h`],['Horas restantes',`~${estimateResult.hours_remaining}h`]].map(([l,v])=>(
                      <div key={l} className="flex justify-between text-xs">
                        <span className="text-gray-500">{l}</span>
                        <span className="text-gray-200 font-medium">{v}</span>
                      </div>
                    ))}
                    {estimateResult.reasoning && <p className="text-xs text-gray-500 italic mt-2 pt-2 border-t border-white/5">{estimateResult.reasoning}</p>}
                    <button onClick={applyEstimate} disabled={saving}
                      className="w-full py-1.5 text-xs bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white rounded-lg mt-1">
                      {saving?'Aplicando...':'Aplicar al juego'}
                    </button>
                  </div>
                )}
                <div className="flex justify-end">
                  <button onClick={()=>setModal(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200">Cerrar</button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </>
  )
}
