# Tu Cancha — Plataforma de reserva de canchas sintéticas

[![CI](https://github.com/davidhd709/TuCanchaSena2/actions/workflows/ci.yml/badge.svg)](https://github.com/davidhd709/TuCanchaSena2/actions/workflows/ci.yml)

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
| `JWT_SECRET` | — | Secreto JWT. **Mínimo 32 caracteres**; el backend aborta el arranque si falta o es más corto |
| `JWT_EXPIRES_IN` | 7d | Expiración del token |
| `CORS_ORIGIN` | http://localhost:3000 | Orígenes permitidos (separados por coma). En `NODE_ENV=production` no se acepta `*` |
| `PUBLIC_BASE_URL` | http://localhost:8001 | Base URL para construir URLs de archivos subidos (driver `local`) |
| `STORAGE_DRIVER` | local | Almacenamiento de comprobantes: `local` (disco) o `s3` |
| `UPLOADS_DIR` | uploads | Carpeta local para `paymentProof` (driver `local`) |
| `S3_REGION` | — | Región del bucket (driver `s3`) |
| `S3_BUCKET` | — | Nombre del bucket (driver `s3`) |
| `S3_PREFIX` | payment-proofs | Prefijo de las claves dentro del bucket (driver `s3`) |
| `S3_PUBLIC_BASE` | (URL estándar AWS) | Base pública del bucket si usas CDN o dominio propio (driver `s3`) |

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

## Almacenamiento de archivos (driver-pattern)

Los comprobantes de pago (`paymentProof`) se guardan a través de una abstracción `StorageDriver` (`backend/src/uploads/`). La app depende del **contrato**, no de una implementación concreta:

- `StorageDriver` — interfaz con un solo método `save(file) → { key, url }`.
- `LocalStorageDriver` — escribe en `UPLOADS_DIR` y devuelve una URL bajo `PUBLIC_BASE_URL/uploads/`.
- `S3StorageDriver` — sube al bucket con `PutObjectCommand` y devuelve la URL pública.
- `UploadsModule` elige la implementación según `STORAGE_DRIVER` (`local` | `s3`) en un `useFactory`.

**Por qué un driver y no inyectar `S3Client` directo:** `bookings.service` no debería saber si el archivo va a disco o a la nube. Con el driver, dev usa disco y prod usa S3 cambiando solo una env var, sin tocar el dominio. El día que se agregue otro backend de almacenamiento, se añade un driver y un `case` — nada más.

Validaciones de subida (en `bookings.controller`): MIME restringido a `image/png`, `image/jpeg`, `application/pdf`; tamaño ≤ 5 MB; el nombre del archivo se regenera con UUID (se ignora el `originalname` del cliente).

Con `STORAGE_DRIVER=local`, en Railway los archivos se pierden entre deploys salvo que montes un volumen persistente en `/app/uploads`. La solución definitiva es `STORAGE_DRIVER=s3`.

## Notas

- El rol `bussines` mantiene la grafía original del frontend. Si quieres corregirlo a `business`, actualiza el enum en `backend/prisma/schema.prisma`, los `class-validator` `@IsIn` y los chequeos de `role` en el frontend (`stores/auth.ts`, páginas, middleware).
- Endpoints de lectura paginados (`GET /api/bookings`, `/api/bookings/my-bookings`, `/api/courts`, `/api/businesses`) aceptan `?page` y `?pageSize` (default 1/20, máx 100) y responden `{ data, total, page, pageSize }`.
- `GET /api/health` hace un ping real a la BD: responde 200 `{ status, db: 'up' }` o 503 si Postgres no responde.
- Rate limit de 5 req/min por IP en `POST /api/auth/login` y `POST /api/auth/register`.
