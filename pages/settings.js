import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Sun, Moon, Monitor, Crown, User, LogOut, ChevronLeft, Settings, Trash2, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Camera } from 'lucide-react'
import { signOut } from '../lib/auth'

export default function SettingsPage({ theme, usingSystem, setThemeValue }) {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [myProfile, setMyProfile] = useState(null)
  const [adminView, setAdminView] = useState(true)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [genderSaving, setGenderSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const saveName = async () => {
    if (!nameValue.trim() || !myProfile?.id) return
    setNameSaving(true)
    await supabase.from('friends').update({ name: nameValue.trim() }).eq('id', myProfile.id)
    setMyProfile(p => ({...p, name: nameValue.trim()}))
    setEditingName(false)
    setNameSaving(false)
  }

  const saveGender = async (gender) => {
    if (!myProfile?.id) return
    setGenderSaving(true)
    await supabase.from('friends').update({ gender }).eq('id', myProfile.id)
    setMyProfile(p => ({...p, gender}))
    setGenderSaving(false)
  }

  const deleteProfile = async () => {
    if (!myProfile?.id) return
    setDeleting(true)
    // Delete all games first
    await supabase.from('games').delete().eq('friend_id', myProfile.id)
    // Delete friend
    await supabase.from('friends').delete().eq('id', myProfile.id)
    // Sign out
    await supabase.auth.signOut()
    router.push('/login')
  }

  const [avatarError, setAvatarError] = useState('')

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif']

  const uploadAvatar = async (file) => {
    setAvatarError('')
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!ALLOWED_TYPES.includes(file.type) || !ALLOWED_EXT.includes(ext)) {
      setAvatarError(`Formato no soportado. Usá JPG, PNG, WEBP o GIF.`)
      return
    }
    if (!myProfile?.id) return
    setAvatarUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const path = `${myProfile.id}/avatar.${fileExt}`
      await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const url = data.publicUrl + '?t=' + Date.now()
      await fetch('/api/friends', { method: 'PATCH', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ id: myProfile.id, avatar_url: url }) })
      setMyProfile(p => ({...p, avatar_url: url}))
      // Small delay then reload so other pages pick up new avatar
      setTimeout(() => window.location.reload(), 500)
    } catch (e) { console.error(e); setAvatarError('Error al subir la foto') }
    setAvatarUploading(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session) {
        const { data } = await supabase.from('friends').select('*').eq('user_id', session.user.id).single()
        setMyProfile(data)
      }
    })
    const saved = localStorage.getItem('adminView')
    if (saved !== null) setAdminView(saved === 'true')
  }, [])

  const handleAdminView = (val) => {
    setAdminView(val)
    localStorage.setItem('adminView', String(val))
    // Communicate back to main app via localStorage event
    window.dispatchEvent(new StorageEvent('storage', { key: 'adminView', newValue: String(val) }))
  }

  const isAdmin = myProfile?.is_admin === true

  const Section = ({ title, children }) => (
    <div className="mb-6">
      <div className="text-xs font-medium uppercase tracking-wider mb-3 px-1" style={{color:'var(--text-muted)'}}>{title}</div>
      <div className="rounded-2xl overflow-hidden" style={{border:'1px solid var(--border)'}}>
        {children}
      </div>
    </div>
  )

  const Row = ({ icon: Icon, label, desc, right, onClick, danger }) => (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all hover:opacity-80"
      style={{
        borderBottom:'1px solid var(--border)',
        background:'var(--bg-card)',
        color: danger ? 'rgb(239,68,68)' : 'var(--text-primary)'
      }}>
      {Icon && <Icon size={18} className="flex-shrink-0" style={{color: danger ? 'rgb(239,68,68)' : 'var(--text-muted)'}} />}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {desc && <div className="text-xs mt-0.5" style={{color:'var(--text-muted)'}}>{desc}</div>}
      </div>
      {right}
    </button>
  )

  return (
    <>
      <Head><title>Ajustes — Game CRM</title></Head>
      <div className="min-h-screen" style={{background:'var(--bg-app)', fontFamily:'Inter,sans-serif'}}>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b sticky top-0 z-10" style={{borderColor:'var(--border)', background:'var(--bg-app)'}}>
          <button onClick={()=>router.back()} className="w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:opacity-70" style={{color:'var(--text-primary)'}}>
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-base font-semibold" style={{color:'var(--text-primary)'}}>Ajustes</h1>
        </div>

        <div className="max-w-lg mx-auto px-4 py-6">

          {/* Account */}
          {session && (
            <Section title="Cuenta">
              <div className="flex items-center gap-3 px-4 py-3.5" style={{background:'var(--bg-card)', borderBottom:'1px solid var(--border)'}}>
                <label className="cursor-pointer flex-shrink-0 relative group">
                  {(() => {
                    // Only use OAuth avatar if user has no custom avatar
                    const url = myProfile?.avatar_url || null
                    // Add cache buster if URL doesn't already have one
                    const src = url && !url.includes('?t=') ? url + '?t=' + Date.now() : url
                    return src
                      ? <img src={src} className="w-12 h-12 rounded-full object-cover"
                          onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex'}} />
                      : null
                  })()}
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold avatar-initials"
                    style={{display: myProfile?.avatar_url ? 'none' : 'flex'}}>
                    {(myProfile?.name||'?')[0].toUpperCase()}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera size={14} className="text-white" />
                  </div>
                  <input type="file" accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif" className="hidden" disabled={avatarUploading}
                    onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
                </label>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{color:'var(--text-primary)'}}>{myProfile?.name || 'Usuario'}</div>
                  <div className="text-xs" style={{color:'var(--text-muted)'}}>{session.user.email}</div>
                  <div className="text-xs mt-0.5" style={{color: avatarError ? 'rgb(239,68,68)' : 'var(--text-muted)'}}>
                    {avatarUploading ? 'Subiendo...' : avatarError || 'Tocá la foto para cambiarla'}
                  </div>
                </div>
              </div>
              {/* Edit name */}
              <div className="px-4 py-3.5" style={{background:'var(--bg-card)', borderBottom:'1px solid var(--border)'}}>
                {editingName ? (
                  <div className="flex gap-2">
                    <input autoFocus value={nameValue} onChange={e=>setNameValue(e.target.value)}
                      onKeyDown={e=>e.key==='Enter'&&saveName()}
                      className="flex-1 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                      style={{background:'var(--bg-input)',border:'1px solid var(--border-input)',color:'var(--text-primary)'}} />
                    <button onClick={saveName} disabled={nameSaving} className="px-3 py-1.5 rounded-lg text-sm text-white" style={{background:'rgba(127,119,221,0.8)'}}>
                      {nameSaving ? '...' : 'Guardar'}
                    </button>
                    <button onClick={()=>setEditingName(false)} className="px-3 py-1.5 rounded-lg text-sm" style={{color:'var(--text-muted)'}}>Cancelar</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs" style={{color:'var(--text-muted)'}}>Nombre</div>
                      <div className="text-sm" style={{color:'var(--text-primary)'}}>{myProfile?.name}</div>
                    </div>
                    <button onClick={()=>{setNameValue(myProfile?.name||'');setEditingName(true)}}
                      className="text-xs px-3 py-1.5 rounded-lg transition-all" style={{color:'var(--text-muted)',border:'1px solid var(--border)'}}>
                      Editar
                    </button>
                  </div>
                )}
              </div>
              <Row icon={LogOut} label="Cerrar sesión" danger onClick={()=>{signOut();router.push('/login')}} />
              {/* Gender */}
              <div className="px-4 py-3.5 border-t" style={{borderColor:'var(--border)'}}>
                <div className="text-xs mb-3" style={{color:'var(--text-muted)'}}>Género <span style={{opacity:0.6}}>(para el título de rol)</span></div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'male',   label: 'Hombre' },
                    { value: 'female', label: 'Mujer'  },
                    { value: 'other',  label: 'Otro'   },
                  ].map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => saveGender(opt.value)}
                      disabled={genderSaving}
                      className="py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                      style={{
                        background: myProfile?.gender === opt.value ? 'rgba(127,119,221,0.2)' : 'var(--bg-card-hover)',
                        border: `1px solid ${myProfile?.gender === opt.value ? 'rgba(127,119,221,0.5)' : 'var(--border)'}`,
                        color: myProfile?.gender === opt.value ? '#b4b0ff' : 'var(--text-muted)',
                      }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </Section>
          )}

          {!session && (
            <Section title="Cuenta">
              <Row label="Entrar / Registrarse" desc="Iniciá sesión para editar tu perfil"
                onClick={()=>router.push('/login')}
                right={<ChevronLeft size={16} className="rotate-180" style={{color:'var(--text-muted)'}} />} />
            </Section>
          )}

          {/* Appearance */}
          <Section title="Apariencia">
            {[
              {value:'light', Icon:Sun, label:'Claro'},
              {value:'dark', Icon:Moon, label:'Oscuro'},
              {value:'system', Icon:Monitor, label:'Según el sistema'},
            ].map((opt, i, arr) => {
              const isSelected = opt.value === 'system' ? usingSystem : (!usingSystem && theme === opt.value)
              const IconComp = opt.Icon
              return (
                <button key={opt.value} onClick={()=>setThemeValue(opt.value)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all hover:opacity-80"
                  style={{
                    background: isSelected ? 'rgba(127,119,221,0.08)' : 'var(--bg-card)',
                    borderBottom: i < arr.length-1 ? '1px solid var(--border)' : 'none',
                  }}>
                  <IconComp size={18} style={{color: isSelected ? 'rgb(127,119,221)' : 'var(--text-muted)'}} className="flex-shrink-0" />
                  <span className="text-sm flex-1" style={{color:'var(--text-primary)'}}>{opt.label}</span>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />}
                </button>
              )
            })}
          </Section>

          {/* Admin */}
          {isAdmin && (
            <Section title="Admin">
              {[
                {value:true, Icon:Crown, label:'Vista admin', desc:'Podés editar cualquier perfil'},
                {value:false, Icon:User, label:'Vista normal', desc:'Ves la app como tus amigos'},
              ].map((opt, i, arr) => {
                const isSelected = adminView === opt.value
                const IconComp = opt.Icon
                return (
                  <button key={String(opt.value)} onClick={()=>handleAdminView(opt.value)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all hover:opacity-80"
                    style={{
                      background: isSelected ? 'rgba(127,119,221,0.08)' : 'var(--bg-card)',
                      borderBottom: i < arr.length-1 ? '1px solid var(--border)' : 'none',
                    }}>
                    <IconComp size={18} style={{color: isSelected ? 'rgb(127,119,221)' : 'var(--text-muted)'}} className="flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm" style={{color:'var(--text-primary)'}}>{opt.label}</div>
                      <div className="text-xs" style={{color:'var(--text-muted)'}}>{opt.desc}</div>
                    </div>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />}
                  </button>
                )
              })}
            </Section>
          )}

          {/* Delete profile */}
          {session && myProfile && (
            <div className="mt-8 mb-4">
              {showDeleteConfirm ? (
                <div className="rounded-2xl p-4" style={{border:'1px solid rgba(239,68,68,0.3)', background:'rgba(239,68,68,0.05)'}}>
                  <div className="text-sm font-medium mb-1" style={{color:'rgb(239,68,68)'}}>¿Eliminar tu perfil?</div>
                  <div className="text-xs mb-4" style={{color:'var(--text-muted)'}}>Se van a borrar todos tus juegos permanentemente. Esta acción no se puede deshacer.</div>
                  <div className="flex gap-2">
                    <button onClick={deleteProfile} disabled={deleting}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                      style={{background:'rgb(239,68,68)'}}>
                      {deleting ? 'Eliminando...' : 'Sí, eliminar'}
                    </button>
                    <button onClick={()=>setShowDeleteConfirm(false)}
                      className="flex-1 py-2.5 rounded-xl text-sm"
                      style={{color:'var(--text-secondary)',border:'1px solid var(--border)'}}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={()=>setShowDeleteConfirm(true)}
                  className="w-full py-3 rounded-2xl text-sm transition-all"
                  style={{color:'rgb(239,68,68)', border:'1px solid rgba(239,68,68,0.2)', background:'transparent'}}>
                  Eliminar mi perfil
                </button>
              )}
            </div>
          )}

          <div className="text-center text-xs mt-4" style={{color:'var(--text-muted)'}}>Game CRM · Hecho con ♥</div>
        </div>
      </div>
    </>
  )
}
