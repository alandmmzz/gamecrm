import '../styles/globals.css'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function applyTheme(value) {
  const isDark = value === 'dark'
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.setAttribute('data-theme', value)
}

export default function App({ Component, pageProps }) {
  const [theme, setTheme] = useState('dark')
  const [usingSystem, setUsingSystem] = useState(true)

  useEffect(() => {
    // Handle implicit flow — exchange hash token for session
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      // Let Supabase process the hash
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname)
          window.dispatchEvent(new Event('supabase-auth-ready'))
        }
      })
    }

    // Theme setup
    const saved = localStorage.getItem('theme')
    if (saved) {
      setTheme(saved); setUsingSystem(false); applyTheme(saved)
    } else {
      setUsingSystem(true)
      const system = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
      setTheme(system); applyTheme(system)
    }

    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const handler = (e) => {
      if (!localStorage.getItem('theme')) {
        const t = e.matches ? 'light' : 'dark'
        setTheme(t); applyTheme(t)
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const setThemeValue = (value) => {
    if (value === 'system') {
      localStorage.removeItem('theme'); setUsingSystem(true)
      const system = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
      setTheme(system); applyTheme(system)
    } else {
      localStorage.setItem('theme', value); setUsingSystem(false)
      setTheme(value); applyTheme(value)
    }
  }

  return <Component {...pageProps} theme={theme} usingSystem={usingSystem} setThemeValue={setThemeValue} />
}
