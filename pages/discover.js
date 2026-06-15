import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

const HARDCODED_USER = 'Aland'

function GameCard({ game, onLike, onSkip }) {
  const [dragging, setDragging] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const cardRef = useRef(null)

  const handleStart = (x, y) => {
    setDragging(true)
    setStartPos({ x, y })
  }
  const handleMove = (x, y) => {
    if (!dragging) return
    setOffset({ x: x - startPos.x, y: y - startPos.y })
  }
  const handleEnd = () => {
    if (!dragging) return
    setDragging(false)
    if (offset.x > 80) onLike()
    else if (offset.x < -80) onSkip()
    else setOffset({ x: 0, y: 0 })
  }

  const rotation = offset.x * 0.08
  const opacity = Math.max(0, 1 - Math.abs(offset.x) / 300)
  const likeOpacity = Math.min(1, Math.max(0, offset.x / 80))
  const skipOpacity = Math.min(1, Math.max(0, -offset.x / 80))

  return (
    <div ref={cardRef}
      className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
      style={{ transform: `translateX(${offset.x}px) translateY(${offset.y * 0.3}px) rotate(${rotation}deg)`, transition: dragging ? 'none' : 'transform 0.3s ease' }}
      onMouseDown={e => handleStart(e.clientX, e.clientY)}
      onMouseMove={e => handleMove(e.clientX, e.clientY)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={e => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={e => { e.preventDefault(); handleMove(e.touches[0].clientX, e.touches[0].clientY) }}
      onTouchEnd={handleEnd}>

      {/* Card */}
      <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 relative" style={{background:'#1a1a24'}}>
        {/* Cover image */}
        {game.cover_url
          ? <img src={game.cover_url} alt={game.title} className="w-full h-48 object-cover" onError={e=>e.target.style.display='none'} />
          : <div className="w-full h-48 flex items-center justify-center text-6xl" style={{background:'rgba(127,119,221,0.1)'}}>🎮</div>
        }

        {/* Like / Skip overlays */}
        <div className="absolute top-6 left-6 px-4 py-2 rounded-xl border-2 border-teal-400 text-teal-400 font-bold text-lg rotate-[-12deg]"
          style={{opacity: likeOpacity, background:'rgba(93,202,165,0.1)'}}>
          ME LATE
        </div>
        <div className="absolute top-6 right-6 px-4 py-2 rounded-xl border-2 border-red-400 text-red-400 font-bold text-lg rotate-[12deg]"
          style={{opacity: skipOpacity, background:'rgba(239,68,68,0.1)'}}>
          PASO
        </div>

        {/* Content */}
        <div className="p-5">
          <h2 className="text-xl font-semibold text-white mb-1">{game.title}</h2>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(game.genres||[]).map(g => (
              <span key={g} className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-gray-400">{g}</span>
            ))}
          </div>
          {game.hltb_main && (
            <div className="text-xs text-gray-500 mb-2">⏱ ~{game.hltb_main}h para completar</div>
          )}
          {game.description && (
            <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">{game.description}</p>
          )}
          <div className="mt-3 text-xs text-gray-600">
            {game.reason && <span>✦ {game.reason}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Discover() {
  const router = useRouter()
  const [friends, setFriends] = useState([])
  const [userGames, setUserGames] = useState([])
  const [queue, setQueue] = useState([])
  const [liked, setLiked] = useState([])
  const [skipped, setSkipped] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const r = await fetch('/api/friends')
    const data = await r.json()
    setFriends(data || [])
    const user = (data || []).find(f => f.name === HARDCODED_USER)
    if (user) {
      setUserGames(user.games || [])
      await generateRecommendations(user.games || [], data || [])
    }
    setLoading(false)
  }

  const generateRecommendations = async (games, allFriends) => {
    setGenerating(true)

    // Get top genres from user
    const genreMap = {}
    games.forEach(g => {
      (g.genres||[]).forEach(genre => {
        genreMap[genre] = (genreMap[genre]||0) + (g.hours_played||0)
      })
    })
    const topGenres = Object.entries(genreMap).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([g])=>g)
    const playedTitles = games.map(g => g.title.toLowerCase())

    // Get games friends play that user doesn't
    const friendGames = allFriends
      .filter(f => f.name !== HARDCODED_USER)
      .flatMap(f => (f.games||[]).map(g => ({...g, playedBy: f.name})))
      .filter(g => !playedTitles.includes(g.title.toLowerCase()) && g.hours_played > 2)

    // Dedupe and score by genre match
    const seen = new Set()
    const candidates = friendGames
      .filter(g => { if (seen.has(g.title.toLowerCase())) return false; seen.add(g.title.toLowerCase()); return true })
      .map(g => {
        const genreMatch = (g.genres||[]).filter(genre => topGenres.includes(genre)).length
        return { ...g, genreMatch, reason: genreMatch > 0 ? `Comparte géneros con tus favoritos` : `Lo juega ${g.playedBy}` }
      })
      .sort((a,b) => b.genreMatch - a.genreMatch || b.hours_played - a.hours_played)
      .slice(0, 20)

    // Ask Claude to fill in and recommend more
    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `A gamer's top genres are: ${topGenres.join(', ')}. They already play: ${playedTitles.slice(0,10).join(', ')}.
            
Recommend 8 games they'd likely enjoy. Return ONLY a JSON array, no markdown:
[{"title":"...","genres":["..."],"hltb_main":N,"description":"one sentence spoiler-free description","reason":"why they'd like it based on their taste","cover_url":"steam CDN URL if known or null"}]`
          }]
        })
      })
      const d = await resp.json()
      const text = d.content?.find(b=>b.type==='text')?.text || '[]'
      const aiGames = JSON.parse(text.replace(/```json|```/g,'').trim()).filter(g => !playedTitles.includes(g.title.toLowerCase()))
      setQueue([...candidates, ...aiGames].slice(0, 25))
    } catch {
      setQueue(candidates)
    }
    setGenerating(false)
  }

  const handleLike = () => {
    if (!queue.length) return
    setLiked(p => [...p, queue[0]])
    setQueue(p => p.slice(1))
    if (queue.length <= 1) setDone(true)
  }

  const handleSkip = () => {
    if (!queue.length) return
    setSkipped(p => [...p, queue[0]])
    setQueue(p => p.slice(1))
    if (queue.length <= 1) setDone(true)
  }

  const current = queue[0]
  const next = queue[1]

  return (
    <>
      <Head><title>Descubrir — Game CRM</title></Head>
      <div className="min-h-screen flex flex-col" style={{fontFamily:'Inter,sans-serif'}}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
          <button onClick={()=>router.push('/')} className="text-sm text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors">
            ‹ Volver
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">✦</span>
            <span className="font-semibold text-white">Descubrir</span>
          </div>
          <div className="text-xs text-gray-600">{queue.length} juegos</div>
        </div>

        {loading || generating ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-white/10 border-t-purple-400 rounded-full animate-spin"></div>
            <div className="text-sm text-gray-500">{generating ? 'Generando recomendaciones...' : 'Cargando...'}</div>
          </div>
        ) : done || !current ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="text-5xl mb-4">🎮</div>
            <h2 className="text-xl font-semibold text-white mb-2">¡Eso es todo por hoy!</h2>
            <p className="text-sm text-gray-500 mb-6">Le diste me late a {liked.length} juego{liked.length!==1?'s':''}</p>
            {liked.length > 0 && (
              <div className="w-full max-w-sm">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Te interesaron</div>
                <div className="space-y-2">
                  {liked.map((g,i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-teal-500/20" style={{background:'rgba(93,202,165,0.05)'}}>
                      {g.cover_url && <img src={g.cover_url} alt={g.title} className="w-8 h-10 rounded object-cover flex-shrink-0" onError={e=>e.target.style.display='none'} />}
                      <div className="text-sm text-white">{g.title}</div>
                      <span className="ml-auto text-teal-400 text-xs">♥</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={()=>{setDone(false);setLiked([]);setSkipped([]);loadData()}} className="mt-6 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm text-white transition-colors">
              Volver a descubrir
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
            {/* Cards stack */}
            <div className="relative w-full max-w-sm" style={{height:'420px'}}>
              {/* Next card (behind) */}
              {next && (
                <div className="absolute inset-0 rounded-2xl border border-white/5 scale-95 translate-y-4 overflow-hidden" style={{background:'#1a1a24', zIndex:0}}>
                  {next.cover_url && <img src={next.cover_url} alt={next.title} className="w-full h-48 object-cover opacity-50" />}
                </div>
              )}
              {/* Current card */}
              <div style={{zIndex:1, position:'relative', height:'100%'}}>
                <GameCard game={current} onLike={handleLike} onSkip={handleSkip} />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-6 mt-6">
              <button onClick={handleSkip}
                className="w-14 h-14 rounded-full border border-red-500/30 flex items-center justify-center text-2xl hover:bg-red-500/10 transition-colors">
                ✕
              </button>
              <button onClick={handleLike}
                className="w-14 h-14 rounded-full border border-teal-500/30 flex items-center justify-center text-2xl hover:bg-teal-500/10 transition-colors">
                ♥
              </button>
            </div>

            {/* Progress */}
            <div className="mt-4 text-xs text-gray-600">
              {liked.length} ♥ · {skipped.length} pasados · {queue.length} restantes
            </div>
          </div>
        )}
      </div>
    </>
  )
}
