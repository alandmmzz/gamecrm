import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    // For implicit flow, the token is in the URL hash
    // Supabase client handles this automatically via detectSessionInUrl
    const handleAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (session) {
        router.replace('/')
      } else {
        // Wait a bit for Supabase to process the hash
        setTimeout(async () => {
          const { data: { session: s } } = await supabase.auth.getSession()
          router.replace(s ? '/' : '/login')
        }, 1000)
      }
    }
    handleAuth()
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{background:'var(--bg-app)'}}>
      <div className="w-8 h-8 border-2 border-white/10 border-t-purple-400 rounded-full animate-spin"></div>
      <div className="text-sm" style={{color:'var(--text-muted)'}}>Iniciando sesión...</div>
    </div>
  )
}
