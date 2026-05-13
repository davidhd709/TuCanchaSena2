# Plan MVP — Tu Cancha

Hoja de ruta hasta el primer MVP funcional y desplegable. El alcance del MVP es: **un cliente puede registrarse, ver canchas, reservar un horario con comprobante de pago, y el negocio puede aprobar/rechazar la reserva**. Todo eso desplegado en Railway con datos que sobreviven a un redeploy.

> Estado verificado el 2026-05-12 sobre `main` (96fc8bb). Reparto en 7 paquetes definido el 2026-05-13.

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
- `app.controller.ts` tiene un `/api/health` que no pinga la BD, pero `railway.json` espera 200 estable.
- No hay exception filter global — los errores Prisma se filtran sin formatear.
- Sin rate limiting en login/register.
- Uploads en disco local (`backend/uploads/`) — se pierden entre deploys de Railway.
- Sin paginación en `bookings.findAll`, `bookings.findMine`, `courts`, `businesses`.
- Enum `bussines` con typo persistente en schema y código.
- Sin pipeline CI definido.
- Stores Pinia existen (`bookings`, `courts`, `businesses`, `auth`) pero llaman a `fetch` directo sin plugin interceptado.
- Sin manejo unificado de errores HTTP en el frontend (toasts, retry, expiración de token).

## Reparto en 9 paquetes (7 personas)

Cada paquete es autocontenible, sin bloqueos cruzados. **P1** toma 3 paquetes (backend + infra); los otros 6 toman 1 paquete cada uno. La única coordinación es el orden de merge para evitar rebases dolorosos.

| # | Paquete | Persona | Foco | Riesgo de cruce |
|---|---|---|---|---|
| 1 | Robustez backend + Storage + Seguridad | **P1 henry** | API, errores, uploads, env, throttler | bajo |
| 2 | Migración `bussines → business` full-stack | P2 | Prisma + DTOs + frontend stores/middleware | medio (toca código de P3, P4) |
| 3 | Plugin `$fetch` + stores migrados | P3 | Frontend infraestructura | bajo |
| 4 | Flujo de reserva del cliente | P4 | Página `book.vue` + componentes del flujo | bajo |
| 5 | UI reutilizable + copy ES + accesibilidad | P5 | Componentes, textos en todas las páginas | bajo |
| 6 | Testing backend automatizado | P6 | Jest, specs reparados, spec race condition | nulo |
| 7 | Smoke E2E + Playwright + qa-smoke.md | P7 | Pruebas manuales y E2E del flujo crítico | nulo |
| 8 | CI (GitHub Actions) | **P1** | Workflows, cache, blocking merge | nulo |
| 9 | Deploy Railway end-to-end | **P1** | Postgres, volumen, env, README de deploy | bajo |

---

## Fase MVP-1 — Bloqueantes para abrir a usuarios

Objetivo: la app se despliega en Railway, un cliente puede completar una reserva y el negocio puede gestionarla sin que se pierdan datos.

### Paquete 1 — Robustez backend + Storage + Seguridad (henry)

- `GET /api/health` con ping a DB (`SELECT 1`). 200 `{ status, db: 'up' }`, 503 si falla.
- Exception filter global en `backend/src/common/filters/prisma-exception.filter.ts` registrado en `main.ts`. Mapear `P2002 → 409`, `P2025 → 404`, resto → 500 logueado.
- `PaginationDto` (`page≥1`, `pageSize≤100`, defaults 1/20) + helper `paginate.ts`. Aplicar a `bookings.findAll`, `bookings.findMine`, `courts.findAll`, `businesses.findAll`. Respuesta `{ data, total, page, pageSize }`.
- Módulo `uploads/` con interfaz `StorageDriver` + `LocalStorageDriver` + `S3StorageDriver`, seleccionado por `STORAGE_DRIVER` env. `useStaticAssets` de `main.ts:27` solo se monta cuando driver es `local`.
- Endurecer `paymentProof` en `bookings.controller.ts` (`FileInterceptor`): MIME `image/png|jpeg|application/pdf`, tamaño ≤5 MB, regenerar nombre con UUID (ignorar `originalname`).
- Validar env al arranque en `main.ts`: abortar si `JWT_SECRET < 32` chars o falta; en `NODE_ENV=production` rechazar `CORS_ORIGIN=*` o vacío.
- Rate limit con `@nestjs/throttler` en `POST /api/auth/login` y `POST /api/auth/register`: 5 req/min/IP.

