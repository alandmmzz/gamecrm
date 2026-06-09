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


const GENRE_COLORS = [
  '#7F77DD','#5DCAA5','#EF9F27','#E07B6A','#5B9BD5',
  '#A78BFA','#34D399','#F59E0B','#F87171','#60A5FA',
]


function getRoleTitle(games) {
  const genreMap = {}
  games.forEach(g => {
    const hrs = g.hours_played || 0
    ;(g.genres || []).forEach(genre => {
      genreMap[genre] = (genreMap[genre] || 0) + hrs
    })
  })
  const top = Object.entries(genreMap).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([g])=>g.toLowerCase())
  if (!top.length) return null

  const total = games.reduce((s,g)=>s+(g.hours_played||0),0)

  // Title based on top genres combo
  const has = (...gs) => gs.every(g => top.some(t => t.includes(g)))
  const any = (...gs) => gs.some(g => top.some(t => t.includes(g)))

  if (has('action') && has('rpg')) return { title: 'Espadachín de Mundos Abiertos', icon: '⚔️' }
  if (has('action') && has('shooter')) return { title: 'Máquina de Guerra', icon: '🔫' }
  if (has('rpg') && has('strategy')) return { title: 'Gran Estratega', icon: '🧠' }
  if (has('horror') && has('action')) return { title: 'Cazador de Pesadillas', icon: '💀' }
  if (has('indie') && has('platformer')) return { title: 'Guardián de los Indies', icon: '🎪' }
  if (has('adventure') && has('rpg')) return { title: 'Explorador de Leyendas', icon: '🗺️' }
  if (has('sports') && has('racing')) return { title: 'Atleta Digital', icon: '🏆' }
  if (has('puzzle') && has('strategy')) return { title: 'Maestro del Ingenio', icon: '🧩' }
  if (any('rpg')) return total > 500 ? { title: 'Veterano de las RPG', icon: '🧙' } : { title: 'Aprendiz del Rol', icon: '📜' }
  if (any('action')) return total > 300 ? { title: 'Guerrero Curtido', icon: '🗡️' } : { title: 'Soldado en Entrenamiento', icon: '🪖' }
  if (any('horror')) return { title: 'Alma Valiente', icon: '👻' }
  if (any('indie')) return { title: 'Fanático del Indie', icon: '🎮' }
  if (any('strategy')) return { title: 'Mente Táctica', icon: '♟️' }
  if (any('adventure')) return { title: 'Espíritu Aventurero', icon: '🌍' }
  if (any('casual')) return { title: 'Jugador Casual', icon: '🛋️' }
  return { title: 'Gamer Inclasificable', icon: '🎲' }
}

