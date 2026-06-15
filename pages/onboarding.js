import { useState, useEffect } from 'react'
import { Link, Sparkles, Camera, Rocket } from 'lucide-react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function Onboarding() {
  const router = useRouter()
  const isAdminMode = router.query.admin === '1'
  const [session, setSession] = useState(null)
  const [step, setStep] = useState('choose')
  const [friends, setFriends] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [linking, setLinking] = useState(false)

  // Create form state
  const [name, setName] = useState('')
  const [steamId, setSteamId] = useState('')
  const [wowChar, setWowChar] = useState('')
  const [wowRealm, setWowRealm] = useState('')
  const [wowRegion, setWowRegion] = useState('us')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && !isAdminMode) { router.replace('/login'); return }
      setSession(session)
      if (session && !isAdminMode) {
        const n = session.user.user_metadata?.full_name ||
                  session.user.user_metadata?.name ||
                  session.user.user_metadata?.login || ''
        setName(n)
        const av = session.user.user_metadata?.avatar_url
        if (av) setAvatarPreview(av)
      }
    })
    if (isAdminMode) setStep('create')
    // Load all unlinked friends
    fetch('/api/friends').then(r=>r.json()).then(data => {
      setFriends((data||[]).filter(f => !f.user_id))
    })
  }, [])

  const filteredFriends = friends.filter(f =>
    !search || f.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const claimProfile = async () => {
    if (!selected || !session) return
    setLinking(true)
    await fetch('/api/friends', {
      method: 'PATCH',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ id: selected.id, user_id: session.user.id, avatar_url: session.user.user_metadata?.avatar_url || selected.avatar_url })
    })
    router.replace('/')
  }

  const createProfile = async () => {
    if (!name.trim() || !session) return
    setSaving(true)
    try {
      // Create friend
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ name: name.trim(), username: name.trim().toLowerCase().replace(/\s+/g,'_'), user_id: isAdminMode ? null : session?.user?.id || null })
      })
      const friend = await res.json()

      // Upload avatar if custom file selected
      if (avatarFile && friend.id) {
        const ext = avatarFile.name.split('.').pop()
        const path = `${friend.id}/avatar.${ext}`
        await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true })
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        await fetch('/api/friends', {
          method: 'PATCH',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ id: friend.id, avatar_url: data.publicUrl })
        })
      } else if (session.user.user_metadata?.avatar_url) {
        // Use OAuth avatar
        await fetch('/api/friends', {
          method: 'PATCH',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ id: friend.id, avatar_url: session.user.user_metadata.avatar_url })
        })
      }

      // Import Steam if provided
      if (steamId.trim()) {
        const steamRes = await fetch(`/api/steam?steamid=${encodeURIComponent(steamId.trim())}`)
        const steamData = await steamRes.json()
        if (steamData.games) {
          for (const g of steamData.games.slice(0, 50)) {
            await fetch('/api/games', {
              method: 'POST',
              headers: {'Content-Type':'application/json'},
              body: JSON.stringify({ friend_id: friend.id, title: g.title, status: 'playing', pct: 0, hours_played: g.hours_played, cover_url: g.cover_url, last_played_at: g.last_played || null })
            })
          }
        }
      }

      router.replace('/')
    } catch (e) {
      console.error(e)
      setSaving(false)
    }
  }

  const inputCls = "w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/50"
  const inputStyle = {background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#e8e8f0'}

  return (
    <>
      <Head><title>Game CRM — Configurá tu perfil</title></Head>
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{background:'#0f0f13', fontFamily:'Inter,sans-serif'}}>
        <div className="w-full max-w-md">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🎮</div>
            <h1 className="text-2xl font-semibold text-white mb-1">Bienvenido a Game CRM</h1>
            <p className="text-sm text-gray-500">Configurá tu perfil para empezar</p>
          </div>

          {step === 'choose' && (
            <div className="space-y-3">
              <button onClick={()=>setStep('claim')}
                className="w-full p-4 rounded-2xl border text-left transition-all hover:border-purple-500/40"
                style={{background:'rgba(255,255,255,0.03)', borderColor:'rgba(255,255,255,0.08)'}}>
                <div className="font-medium text-white mb-1 flex items-center gap-2"><Link size={16} /> Ya tengo un perfil creado</div>
                <div className="text-sm text-gray-500">Alguien ya me agregó — quiero vincular mi cuenta</div>
              </button>
              <button onClick={()=>setStep('create')}
                className="w-full p-4 rounded-2xl border text-left transition-all hover:border-purple-500/40"
                style={{background:'rgba(255,255,255,0.03)', borderColor:'rgba(255,255,255,0.08)'}}>
                <div className="font-medium text-white mb-1 flex items-center gap-2"><Sparkles size={16} /> Crear mi perfil nuevo</div>
                <div className="text-sm text-gray-500">Primera vez — quiero armar mi perfil desde cero</div>
              </button>
            </div>
          )}

          {step === 'claim' && (
            <div>
              <button onClick={()=>setStep('choose')} className="text-sm text-gray-500 hover:text-gray-300 mb-5 flex items-center gap-1">‹ Volver</button>
              <h2 className="text-lg font-semibold text-white mb-1">Buscá tu perfil</h2>
              <p className="text-sm text-gray-500 mb-4">Seleccioná tu nombre y vinculamos tu cuenta</p>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Buscar por nombre..."
                className={inputCls + " mb-3"} style={inputStyle} />
              <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                {filteredFriends.length === 0
                  ? <div className="text-sm text-gray-600 text-center py-4">No hay perfiles sin vincular</div>
                  : filteredFriends.map(f => (
                    <button key={f.id} onClick={()=>setSelected(f)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                      style={{
                        background: selected?.id === f.id ? 'rgba(127,119,221,0.1)' : 'rgba(255,255,255,0.02)',
                        borderColor: selected?.id === f.id ? 'rgba(127,119,221,0.5)' : 'rgba(255,255,255,0.08)'
                      }}>
                      <div className="w-9 h-9 rounded-full bg-purple-900/40 flex items-center justify-center text-sm text-purple-300 flex-shrink-0">
                        {f.name[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{f.name}</div>
                        <div className="text-xs text-gray-500">{f.games?.length || 0} juegos registrados</div>
                      </div>
                      {selected?.id === f.id && <span className="ml-auto text-purple-400">✓</span>}
                    </button>
                  ))
                }
              </div>
              <button onClick={claimProfile} disabled={!selected || linking}
                className="w-full py-3 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-all"
                style={{background:'rgba(127,119,221,0.8)'}}>
                {linking ? 'Vinculando...' : 'Vincular mi cuenta'}
              </button>
            </div>
          )}

          {step === 'create' && (
            <div>
              <button onClick={()=>isAdminMode ? router.push('/') : setStep('choose')} className="text-sm text-gray-500 hover:text-gray-300 mb-5 flex items-center gap-1">‹ Volver</button>
              <h2 className="text-lg font-semibold text-white mb-4">{isAdminMode ? 'Crear nuevo usuario' : 'Creá tu perfil'}</h2>

              {/* Avatar */}
              <div className="flex items-center gap-4 mb-5">
                <label className="cursor-pointer flex-shrink-0">
                  <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center relative group"
                    style={{background:'rgba(127,119,221,0.2)', border:'2px dashed rgba(127,119,221,0.4)'}}>
                    {avatarPreview
                      ? <img src={avatarPreview} className="w-full h-full object-cover" />
                      : <span className="text-2xl">👤</span>
                    }
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                      <Camera size={14} className="text-white" />
                    </div>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
                <div className="flex-1">
                  <div className="text-sm text-white mb-1">Foto de perfil</div>
                  <div className="text-xs text-gray-500">
                    {avatarPreview ? 'Hacé click para cambiar' : 'Hacé click para subir una foto'}
                  </div>
                  {session?.user.user_metadata?.avatar_url && !avatarFile && (
                    <div className="text-xs text-purple-400 mt-1">Usando foto de GitHub/Google</div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1">Nombre *</label>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre" className={inputCls} style={inputStyle} />
              </div>

              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1">Steam ID <span className="text-gray-600">(opcional)</span></label>
                <input value={steamId} onChange={e=>setSteamId(e.target.value)} placeholder="URL de perfil o ID numérico" className={inputCls} style={inputStyle} />
                <p className="text-xs text-gray-600 mt-1">Se importarán tus juegos automáticamente</p>
              </div>

              <div className="mb-6">
                <label className="block text-xs text-gray-500 mb-1">WoW <span className="text-gray-600">(opcional)</span></label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input value={wowChar} onChange={e=>setWowChar(e.target.value)} placeholder="Personaje" className={inputCls} style={inputStyle} />
                  <input value={wowRealm} onChange={e=>setWowRealm(e.target.value)} placeholder="Reino" className={inputCls} style={inputStyle} />
                </div>
                <select value={wowRegion} onChange={e=>setWowRegion(e.target.value)} className={inputCls} style={inputStyle}>
                  <option value="us">Americas (US)</option>
                  <option value="eu">Europa (EU)</option>
                  <option value="kr">Korea (KR)</option>
                  <option value="tw">Taiwan (TW)</option>
                </select>
              </div>

              <button onClick={createProfile} disabled={saving || !name.trim()}
                className="w-full py-3 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-all"
                style={{background:'rgba(127,119,221,0.8)'}}>
                {saving ? 'Creando perfil...' : 'Crear mi perfil'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