### Paquete 2 — Migración `bussines → business` full-stack (P2)

- Migración Prisma: `ALTER TYPE "UserRole" RENAME VALUE 'bussines' TO 'business'`.
- Backend: `@IsIn(['admin','business','client'])` en DTOs, comparaciones de `role` en guards, `bookings.service.ts`, `courts.controller.ts`, seed.
- Frontend: `stores/auth.ts`, `middleware/role.ts`, comparaciones `role === 'bussines'` en páginas.
- `RolesGuard` en modo "acepta ambos valores" durante una semana para no invalidar JWT vivos (con flag `LEGACY_ROLE_ACCEPT` que se quita después).
- Actualizar seed para que cree usuarios con `business`.
- Merge rápido y temprano para evitar conflictos con 3 y 4.

### Paquete 3 — Plugin `$fetch` + stores migrados (P3)

- `plugins/api.client.ts` con `$fetch.create` interceptado: inyecta `Authorization` desde `useAuthStore`, 401 → logout + redirect a `/auth/login`, 5xx → toast genérico, propaga el resto del error con tipos.
- Composable `useApiError(err)` que mapea errores comunes a mensajes en español.
- Sistema de toasts compartido (snackbar global Vuetify) expuesto vía `useToast`.
- Repasar los stores existentes (`stores/bookings.ts`, `stores/courts.ts`, `stores/businesses.ts`) para que llamen al `$fetch` interceptado en vez de `fetch` directo. Manejar `loading`, `error` y caché simple.

### Paquete 4 — Flujo de reserva del cliente (P4)

- `pages/client/courts/[courtId]/book.vue` end-to-end: selector de fecha (`v-date-picker`), render de slots disponibles consumiendo `GET /api/bookings/availability`, subida de comprobante con preview, paso de confirmación final.
- Componentes nuevos en `frontend/app/components/booking/`: `BookingDateTimePicker.vue`, `BookingPaymentUpload.vue`, `BookingConfirmation.vue`.
- Estado del formulario durante la subida (`pending → uploaded → submitted`) sin perder datos si la subida falla.
- Tras `submitted`, redirigir a `pages/client/bookings/[id].vue` con el detalle en estado `pending`.
- Manejo de errores propios del flujo: slot tomado por otro mientras el usuario llenaba el formulario (409 del backend) → mensaje claro + refresh de slots.

### Paquete 5 — UI reutilizable + copy ES + accesibilidad (P5)

- Componentes reutilizables en `frontend/app/components/ui/`: `EmptyState.vue`, `ErrorState.vue`, `LoadingState.vue` (skeleton). Aplicarlos en las listas de canchas, reservas y dashboard.
- Unificar copy en español en **todas las páginas** (admin/business/client/auth/dashboard/profile). Centralizar textos repetidos en `frontend/app/composables/useCopy.ts` o constantes; corregir mezcla EN/ES en mensajes de error y botones.
- Accesibilidad mínima: `aria-label` en iconos sin texto, foco visible (`:focus-visible` en tema Vuetify), navegación por teclado en el dialog de reserva y en los menús de aprobación.
- Lista priorizada en `README.md` o issue tracker de las 3 páginas con peor UX actual y qué se mejoró.

### Paquete 6 — Testing backend automatizado (P6)

- Instalar `jest`, `ts-jest`, `@nestjs/testing` y dejar `npm test` verde en backend.
- Reparar `auth.service.spec.ts` y `bookings.service.spec.ts` tras el cambio a `prisma.$transaction` y los tipos de `auth.service`.
- Nuevo spec de race condition: dos `create` concurrentes con el mismo slot — uno gana, el otro recibe 409.
- Cobertura de happy path para `auth.service` (register, login, me) y `bookings.service` (create, approve, reject, cancel).
- `npm test` se ejecuta en menos de 30s y es ejecutable sin red (BD en memoria con mocks de Prisma o testcontainers locales).

