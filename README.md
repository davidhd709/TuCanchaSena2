# Tu Cancha — Plataforma de reserva de canchas sintéticas

Monorepo separado en dos responsabilidades:

```
tucancha-sena/
├── frontend/         Nuxt 4 + Vuetify + Pinia (SPA)
│   ├── app/          Páginas, componentes, layouts, stores, middleware
│   ├── public/
│   ├── nuxt.config.ts
│   ├── nixpacks.toml + railway.json   (deploy Railway)
│   └── package.json
├── backend/          NestJS + Prisma + PostgreSQL (API REST)
│   ├── src/
│   │   ├── auth/         Autenticación JWT + register/login
│   │   ├── users/        Gestión de usuarios
│   │   ├── businesses/   Negocios y horarios de apertura
│   │   ├── courts/       Canchas, tipo, precio, disponibilidad por día
│   │   ├── bookings/     Reservas, slots disponibles, ciclo de estados
│   │   ├── software/     Módulo CMS de la landing
│   │   ├── prisma/       PrismaService global
│   │   └── common/       Guards, decorators, JWT strategy
│   ├── prisma/{schema.prisma, seed.ts}
│   ├── nixpacks.toml + railway.json   (deploy Railway)
│   └── package.json
└── README.md
```

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Nuxt 4 (SPA), Vuetify 3, Pinia |
| Backend | NestJS 10, Passport JWT, class-validator |
| ORM | Prisma 5 |
| Base de datos | PostgreSQL 16+ |
| Deploy | Railway (Nixpacks) |

## Requisitos del entorno

- **Node.js** ≥ 20.12 (`nvm` recomendado)
- **PostgreSQL** ≥ 14 corriendo en `localhost:5432`
- **Git**

## 1. PostgreSQL local

### Linux (Fedora)

```bash
sudo dnf install postgresql-server postgresql
sudo postgresql-setup --initdb
sudo systemctl enable --now postgresql
```

### Linux (Ubuntu/Debian)

```bash
sudo apt install postgresql
sudo systemctl enable --now postgresql
```

### macOS

```bash
brew install postgresql@16
brew services start postgresql@16
```

### Windows

Descarga el instalador desde https://www.postgresql.org/download/windows/

### Crear la base de datos y el usuario

Una sola vez, en cualquier sistema:

```bash
sudo -u postgres psql <<SQL
CREATE USER tucancha WITH PASSWORD 'tucancha' CREATEDB;
CREATE DATABASE tucancha OWNER tucancha;
GRANT ALL PRIVILEGES ON DATABASE tucancha TO tucancha;
SQL
```

> El permiso `CREATEDB` es necesario para que `prisma migrate dev` cree su "shadow database" temporal. Si no lo tienes, usa `npx prisma db push` para sincronizar el schema sin migraciones formales.

> Si tu instalación usa otra contraseña/usuario, ajusta `DATABASE_URL` en `backend/.env`.

## 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:migrate -- --name init   # crea las tablas
npm run db:seed                          # cuentas y datos demo
npm run start:dev                        # http://localhost:8001/api
```

## 3. Frontend

En otra terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                              # http://localhost:3000
```

## Cuentas semilla (después de `db:seed`)

| Rol | Email | Password |
|---|---|---|
| `admin` | admin@tucancha.local | `Password123!` |
| `bussines` | negocio@tucancha.local | `Password123!` |
| `client` | cliente@tucancha.local | `Password123!` |

## Flujo para colaboradores

Con una copia local del proyecto y después de tener Postgres y `tucancha`/`tucancha`/`tucancha` creados como en la sección anterior:

```bash
cd tucancha-sena

# crea los .env desde los ejemplos
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# instala dependencias, corre migraciones y seed
npm install                # instala concurrently en la raíz
npm run setup              # instala backend + frontend, migra y siembra

# arranca backend y frontend juntos
npm run dev
```

`npm run dev` usa `concurrently` para correr ambos en una sola terminal con logs etiquetados. Si prefieres terminales separadas:

```bash
npm run dev:backend        # http://localhost:8001/api
npm run dev:frontend       # http://localhost:3000
```

Si recibes una versión actualizada del proyecto y hubo cambios en el schema:

```bash
cd backend
npm run prisma:migrate     # aplica migraciones nuevas
npm run prisma:generate    # regenera cliente Prisma
```

Inspeccionar la BD:

```bash
cd backend
npm run prisma:studio      # GUI en http://localhost:5555
```

## Modelo de datos

```
User ──< Business ──< Court ──< CourtAvailability
  │         │           │
  │         └─< BusinessSchedule
  │
  └──< Booking >── Court

Software (independiente, módulo CMS)
```

- **User**: roles `admin` | `bussines` | `client`. Soft-delete con `isActive`.
- **Business**: tiene un dueño (User), uno o más horarios (`BusinessSchedule`) y varias canchas.
- **Court**: pertenece a un Business, define precio base y estado. Cada cancha tiene varios slots de `CourtAvailability` (por día, con precio especial opcional).
- **Booking**: reserva de una `Court` por un `User`, con flujo `pending → confirmed → completed | cancelled | no_show`. El backend calcula `totalPrice` desde la duración y el `pricePerHour` del slot (o el de la cancha si no hay precio especial).
- **Software**: entradas tipo CMS para la landing pública.

## Endpoints

