# AgendaNet

Plataforma multi-negocio de citas (uñas, barbería, lavacar, etc.) con roles **admin general**, **admin de negocio** y **cliente**.

## Stack

- Next.js (App Router) + JavaScript
- Neon Postgres
- Tailwind CSS (teal + stone)

## Inicio rápido

```bash
npm install
cp .env.local.example .env.local
# Configura DATABASE_URL (y opcionalmente SESSION_SECRET)
npm run db:migrate   # bases existentes: solo cambios aditivos
npm run dev
```

`npm run db:setup` **borra todos los datos**. Solo úsalo en una base vacía o de demo:

```bash
ALLOW_DB_RESET=1 npm run db:setup
```

Abre http://localhost:3000

## Deploy en Vercel

1. **Neon** — crea un proyecto en [neon.tech](https://neon.tech) y copia el connection string (**Pooled**, con `?sslmode=require`).

2. **Vercel** — importa el repo → **Settings → Environment Variables**:
   - `DATABASE_URL` = tu connection string de Neon
   - `SESSION_SECRET` = una cadena larga aleatoria (firma las cookies de sesión)
   - Actívalas en **Production**, **Preview** y **Development**
   - (Opcional) `NEXT_PUBLIC_APP_URL` = `https://tu-proyecto.vercel.app`

3. **Schema** — bases nuevas: `ALLOW_DB_RESET=1 npm run db:setup` una sola vez. Bases con datos: `npm run db:migrate`.

4. **Deploy** — push a `main` o **Redeploy** en Vercel.

5. Prueba login en `https://tu-proyecto.vercel.app/login` con los teléfonos demo.

La autenticación de rutas usa `proxy.js` (convención de Next.js 16; equivale al antiguo `middleware.js`).

## Demo

| Rol | URL | Teléfono |
|-----|-----|----------|
| Admin general | `/platform/login` | `77770000` |
| Admin de negocio | `/b/demo-unas/admin/login` | `88880000` |
| Cliente | `/b/demo-unas/app/login` | `66660000` |

## Rutas

### Admin general (`/platform`)
- **Mis negocios** — lista y acceso a cada panel admin
- **Nuevo negocio** — crea negocio, admin local y estación inicial
- **Configuración** — perfil y tipos de negocio

### Admin de negocio (`/b/[slug]/admin`)
- **Inicio** — citas de hoy, solicitudes pendientes y avisos internos
- **Calendario** — disponibilidad por estación, bloquear, cancelar, aprobar
- **Reporte** — ocupación semanal (zona America/Costa_Rica)
- **Clientes** — lista, premium, enlace de invitación (vence en 15 min; es abierto)
- **Servicios** — CRUD con duración y precio
- **Configuración** — horario semanal o por día, intervalo, aprobación de reservas, avisos internos

### Cliente (`/b/[slug]/app`)
- **Join** — `/b/[slug]/join?token=...` registro vía enlace
- **Login** — teléfono (sin OTP en esta versión)
- **Reservar** — calendario + estación + servicios
- **Mis reservas** — pendientes, activas, historial (20), cancelar según `min_modify_hours`

## Notas

- Notificaciones son **internas** en el panel admin (sin SMS/email).
- Auth por teléfono + cookie de sesión firmada. Los planes de la landing son ilustrativos; no hay cobros ni límites de plan.
- Cada negocio tiene **un administrador local**, estaciones, servicios y configuración independiente.
- El **admin general** crea negocios y puede administrarlos directamente.
- Las citas `active` que ya terminaron pasan a `completed`. Las solicitudes `pending` cuyo horario ya pasó se marcan como expiradas.
