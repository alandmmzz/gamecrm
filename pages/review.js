import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { Star, Search, ChevronLeft, Gamepad2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getProfile } from '../lib/auth'

const initials = (n) => n ? n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) : '?'

function StarRating({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => {
        const filled = n <= (hovered || value)
        return (
          <button
            key={n}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange && onChange(n)}
            onMouseEnter={() => !readonly && setHovered(n)}
            onMouseLeave={() => !readonly && setHovered(0)}
            className={`transition-all ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
          >
            <Star
              size={readonly ? 14 : 32}
              className="transition-colors"
              style={{
                fill: filled ? '#EF9F27' : 'transparent',
                stroke: filled ? '#EF9F27' : 'var(--text-muted)',
              }}
            />
          </button>
        )
      })}
    </div>
  )
}

export default function ReviewPage() {
  const router = useRouter()
  const { game: gameParam, from: fromParam } = router.query

  const [myProfile, setMyProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Game search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selectedGame, setSelectedGame] = useState(null) // { title, cover_url }

  // Review fields
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  // Existing review for this user+game
  const [existingReview, setExistingReview] = useState(null)

  const searchTimer = useRef(null)

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/login'); return }
      const profile = await getProfile(session)
      if (!profile) { router.replace('/onboarding'); return }
      setMyProfile(profile)
      setLoading(false)
    })
  }, [])

  // If game was passed via query param, pre-select it
  useEffect(() => {
    if (!router.isReady || !gameParam) return
    // gameParam is "title|||cover_url" encoded
    const [title, cover] = decodeURIComponent(gameParam).split('|||')
    if (title) {
      setSelectedGame({ title, cover_url: cover || null })
      setSearchQuery(title)
    }
  }, [router.isReady, gameParam])

  // Load existing review when game + profile are ready
  useEffect(() => {
    if (!myProfile || !selectedGame) return
    fetch(`/api/reviews?game_title=${encodeURIComponent(selectedGame.title)}`)
      .then(r => r.json())
      .then(reviews => {
        const mine = reviews.find(r => r.friend_id === myProfile.id)
        if (mine) {
          setExistingReview(mine)
          setRating(mine.rating)
          setComment(mine.comment || '')
        } else {
          setExistingReview(null)
          setRating(0)
          setComment('')
        }
      })
      .catch(() => {})
  }, [myProfile, selectedGame])

  const searchGames = async (q) => {
    if (!q || q.length < 2) { setSearchResults([]); return }
    setSearching(true)
    try {
      const r = await fetch(`/api/hltb?q=${encodeURIComponent(q)}`)
      const data = await r.json()
      setSearchResults(Array.isArray(data) ? data.slice(0,6) : [])
    } catch { setSearchResults([]) }
    setSearching(false)
  }

  const handleSearchChange = (v) => {
    setSearchQuery(v)
    setSelectedGame(null)
    clearTimeout(searchTimer.current)
    if (v.length >= 2) {
      setSearching(true)
      searchTimer.current = setTimeout(() => searchGames(v), 600)
    } else {
      setSearchResults([])
    }
  }

  const selectGame = async (result) => {
    setSearchQuery(result.title)
    setSearchResults([])
    setSearching(false)
    // Try to get cover from RAWG
    let cover_url = null
    try {
      const r = await fetch(`/api/gameinfo?title=${encodeURIComponent(result.title)}`)
      const info = await r.json()
      cover_url = info.cover_url || null
    } catch {}
    setSelectedGame({ title: result.title, cover_url })
  }

  const handleSave = async () => {
    if (!myProfile || !selectedGame || rating === 0) return
    setSaving(true)
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          friend_id: myProfile.id,
          game_title: selectedGame.title,
          game_cover: selectedGame.cover_url || null,
          rating,
          comment: comment.trim() || null,
        })
      })
      setSaved(true)
      setTimeout(() => {
        // Go back to profile or home
        if (fromParam) {
          router.push(`/?profile=${fromParam}`)
        } else {
          router.push('/')
        }
      }, 1200)
    } catch {}
    setSaving(false)
  }

  const handleBack = () => {
    if (fromParam) router.push(`/?profile=${fromParam}`)
    else router.back()
  }

  const inputCls = "w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'var(--bg-app)'}}>
      <div className="w-6 h-6 border-2 border-white/10 border-t-purple-400 rounded-full animate-spin" />
    </div>
  )

  return (
    <>
      <Head>
        <title>Escribir reseña · Game CRM</title>
      </Head>

      <div className="min-h-screen pb-12" style={{background:'var(--bg-app)'}}>
        {/* Header */}
        <div className="sticky top-0 z-20 px-4 py-4 flex items-center gap-3 border-b"
          style={{background:'var(--bg-sidebar)', borderColor:'var(--border)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)'}}>
          <button onClick={handleBack} className="w-9 h-9 flex items-center justify-center rounded-xl border transition-colors hover:bg-white/5"
            style={{borderColor:'var(--border)', color:'var(--text-muted)'}}>
            <ChevronLeft size={18} />
          </button>
          <div>
            <div className="text-sm font-semibold" style={{color:'var(--text-primary)'}}>
              {existingReview ? 'Editar reseña' : 'Nueva reseña'}
            </div>
            <div className="text-xs" style={{color:'var(--text-muted)'}}>
              Como {myProfile?.name}
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 pt-8 space-y-6">

          {/* Game selector */}
          <div>
            <div className="text-xs font-medium uppercase tracking-wider mb-3" style={{color:'var(--text-muted)'}}>
              Juego
            </div>

            {/* Selected game card */}
            {selectedGame ? (
              <div className="flex items-center gap-4 p-4 rounded-2xl mb-3" style={{background:'var(--bg-card)', border:'1px solid var(--border)'}}>
                {selectedGame.cover_url
                  ? <img src={selectedGame.cover_url} alt={selectedGame.title} className="w-12 h-16 rounded-lg object-cover flex-shrink-0" onError={e=>e.target.style.display='none'} />
                  : <div className="w-12 h-16 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:'rgba(127,119,221,0.1)'}}>
                      <Gamepad2 size={20} style={{color:'#7F77DD'}} />
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate" style={{color:'var(--text-primary)'}}>{selectedGame.title}</div>
                  {existingReview && (
                    <div className="text-xs mt-1" style={{color:'var(--text-muted)'}}>Ya tenés una reseña — podés editarla</div>
                  )}
                </div>
                {!gameParam && (
                  <button onClick={() => { setSelectedGame(null); setSearchQuery(''); setRating(0); setComment(''); setExistingReview(null) }}
                    className="text-xs px-2.5 py-1.5 rounded-lg transition-colors hover:bg-white/5"
                    style={{color:'var(--text-muted)', border:'1px solid var(--border)'}}>
                    Cambiar
                  </button>
                )}
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{color:'var(--text-muted)'}}>
                  <Search size={16} />
                </div>
                <input
                  value={searchQuery}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder="Buscar juego..."
                  className={inputCls}
                  style={{
                    background:'var(--bg-input)',
                    border:'1px solid var(--border-input)',
                    color:'var(--text-primary)',
                    paddingLeft:'2.5rem',
                  }}
                  autoFocus
                  autoComplete="off"
                />
                {searching && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-white/10 border-t-purple-400 rounded-full animate-spin" />
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-30 shadow-xl"
                    style={{background:'var(--bg-modal)', border:'1px solid var(--border)'}}>
                    {searchResults.map((r, i) => (
                      <button key={i} onClick={() => selectGame(r)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 border-b last:border-b-0"
                        style={{borderColor:'var(--border)'}}>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm truncate" style={{color:'var(--text-primary)'}}>{r.title}</div>
                          {r.main && <div className="text-xs" style={{color:'var(--text-muted)'}}>{r.main}h historia</div>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rating — only show when game selected */}
          {selectedGame && (
            <>
              <div>
                <div className="text-xs font-medium uppercase tracking-wider mb-4" style={{color:'var(--text-muted)'}}>
                  Puntuación
                </div>
                <div className="flex flex-col items-center gap-3 py-6 rounded-2xl" style={{background:'var(--bg-card)', border:'1px solid var(--border)'}}>
                  <StarRating value={rating} onChange={setRating} />
                  <div className="text-sm h-5" style={{color: rating ? '#EF9F27' : 'var(--text-muted)'}}>
                    {rating === 0 && 'Seleccioná una puntuación'}
                    {rating === 1 && 'Muy malo'}
                    {rating === 2 && 'Malo'}
                    {rating === 3 && 'Regular'}
                    {rating === 4 && 'Bueno'}
                    {rating === 5 && 'Excelente'}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs font-medium uppercase tracking-wider mb-3" style={{color:'var(--text-muted)'}}>
                  Comentario <span style={{color:'var(--text-muted)', opacity:0.6, fontWeight:400, textTransform:'none', letterSpacing:'normal'}}>(opcional)</span>
                </div>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="¿Qué te pareció el juego?"
                  rows={5}
                  className={inputCls}
                  style={{
                    background:'var(--bg-input)',
                    border:'1px solid var(--border-input)',
                    color:'var(--text-primary)',
                    resize:'none',
                  }}
                />
                <div className="text-xs mt-1.5 text-right" style={{color:'var(--text-muted)', opacity: comment.length > 400 ? 1 : 0.5}}>
                  {comment.length}/500
                </div>
              </div>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={saving || saved || rating === 0}
                className="w-full py-4 rounded-2xl text-sm font-semibold transition-all disabled:opacity-50"
                style={{
                  background: saved ? '#5DCAA5' : rating === 0 ? 'var(--bg-card)' : '#7F77DD',
                  color: rating === 0 ? 'var(--text-muted)' : 'white',
                  border: rating === 0 ? '1px solid var(--border)' : 'none',
                }}
              >
                {saved ? '✓ Reseña guardada' : saving ? 'Guardando...' : existingReview ? 'Actualizar reseña' : 'Publicar reseña'}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