Tabla completa en [`backend/README.md`](backend/README.md). El backend monta todo bajo el prefijo `/api`.

## Variables de entorno

**Backend** (`backend/.env`):

| Variable | Default | Descripción |
|---|---|---|
| `PORT` | 8001 | Puerto HTTP |
| `DATABASE_URL` | — | Cadena Postgres |
| `JWT_SECRET` | — | Secreto JWT |
| `JWT_EXPIRES_IN` | 7d | Expiración del token |
| `CORS_ORIGIN` | http://localhost:3000 | Orígenes permitidos (separados por coma) |
| `PUBLIC_BASE_URL` | http://localhost:8001 | Base URL para construir URLs de archivos subidos |
| `UPLOADS_DIR` | uploads | Carpeta local para `paymentProof` |

**Frontend** (`frontend/.env`):

| Variable | Default | Descripción |
|---|---|---|
| `NUXT_PUBLIC_API_BASE` | http://localhost:8001/api | Base de la API consumida |

## Deploy a Railway (cuando llegue el momento)

Ambos proyectos tienen `nixpacks.toml` y `railway.json`. No se necesita Docker.

**Backend:**
1. Crea un servicio Postgres en Railway. Copia `DATABASE_URL`.
2. Crea un servicio nuevo apuntando a `backend/`.
   - Si Railway te pide `Root Directory`, usa `/backend`.
   - Si configuras `railway.json` manualmente desde Settings, usa la ruta absoluta `/backend/railway.json`.
3. Variables a configurar:
   - `DATABASE_URL`
   - `JWT_SECRET` (un string fuerte)
   - `CORS_ORIGIN` (la URL pública del frontend desplegado)
   - `PUBLIC_BASE_URL` (la URL pública del backend, para construir links de uploads)
4. Railway detecta `nixpacks.toml`, ejecuta `npx prisma migrate deploy` al arrancar y luego `node dist/main`.
5. El healthcheck del backend queda en `/api/health`.

**Frontend:**
1. Crea un servicio nuevo apuntando a `frontend/`.
   - Si Railway te pide `Root Directory`, usa `/frontend`.
   - Si configuras `railway.json` manualmente desde Settings, usa la ruta absoluta `/frontend/railway.json`.
2. Variables:
   - `NUXT_PUBLIC_API_BASE` → la URL pública del backend `+ /api`
3. Railway detecta `nixpacks.toml`, hace `npm run build` y arranca con Nitro en `$PORT`.

## Notas

- El rol `bussines` mantiene la grafía original del frontend. Si quieres corregirlo a `business`, actualiza el enum en `backend/prisma/schema.prisma`, los `class-validator` `@IsIn` y los chequeos de `role` en el frontend (`stores/auth.ts`, páginas, middleware).
- Los archivos de `paymentProof` se guardan en `backend/uploads/` y se sirven en `/uploads/<archivo>`. En Railway se pierden entre deploys salvo que añadas un volumen persistente montado en `/app/uploads` o uses S3/Cloudinary.

---

## UI reutilizable, copy ES y accesibilidad (Paquete 5 — MVP-1)

### Nuevos componentes en `frontend/app/components/ui/`

| Componente | Props | Uso |
|---|---|---|
| `EmptyState.vue` | `icon`, `iconColor`, `title`, `description` + slot `#action` | Listas vacías con CTA opcional |
| `ErrorState.vue` | `message` + evento `@retry` | Error de carga con botón Reintentar |
| `LoadingState.vue` | `count`, `cols`, `sm`, `lg`, `type` | Skeleton de tarjetas mientras carga |

### Nuevo composable `frontend/app/composables/useCopy.ts`

Centraliza textos en español para validaciones, roles, estados de reserva, acciones y errores.
Evita duplicar strings en cada página.

```ts
const copy = useCopy()
copy.validation.required   // 'Este campo es requerido'
copy.roles.business        // 'Negocio'
copy.bookingStatus.pending // 'Pendiente'
```

### 3 páginas con peor UX — mejoradas

| # | Página | Problema original | Mejora aplicada |
|---|---|---|---|
| 1 | `client/courts/index.vue` | Spinner desnudo sin skeleton, estado vacío con `v-alert` genérico sin CTA, sin estado de error | `LoadingState` con skeleton de tarjetas, `EmptyState` con botón "Limpiar filtros", `ErrorState` con retry |
| 2 | `admin/bookings.vue` | Sin estado vacío alguno en la tabla, botón de comprobante sin `aria-label` | Slot `#no-data` con `EmptyState`, `aria-label="Ver comprobante de pago"` en botón icono |
| 3 | `business/bookings.vue` | Botones de navegación del calendario sin `aria-label`, bloques de reserva no accesibles por teclado, estado vacío con `v-alert` genérico | `aria-label` en chevrons, `role="button" tabindex="0"` + keyboard handler en booking-blocks, `EmptyState` |

### Accesibilidad aplicada en toda la app

- `aria-label` explícito en todos los botones de icono sin texto visible
- `aria-hidden="true"` en iconos decorativos
- `role="button"` + `tabindex="0"` + handler `@keydown.enter.space` en elementos clickeables no nativos
- `aria-labelledby` en el dialog de detalle de reserva (`business/bookings.vue`)
- `:focus-visible` con color de marca en todos los elementos interactivos (ver `assets/main.css`)
