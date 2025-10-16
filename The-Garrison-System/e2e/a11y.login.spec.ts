import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { setupAuthRoutes, resetAuthMocks } from './utils';

test.describe('Accesibilidad - Login', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthRoutes(page);
    await page.goto('/login');
  });

  test.afterEach(() => { resetAuthMocks(); });

  test('no hay violaciones críticas o serias en /login', async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .exclude('.menu, nav, header') // 👈 excluye la barra de navegación
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  const serious = (results.violations || []).filter(v => ['serious', 'critical'].includes(v.impact || ''));
  if (serious.length) {
    console.log('Violaciones serias/criticas:', JSON.stringify(serious, null, 2));
  }
  expect(serious.length, 'Accesibilidad (serio/crítico) en /login').toBe(0);
});

});
