# Plan MVP — Tu Cancha

Hoja de ruta hasta el primer MVP funcional y desplegable. El alcance del MVP es: **un cliente puede registrarse, ver canchas, reservar un horario con comprobante de pago, y el negocio puede aprobar/rechazar la reserva**. Todo eso desplegado en Railway con datos que sobreviven a un redeploy.

> Estado verificado el 2026-05-12 sobre `main` (96fc8bb).

## Estado de partida (real, no documental)

Lo que **ya funciona**:

- Frontend Nuxt 4 compila (`npm run build` verde).
- Backend NestJS compila (`npm run build` verde).
- Schema Prisma definido, BD con datos seed, migración inicial generada y registrada (`prisma/migrations/20260512192505_init/`).
- Reserva de horario protegida contra solapamientos concurrentes (transacción en `bookings.service.ts:create`).
- Auth JWT con register/login/me y guards por rol.
- Páginas para admin (5), business (4), client (4), auth (2), dashboard y profile.

Lo que **no funciona o no existe**:

- `npm test` en backend falla — falta instalar `jest` y `ts-jest` aunque hay specs escritos.
- No hay endpoint `/api/health` (el `railway.json` lo referencia → healthcheck rojo en deploy).
- No hay exception filter global — los errores Prisma se filtran sin formatear.
- Sin rate limiting en login/register.
- Uploads en disco local (`backend/uploads/`) — se pierden entre deploys de Railway.
- Sin paginación en `bookings.findAll`, `bookings.findMine`, `courts`, `businesses`.
- Enum `bussines` con typo persistente en schema y código.
- Sin pipeline CI definido.
- Stores Pinia incompletos — solo existe `auth.ts`; las páginas hacen `fetch` directo sin estado compartido.
- Sin manejo unificado de errores HTTP en el frontend (toasts, retry, expiración de token).

## Equipo y roles

| # | Rol | Responsable principal |
|---|---|---|
| 1 | Backend Senior | API, dominio, base de datos |
| 2 | Frontend Senior | UI, stores, integración API |
| 3 | QA Engineer | Tests, automatización, regresión |
| 4 | DevOps Engineer | CI/CD, despliegue, infra |
| 5 | Arquitecto de Software | Diseño, refactor, decisiones técnicas |
| 6 | Especialista en Seguridad | Auth, validación, secretos |
| 7 | Product Manager / UX | Flujo, priorización, feedback |

---

## Fase MVP-1: Bloqueantes para abrir a usuarios

Objetivo: la app se despliega en Railway, un cliente puede completar una reserva y el negocio puede gestionarla sin que se pierdan datos.

### Backend Senior

- Crear endpoint `GET /api/health` en `app.controller.ts` que retorne `{ status: 'ok', db: <ping> }`. Hoy el `railway.json` apunta a una ruta inexistente.
- Implementar exception filter global en `backend/src/common/filters/prisma-exception.filter.ts` y registrarlo en `main.ts`. Mapear `P2002` → 409, `P2025` → 404.
- Añadir paginación (`page`, `pageSize`) en `bookings.findAll`, `bookings.findMine`, `courts` y `businesses`. Devolver `{ data, total, page, pageSize }`.
- Crear módulo `uploads` que abstraiga el almacenamiento (`LocalStorageStrategy` para dev, `S3StorageStrategy` para prod). Configurable por `STORAGE_DRIVER` env. Reemplaza el `useStaticAssets` de `main.ts:27` cuando el driver sea S3.
- Sustituir el enum `bussines` por `business` (schema, DTOs, guards, seed). Es una migración Postgres con `ALTER TYPE`. Coordinar con Frontend Senior porque rompe contrato.

### Frontend Senior

- Crear stores Pinia por dominio: `stores/bookings.ts`, `stores/courts.ts`, `stores/businesses.ts`. Centralizar fetch, caché y errores.
- Plugin `plugins/api.client.ts` con `$fetch` interceptado: inyecta `Authorization`, intercepta 401 → logout, 5xx → toast.
- Completar el flujo de reserva en `pages/client/courts/[courtId]/book.vue`: selector de fecha, slots disponibles, subida de comprobante, confirmación.
- Reemplazar `tucancha-sena: file:..` (eliminado) por revisión de cualquier import roto que dependiera de ese path.
- Cambiar `role === 'bussines'` por `role === 'business'` en stores, middleware y páginas una vez el Backend Senior termine el rename del enum.

### QA Engineer

- Instalar dependencias de testing en backend: `jest`, `ts-jest`, `@nestjs/testing` (ya está). Verificar que `npm test` pasa con los specs existentes.
- Reparar/actualizar `auth.service.spec.ts` y `bookings.service.spec.ts` tras el cambio a `prisma.$transaction` y los tipos de `auth.service`.
- Agregar specs para el caso de race condition de reserva: dos `create` concurrentes con el mismo slot, uno gana, uno recibe 409.
- Smoke test E2E manual documentado: registro cliente → login → reserva → aprobación negocio → cancelación. Resultado en `qa-smoke.md` (creado tras la verificación, **no antes**).

### DevOps Engineer

- Crear pipeline CI con jobs para backend y frontend (lint, build, test) y cache de `node_modules`.
- Levantar un servicio Postgres en Railway y conectar el backend. Documentar las env vars en una sección de `README.md` (no en un md aparte).
- Configurar volumen persistente en Railway para `/app/uploads` mientras el módulo `uploads` con S3 no esté listo. Es la salida de emergencia.
- Probar deploy end-to-end: push a `main` → CI verde → Railway redeploya → `/api/health` responde 200 → seed corre solo la primera vez.

### Arquitecto de Software

