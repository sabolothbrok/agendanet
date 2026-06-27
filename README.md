# AgendaNet

Plataforma multi-negocio de citas (uñas, barbería, lavacar, etc.) con roles **admin general**, **admin de negocio** y **cliente**.

## Stack

- Next.js (App Router) + JavaScript
- Neon Postgres
- Tailwind CSS (paleta neutra)

## Inicio rápido

```bash
npm install
cp .env.local.example .env.local
# Configura DATABASE_URL
npm run db:setup   # borra tablas viejas y crea el esquema nuevo
npm run dev
```

> Si ves `column "business_id" does not exist`, tu base de datos aún tiene el esquema antiguo del salón. Ejecuta `npm run db:setup` de nuevo (borra datos y recrea tablas).

Abre http://localhost:3000

## Deploy en Vercel

1. **Neon** — crea un proyecto en [neon.tech](https://neon.tech) y copia el connection string (**Pooled**, con `?sslmode=require`).

2. **Vercel** — importa el repo → **Settings → Environment Variables**:
   - `DATABASE_URL` = tu connection string de Neon
   - Actívala en **Production**, **Preview** y **Development**
   - (Opcional) `NEXT_PUBLIC_APP_URL` = `https://tu-proyecto.vercel.app`

   También puedes usar la integración **Neon** en el marketplace de Vercel; agrega `DATABASE_URL` sola.

3. **Schema en producción** — una sola vez, desde tu PC (usa el mismo `DATABASE_URL` de producción):

   ```bash
   DATABASE_URL="postgresql://..." npm run db:setup
   ```

4. **Deploy** — push a `main` o **Redeploy** en Vercel si ya agregaste las variables.

5. Prueba login en `https://tu-proyecto.vercel.app/login` con los teléfonos demo.

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
- **Configuración** — perfil del administrador general

### Admin de negocio (`/b/[slug]/admin`)
- **Inicio** — citas del día + notificaciones internas
- **Calendario** — disponibilidad por espacio, ver/cancelar reservas
- **Clientes** — lista, eliminar, premium, generar enlace de invitación (vence en 15 min)
- **Servicios** — CRUD con duración (calcula largo de cita)
- **Configuración** — reglas de modificación, servicios visibles, notificaciones on/off

### Cliente (`/b/[slug]/app`)
- **Join** — `/b/[slug]/join?token=...` registro vía enlace del admin
- **Login** — solo teléfono
- **Reservar** — calendario + espacio + servicios (opcional)
- **Mis reservas** — activas, historial, cancelar (según `min_modify_hours`)

## Estructura

```
app/platform/       Admin general
app/b/[slug]/       Rutas por negocio
db/schema.sql     Esquema multi-tenant
lib/queries.js    Acceso a datos
lib/auth.js       Sesiones admin/cliente
components/       UI compartida
```

## Notas

- Notificaciones y calendario son **internos** (sin SMS/email externo).
- Auth por teléfono + cookie de sesión (sin OTP en esta versión).
- Cada negocio tiene **un administrador local**, espacios, servicios y configuración independiente.
- El **admin general** crea negocios y puede administrarlos directamente.
- Los enlaces de invitación para clientes expiran a los **15 minutos**.
