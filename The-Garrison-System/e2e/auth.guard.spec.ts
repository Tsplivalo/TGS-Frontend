import { test, expect } from '@playwright/test';
import { setupAuthRoutes, resetAuthMocks, loginViaApi } from './utils';

test.describe('Rutas protegidas (guards) + login', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthRoutes(page);
    await page.goto('/');
  });

  test.afterEach(() => resetAuthMocks());

  test('si no estoy autenticado, ir a products redirige a /login', async ({ page }) => {
    await page.goto('/products').catch(async () => { await page.goto('/product'); });
    await expect(page).toHaveURL(/\/login/);
  });

  test('login exitoso y luego products es accesible', async ({ page }) => {
  await loginViaApi(page);

  // Intento por UI si existe link; si no, voy directo
  const productsLink =
    page.getByRole('link', { name: /producto(s)?|tienda|store/i }).first()
      .or(page.getByRole('menuitem', { name: /producto(s)?|tienda|store/i }).first());

  const hasLink = await productsLink.isVisible().catch(() => false);
  if (hasLink) {
    await productsLink.click().catch(() => {});
  } else {
    await page.goto('/products', { waitUntil: 'networkidle' })
      .catch(async () => { await page.goto('/product', { waitUntil: 'networkidle' }); });
  }

  // Esperá la llamada a productos (mockeada) para confirmar acceso real
  const productsOk = await page.waitForResponse(
    (res) => /\/api\/product(s)?$/.test(res.url()) && res.status() === 200,
    { timeout: 8000 }
  ).then(() => true).catch(() => false);

  // No debe mandarte a /login
  await expect(page).not.toHaveURL(/\/login/);

  // Si por UX te quedaste en '/', igual exigimos que el endpoint sea accesible
  expect(productsOk, 'Debería poder acceder a /api/products estando logueado').toBe(true);
});

});
