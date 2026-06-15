import '../styles/globals.css'
import { useEffect, useState } from 'react'

export default function App({ Component, pageProps }) {
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    // Check saved preference, fallback to system
    const saved = localStorage.getItem('theme')
    if (saved) {
      setTheme(saved)
      document.documentElement.setAttribute('data-theme', saved)
    } else {
      const system = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
      setTheme(system)
      document.documentElement.setAttribute('data-theme', system)
    }

    // Listen for system changes
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const handler = (e) => {
      if (!localStorage.getItem('theme')) {
        const t = e.matches ? 'light' : 'dark'
        setTheme(t)
        document.documentElement.setAttribute('data-theme', t)
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  const resetToSystem = () => {
    localStorage.removeItem('theme')
    const system = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    setTheme(system)
    document.documentElement.setAttribute('data-theme', system)
  }

  return <Component {...pageProps} theme={theme} toggleTheme={toggleTheme} resetToSystem={resetToSystem} />
}
