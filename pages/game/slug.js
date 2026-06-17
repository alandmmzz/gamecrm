import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { ChevronLeft, Star, Clock, ExternalLink, Gamepad2, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { getProfile } from '../../lib/auth'

const initials = (n) => n ? n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) : '?'

function StarDisplay({ value, size = 12 }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} size={size} style={{
          fill: n <= value ? '#EF9F27' : 'transparent',
          stroke: n <= value ? '#EF9F27' : 'var(--text-muted)',
          flexShrink: 0
        }} />
      ))}
    </span>
  )
}

const gameBadge = (s) => s==='playing'?'game-badge-playing':s==='completed'?'game-badge-completed':'game-badge-dropped'
const gameLabel = (s) => s==='playing'?'Jugando':s==='completed'?'Completado':'Abandonado'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-CL') : null

export default function GamePage() {
  const router = useRouter()
  const { slug } = router.query

  const [myProfile, setMyProfile] = useState(null)
  const [detail, setDetail] = useState(null)
  const [reviews, setReviews] = useState([])
  const [friends, setFriends] = useState([])
  const [hltb, setHltb] = useState(null)
  const [loading, setLoading] = useState(true)
  const [descExpanded, setDescExpanded] = useState(false)
  const [trailerError, setTrailerError] = useState(false)

  const title = slug ? decodeURIComponent(slug) : null

  // Auth (optional — guests can view)
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const profile = await getProfile(session)
      setMyProfile(profile)
    })
  }, [])

  // Load everything once title is ready
  useEffect(() => {
    if (!title) return
    setLoading(true)

    Promise.all([
      fetch(`/api/gamedetail?title=${encodeURIComponent(title)}`).then(r => r.json()),
      fetch(`/api/reviews?game_title=${encodeURIComponent(title)}`).then(r => r.json()),
      fetch('/api/friends').then(r => r.json()),
      fetch(`/api/hltb?q=${encodeURIComponent(title)}`).then(r => r.json()),
    ]).then(([detailData, reviewsData, friendsData, hltbData]) => {
      setDetail(detailData)
      setReviews(Array.isArray(reviewsData) ? reviewsData : [])
      setFriends(Array.isArray(friendsData) ? friendsData : [])
      // Pick best HLTB match
      const hltbMatch = Array.isArray(hltbData)
        ? hltbData.find(h => h.title.toLowerCase() === title.toLowerCase()) || hltbData[0]
        : null
      setHltb(hltbMatch || null)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [title])

  // Friends who have this game
  const friendsWithGame = friends.map(f => {
    const game = (f.games || []).find(g => g.title.toLowerCase() === title?.toLowerCase())
    return game ? { friend: f, game } : null
  }).filter(Boolean)

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const handleBack = () => {
    if (window.history.length > 1) router.back()
    else router.push('/')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'var(--bg-app)'}}>
      <div className="w-6 h-6 border-2 border-white/10 border-t-purple-400 rounded-full animate-spin" />
    </div>
  )

  const desc = detail?.description || null
  const shortDesc = desc ? desc.slice(0, 280) : null
  const needsExpand = desc && desc.length > 280

  return (
    <>
      <Head>
        <title>{title} · Game CRM</title>
      </Head>

      <div className="min-h-screen pb-16" style={{background:'var(--bg-app)'}}>

        {/* Hero — cover as background */}
        <div className="relative">
          {detail?.background_url && (
            <>
              <div className="absolute inset-0 h-56 md:h-72"
                style={{
                  backgroundImage: `url(${detail.background_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center top',
                }} />
              <div className="absolute inset-0 h-56 md:h-72"
                style={{background: 'linear-gradient(to bottom, rgba(15,15,19,0.4) 0%, rgba(15,15,19,1) 100%)'}} />
            </>
          )}

          {/* Back button */}
          <div className="relative z-10 px-4 pt-4">
            <button onClick={handleBack}
              className="w-9 h-9 flex items-center justify-center rounded-xl border transition-colors hover:bg-white/10"
              style={{borderColor:'rgba(255,255,255,0.15)', color:'white', background:'rgba(0,0,0,0.3)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)'}}>
              <ChevronLeft size={18} />
            </button>
          </div>

          {/* Title area */}
          <div className="relative z-10 px-4 pt-4 pb-6" style={{marginTop: detail?.background_url ? '80px' : '8px'}}>
            <div className="flex items-end gap-4">
              {detail?.cover_url && (
                <img src={detail.cover_url} alt={title}
                  className="w-20 h-28 rounded-xl object-cover flex-shrink-0 shadow-xl"
                  style={{border:'2px solid rgba(255,255,255,0.1)'}}
                  onError={e=>e.target.style.display='none'} />
              )}
              <div className="flex-1 min-w-0 pb-1">
                <h1 className="text-2xl font-bold text-white leading-tight mb-2">{title}</h1>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(detail?.genres || []).map(g => (
                    <span key={g} className="text-xs px-2 py-0.5 rounded-full"
                      style={{background:'rgba(127,119,221,0.2)', border:'1px solid rgba(127,119,221,0.3)', color:'rgb(180,176,255)'}}>
                      {g}
                    </span>
                  ))}
                </div>
                {avgRating && (
                  <div className="flex items-center gap-2">
                    <StarDisplay value={Math.round(avgRating)} size={13} />
                    <span className="text-sm font-semibold" style={{color:'#EF9F27'}}>{avgRating}</span>
                    <span className="text-xs" style={{color:'var(--text-muted)'}}>({reviews.length} reseña{reviews.length !== 1 ? 's' : ''})</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 space-y-5">

          {/* HLTB times */}
          {hltb && (hltb.main || hltb.extra || hltb.complete) && (
            <div className="rounded-2xl p-4" style={{background:'var(--bg-card)', border:'1px solid var(--border)'}}>
              <div className="text-xs font-medium uppercase tracking-wider mb-3" style={{color:'var(--text-muted)'}}>
                <Clock size={11} className="inline mr-1.5" />HowLongToBeat
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Historia', val: hltb.main },
                  { label: 'Historia +', val: hltb.extra },
                  { label: '100%', val: hltb.complete },
                ].map(({ label, val }) => val ? (
                  <div key={label}>
                    <div className="text-lg font-semibold text-white">{val}h</div>
                    <div className="text-xs" style={{color:'var(--text-muted)'}}>{label}</div>
                  </div>
                ) : null)}
              </div>
            </div>
          )}

          {/* Trailer */}
          {detail?.trailer_url && detail?.trailer_type === 'mp4' && !trailerError && (
            <div className="rounded-2xl overflow-hidden" style={{border:'1px solid var(--border)'}}>
              <video
                src={detail.trailer_url}
                controls
                className="w-full"
                style={{maxHeight:'280px', background:'#000'}}
                onError={() => setTrailerError(true)}
              />
            </div>
          )}
          {detail?.trailer_type === 'youtube_search' && (
            <a href={detail.trailer_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm transition-colors hover:bg-white/5"
              style={{background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-muted)'}}>
              <ExternalLink size={14} />
              Ver trailer en YouTube
            </a>
          )}

          {/* Description */}
          {desc && (
            <div className="rounded-2xl p-4" style={{background:'var(--bg-card)', border:'1px solid var(--border)'}}>
              <div className="text-xs font-medium uppercase tracking-wider mb-3" style={{color:'var(--text-muted)'}}>Descripción</div>
              <p className="text-sm leading-relaxed" style={{color:'var(--text-secondary)'}}>
                {descExpanded ? desc : shortDesc}{needsExpand && !descExpanded ? '…' : ''}
              </p>
              {needsExpand && (
                <button onClick={() => setDescExpanded(p => !p)}
                  className="flex items-center gap-1 text-xs mt-3 transition-colors hover:opacity-80"
                  style={{color:'#7F77DD'}}>
                  {descExpanded ? <><ChevronUp size={13} /> Leer menos</> : <><ChevronDown size={13} /> Leer más</>}
                </button>
              )}
            </div>
          )}

          {/* Info grid */}
          {(detail?.released || detail?.developers?.length || detail?.publishers?.length || detail?.metacritic || detail?.platforms?.length) && (
            <div className="rounded-2xl p-4" style={{background:'var(--bg-card)', border:'1px solid var(--border)'}}>
              <div className="text-xs font-medium uppercase tracking-wider mb-3" style={{color:'var(--text-muted)'}}>Info</div>
              <div className="space-y-2">
                {[
                  { label: 'Lanzamiento', val: detail.released ? fmtDate(detail.released) : null },
                  { label: 'Desarrollador', val: detail.developers?.join(', ') || null },
                  { label: 'Publisher', val: detail.publishers?.join(', ') || null },
                  { label: 'Plataformas', val: detail.platforms?.join(', ') || null },
                  { label: 'Metacritic', val: detail.metacritic ? `${detail.metacritic}/100` : null },
                ].filter(x => x.val).map(({ label, val }) => (
                  <div key={label} className="flex justify-between gap-4 text-sm">
                    <span className="flex-shrink-0" style={{color:'var(--text-muted)'}}>{label}</span>
                    <span className="text-right" style={{color:'var(--text-secondary)'}}>{val}</span>
                  </div>
                ))}
                {detail.website && (
                  <a href={detail.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm transition-colors hover:opacity-80"
                    style={{color:'#7F77DD'}}>
                    <ExternalLink size={12} /> Sitio oficial
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Who has it in the group */}
          {friendsWithGame.length > 0 && (
            <div className="rounded-2xl p-4" style={{background:'var(--bg-card)', border:'1px solid var(--border)'}}>
              <div className="text-xs font-medium uppercase tracking-wider mb-3" style={{color:'var(--text-muted)'}}>
                En el grupo
              </div>
              <div className="space-y-3">
                {friendsWithGame.map(({ friend: f, game: g }) => (
                  <button key={f.id} onClick={() => router.push(`/?profile=${f.id}`)}
                    className="w-full flex items-center gap-3 text-left transition-colors hover:bg-white/5 rounded-xl p-2 -mx-2">
                    {f.avatar_url
                      ? <img src={f.avatar_url} className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                          onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex'}} />
                      : null}
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 avatar-initials"
                      style={{display: f.avatar_url ? 'none' : 'flex'}}>
                      {initials(f.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium" style={{color:'var(--text-primary)'}}>{f.name}</div>
                      <div className="text-xs" style={{color:'var(--text-muted)'}}>
                        {g.hours_played}h jugadas
                        {g.pct > 0 && ` · ${g.pct}% completado`}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${gameBadge(g.status)}`}>
                      {gameLabel(g.status)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="rounded-2xl p-4" style={{background:'var(--bg-card)', border:'1px solid var(--border)'}}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-medium uppercase tracking-wider" style={{color:'var(--text-muted)'}}>
                Reseñas del grupo
              </div>
              {myProfile && (
                <button
                  onClick={() => router.push(`/review?game=${encodeURIComponent(title+'|||'+(detail?.cover_url||''))}&from=${myProfile.id}`)}
                  className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                  style={{background:'rgba(127,119,221,0.12)', color:'#7F77DD', border:'1px solid rgba(127,119,221,0.25)'}}>
                  <Star size={11} style={{fill: reviews.find(r=>r.friend_id===myProfile.id) ? '#7F77DD' : 'transparent', stroke:'#7F77DD'}} />
                  {reviews.find(r => r.friend_id === myProfile.id) ? 'Tu reseña' : 'Reseñar'}
                </button>
              )}
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-sm mb-1" style={{color:'var(--text-muted)'}}>Sin reseñas todavía</div>
                <div className="text-xs" style={{color:'var(--text-muted)', opacity:0.6}}>Sé el primero del grupo en reseñarlo</div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Rating summary */}
                {avgRating && (
                  <div className="flex items-center gap-4 pb-4 border-b border-white/5">
                    <div className="text-4xl font-bold" style={{color:'#EF9F27'}}>{avgRating}</div>
                    <div>
                      <StarDisplay value={Math.round(avgRating)} size={16} />
                      <div className="text-xs mt-1" style={{color:'var(--text-muted)'}}>{reviews.length} reseña{reviews.length !== 1 ? 's' : ''}</div>
                    </div>
                    {reviews.some(r => r.no_apto_angelitos) && (
                      <div className="ml-auto text-right">
                        <div className="text-lg">😇</div>
                        <div className="text-xs" style={{color:'var(--text-muted)'}}>no apto angelitos</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Individual reviews */}
                {reviews.map(rev => (
                  <div key={rev.id} className="flex gap-3">
                    {rev.friend?.avatar_url
                      ? <img src={rev.friend.avatar_url} className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5"
                          onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex'}} />
                      : null}
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5 avatar-initials"
                      style={{display: rev.friend?.avatar_url ? 'none' : 'flex', fontSize:'10px'}}>
                      {initials(rev.friend?.name || '?')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-medium" style={{color:'var(--text-primary)'}}>{rev.friend?.name}</span>
                        <StarDisplay value={rev.rating} size={12} />
                        <span className="text-xs font-semibold" style={{color:'#EF9F27'}}>{rev.rating}/5</span>
                        {rev.no_apto_angelitos && <span className="text-xs" title="No apto para angelitos">😇</span>}
                      </div>
                      {rev.comment && (
                        <p className="text-sm leading-relaxed" style={{color:'var(--text-secondary)'}}>{rev.comment}</p>
                      )}
                      <div className="text-xs mt-1.5" style={{color:'var(--text-muted)', opacity:0.6}}>{fmtDate(rev.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}