### Paquete 7 — Smoke E2E + Playwright + qa-smoke.md (P7)

- `qa-smoke.md` con checklist E2E manual: registro cliente → login → reserva → aprobación negocio → cancelación. Crear el archivo **después** de correr el flujo, no antes.
- Setup de Playwright en `frontend/tests/e2e/` con un test del flujo crítico (registro → reserva → estado pending). El test arranca el backend y frontend buildados.
- Reporte de regresiones encontradas durante el smoke (issue list o sección al final del `qa-smoke.md`).
- Coordinar con P6 que `npm test` esté verde antes de empezar el E2E (si no, lo deja arrancado y avisa).

### Paquete 8 — CI con GitHub Actions (Henry)

- `.github/workflows/ci.yml` con jobs `backend` y `frontend` en paralelo: `npm ci`, `lint`, `build`, `test`. Cache de `node_modules` por hash de `package-lock.json`.
- Servicio Postgres en el workflow del job de backend (`services: postgres:16`) con `DATABASE_URL` apuntando a `localhost:5432` para que los specs corran contra una BD real, no solo mocks.
- Variables sensibles del CI como secrets de GitHub (`CI_DATABASE_URL`, `CI_JWT_SECRET`).
- Branch protection en `main`: bloquear merge si el workflow falla.
- Badge de status del CI en `README.md`.

### Paquete 9 — Deploy Railway end-to-end (Henry)

- Crear servicio Postgres en Railway. Cablear `DATABASE_URL` al servicio backend.
- Variables del backend: `JWT_SECRET` (fuerte, ≥32 chars), `CORS_ORIGIN` (URL del frontend desplegado), `PUBLIC_BASE_URL`, `STORAGE_DRIVER=local` por ahora.
- Volumen persistente montado en `/app/uploads` (puente hasta que el paquete 1 termine `S3StorageDriver` y se cambie a `STORAGE_DRIVER=s3`).
- Healthcheck en `/api/health` (depende de que el paquete 1 lo deje pingando la BD).
- Servicio frontend con `NUXT_PUBLIC_API_BASE` apuntando a la URL del backend `+ /api`.
- Probar deploy completo: push a `main` → CI verde (paquete 8) → Railway redeploya → `/api/health` 200 → registro → reserva en producción.
- Sección de "Variables de entorno" actualizada en `README.md` con todo lo necesario para deploy.

---

## Fase MVP-2 — Estabilidad post-lanzamiento (tras MVP-1)

Objetivo: la app aguanta carga real, los errores son visibles, las regresiones se detectan en CI. Cada uno sigue con el mismo paquete que en MVP-1.

### Paquete 1 (Robustez + Storage)
- Filtros en `GET /api/courts`: `businessId`, `type`, `priceMin`, `priceMax`, `lat`/`lng`/`radiusKm` (Haversine).
- Cron `@nestjs/schedule` con `@Cron('0 3 * * 0')`: marcar `no_show` reservas confirmadas con fecha pasada no completadas.
- Notificaciones email con `@nestjs-modules/mailer` y plantillas Handlebars. Mailtrap local mientras tanto; cuando el paquete 7 provisione Resend/SES en prod, solo cambian las env.
- Helmet activo, `npm audit` con threshold de severidad.
- Verificar que `password` nunca aparece en logs ni en respuestas API.

### Paquete 2 (Migración enum)
- Retirar el flag `LEGACY_ROLE_ACCEPT` del `RolesGuard` tras una semana en producción.
- ADR corto en `/docs/adr/` documentando la migración y por qué se eligió convivencia transitoria.

### Paquete 3 (Plugin + stores)
- Code splitting de las páginas grandes (`dashboard`, `admin/*`).
- Skeleton loaders en listas (canchas, reservas) usando los stores ya migrados.

### Paquete 4 (Flujo cliente)
- Vista calendario y feature "repetir reserva" desde el detalle de booking.
- Calificación de canchas tras `completed`.

### Paquete 5 (UI reutilizable)
- Skeleton loaders en listas, code splitting de páginas grandes (`dashboard`, `admin/*`).
- Wireframes de features post-MVP.

