import { createServerClient } from '@supabase/ssr'

export default async function handler(req, res) {
  const { code, error: authError } = req.query

  if (authError) return res.redirect(`/login?error=${authError}`)
  if (!code) return res.redirect('/login?error=no_code')

  // Parse cookies
  const cookies = {}
  const cookieHeader = req.headers.cookie || ''
  cookieHeader.split(';').forEach(c => {
    const [k, v] = c.trim().split('=')
    if (k) cookies[k.trim()] = v
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => cookies[name],
        set: (name, value, options) => {
          res.setHeader('Set-Cookie', `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${options?.maxAge || 3600}`)
        },
        remove: (name) => {
          res.setHeader('Set-Cookie', `${name}=; Path=/; Max-Age=0`)
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return res.redirect('/login?error=exchange_failed')

  res.redirect('/')
}
