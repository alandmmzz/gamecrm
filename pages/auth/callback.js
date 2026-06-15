import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState('Procesando...')

  useEffect(() => {
    const process = async () => {
      // Get hash from URL — implicit flow puts token here
      const hash = window.location.hash
      
      if (hash && hash.includes('access_token')) {
        // Parse the hash manually
        const params = new URLSearchParams(hash.substring(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        
        if (accessToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          })
          
          if (data.session) {
            setStatus('¡Listo! Redirigiendo...')
            router.replace('/')
            return
          }
        }
      }

      // No hash — check if session exists already
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace('/')
      } else {
        setStatus('Error al iniciar sesión')
        setTimeout(() => router.replace('/login'), 2000)
      }
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