### Paquete 6 (Testing backend)
- Cobertura mínima 60% en `auth.service`, `bookings.service`, `courts.service` (medida con `--coverage`).
- Reporte de cobertura como artifact del CI.

### Paquete 7 (E2E)
- Extender la suite Playwright al flujo de business (aprobar/rechazar) y al de admin.
- Tests E2E corren en CI contra el frontend buildado (acuerdo con P1 sobre el workflow).

### Paquete 8 (CI henry)
- Job de PR previews con Playwright.
- `npm audit` en CI con threshold de severidad.
- Cache de Playwright browsers entre runs.

### Paquete 9 (Deploy henry)
- Staging environment en Railway con su propia BD. PR previews opcional.
- Logs estructurados (JSON) en backend con `pino` o `nestjs-pino`.
- Alerta: si `/api/health` falla 3 veces seguidas → notificación al canal del equipo.
- Rotación documentada de `JWT_SECRET`.

---

## Criterios de "Done" para el MVP

- [ ] `npm run build` verde en backend y frontend en `main`.
- [ ] `npm test` ejecuta y pasa todos los specs existentes en backend.
- [ ] CI corre en cada push y bloquea merge si falla.
- [ ] Deploy en Railway con dominio público accesible para los 3 roles.
- [ ] `/api/health` responde 200 y pinga la BD.
- [ ] Un cliente puede completar el flujo `registro → reserva → comprobante subido → estado pending` sin tocar la base de datos manualmente.
- [ ] El comprobante de pago sobrevive a un redeploy (volumen persistente o S3).
- [ ] No quedan referencias a `bussines` (todo es `business`).
- [ ] Rate limit activo en `/api/auth/*`.
- [ ] `README.md` describe pasos exactos para correr local y desplegar.

## Riesgos abiertos

- **Railway free tier:** si la carga sube, el plan no escala bien. Plan B: Render + Supabase.
- **Migración de enum `bussines → business`:** invalida tokens emitidos. El paquete 2 lo resuelve con `RolesGuard` transicional (acepta ambos durante una semana). Hay que retirarlo en MVP-2.
- **Cruce paquete 2 ↔ paquetes 3/4/5:** todos tocan `stores/auth.ts`, middleware o copy de páginas. Si el paquete 2 mergea primero, los otros rebasean fácil. Si mergea último, el paquete 2 absorbe los cambios y reemplaza los literales.
- **Cruce paquete 1 ↔ paquete 9:** el `STORAGE_DRIVER=s3` del paquete 1 reemplaza al volumen persistente del paquete 9. Mientras tanto conviven sin chocar (driver `local` + volumen).
- **Cruce paquete 6 ↔ paquete 8:** ambos tocan la ejecución de `npm test`. El paquete 6 deja `npm test` verde localmente y el paquete 8 lo monta en CI con Postgres. Si el 6 no termina, el 8 puede arrancar con un workflow vacío que solo hace `lint` y `build`, y se completa después.
- **Cruce paquete 4 ↔ paquete 5:** ambos tocan componentes y copy. P4 hace componentes específicos del flujo de reserva, P5 hace los reutilizables y copy global. Si P5 saca `EmptyState`/`ErrorState` primero, P4 los reusa.

## Cambios ya aplicados en esta iteración

Para no acumular deuda silenciosa, este plan parte de los siguientes fixes ya realizados sobre `main`:

- Migración inicial Prisma generada en `backend/prisma/migrations/20260512192505_init/migration.sql` y registrada como aplicada.
- `bookings.service.ts:create` envuelto en `prisma.$transaction` para serializar el chequeo de solapamiento con el insert.
- `auth.service.ts` tipado con `User` de `@prisma/client` (eliminados los `any`).
- Removida la dependencia circular `"tucancha-sena": "file:.."` de `frontend/package.json`.
- Eliminados `plan-mejora-tucancha.md`, `qa-build-report.md` y `backend/output.txt` (estaban desactualizados o eran ruido).
- Stores Pinia `bookings.ts`, `courts.ts`, `businesses.ts` creados (pendiente migrarlos al plugin `$fetch` interceptado en el paquete 3).
