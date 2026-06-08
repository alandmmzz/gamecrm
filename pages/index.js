import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'

const COLORS = ['purple', 'teal', 'coral', 'blue', 'amber']
const COLOR_MAP = {
  purple: { bg: 'bg-purple-900/40', text: 'text-purple-300', badge: 'bg-purple-900/60 text-purple-200' },
  teal:   { bg: 'bg-teal-900/40',   text: 'text-teal-300',   badge: 'bg-teal-900/60 text-teal-200' },
  coral:  { bg: 'bg-orange-900/40', text: 'text-orange-300', badge: 'bg-orange-900/60 text-orange-200' },
  blue:   { bg: 'bg-blue-900/40',   text: 'text-blue-300',   badge: 'bg-blue-900/60 text-blue-200' },
  amber:  { bg: 'bg-amber-900/40',  text: 'text-amber-300',  badge: 'bg-amber-900/60 text-amber-200' },
}
const initials = (name) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

function useDebounce(fn, delay) {
  const [timer, setTimer] = useState(null)
  return useCallback((...args) => {
    clearTimeout(timer)
    const t = setTimeout(() => fn(...args), delay)
    setTimer(t)
  }, [fn, delay, timer])
}

export default function Home() {
  const [friends, setFriends] = useState([])
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('friends')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // 'friend' | 'game' | 'editGame'

  // Forms
  const [fName, setFName] = useState('')
  const [fUser, setFUser] = useState('')
  const [fStatus, setFStatus] = useState('offline')
  const [gName, setGName] = useState('')
  const [gStatus, setGStatus] = useState('playing')
  const [gPct, setGPct] = useState(0)
  const [gHours, setGHours] = useState('')
  const [hltbResults, setHltbResults] = useState([])
  const [hltbLoading, setHltbLoading] = useState(false)
  const [selectedHltb, setSelectedHltb] = useState(null)
  const [editGame, setEditGame] = useState(null)
  const [saving, setSaving] = useState(false)

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
      setHltbResults(Array.isArray(data) ? data : [])
    } catch { setHltbResults([]) }
    setHltbLoading(false)
  }

  const debouncedSearch = useCallback((q) => {
    const t = setTimeout(() => searchHltb(q), 500)
    return () => clearTimeout(t)
  }, [])

  const handleGNameChange = (v) => {
    setGName(v)
    setSelectedHltb(null)
    setHltbResults([])
    if (v.length >= 2) {
      setHltbLoading(true)
      clearTimeout(window._hltbTimer)
      window._hltbTimer = setTimeout(() => searchHltb(v), 500)
    }
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
      }),
    })
    await fetchFriends()
    setModal(null); setGName(''); setGPct(0); setGHours(''); setSelectedHltb(null); setHltbResults([])
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
    setModal('editGame')
  }

  const selectedFriend = friends.find(f => f.id === selected)
  const currentGame = selectedFriend?.games?.find(g => g.status === 'playing')
  const history = selectedFriend?.games?.filter(g => g.status !== 'playing') || []

  const allGames = friends.flatMap(f => (f.games || []).map(g => ({ ...g, friendName: f.name, friendColor: f.color || 'purple' })))
  const playing = friends.filter(f => f.games?.some(g => g.status === 'playing')).length
  const totalHours = allGames.reduce((s, g) => s + (g.hours_played || 0), 0)

  const statusDot = (s) => s === 'online' ? 'bg-green-400' : s === 'away' ? 'bg-amber-400' : 'bg-gray-500'
  const statusLabel = (s) => s === 'online' ? 'Online' : s === 'away' ? 'Ausente' : 'Offline'
  const gameStatusBadge = (s) => s === 'playing' ? 'bg-purple-900/60 text-purple-200' : s === 'completed' ? 'bg-teal-900/60 text-teal-200' : 'bg-red-900/40 text-red-300'
  const gameStatusLabel = (s) => s === 'playing' ? 'Jugando' : s === 'completed' ? 'Completado' : 'Abandonado'
  const progressColor = (pct) => pct < 33 ? 'bg-teal-500' : pct < 66 ? 'bg-amber-500' : 'bg-purple-500'

  return (
    <>
      <Head>
        <title>Game CRM</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="max-w-6xl mx-auto px-4 py-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎮</span>
              <h1 className="text-xl font-semibold text-white">Game CRM</h1>
            </div>
            <div className="flex gap-2">
              {selected && (
                <button onClick={() => { setGName(''); setGStatus('playing'); setGPct(0); setGHours(''); setSelectedHltb(null); setHltbResults([]); setModal('game') }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-sm text-gray-300 hover:bg-white/5 transition-colors">
                  + Juego
                </button>
              )}
              <button onClick={() => { setFName(''); setFUser(''); setFStatus('offline'); setModal('friend') }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-sm text-gray-300 hover:bg-white/5 transition-colors">
                + Amigo
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { num: friends.length, label: 'Amigos' },
              { num: playing, label: 'Jugando ahora' },
              { num: `${Math.round(totalHours)}h`, label: 'Horas totales' },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-white/5 bg-white/3 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="text-2xl font-semibold text-white">{s.num}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1 w-fit">
            {['friends', 'activity'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${tab === t ? 'bg-white/10 text-white font-medium' : 'text-gray-500 hover:text-gray-300'}`}>
                {t === 'friends' ? 'Amigos' : 'Actividad'}
              </button>
            ))}
          </div>

          {/* Friends tab */}
          {tab === 'friends' && (
            <div className="flex gap-4">
              <div className="flex-1">
                {loading ? (
                  <div className="text-gray-500 text-sm py-8 text-center">Cargando...</div>
                ) : friends.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <div className="text-4xl mb-3">👾</div>
                    <div>Sin amigos aún. ¡Agrega el primero!</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {friends.map((f, idx) => {
                      const color = COLOR_MAP[COLORS[idx % COLORS.length]]
                      const cur = f.games?.find(g => g.status === 'playing')
                      const hoursLeft = cur?.hltb_main ? Math.max(0, cur.hltb_main - (cur.hours_played || 0)) : null
                      return (
                        <div key={f.id}
                          onClick={() => setSelected(selected === f.id ? null : f.id)}
                          className={`rounded-xl border p-4 cursor-pointer transition-all ${selected === f.id ? 'border-purple-500/50 bg-purple-900/10' : 'border-white/5 hover:border-white/10'}`}
                          style={{ background: selected === f.id ? undefined : 'rgba(255,255,255,0.02)' }}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${color.bg} ${color.text}`}>
                              {initials(f.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-white text-sm">{f.name}</div>
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <span className={`w-1.5 h-1.5 rounded-full ${statusDot(f.status)}`}></span>
                                {statusLabel(f.status)} · {f.games?.length || 0} juego{f.games?.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                          {cur ? (
                            <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                              <div className="text-xs text-gray-500 mb-1">Jugando ahora</div>
                              <div className="font-medium text-white text-sm mb-2">{cur.title}</div>
                              <div className="flex justify-between items-center text-xs text-gray-400 mb-1.5">
                                <span>{cur.pct}% completado</span>
                                {hoursLeft !== null && <span className="text-purple-400">~{Math.round(hoursLeft)}h restantes</span>}
                              </div>
                              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${progressColor(cur.pct)}`} style={{ width: `${cur.pct}%` }}></div>
                              </div>
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
                  <div className="rounded-xl border border-white/5 p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {/* Friend header */}
                    <div className="flex items-center gap-3 mb-4">
                      {(() => {
                        const idx = friends.findIndex(f => f.id === selected)
                        const color = COLOR_MAP[COLORS[idx % COLORS.length]]
                        return (
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-medium ${color.bg} ${color.text}`}>
                            {initials(selectedFriend.name)}
                          </div>
                        )
                      })()}
                      <div>
                        <div className="font-medium text-white">{selectedFriend.name}</div>
                        <div className="text-xs text-gray-500">@{selectedFriend.username}</div>
                      </div>
                    </div>

                    {/* Current game detail */}
                    {currentGame && (
                      <>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Juego actual</div>
                        <div className="mb-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-medium text-white text-sm">{currentGame.title}</div>
                            <div className="flex gap-1">
                              <button onClick={() => openEditGame(currentGame)} className="text-gray-600 hover:text-gray-400 text-xs px-1.5 py-0.5 rounded border border-white/5 hover:border-white/10 transition-colors">✏️</button>
                              <button onClick={() => deleteGame(currentGame.id)} className="text-gray-600 hover:text-red-400 text-xs px-1.5 py-0.5 rounded border border-white/5 hover:border-red-500/20 transition-colors">✕</button>
                            </div>
                          </div>
                          <div className="mt-3 space-y-1.5">
                            {[
                              ['Horas jugadas', `${currentGame.hours_played}h`],
                              currentGame.hltb_main && ['Historia (HLTB)', `${currentGame.hltb_main}h`],
                              currentGame.hltb_extra && ['Historia + extras', `${currentGame.hltb_extra}h`],
                              currentGame.hltb_complete && ['Completionista', `${currentGame.hltb_complete}h`],
                              currentGame.hltb_main && ['Horas restantes', `~${Math.max(0, currentGame.hltb_main - currentGame.hours_played).toFixed(0)}h`],
                            ].filter(Boolean).map(([label, val]) => (
                              <div key={label} className="flex justify-between text-xs">
                                <span className="text-gray-500">{label}</span>
                                <span className={label === 'Horas restantes' ? 'text-purple-400 font-medium' : 'text-gray-300'}>{val}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Completitud</span><span>{currentGame.pct}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                              <div className={`h-full rounded-full ${progressColor(currentGame.pct)}`} style={{ width: `${currentGame.pct}%` }}></div>
                            </div>
                          </div>
                        </div>
                        <div className="border-t border-white/5 mb-4"></div>
                      </>
                    )}

                    {/* History */}
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Historial</div>
                    {history.length === 0 ? (
                      <div className="text-xs text-gray-600">Sin juegos anteriores.</div>
                    ) : (
                      <div className="space-y-2">
                        {history.map(g => (
                          <div key={g.id} className="flex items-center gap-2.5 group">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-gray-300 truncate">{g.title}</div>
                              <div className="text-xs text-gray-600">{g.hours_played}h · {new Date(g.created_at).toLocaleDateString('es-CL')}</div>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${gameStatusBadge(g.status)}`}>{gameStatusLabel(g.status)}</span>
                              <button onClick={() => openEditGame(g)} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-gray-400 text-xs transition-all">✏️</button>
                              <button onClick={() => deleteGame(g.id)} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 text-xs transition-all">✕</button>
                            </div>
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
          {tab === 'activity' && (
            <div className="space-y-2">
              {allGames.length === 0 ? (
                <div className="text-center py-16 text-gray-500">Sin actividad registrada.</div>
              ) : allGames.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(g => {
                const idx = friends.findIndex(f => f.name === g.friendName)
                const color = COLOR_MAP[COLORS[idx % COLORS.length]]
                return (
                  <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${color.bg} ${color.text}`}>
                      {initials(g.friendName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-300"><span className="text-gray-500">{g.friendName}</span> — {g.title}</div>
                      <div className="text-xs text-gray-600">{g.hours_played}h jugadas · {new Date(g.created_at).toLocaleDateString('es-CL')}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${gameStatusBadge(g.status)}`}>{gameStatusLabel(g.status)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal backdrop */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="rounded-2xl border border-white/10 p-6 w-full max-w-sm" style={{ background: '#1a1a24' }}>

            {/* Add friend modal */}
            {modal === 'friend' && (
              <>
                <h2 className="text-base font-semibold text-white mb-4">Agregar amigo</h2>
                {[
                  { label: 'Nombre', value: fName, set: setFName, placeholder: 'ej. Rodrigo' },
                  { label: 'Usuario / alias', value: fUser, set: setFUser, placeholder: 'ej. rod_plays' },
                ].map(f => (
                  <div key={f.label} className="mb-3">
                    <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                    <input value={f.value} onChange={e => f.set(e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50" />
                  </div>
                ))}
                <div className="mb-4">
                  <label className="block text-xs text-gray-500 mb-1">Estado inicial</label>
                  <select value={fStatus} onChange={e => setFStatus(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50">
                    <option value="online">Online</option>
                    <option value="away">Ausente</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors">Cancelar</button>
                  <button onClick={addFriend} disabled={saving}
                    className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg transition-colors">
                    {saving ? 'Guardando...' : 'Agregar'}
                  </button>
                </div>
              </>
            )}

            {/* Add game modal */}
            {modal === 'game' && (
              <>
                <h2 className="text-base font-semibold text-white mb-1">Agregar juego</h2>
                <p className="text-xs text-gray-500 mb-4">Para {selectedFriend?.name}</p>
                <div className="mb-3 relative">
                  <label className="block text-xs text-gray-500 mb-1">Juego</label>
                  <input value={gName} onChange={e => handleGNameChange(e.target.value)}
                    placeholder="Buscar en HowLongToBeat..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50"
                    autoComplete="off" />
                  {(hltbLoading || hltbResults.length > 0) && (
                    <div className="absolute z-10 w-full mt-1 rounded-lg border border-white/10 overflow-hidden" style={{ background: '#1e1e2e' }}>
                      {hltbLoading ? (
                        <div className="px-3 py-2 text-sm text-gray-500">Buscando...</div>
                      ) : hltbResults.map((g, i) => (
                        <div key={i} onClick={() => { setGName(g.title); setSelectedHltb(g); setHltbResults([]) }}
                          className="px-3 py-2 text-sm text-gray-300 hover:bg-white/5 cursor-pointer flex justify-between">
                          <span>{g.title}</span>
                          <span className="text-gray-600 text-xs">{g.main}h</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedHltb && (
                  <div className="mb-3 rounded-lg p-3 text-xs space-y-1" style={{ background: 'rgba(124,92,255,0.08)' }}>
                    <div className="text-purple-400 font-medium mb-1">Datos de HowLongToBeat</div>
                    {[['Historia', selectedHltb.main], ['Historia + extras', selectedHltb.extra], ['Completionista', selectedHltb.complete]].map(([l, v]) => (
                      <div key={l} className="flex justify-between"><span className="text-gray-500">{l}</span><span className="text-gray-300">{v}h</span></div>
                    ))}
                  </div>
                )}

                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1">Estado</label>
                  <select value={gStatus} onChange={e => setGStatus(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50">
                    <option value="playing">Jugando</option>
                    <option value="completed">Completado</option>
                    <option value="dropped">Abandonado</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">% Completado</label>
                    <input type="number" min="0" max="100" value={gPct} onChange={e => setGPct(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Horas jugadas</label>
                    <input type="number" min="0" step="0.5" value={gHours} onChange={e => setGHours(e.target.value)}
                      placeholder="ej. 12.5"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50" />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors">Cancelar</button>
                  <button onClick={addGame} disabled={saving}
                    className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg transition-colors">
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </>
            )}

            {/* Edit game modal */}
            {modal === 'editGame' && editGame && (
              <>
                <h2 className="text-base font-semibold text-white mb-1">Editar juego</h2>
                <p className="text-xs text-gray-500 mb-4">{editGame.title}</p>
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1">Estado</label>
                  <select value={gStatus} onChange={e => setGStatus(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50">
                    <option value="playing">Jugando</option>
                    <option value="completed">Completado</option>
                    <option value="dropped">Abandonado</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">% Completado</label>
                    <input type="number" min="0" max="100" value={gPct} onChange={e => setGPct(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Horas jugadas</label>
                    <input type="number" min="0" step="0.5" value={gHours} onChange={e => setGHours(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50" />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors">Cancelar</button>
                  <button onClick={updateGame} disabled={saving}
                    className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg transition-colors">
                    {saving ? 'Guardando...' : 'Actualizar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
