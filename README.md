# 🎮 Game CRM

Seguimiento de juegos con tus amigos. Stack: Next.js + Supabase + Vercel.

---

## Setup en 10 minutos

### 1. Supabase (base de datos gratis)

1. Ve a [supabase.com](https://supabase.com) → Create new project
2. Elige nombre y contraseña, espera que inicialice (~2 min)
3. Ve a **SQL Editor** → pega todo el contenido de `schema.sql` → Run
4. Ve a **Settings → API** y copia:
   - `Project URL` → es tu `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → es tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Clave de Anthropic (para búsqueda HLTB)

1. Ve a [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key
2. Guarda esa clave, es tu `ANTHROPIC_API_KEY`

### 3. Subir a GitHub

```bash
cd gamecrm
git init
git add .
git commit -m "init"
gh repo create gamecrm --public --push
# o en github.com → New repository → sube los archivos
```

### 4. Deploy en Vercel (gratis)

1. Ve a [vercel.com](https://vercel.com) → New Project → importa tu repo
2. En **Environment Variables** agrega las 3 variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL     = https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGc...
   ANTHROPIC_API_KEY            = sk-ant-...
   ```
3. Click Deploy → en ~1 min tienes tu URL pública ✅

### 5. Comparte el link con tus amigos

Cualquiera con el link puede:
- Agregar amigos
- Registrar juegos con datos de HowLongToBeat
- Ver el progreso de todos

---

## Desarrollo local

```bash
cp .env.example .env.local
# llena .env.local con tus claves

npm install
npm run dev
# abre http://localhost:3000
```
