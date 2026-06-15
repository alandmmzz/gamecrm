import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState('Autenticando...')

  useEffect(() => {
    if (!router.isReady) return

    const { code, error } = router.query

    if (error) {
      setStatus('Error al iniciar sesión')
      setTimeout(() => router.replace('/login?error=' + error), 2000)
      return
    }

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error || !data.session) {
          setStatus('Error al iniciar sesión')
          setTimeout(() => router.replace('/login?error=exchange_failed'), 2000)
        } else {
          router.replace('/')
        }
      })
    } else {
      router.replace('/login')
    }
  }, [router.isReady, router.query])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{background:'var(--bg-app)', fontFamily:'Inter,sans-serif'}}>
      <div className="w-8 h-8 border-2 border-white/10 border-t-purple-400 rounded-full animate-spin"></div>
      <div className="text-sm" style={{color:'var(--text-muted)'}}>{status}</div>
    </div>
  )
}
