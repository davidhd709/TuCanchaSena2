import { test, expect } from '@playwright/test';

test.describe('Flujo Crítico de Usuario', () => {
  const testUser = {
    email: `testuser_${Date.now()}@example.com`,
    password: 'Password123!',
    name: 'Test User',
  };

  test('debería registrarse, realizar una reserva y validar estado pending', async ({ page }) => {
    // 1. Registro
    await page.goto('/auth/register');
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Validar redirección o mensaje de éxito
    await expect(page).toHaveURL(/.*login|dashboard/);

    // 2. Login (si es necesario)
    if (page.url().includes('login')) {
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');
    }

    // 3. Realización de Reserva
    // Navegar a la página de canchas/reservas
    await page.goto('/dashboard'); // Asumiendo que el dashboard es el punto de entrada
    
    // Seleccionar una cancha (buscamos el primer botón de reservar disponible)
    const reserveButton = page.locator('text=Reservar').first();
    await expect(reserveButton).toBeVisible();
    await reserveButton.click();

    // Llenar datos de la reserva (Fecha y Hora)
    // Nota: Usamos selectores genéricos basados en la estructura común de formularios de reserva
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0]);
    await page.fill('input[type="time"]', '10:00');
    
    // Confirmar reserva
    await page.click('button:has-text("Confirmar")');

    // 4. Validación de estado Pending
    await page.goto('/profile'); // O la página de "Mis Reservas"
    
    // Buscamos el chip de estado 'pending'
    const statusChip = page.locator('text=Pending'); 
    await expect(statusChip).toBeVisible();
  });
});
