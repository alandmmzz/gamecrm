# 🎮 Game CRM

Una app para seguir los juegos de tus amigos. Registrá qué están jugando, cuántas horas llevan, y descubrí patrones entre perfiles.

## ¿Qué hace?

**Perfiles de usuario**
- Importación automática desde Steam (juegos, horas, logros, fechas)
- Vinculación con World of Warcraft (personaje, ilvl, raid progress)
- Rol único generado por IA basado en los géneros más jugados
- Gráfico radar de géneros jugados
- Historial ordenado por fecha con estados: En progreso, Completado, Abandonado

**Insights**
- Juegos en común entre usuarios
- El más dedicado por juego compartido
- Perfiles similares por géneros (con ♥ para alta compatibilidad)

**Descubrir**
- GameFinder estilo Tinder — recomendaciones personalizadas basadas en tus géneros más jugados + juegos de tus amigos

**Cuenta**
- Login con GitHub o Google
- Foto de perfil personalizable
- Modo claro / oscuro / según el sistema
- Perfil público — cualquiera puede ver sin registrarse

## Stack

| Tecnología | Uso |
|---|---|
| Next.js 14 | Frontend + API routes |
| Supabase | Base de datos + Auth + Storage |
| Vercel | Deploy |
| Tailwind CSS | Estilos |
| Lucide React | Iconos |
| Claude API (Haiku) | HLTB estimado + roles + progreso IA |
| Steam API | Importación de juegos |
| RAWG API | Portadas y géneros |
| Blizzard API | Datos de WoW |

## Features

- 📱 Mobile-first con bottom bar estilo iOS
- 🖥️ Sidebar fijo en desktop
- 🌙 Modo claro/oscuro con detección del sistema
- 🔒 Perfiles públicos, edición solo para el dueño
- 👑 Rol de admin para gestionar todos los perfiles
- 🔄 Sync automático de portadas, géneros y progreso
- 🏆 Logros de Steam como métrica de completitud

## Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
RAWG_API_KEY=
STEAM_API_KEY=
BLIZZARD_CLIENT_ID=
BLIZZARD_CLIENT_SECRET=
SUPABASE_SERVICE_ROLE_KEY=
```

## Deploy

```bash
git clone https://github.com/alandmmzz/gamecrm.git
cd gamecrm
npm install
# Configurar variables de entorno
npm run dev
```