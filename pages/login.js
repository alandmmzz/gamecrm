import { useEffect, useState } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'

export default function Login({ theme, usingSystem, setThemeValue }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/')
      else setChecking(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) router.replace('/')
    })
    return () => subscription.unsubscribe()
  }, [])

  const loginWith = async (provider) => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin }
    })
  }

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'var(--bg-app)'}}>
      <div className="w-8 h-8 border-2 border-white/10 border-t-purple-400 rounded-full animate-spin"></div>
    </div>
  )

  return (
    <>
      <Head><title>Game CRM — Entrar</title></Head>
      <div className="min-h-screen flex items-center justify-center px-4" style={{background:'var(--bg-app)', fontFamily:'Inter,sans-serif'}}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="text-5xl mb-4">🎮</div>
            <h1 className="text-2xl font-semibold mb-2" style={{color:'var(--text-primary)'}}>Game CRM</h1>
            <p className="text-sm" style={{color:'var(--text-muted)'}}>Seguí los juegos de tus amigos</p>
          </div>
          <div className="space-y-3">
            <button onClick={()=>loginWith('github')} disabled={loading}
              className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
              style={{background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-primary)'}}>
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              {loading ? 'Redirigiendo...' : 'Continuar con GitHub'}
            </button>
          </div>
          <p className="text-center text-xs mt-8" style={{color:'var(--text-muted)'}}>
            Los perfiles son públicos — cualquiera puede verlos sin registrarse.
          </p>
        </div>
      </div>
    </>
  )
}
