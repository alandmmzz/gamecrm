import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Sun, Moon, Monitor, Crown, User, LogOut, ChevronLeft, Settings } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { signOut } from '../lib/auth'

export default function SettingsPage({ theme, usingSystem, setThemeValue }) {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [myProfile, setMyProfile] = useState(null)
  const [adminView, setAdminView] = useState(true)

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
                {(myProfile?.avatar_url || session.user.user_metadata?.avatar_url)
                  ? <img src={myProfile?.avatar_url || session.user.user_metadata?.avatar_url} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  : <div className="w-10 h-10 rounded-full bg-purple-900/40 flex items-center justify-center text-purple-300 flex-shrink-0">{(myProfile?.name||'?')[0]}</div>
                }
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{color:'var(--text-primary)'}}>{myProfile?.name || 'Usuario'}</div>
                  <div className="text-xs" style={{color:'var(--text-muted)'}}>{session.user.email}</div>
                </div>
              </div>
              <Row icon={LogOut} label="Cerrar sesión" danger onClick={()=>{signOut();router.push('/login')}} />
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

          <div className="text-center text-xs mt-8" style={{color:'var(--text-muted)'}}>Game CRM · Hecho con ♥</div>
        </div>
      </div>
    </>
  )
}
