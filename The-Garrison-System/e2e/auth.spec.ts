import { test, expect } from '@playwright/test';

test('app carga y (si existe) el login funciona', async ({ page }) => {
 
  await page.goto('/');

  
  const maybeLoginLink = page.locator(
    'a:has-text("Login"), a:has-text("Ingresar"), a:has-text("Acceder"), ' +
    '[routerLink="/login"], [href*="/login"], [href*="/auth"]'
  );
  if (await maybeLoginLink.count()) {
    await Promise.all([
      page.waitForURL(/login|auth/i, { waitUntil: 'load' }),
      maybeLoginLink.first().click(),
    ]);
  }

  
  const email = page.locator(
    'input[type="email"], input[name*="email" i], input[placeholder*="correo" i], input[placeholder*="email" i]'
  );
  const pass = page.locator(
    'input[type="password"], input[name*="pass" i], input[placeholder*="contraseña" i]'
  );

  const haveLoginForm = (await email.count()) > 0 && (await pass.count()) > 0;

  if (haveLoginForm) {
    
    await email.first().fill(process.env.E2E_EMAIL ?? 'demo@garrison.test');
    await pass.first().fill(process.env.E2E_PASS ?? 'demo1234');

    const submitBtn = page
      .getByRole('button', { name: /login|ingresar|acceder|iniciar/i })
      .or(page.locator('button[type="submit"]'));

    if (await submitBtn.count()) {
      await Promise.all([
        page.waitForLoadState('networkidle'),
        submitBtn.first().click(),
      ]);
    }
  }


  await expect(page.locator('app-root')).toBeVisible();
  await expect(page).toHaveTitle(/garr|garrison|garrsys/i);
});