- Definir el contrato del módulo `uploads` (interface `StorageDriver`) y revisar el PR del Backend Senior.
- Documentar en `README.md` la decisión de arquitectura de uploads (driver-pattern), por qué no inyectamos `S3Client` directo.
- Revisar y aprobar el cambio de enum `bussines → business` (impacto en migración, frontend, JWT existentes).

### Especialista en Seguridad

- Forzar `JWT_SECRET` mínimo 32 caracteres al arranque (`main.ts`) — abortar si falta o es débil.
- Validar `CORS_ORIGIN` en producción: rechazar `*` y exigir lista explícita.
- Instalar `@nestjs/throttler` y configurar rate limit en `POST /api/auth/login` y `POST /api/auth/register` (5 req/min por IP).
- Auditar `paymentProof` upload: limitar MIME (`image/png`, `image/jpeg`, `application/pdf`), tamaño (≤5MB), reescribir nombre con UUID (no respetar el del cliente).

### Product Manager / UX

- Definir el flujo crítico del MVP en 1 pantalla (Miro/Figma): cliente → reserva → confirmación. Compartir con el equipo antes del día 3.
- Revisar copy de errores en español (las páginas tienen mensajes en mezcla EN/ES).
- Lista priorizada de las 3 páginas con peor UX actual y qué cambiar en cada una.

---

## Fase MVP-2: Estabilidad post-lanzamiento ( tras MVP-1)

Objetivo: la app aguanta carga real, los errores son visibles, las regresiones se detectan en CI.

### Backend Senior

- Notificaciones por email (`@nestjs-modules/mailer`): nuevo evento de booking creado → notificar al business; aprobada/rechazada → notificar al cliente.
- Filtros de búsqueda en `GET /api/courts`: por `businessId`, `type`, rango de precio, ciudad/lat-lng (radio).
- Cron job semanal para marcar como `no_show` reservas confirmadas con fecha pasada sin completar.

### Frontend Senior

- Code splitting de las páginas grandes (`dashboard`, `admin/*`).
- Skeleton loaders en listas (canchas, reservas).
- Componente `<EmptyState />` y `<ErrorState />` reutilizable.
- Accesibilidad básica: `aria-label` en iconos sin texto, foco visible, navegación con teclado en el dialog de reserva.

### QA Engineer

- Cobertura mínima 60% en `auth.service`, `bookings.service`, `courts.service` (medida con `--coverage`).
- Suite E2E con Playwright para el flujo crítico (registro, login, reserva, aprobación). Corre en CI contra el frontend buildado.
- Reporte de cobertura publicado como artifact en la plataforma de CI elegida.

### DevOps Engineer

- Staging environment en Railway con su propia BD. PR previews opcional.
- Logs estructurados (JSON) en backend con `pino` o `nestjs-pino`.
- Alerta básica: si `/api/health` falla 3 veces seguidas en Railway → notificación al canal del equipo.

### Arquitecto de Software

- Revisar y aprobar PRs grandes (uploads, throttler, exception filter).
- ADR (Architecture Decision Record) corto en `README.md` o `/docs/adr/` para: 1) almacenamiento, 2) auth strategy, 3) deploy target.
- Bench rápido del endpoint `availableSlots` — N+1 potencial con `findUnique(include availability)` por día.

### Especialista en Seguridad

- Helmet en backend (`@nestjs/helmet` o equivalente).
- Auditar dependencias: `npm audit` en CI con threshold de severidad.
- Rotación documentada de `JWT_SECRET` (qué pasa con los tokens emitidos).
- Verificar que `password` nunca aparece en logs ni en respuestas API (revisar `console.log` y exception filter).

### Product Manager / UX

- Recolectar feedback de 3–5 usuarios beta (negocios reales y clientes).
- Tablero público de prioridades con los issues abiertos clasificados.
- Wireframes de las features post-MVP (calificación de canchas, repetir reserva, vista calendario).

---

## Criterios de "Done" para el MVP

- [ ] `npm run build` verde en backend y frontend en `main`.
- [ ] `npm test` ejecuta y pasa todos los specs existentes en backend.
- [ ] CI corre en cada push y bloquea merge si falla.
- [ ] Deploy en Railway con dominio público accesible para los 3 roles.
- [ ] `/api/health` responde 200.
- [ ] Un cliente puede completar el flujo `registro → reserva → comprobante subido → estado pending` sin tocar la base de datos manualmente.
- [ ] El comprobante de pago sobrevive a un redeploy (volumen persistente o S3).
- [ ] No quedan referencias a `bussines` (todo es `business`).
- [ ] Rate limit activo en `/api/auth/*`.
- [ ] `README.md` describe pasos exactos para correr local y desplegar.

## Riesgos abiertos

- **Railway free tier:** si la carga sube, el plan no escala bien. Plan B: Render + Supabase.
- **Migración de enum `bussines → business`:** invalida tokens emitidos. Hay que decidir si forzar logout global o convivir con ambos valores por una semana.
- **Sin tests automatizados:** los cambios actuales (transacción de booking, tipos de auth) no tienen cobertura. Lo primero que debe pasar en MVP-1 es destrabar Jest.

## Cambios ya aplicados en esta iteración

Para no acumular deuda silenciosa, este plan parte de los siguientes fixes ya realizados sobre `main`:

- Migración inicial Prisma generada en `backend/prisma/migrations/20260512192505_init/migration.sql` y registrada como aplicada.
- `bookings.service.ts:create` envuelto en `prisma.$transaction` para serializar el chequeo de solapamiento con el insert.
- `auth.service.ts` tipado con `User` de `@prisma/client` (eliminados los `any`).
- Removida la dependencia circular `"tucancha-sena": "file:.."` de `frontend/package.json`.
- Eliminados `plan-mejora-tucancha.md`, `qa-build-report.md` y `backend/output.txt` (estaban desactualizados o eran ruido).
