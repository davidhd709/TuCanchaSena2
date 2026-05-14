# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: critical-flow.spec.ts >> Flujo Crítico de Usuario >> debería registrarse, realizar una reserva y validar estado pending
- Location: tests\e2e\critical-flow.spec.ts:10:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[name="name"]')

```

# Page snapshot

```yaml
- main [ref=e5]:
  - generic [ref=e9]:
    - img "TuCancha" [ref=e11]
    - generic [ref=e12]:
      - generic [ref=e13]:
        - heading "Crea tu cuenta" [level=1] [ref=e14]
        - paragraph [ref=e15]: Únete y empieza a reservar canchas hoy
      - generic [ref=e16]:
        - generic [ref=e17]:
          - generic [ref=e18]:
            - generic [ref=e19]: Nombre
            - generic [ref=e20]:
              - generic: 󰀓
              - textbox "Juan" [ref=e25]
          - generic [ref=e26]:
            - generic [ref=e27]: Apellido
            - textbox "Pérez" [ref=e33]
        - generic [ref=e34]:
          - generic [ref=e35]: Correo electrónico
          - generic [ref=e36]:
            - generic: 󰇰
            - textbox "tu@correo.com" [ref=e41]
        - generic [ref=e42]:
          - generic [ref=e43]: Teléfono (opcional)
          - generic [ref=e44]:
            - generic: 󰷰
            - textbox "+57 300 000 0000" [ref=e49]
        - generic [ref=e50]:
          - generic [ref=e51]: Tipo de cuenta
          - generic [ref=e52]:
            - generic: 󰯤
            - combobox [ref=e55] [cursor=pointer]:
              - generic [ref=e57]:
                - generic [ref=e59]: Cliente
                - combobox: Cliente
              - generic [ref=e61]: 󰍝
        - generic [ref=e62]:
          - generic [ref=e63]: Contraseña
          - generic [ref=e64]:
            - generic: 󰍁
            - textbox "Mínimo 6 caracteres" [ref=e69]
            - button "󰛐" [ref=e70] [cursor=pointer]:
              - generic [ref=e71]: 󰛐
        - generic [ref=e72]:
          - generic [ref=e73]: Confirmar contraseña
          - generic [ref=e74]:
            - generic: 󱚨
            - textbox "Repite tu contraseña" [ref=e79]
        - button "󰠁 Registrarse" [ref=e80] [cursor=pointer]:
          - generic [ref=e81]:
            - generic [ref=e82]: 󰠁
            - text: Registrarse
      - generic [ref=e85]: ¿Ya tienes cuenta?
      - link "Iniciar sesión" [ref=e87] [cursor=pointer]:
        - /url: /auth/login
    - paragraph [ref=e88]: © 2026 TuCancha · Todos los derechos reservados
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Flujo Crítico de Usuario', () => {
  4  |   const testUser = {
  5  |     email: `testuser_${Date.now()}@example.com`,
  6  |     password: 'Password123!',
  7  |     name: 'Test User',
  8  |   };
  9  | 
  10 |   test('debería registrarse, realizar una reserva y validar estado pending', async ({ page }) => {
  11 |     // 1. Registro
  12 |     await page.goto('/auth/register');
> 13 |     await page.fill('input[name="name"]', testUser.name);
     |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  14 |     await page.fill('input[name="email"]', testUser.email);
  15 |     await page.fill('input[name="password"]', testUser.password);
  16 |     await page.click('button[type="submit"]');
  17 |     
  18 |     // Validar redirección o mensaje de éxito
  19 |     await expect(page).toHaveURL(/.*login|dashboard/);
  20 | 
  21 |     // 2. Login (si es necesario)
  22 |     if (page.url().includes('login')) {
  23 |       await page.fill('input[name="email"]', testUser.email);
  24 |       await page.fill('input[name="password"]', testUser.password);
  25 |       await page.click('button[type="submit"]');
  26 |     }
  27 | 
  28 |     // 3. Realización de Reserva
  29 |     // Navegar a la página de canchas/reservas
  30 |     await page.goto('/dashboard'); // Asumiendo que el dashboard es el punto de entrada
  31 |     
  32 |     // Seleccionar una cancha (buscamos el primer botón de reservar disponible)
  33 |     const reserveButton = page.locator('text=Reservar').first();
  34 |     await expect(reserveButton).toBeVisible();
  35 |     await reserveButton.click();
  36 | 
  37 |     // Llenar datos de la reserva (Fecha y Hora)
  38 |     // Nota: Usamos selectores genéricos basados en la estructura común de formularios de reserva
  39 |     await page.fill('input[type="date"]', new Date().toISOString().split('T')[0]);
  40 |     await page.fill('input[type="time"]', '10:00');
  41 |     
  42 |     // Confirmar reserva
  43 |     await page.click('button:has-text("Confirmar")');
  44 | 
  45 |     // 4. Validación de estado Pending
  46 |     await page.goto('/profile'); // O la página de "Mis Reservas"
  47 |     
  48 |     // Buscamos el chip de estado 'pending'
  49 |     const statusChip = page.locator('text=Pending'); 
  50 |     await expect(statusChip).toBeVisible();
  51 |   });
  52 | });
  53 | 
```