function GenreRadarChart({ games }) {
  const genreMap = {}
  games.forEach(g => {
    const hrs = g.hours_played || 0
    ;(g.genres || []).forEach(genre => {
      genreMap[genre] = (genreMap[genre] || 0) + hrs
    })
  })
  const entries = Object.entries(genreMap).sort((a,b)=>b[1]-a[1]).slice(0,8)
  if (!entries.length) return (
    <div className="flex items-center justify-center h-48 text-xs text-gray-600">Sin datos de géneros aún</div>
  )
  const max = entries[0][1]
  const cx = 110, cy = 110, r = 80
  const n = entries.length
  const points = entries.map(([,val], i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    const dist = (val / max) * r
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) }
  })
  const gridPoints = (factor) => entries.map((_, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    return `${cx + factor * r * Math.cos(angle)},${cy + factor * r * Math.sin(angle)}`
  }).join(' ')
  const polyPoints = points.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <div>
      <svg viewBox="0 0 220 220" className="w-full max-w-xs mx-auto">
        {[0.25,0.5,0.75,1].map(f => (
          <polygon key={f} points={gridPoints(f)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        ))}
        {entries.map((_,i) => {
          const angle = (i / n) * 2 * Math.PI - Math.PI / 2
          return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        })}
        <polygon points={polyPoints} fill="rgba(127,119,221,0.2)" stroke="#7F77DD" strokeWidth="1.5" />
        {points.map((p,i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="#7F77DD" />)}
        {entries.map(([name,val],i) => {
          const angle = (i / n) * 2 * Math.PI - Math.PI / 2
          const lx = cx + (r + 18) * Math.cos(angle)
          const ly = cy + (r + 18) * Math.sin(angle)
          const anchor = lx < cx - 5 ? 'end' : lx > cx + 5 ? 'start' : 'middle'
          return (
            <text key={i} x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle" fontSize="8" fill="rgba(255,255,255,0.5)">
              {name.length > 12 ? name.slice(0,11)+'…' : name}
            </text>
          )
        })}
      </svg>
      <div className="mt-3 space-y-1.5">
        {entries.map(([name,val],i) => (
          <div key={name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:GENRE_COLORS[i%GENRE_COLORS.length]}}></div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-gray-400 truncate">{name}</span>
                <span className="text-gray-500 flex-shrink-0 ml-2">{Math.round(val)}h</span>
              </div>
              <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{width:`${(val/max)*100}%`,background:GENRE_COLORS[i%GENRE_COLORS.length]}}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  const [friends, setFriends] = useState([])
  const [view, setView] = useState('list') // 'list' | 'profile' | 'activity'
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [expandedDescs, setExpandedDescs] = useState({})
  const [sortOrder, setSortOrder] = useState('hours') // 'hours' | 'alpha'

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
  const [gNoProgress, setGNoProgress] = useState(false)
  const [hltbResults, setHltbResults] = useState([])
  const [hltbLoading, setHltbLoading] = useState(false)
  const [selectedHltb, setSelectedHltb] = useState(null)
  const [editGame, setEditGame] = useState(null)
  const [saving, setSaving] = useState(false)
  const [gameInfo, setGameInfo] = useState(null)
  const [gameInfoLoading, setGameInfoLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshProgress, setRefreshProgress] = useState('')

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
        setGameInfoLoading(true); setGameInfo(null)
        fetch(`/api/gameinfo?title=${encodeURIComponent(results[0].title)}`)
          .then(r => r.json()).then(info => { setGameInfo(info); setGameInfoLoading(false) })
          .catch(() => setGameInfoLoading(false))
      } else { setSelectedHltb(null) }
    } catch { setHltbResults([]); setSelectedHltb(null) }
    setHltbLoading(false)
  }

  const handleGNameChange = (v) => {
    setGName(v); setSelectedHltb(null); setHltbResults([]); setGameInfo(null)
    if (v.length >= 2) {
      setHltbLoading(true)
      clearTimeout(window._hltbTimer)
      window._hltbTimer = setTimeout(() => searchHltb(v), 800)
    }
  }

  const resetGameForm = () => {
    setGName(''); setGStatus('playing'); setGPct(0); setGHours('')
    setGStartedAt(''); setGFinishedAt(''); setGNoProgress(false)
    setSelectedHltb(null); setHltbResults([]); setGameInfo(null)
  }

  const addFriend = async () => {
    if (!fName.trim()) return
    setSaving(true)
    await fetch('/api/friends', { method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ name: fName.trim(), username: fUser.trim(), status: fStatus }) })
    await fetchFriends()
    setModal(null); setFName(''); setFUser(''); setFStatus('offline'); setSaving(false)
  }

  const deleteFriend = async (id) => {
    if (!confirm('¿Eliminar este amigo y todos sus juegos?')) return
    await fetch(`/api/friends?id=${id}`, { method: 'DELETE' })
    setSelected(null); setView('list'); await fetchFriends()
  }

  const addGame = async () => {
    if (!gName.trim() || !selected) return
    setSaving(true)
    await fetch('/api/games', { method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        friend_id: selected, title: gName.trim(), status: gStatus,
        pct: parseInt(gPct)||0, hours_played: parseFloat(gHours)||0,
        hltb_main: selectedHltb?.main||null, hltb_extra: selectedHltb?.extra||null, hltb_complete: selectedHltb?.complete||null,
        cover_url: gameInfo?.cover_url||null, description: gameInfo?.description||null, genres: gameInfo?.genres||[],
        started_at: gStartedAt||null, finished_at: gStatus==='completed'?(gFinishedAt||null):null,
        no_progress: gNoProgress,
      }) })
    await fetchFriends(); setModal(null); resetGameForm(); setSaving(false)
  }

  const updateGame = async () => {
    if (!editGame) return
    setSaving(true)
    await fetch('/api/games', { method: 'PATCH', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        id: editGame.id, status: gStatus, pct: parseInt(gPct)||0, hours_played: parseFloat(gHours)||0,
        started_at: gStartedAt||null, finished_at: gStatus==='completed'?(gFinishedAt||null):null,
        no_progress: gNoProgress,
      }) })
    await fetchFriends(); setModal(null); setEditGame(null); setSaving(false)
  }

  const deleteGame = async (id) => {
    if (!confirm('¿Eliminar este juego?')) return
    await fetch(`/api/games?id=${id}`, { method: 'DELETE' })
    await fetchFriends()
  }

  const openEditGame = (game) => {
    setEditGame(game); setGStatus(game.status); setGPct(game.pct); setGHours(game.hours_played)
    setGStartedAt(game.started_at ? game.started_at.slice(0,10) : '')
    setGFinishedAt(game.finished_at ? game.finished_at.slice(0,10) : '')
    setGNoProgress(game.no_progress || false)
    setEstimateDesc(''); setEstimateResult(null); setModal('editGame')
  }

  const openEstimate = (game) => {
    setEditGame(game); setEstimateDesc(''); setEstimateResult(null); setModal('estimate')
  }

  const runEstimate = async () => {
    if (!estimateDesc.trim() || !editGame) return
    setEstimating(true); setEstimateResult(null)
    try {
      const r = await fetch('/api/estimate', { method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ game: editGame.title, description: estimateDesc, hltb_main: editGame.hltb_main, hltb_extra: editGame.hltb_extra, hltb_complete: editGame.hltb_complete }) })
      setEstimateResult(await r.json())
    } catch {}
    setEstimating(false)
  }

  const applyEstimate = async () => {
    if (!estimateResult || !editGame) return
    setSaving(true)
    await fetch('/api/games', { method: 'PATCH', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ id: editGame.id, pct: estimateResult.pct, hours_played: estimateResult.hours_played }) })
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

  const refreshCovers = async () => {
    const f = friends.find(x => x.id === selected)
    if (!f) return
    const missing = (f.games||[]).filter(g => !g.genres?.length || !g.cover_url)
    if (!missing.length) { setRefreshProgress('Todo al día ✓'); setTimeout(()=>setRefreshProgress(''),3000); return }
    setRefreshing(true)
    for (let i = 0; i < missing.length; i++) {
      const g = missing[i]
      setRefreshProgress(`${i+1}/${missing.length}: ${g.title}...`)
      try {
        const r = await fetch('/api/gameinfo?title='+encodeURIComponent(g.title))
        const info = await r.json()
        if (info.cover_url || info.description || info.genres?.length) {
          await fetch('/api/games', { method: 'PATCH', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({
              id: g.id,
              cover_url: info.cover_url || g.cover_url || null,
              description: info.description || g.description || null,
              genres: info.genres?.length ? info.genres : (g.genres || []),
            }) })
        }
      } catch {}
    }
    await fetchFriends(); setRefreshing(false)
    setRefreshProgress('¡Listo! ✓'); setTimeout(()=>setRefreshProgress(''),3000)
  }

  const selectedFriend = friends.find(f => f.id === selected)
  const allActive = (selectedFriend?.games?.filter(g => g.status==='playing')||[]).sort((a,b)=> sortOrder==='alpha' ? a.title.localeCompare(b.title) : (b.hours_played||0)-(a.hours_played||0))
  const activeGames = allActive.filter(g => !g.no_progress)
  const recurringGames = allActive.filter(g => g.no_progress)
  const history = (selectedFriend?.games?.filter(g => g.status!=='playing')||[]).sort((a,b)=>{
    const da = b.finished_at||b.started_at||b.created_at||''
    const db = a.finished_at||a.started_at||a.created_at||''
    return da.localeCompare(db)
  })
  const allGames = friends.flatMap(f=>(f.games||[]).map(g=>({...g,friendName:f.name,friendIdx:friends.findIndex(x=>x.id===f.id)})))
  const playing = friends.filter(f=>f.games?.some(g=>g.status==='playing')).length
  const totalHours = allGames.reduce((s,g)=>s+(g.hours_played||0),0)

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
        <div className="max-w-4xl mx-auto px-4 py-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3 cursor-pointer" onClick={()=>{setView('list');setSelected(null)}}>
              <span className="text-2xl">🎮</span>
              <h1 className="text-xl font-semibold text-white">Game CRM</h1>
            </div>
            <div className="flex gap-2">
              {view!=='profile' && (
                <button onClick={()=>{setFName('');setFUser('');setFStatus('offline');setModal('friend')}}
                  className="px-4 py-2 rounded-lg border border-white/10 text-sm text-gray-300 hover:bg-white/5 transition-colors">
                  + Amigo
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          {view!=='profile' && <div className="grid grid-cols-3 gap-3 mb-8">
            {[{num:friends.length,label:'Amigos'},{num:playing,label:'Jugando ahora'},{num:`${Math.round(totalHours)}h`,label:'Horas totales'}].map(s=>(
              <div key={s.label} className="rounded-xl border border-white/5 p-4" style={{background:'rgba(255,255,255,0.03)'}}>
                <div className="text-2xl font-semibold text-white">{s.num}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>}

          {/* Tabs */}
          {view!=='profile' && <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1 w-fit">
            {['list','activity'].map(t=>(
              <button key={t} onClick={()=>{setView(t);setSelected(null)}}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${(view===t||(view==='profile'&&t==='list'))?'bg-white/10 text-white font-medium':'text-gray-500 hover:text-gray-300'}`}>
                {t==='list'?'Amigos':'Actividad'}
              </button>
            ))}
          </div>}

          {/* Friends list */}
          {(view==='list') && (
            loading ? <div className="text-gray-500 text-sm py-8 text-center">Cargando...</div>
            : friends.length===0 ? <div className="text-center py-16 text-gray-500"><div className="text-4xl mb-3">👾</div>Sin amigos aún.</div>
            : (
              <div className="space-y-2">
                {friends.map((f,idx)=>{
                  const color = COLOR_MAP[COLORS[idx%COLORS.length]]
                  const actives = f.games?.filter(g=>g.status==='playing')||[]
                  const totalH = (f.games||[]).reduce((s,g)=>s+(g.hours_played||0),0)
                  return (
                    <div key={f.id} onClick={()=>{setSelected(f.id);setView('profile')}}
                      className="p-4 rounded-xl border border-white/5 cursor-pointer hover:border-white/10 transition-all"
                      style={{background:'rgba(255,255,255,0.02)'}}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${color.bg} ${color.text}`}>
                          {initials(f.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white">{f.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {(()=>{ const role = getRoleTitle(f.games||[]); return role ? (
                              <span className="flex items-center gap-1"><span>{role.icon}</span><span className="text-purple-400">{role.title}</span></span>
                            ) : <span className="text-gray-600">Sin géneros aún</span> })()}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm text-white font-medium">{f.games?.length||0} juego{f.games?.length!==1?'s':''}</div>
                          <div className="text-xs text-gray-500">{Math.round(totalH)}h</div>
                        </div>
                        <span className="text-gray-600 text-sm flex-shrink-0">›</span>
                      </div>
                      {actives.length>0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {actives.slice(0,3).map(g=>(
                            <div key={g.id} className="flex items-center gap-1.5 bg-purple-900/30 border border-purple-500/20 rounded-lg px-2 py-1">
                              {g.cover_url && <img src={g.cover_url} alt="" className="w-4 h-5 rounded object-cover flex-shrink-0" onError={e=>e.target.style.display='none'} />}
                              <span className="text-xs text-purple-300 truncate max-w-24">{g.title}</span>
                            </div>
                          ))}
                          {actives.length>3 && <span className="text-xs text-gray-600 self-center">+{actives.length-3} más</span>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          )}

          {/* Profile view */}
          {view==='profile' && selectedFriend && (() => {
            const idx = friends.findIndex(f=>f.id===selected)
            const color = COLOR_MAP[COLORS[idx%COLORS.length]]
            const totalH = (selectedFriend.games||[]).reduce((s,g)=>s+(g.hours_played||0),0)
            return (
              <>
              <div className="flex gap-6 items-start">
                <div className="flex-1 min-w-0">
                {/* Back + profile header */}
                <button onClick={()=>{setView('list');setSelected(null)}} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 mb-6 transition-colors">
                  ‹ Volver
                </button>
                <div className="flex items-center gap-4 mb-8">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-medium flex-shrink-0 ${color.bg} ${color.text}`}>
                    {initials(selectedFriend.name)}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold text-white">{selectedFriend.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-500">@{selectedFriend.username}</span>
                      <span className="text-xs text-gray-500">{selectedFriend.games?.length||0} juegos · {Math.round(totalH)}h</span>
                    </div>
                    {(()=>{ const role = getRoleTitle(selectedFriend.games||[]); return role ? (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span>{role.icon}</span>
                        <span className="text-xs font-medium text-purple-400">{role.title}</span>
                      </div>
                    ) : null })()}
                  </div>
                  <div className="flex gap-2">
                    {refreshProgress && <span className="text-xs text-purple-400 self-center">{refreshProgress}</span>}
                    <button onClick={()=>{resetGameForm();setModal('game')}}
                      className="text-gray-300 hover:text-white text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors">+ Juego</button>
                    <button onClick={refreshCovers} disabled={refreshing} title="Actualizar portadas"
                      className="text-gray-600 hover:text-blue-400 text-sm px-2 py-1 rounded border border-white/5 hover:border-blue-500/20 transition-colors disabled:opacity-50">🔄</button>
                    <button onClick={()=>deleteFriend(selectedFriend.id)}
                      className="text-gray-600 hover:text-red-400 text-sm px-2 py-1 rounded border border-white/5 hover:border-red-500/20 transition-colors">🗑️</button>
                  </div>
                </div>

                {/* Recurring games badges */}
                {recurringGames.length>0 && (
                  <div className="mb-6">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Juegos recurrentes</div>
                    <div className="flex flex-wrap gap-2">
                      {recurringGames.map(g=>(
                        <div key={g.id} className="group flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 hover:border-white/20 transition-colors" style={{background:'rgba(255,255,255,0.03)'}}>
                          {g.cover_url && <img src={g.cover_url} alt={g.title} className="w-5 h-7 rounded object-cover flex-shrink-0" onError={e=>e.target.style.display='none'} />}
                          <span className="text-sm text-gray-300">{g.title}</span>
                          <span className="text-xs text-gray-600">{g.hours_played}h</span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={()=>openEditGame(g)} className="text-gray-600 hover:text-gray-400 text-xs">✏️</button>
                            <button onClick={()=>deleteGame(g.id)} className="text-gray-600 hover:text-red-400 text-xs">✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active games */}
                {activeGames.length>0 && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">En progreso</div>
                      <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
                        <button onClick={()=>setSortOrder('hours')} className={`text-xs px-2 py-1 rounded-md transition-colors ${sortOrder==='hours'?'bg-white/10 text-white':'text-gray-500 hover:text-gray-300'}`}>Horas</button>
                        <button onClick={()=>setSortOrder('alpha')} className={`text-xs px-2 py-1 rounded-md transition-colors ${sortOrder==='alpha'?'bg-white/10 text-white':'text-gray-500 hover:text-gray-300'}`}>A–Z</button>
                      </div>
                    </div>
                    <div className="space-y-3 mb-8">
                      {activeGames.map(g=>(
                        <div key={g.id} className="rounded-xl border border-white/5 p-4" style={{background:'rgba(255,255,255,0.02)'}}>
                          <div className="flex gap-3">
                            {g.cover_url && <img src={g.cover_url} alt={g.title} className="w-14 h-20 rounded-lg object-cover flex-shrink-0" onError={e=>e.target.style.display='none'} />}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="font-medium text-white">{g.title}</div>
                                <div className="flex gap-1 flex-shrink-0">
                                  <button onClick={()=>openEstimate(g)} title="Estimar con IA" className="text-purple-400 hover:text-purple-300 text-xs px-1.5 py-0.5 rounded border border-purple-500/20 hover:border-purple-500/40 transition-colors">✨</button>
                                  <button onClick={()=>openEditGame(g)} className="text-gray-600 hover:text-gray-400 text-xs px-1.5 py-0.5 rounded border border-white/5 hover:border-white/10 transition-colors">✏️</button>
                                  <button onClick={()=>deleteGame(g.id)} className="text-gray-600 hover:text-red-400 text-xs px-1.5 py-0.5 rounded border border-white/5 hover:border-red-500/20 transition-colors">✕</button>
                                </div>
                              </div>
                              {g.started_at && <div className="text-xs text-gray-600 mb-2">Desde {fmtDate(g.started_at)}</div>}
                              {g.genres?.length>0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {g.genres.map(genre=>(
                                    <span key={genre} className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-gray-500">{genre}</span>
                                  ))}
                                </div>
                              )}
                              {g.description && (
                                <div className="mb-2">
                                  <button onClick={()=>setExpandedDescs(p=>({...p,[g.id]:!p[g.id]}))} className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors">
                                    {expandedDescs[g.id]?'▾':'▸'} descripción
                                  </button>
                                  {expandedDescs[g.id] && <p className="text-xs text-gray-400 mt-1 leading-relaxed">{g.description}</p>}
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
                                {[
                                  ['Horas jugadas', `${g.hours_played}h`],
                                  !g.no_progress && g.hltb_main && ['Historia (HLTB)', `${g.hltb_main}h`],
                                  !g.no_progress && g.hltb_main && ['Restantes', `~${Math.max(0,g.hltb_main-g.hours_played).toFixed(0)}h`],
                                ].filter(Boolean).map(([label,val])=>(
                                  <div key={label} className="flex justify-between">
                                    <span className="text-gray-500">{label}</span>
                                    <span className={label==='Restantes'?'text-purple-400 font-medium':'text-gray-300'}>{val}</span>
                                  </div>
                                ))}
                              </div>
                              {!g.no_progress && (
                                <>
                                  <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Completitud</span><span>{g.pct}%</span></div>
                                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                                    <div className={`h-full rounded-full ${progressColor(g.pct)}`} style={{width:`${g.pct}%`}}></div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* History */}
                {history.length>0 && (
                  <>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Historial</div>
                    <div className="space-y-2">
                      {history.map(g=>(
                        <div key={g.id} className="group flex items-center gap-3 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors" style={{background:'rgba(255,255,255,0.02)'}}>
                          {g.cover_url && <img src={g.cover_url} alt={g.title} className="w-8 h-11 rounded object-cover flex-shrink-0" onError={e=>e.target.style.display='none'} />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm text-gray-200">{g.title}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${gameBadge(g.status)}`}>{gameLabel(g.status)}</span>
                            </div>
                            <div className="text-xs text-gray-600 mt-0.5">
                              {g.hours_played}h
                              {g.started_at && ` · inicio ${fmtDate(g.started_at)}`}
                              {g.finished_at && ` · fin ${fmtDate(g.finished_at)}`}
                            </div>
                            {g.genres?.length>0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {g.genres.map(genre=>(
                                  <span key={genre} className="text-xs px-1.5 py-0.5 rounded-full border border-white/10 text-gray-600">{genre}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={()=>openEditGame(g)} className="text-gray-600 hover:text-gray-400 text-xs px-1.5 py-0.5 rounded border border-white/5">✏️</button>
                            <button onClick={()=>deleteGame(g.id)} className="text-gray-600 hover:text-red-400 text-xs px-1.5 py-0.5 rounded border border-white/5">✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {(!activeGames.length && !history.length) && (
                  <div className="text-center py-16 text-gray-500">Sin juegos registrados aún.</div>
                )}
                </div>{/* end main col */}

                {/* Chart sidebar — desktop only */}
                <div className="hidden md:block w-64 flex-shrink-0 sticky top-8">
                  <div className="rounded-xl border border-white/5 p-4" style={{background:'rgba(255,255,255,0.02)'}}>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Géneros jugados</div>
                    <GenreRadarChart games={selectedFriend?.games||[]} />
                    <div className="mt-5 pt-4 border-t border-white/5">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Resumen</div>
                      {[
                        { label: 'En progreso', key: 'playing',   color: 'bg-purple-500', badge: 'text-purple-300' },
                        { label: 'Completados', key: 'completed', color: 'bg-teal-500',   badge: 'text-teal-300' },
                        { label: 'Abandonados', key: 'dropped',   color: 'bg-red-500/70', badge: 'text-red-300' },
                      ].map(({ label, key, color, badge }) => {
                        const count = (selectedFriend?.games||[]).filter(g => g.status === key).length
                        const total = (selectedFriend?.games||[]).length
                        const pct = total ? Math.round((count/total)*100) : 0
                        return (
                          <div key={key} className="mb-2.5">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">{label}</span>
                              <span className={badge}>{count} <span className="text-gray-600">({pct}%)</span></span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${color}`} style={{width:`${pct}%`}}></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

              </div>

              {/* Chart mobile — below games */}
              <div className="md:hidden mt-6">
                <div className="rounded-xl border border-white/5 p-4" style={{background:'rgba(255,255,255,0.02)'}}>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Géneros jugados</div>
                  <GenreRadarChart games={selectedFriend?.games||[]} />
                    <div className="mt-5 pt-4 border-t border-white/5">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Resumen</div>
                      {[
                        { label: 'En progreso', key: 'playing',   color: 'bg-purple-500', badge: 'text-purple-300' },
                        { label: 'Completados', key: 'completed', color: 'bg-teal-500',   badge: 'text-teal-300' },
                        { label: 'Abandonados', key: 'dropped',   color: 'bg-red-500/70', badge: 'text-red-300' },
                      ].map(({ label, key, color, badge }) => {
                        const count = (selectedFriend?.games||[]).filter(g => g.status === key).length
                        const total = (selectedFriend?.games||[]).length
                        const pct = total ? Math.round((count/total)*100) : 0
                        return (
                          <div key={key} className="mb-2.5">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">{label}</span>
                              <span className={badge}>{count} <span className="text-gray-600">({pct}%)</span></span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${color}`} style={{width:`${pct}%`}}></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                </div>
              </div>
            </>
            )
          })()}

          {/* Activity tab */}
          {view==='activity' && (
            <div className="space-y-2">
              {allGames.length===0
                ? <div className="text-center py-16 text-gray-500">Sin actividad registrada.</div>
                : allGames.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).map(g=>{
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
                            {g.finished_at && ` · fin ${fmtDate(g.finished_at)}`}
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${gameBadge(g.status)}`}>{gameLabel(g.status)}</span>
                      </div>
                    )
                  })
              }
            </div>
          )}

        </div>
      </div>

      {/* Modals */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="rounded-2xl border border-white/10 p-6 w-full max-w-sm max-h-screen overflow-y-auto" style={{background:'#1a1a24'}}>

            {modal==='friend' && (
              <>
                <h2 className="text-base font-semibold text-white mb-4">Agregar amigo</h2>
                <div className="mb-3"><label className="block text-xs text-gray-500 mb-1">Nombre</label><input value={fName} onChange={e=>setFName(e.target.value)} placeholder="ej. Rodrigo" className={inputCls} /></div>
                <div className="mb-3"><label className="block text-xs text-gray-500 mb-1">Usuario</label><input value={fUser} onChange={e=>setFUser(e.target.value)} placeholder="ej. rod_plays" className={inputCls} /></div>

                <div className="flex gap-2 justify-end">
                  <button onClick={()=>setModal(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200">Cancelar</button>
                  <button onClick={addFriend} disabled={saving} className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg">{saving?'Guardando...':'Agregar'}</button>
                </div>
              </>
            )}

            {modal==='game' && (
              <>
                <h2 className="text-base font-semibold text-white mb-1">Agregar juego</h2>
                <p className="text-xs text-gray-500 mb-4">Para {selectedFriend?.name}</p>
                <div className="mb-3"><label className="block text-xs text-gray-500 mb-1">Juego</label>
                  <input value={gName} onChange={e=>handleGNameChange(e.target.value)} placeholder="Nombre del juego..." className={inputCls} autoComplete="off" />
                </div>
                {hltbLoading && <div className="mb-2 text-xs text-gray-500 flex items-center gap-2"><span className="inline-block w-3 h-3 border border-gray-500 border-t-purple-400 rounded-full animate-spin"></span>Buscando...</div>}
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
                {gameInfoLoading && <div className="text-xs text-gray-600 mb-2">Buscando portada...</div>}
                {gameInfo?.cover_url && (
                  <div className="flex items-center gap-2 mb-3">
                    <img src={gameInfo.cover_url} alt="" className="w-8 h-10 rounded object-cover" onError={e=>e.target.style.display='none'} />
                    <span className="text-xs text-gray-500">Portada encontrada ✓</span>
                  </div>
                )}
                <div className="mb-3"><label className="block text-xs text-gray-500 mb-1">Estado</label>
                  <select value={gStatus} onChange={e=>handleStatusChange(e.target.value,selectedHltb,null)} className={inputCls}>
                    <option value="playing">Jugando</option><option value="completed">Completado</option><option value="dropped">Abandonado</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div><label className="block text-xs text-gray-500 mb-1">% Completado</label><input type="number" min="0" max="100" value={gPct} onChange={e=>setGPct(e.target.value)} className={inputCls} /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Horas jugadas</label><input type="number" min="0" step="0.5" value={gHours} onChange={e=>setGHours(e.target.value)} placeholder="ej. 12" className={inputCls} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div><label className="block text-xs text-gray-500 mb-1">Fecha inicio</label><input type="date" value={gStartedAt} onChange={e=>setGStartedAt(e.target.value)} className={inputCls} /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">{gStatus==='completed'?'Fecha fin':'Fecha fin'}</label><input type="date" value={gFinishedAt} onChange={e=>setGFinishedAt(e.target.value)} className={inputCls} /></div>
                </div>
                <label className="flex items-center gap-2 mb-4 cursor-pointer">
                  <input type="checkbox" checked={gNoProgress} onChange={e=>setGNoProgress(e.target.checked)} className="w-4 h-4 rounded accent-purple-500" />
                  <span className="text-xs text-gray-400">Sin campaña / progreso (ej. Rocket League)</span>
                </label>
                <div className="flex gap-2 justify-end">
                  <button onClick={()=>setModal(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200">Cancelar</button>
                  <button onClick={addGame} disabled={saving} className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg">{saving?'Guardando...':'Guardar'}</button>
                </div>
              </>
            )}

            {modal==='editGame' && editGame && (
              <>
                <h2 className="text-base font-semibold text-white mb-1">Editar juego</h2>
                <p className="text-xs text-gray-500 mb-4">{editGame.title}</p>
                <div className="mb-3"><label className="block text-xs text-gray-500 mb-1">Estado</label>
                  <select value={gStatus} onChange={e=>handleStatusChange(e.target.value,null,editGame)} className={inputCls}>
                    <option value="playing">Jugando</option><option value="completed">Completado</option><option value="dropped">Abandonado</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div><label className="block text-xs text-gray-500 mb-1">% Completado</label><input type="number" min="0" max="100" value={gPct} onChange={e=>setGPct(e.target.value)} className={inputCls} /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Horas jugadas</label><input type="number" min="0" step="0.5" value={gHours} onChange={e=>setGHours(e.target.value)} className={inputCls} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div><label className="block text-xs text-gray-500 mb-1">Fecha inicio</label><input type="date" value={gStartedAt} onChange={e=>setGStartedAt(e.target.value)} className={inputCls} /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">{gStatus==='completed'?'Fecha fin':'Fecha fin'}</label><input type="date" value={gFinishedAt} onChange={e=>setGFinishedAt(e.target.value)} className={inputCls} /></div>
                </div>
                <label className="flex items-center gap-2 mb-4 cursor-pointer">
                  <input type="checkbox" checked={gNoProgress} onChange={e=>setGNoProgress(e.target.checked)} className="w-4 h-4 rounded accent-purple-500" />
                  <span className="text-xs text-gray-400">Sin campaña / progreso (ej. Rocket League)</span>
                </label>
                <div className="flex gap-2 justify-end">
                  <button onClick={()=>setModal(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200">Cancelar</button>
                  <button onClick={updateGame} disabled={saving} className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg">{saving?'Guardando...':'Actualizar'}</button>
                </div>
              </>
            )}

            {modal==='estimate' && editGame && (
              <>
                <h2 className="text-base font-semibold text-white mb-1">✨ Estimar con IA</h2>
                <p className="text-xs text-gray-500 mb-4">{editGame.title}</p>
                <div className="mb-3"><label className="block text-xs text-gray-500 mb-1">¿Dónde estás en el juego?</label>
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
                      <div key={l} className="flex justify-between text-xs"><span className="text-gray-500">{l}</span><span className="text-gray-200 font-medium">{v}</span></div>
                    ))}
                    {estimateResult.reasoning && <p className="text-xs text-gray-500 italic mt-2 pt-2 border-t border-white/5">{estimateResult.reasoning}</p>}
                    <button onClick={applyEstimate} disabled={saving} className="w-full py-1.5 text-xs bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white rounded-lg mt-1">
                      {saving?'Aplicando...':'Aplicar al juego'}
                    </button>
                  </div>
                )}
                <div className="flex justify-end"><button onClick={()=>setModal(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200">Cerrar</button></div>
              </>
            )}

          </div>
        </div>
      )}
    </>
  )
}
