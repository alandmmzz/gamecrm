import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState('Autenticando...')

  useEffect(() => {
    const process = async () => {
      // Try to get hash from sessionStorage (set by auth-callback.html)
      const storedHash = sessionStorage.getItem('supabase-auth-hash')
      const hash = storedHash || window.location.hash

      if (hash && hash.includes('access_token')) {
        sessionStorage.removeItem('supabase-auth-hash')
        const params = new URLSearchParams(hash.substring(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token') || ''

        const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        if (data?.session) {
          setStatus('¡Listo!')
          router.replace('/')
          return
        }
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (session) { router.replace('/'); return }

      setStatus('Error al iniciar sesión. Redirigiendo...')
      setTimeout(() => router.replace('/login'), 2000)
    }

    process()
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{background:'var(--bg-app)', fontFamily:'Inter,sans-serif'}}>
      <div className="w-8 h-8 border-2 border-white/10 border-t-purple-400 rounded-full animate-spin"></div>
      <div className="text-sm" style={{color:'var(--text-muted)'}}>{status}</div>
    </div>
  )
}
