# Mis tareas — Backend Senior (Henry)

Tracking personal de las tareas que me tocan según `plan-mvp.md`. Este archivo está en `.gitignore` y no se sube al repo.

## Fase MVP-1 — Bloqueantes

### ✅ Completadas (en PR `henry-backend-mvp`)

- **Health endpoint con DB ping** — `GET /api/health` hace `SELECT 1` contra Postgres. 200 con `{ status, db: 'up' }`, 503 si la conexión falla. Probado.
- **Exception filter global de Prisma** — `PrismaExceptionFilter` registrado en `main.ts`. `P2002 → 409`, `P2025 → 404`, otros → 500 con logging.
- **Paginación en endpoints de lectura** — `PaginationDto` (page≥1, pageSize≤100, defaults 1/20) + helper `paginate.ts`. Aplicado a:
  - `bookings.findAll` y `bookings.findMine`
  - `courts.findAll`
  - `businesses.findAll`
  Respuesta uniforme: `{ data, total, page, pageSize }`.
- **Módulo `uploads` con driver-pattern** — interfaz `StorageDriver`, implementación `LocalStorageDriver`, provider que escoge según `STORAGE_DRIVER` env (solo `local` por ahora; `s3` lanza error explícito). `bookings.service.create` inyecta el driver y descarga el archivo desde memoria.

> El PR `henry-backend-mvp` queda con 6 commits y los siguientes archivos nuevos: `app.controller.ts`, `common/filters/prisma-exception.filter.ts`, `common/dto/pagination.dto.ts`, `common/utils/paginate.ts`, `uploads/storage.driver.ts`, `uploads/local-storage.driver.ts`, `uploads/uploads.module.ts`.

### 🔜 Pendiente — requiere coordinación

- **Rename del enum `bussines → business`** — bloqueado hasta coordinar con Israel (Frontend Senior). Cuando lo hagamos:
  1. Migración Prisma con `ALTER TYPE UserRole RENAME VALUE 'bussines' TO 'business'`.
  2. Actualizar `@IsIn(['admin', 'business', 'client'])` en DTOs, comparaciones `role === 'bussines'` en guards y servicios (`bookings.service.ts:246`, `courts.controller.ts`, etc.).
  3. Frontend: cambiar `stores/auth.ts`, middleware `role.ts`, comparaciones en páginas.
  4. Decidir qué hacer con los JWT ya emitidos: o invalidarlos forzando re-login, o aceptar ambos valores por una semana en el `RolesGuard`.
  5. Actualizar seed.

  PR conjunto del backend + frontend o secuenciados con un breve "modo lectura ambos valores" para evitar downtime.

## Fase MVP-2 — Estabilidad post-lanzamiento

### Pendientes

- **Notificaciones por email** — `@nestjs-modules/mailer` + SMTP env. Enviar al business cuando se crea booking, al client cuando se confirma o cancela. Plantillas Handlebars. Mailtrap en staging, Resend/SES en prod. Depende de DevOps (Oscar) provisionando cuenta SMTP.
- **Filtros en `GET /api/courts`** — `businessId`, `type`, `priceMin`, `priceMax`, `lat`/`lng`/`radiusKm` (Haversine o PostGIS).
- **Cron de mantenimiento** — `@nestjs/schedule` con `@Cron('0 3 * * 0')` que marca como `no_show` reservas confirmadas con `date < today` no completadas.

## Notas de coordinación

- **Antes de hacer el rename del enum**: confirmar con Israel qué páginas y stores tocan `role === 'bussines'`. Mergear ambos PRs juntos o usar el modo de transición de 1 semana.
- **`uploads` con S3**: cuando llegue el momento, instalar `@aws-sdk/client-s3` y crear `S3StorageDriver` en `backend/src/uploads/`. El `UploadsModule` ya tiene el `switch` listo, solo agregar el case `s3`.
- **Email**: depende de SMTP de Oscar.

## Comandos útiles

```bash
# arrancar backend en dev
cd backend && npm run start:dev

# probar health
curl http://localhost:8001/api/health

# probar paginación
curl "http://localhost:8001/api/courts?page=1&pageSize=5"

# correr migración nueva
cd backend && npx prisma migrate dev --name nombre_migracion

# regenerar cliente Prisma tras editar schema
cd backend && npx prisma generate
```
