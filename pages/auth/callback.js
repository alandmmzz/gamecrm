import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/')
      else router.replace('/login')
    })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'var(--bg-app)'}}>
      <div className="w-8 h-8 border-2 border-white/10 border-t-purple-400 rounded-full animate-spin"></div>
    </div>
  )
}
