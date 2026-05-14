# Tu Cancha — Backend (NestJS + Prisma + PostgreSQL)

API REST que da soporte al frontend Nuxt en `../frontend`.

## Requisitos

- Node.js >= 20.12
- PostgreSQL 15+ (o Docker, ver `docker-compose.yml` en la raíz del repo)

## Configuración

```bash
cp .env.example .env
# ajusta DATABASE_URL y JWT_SECRET
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run db:seed
```

## Desarrollo

```bash
npm run start:dev   # http://localhost:8001/api
```

## Producción

```bash
npm run build
npm run prisma:deploy
npm run start:prod
```

## Endpoints principales

| Método | Ruta | Rol |
|---|---|---|
| POST | `/api/auth/register` | público |
| POST | `/api/auth/login` | público |
| GET  | `/api/auth/me` | autenticado |
| GET  | `/api/users` | admin |
| PATCH/DELETE | `/api/users/:id` | admin/dueño |
| GET  | `/api/businesses` | admin |
| GET  | `/api/businesses/my-businesses` | business |
| POST/PATCH/DELETE | `/api/businesses[/:id]` | admin/business |
| GET  | `/api/courts` | público |
| GET  | `/api/courts/by-business/:id` | autenticado |
| GET  | `/api/courts/:id/availability` | público |
| POST | `/api/courts/:id/availability` | admin/business |
| GET  | `/api/bookings` | admin |
| GET  | `/api/bookings/my-bookings` | autenticado |
| GET  | `/api/bookings/business/:id` | admin/business |
| GET  | `/api/bookings/court/:id/available-slots?date=YYYY-MM-DD` | autenticado |
| POST | `/api/bookings` (multipart con `paymentProof`) | autenticado |
| POST | `/api/bookings/:id/{confirm,reject,complete,no-show}` | admin/business |
| DELETE | `/api/bookings/:id` | autor / business / admin |
| GET/POST/PATCH/DELETE | `/api/software[/:id]` | admin (lectura pública) |

## Cuentas semilla

| Rol | Email | Password |
|---|---|---|
| admin | admin@tucancha.local | Password123! |
| business | negocio@tucancha.local | Password123! |
| client | cliente@tucancha.local | Password123! |
