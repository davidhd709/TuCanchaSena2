# QA Smoke Test Report - Paquete P7

## 🎯 Objetivo
Validar el flujo crítico de la aplicación "Tu Cancha" para asegurar que las funcionalidades base de registro, reserva y gestión estén operativas.

## 🛠️ Entorno de Pruebas
- **Fecha:** 14 de mayo de 2026
- **Frontend:** Nuxt 3 / Vuetify
- **Backend:** NestJS / Prisma
- **Estado de Tests Unitarios:** ✅ Verde (Pasados)

## 🧪 Casos de Prueba (Smoke Test)

| ID | Caso de Prueba | Pasos | Resultado Esperado | Estado | Notas |
|:---|:---|:---|:---|:---:|:---|
| ST-01 | Registro de Usuario | 1. Ir a /auth/register<br>2. Llenar datos válidos<br>3. Click en Registrar | Usuario creado y redirigido al login | ✅ | |
| ST-02 | Login de Usuario | 1. Ir a /auth/login<br>2. Ingresar credenciales<br>3. Click en Entrar | Acceso concedente y redirección al dashboard | ✅ | |
| ST-03 | Realización de Reserva | 1. Seleccionar cancha<br>2. Elegir fecha y hora disponible<br>3. Confirmar reserva | Reserva creada con estado `PENDING` | ✅ | |
| ST-04 | Aprobación de Negocio | 1. Login como Admin Negocio<br>2. Ir a Gestión de Reservas<br>3. Cambiar estado a `CONFIRMED` | Reserva actualizada a confirmada | ✅ | |
| ST-05 | Cancelación de Reserva | 1. Ir a Mis Reservas<br>2. Seleccionar reserva confirmada<br>3. Click en Cancelar | Reserva actualizada a estado `CANCELLED` | ✅ | |

## 🚩 Regresiones Encontradas
- Ninguna regresión crítica detectada durante el flujo manual.

## 📝 Conclusión
El flujo crítico se encuentra operativo. Se puede proceder con la automatización de los tests E2E con Playwright.
