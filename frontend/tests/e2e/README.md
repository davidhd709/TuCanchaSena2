# Tests E2E (Playwright)

Pruebas de extremo a extremo del flujo de reservas de Tu Cancha. Validan login por
rol, alta de reservas, aprobación/rechazo desde el panel de business y regresiones
visuales contra los hallazgos previos (Invalid Date, texto sin horarios, CORS dev,
imágenes externas).

## Pre-requisitos

Antes de correr `npm run test:e2e` deben estar arriba:

1. **Postgres** corriendo con la DB de Tu Cancha.
2. Migraciones aplicadas:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```
3. **Seed** ejecutado (crea los 3 usuarios demo y los negocios/canchas):
   ```bash
   cd backend
   npm run db:seed
   ```
   Credenciales que usa la suite:
   | Rol      | Email                       | Password       |
   |----------|-----------------------------|----------------|
   | client   | cliente@tucancha.local      | Password123!   |
   | business | negocio@tucancha.local      | Password123!   |
   | admin    | admin@tucancha.local        | Password123!   |
4. **Backend** corriendo en `http://localhost:8001` (terminal aparte):
   ```bash
   cd backend
   npm run start:dev
   ```
5. **Frontend** corriendo en `http://localhost:3000` (terminal aparte):
   ```bash
   cd frontend
   npm run dev
   ```
6. **Browser de Playwright** instalado (sola vez por máquina):
   ```bash
   cd frontend
   npm run test:e2e:install
   ```

Variables opcionales:
- `E2E_BASE_URL` — default `http://localhost:3000`
- `E2E_API_BASE` — default `http://localhost:8001/api`

## Comandos

```bash
cd frontend
npm run test:e2e            # corre todos los specs
npm run test:e2e:ui         # modo UI interactivo
npx playwright test 03-client-booking.spec.ts   # solo un spec
npx playwright show-report  # abre el HTML report tras correr
```

## Independencia de los specs

Los 8 specs son independientes entre sí — **ningún spec depende de datos creados
por otro**. Cada uno hace su propio setup:

| Spec | Setup propio | UI cubierta | Verificación |
|---|---|---|---|
| `01-smoke` | — | `/` | sin errores de consola |
| `02-auth-login` | — | login client + business | redirección fuera de `/auth/login` |
| `03-client-booking` | navega desde el listado de negocios | flujo completo cliente | chip "Pendiente" en detalle |
| `04-business-approve` | crea su propia reserva pending vía API | aprobar desde detail dialog | API: status === `confirmed` |
| `05-business-reject` | crea su propia reserva pending vía API | rechazar desde reject dialog | API: status === `rejected` y slot disponible |
| `06-regression-ux` | crea su propia reserva (no "Invalid Date") y navega a fecha lejana (texto sin slots) | mis reservas + detalle cancha | sin "Invalid Date" + texto canónico |
| `07-cors-dev` | — | (sin browser) | header `access-control-allow-origin` por origen |
| `08-image-fallback` | aborta requests a `picsum.photos` | `/client/businesses` | placeholder `.biz-card-img--ph` visible |

Todos los specs serializan (`workers: 1`, `fullyParallel: false`) para evitar
condiciones de carrera al consumir slots de una misma cancha.

## Suposiciones sobre el seed

- Existe al menos un negocio activo con al menos una cancha disponible.
- El cliente `cliente@tucancha.local` (Ana Gómez) es quien aparece en las reservas
  creadas por la suite — el spec `04` y `05` filtran sus cards por ese nombre.
- La cancha del seed admite reservas en el día siguiente. Si tu seed cambia la
  disponibilidad semanal, los specs que reservan a `+1 día` pueden saltarse con
  `test.skip(...)` cuando `getAvailableSlots()` devuelve 0 huecos.

## Artefactos

Los artefactos van a `frontend/test-results/` y `frontend/playwright-report/`,
ambos ignorados por git. No subir traces, screenshots ni videos al repo.

## QA visual sobre build estable (no HMR)

Para revisión visual del rediseño (en lugar de `npm run dev`, que tiene HMR
y puede mostrar flickering / re-renders intermedios), corre el build de
producción local:

```bash
cd frontend
npm run build                 # genera .output/
PORT=3100 npm run preview     # sirve el build (usa :3100 para no chocar con el dev en :3000)
```

`preview` sirve los chunks finales de Nitro/Vite tal como van a producción:
sin HMR, sin source-maps inline, con tree-shaking aplicado. Ábrelo en el
navegador (DevTools → Toggle device) y recorre estos breakpoints:
`360 / 390 / 768 / 1024 / 1440`.

### Checklist de QA visual (Design System F0–F6)

Tema dark premium / branding:
- [ ] Toda la app cliente/business/admin se ve dark premium consistente (no quedan
      zonas en tema claro ni verdes "forest" sueltos en el landing).
- [ ] Placeholders de imagen muestran el **logo de TuCancha** (no icono genérico
      ni paisajes de picsum) en: cards de negocio/cancha, "Mis reservas", galería
      de detalle de cancha/negocio y aside de pago.

Formularios y modales:
- [ ] "Editar negocio" y "Editar cancha" muestran bloques con encabezado
      (Información general / Detalles / Fotos / Horarios) y separadores.
- [ ] Inputs sin borde verde permanente; el verde aparece solo en focus.
- [ ] Chips de multiselect ("Características", "URLs de fotos") con spacing
      correcto, sin iconos montados.
- [ ] Modales largos: header fijo, body con scroll interno, footer sticky.

Horarios:
- [ ] Horario de negocio: una fila limpia por día (switch + día + horas).
- [ ] Disponibilidad de cancha: cada slot ordenado (inicio—fin + precio + tag +
      acciones), sin chips compitiendo. Apila bien en móvil.

Flujos clave (ya cubiertos por E2E, revisar visualmente):
- [ ] Pantalla de pago: card de confianza visible antes del CTA.
- [ ] Detalle de negocio: acordeones claros como expansión en móvil.
- [ ] Hero home cliente: CTA principal + 3 beneficios sobre el primer pliegue
      en 360/390.
- [ ] Panel business → Reservas: botones Confirmar/Rechazar tocables (≥44 px) en
      cards pending; nombre del cliente visible (fix user/client).
- [ ] Fechas de reserva muestran el día correcto (sin shift de un día).

Para reproducir botones inline Confirmar/Rechazar en QA: crea una reserva
desde el cliente y sube comprobante; quedará `pending` y aparecerá en el
panel del business.

## Limitaciones conocidas

- Si corres la suite varias veces sin re-seedear la DB, los slots del día `+1`
  se llenan progresivamente. Tras unas 10 corridas seguidas algún spec puede
  marcarse como `skipped` por "Sin slots disponibles". Solución: `npm run db:seed`
  (el seed borra reservas previas y conserva los usuarios).
- El test de CORS valida que el backend devuelve el header esperado, pero no
  hace un preflight real desde un browser en `:3001`. Si necesitas reproducir el
  comportamiento exacto del navegador, levanta Nuxt en `:3001` con
  `PORT=3001 npm run dev` y carga la app manualmente.
- `08-image-fallback` solo valida `BusinessCard`. `CourtCard` y `BookingCard`
  comparten la misma implementación de fallback, por lo que su comportamiento
  está cubierto indirectamente. Si en algún momento divergen, conviene añadir
  un spec por componente.
