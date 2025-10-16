import type { Page } from '@playwright/test';

// --- AUTH MOCK USER CON ROLES ---
export const userDemo = {
  id: 'u1',
  email: 'demo@tgs.com',
  roles: ['CLIENT', 'ADMIN'], // <- acceso a products
};

let isLogged = false;


/** Mocks de auth: /api/auth/login, /api/users/me, /api/auth/me y /api/auth/logout */
export async function setupAuthRoutes(page: Page) {
  isLogged = false;

  // LOGIN
  // dentro de setupAuthRoutes(page)
await page.route('**/api/products', async (route) => {
  const products = [
    { id: 1, name: 'Whisky Shelby', price: 100, stock: 10 },
    { id: 2, name: 'Gorro Flat Cap', price: 50, stock: 25 },
    { id: 3, name: 'Abrigo Peaky', price: 200, stock: 5 },
  ];
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(products),
  });
});

// opcional si tu app llama singular
await page.route('**/api/product', async (route) => {
  const products = [
    { id: 1, name: 'Whisky Shelby', price: 100, stock: 10 },
    { id: 2, name: 'Gorro Flat Cap', price: 50, stock: 25 },
    { id: 3, name: 'Abrigo Peaky', price: 200, stock: 5 },
  ];
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(products),
  });
});

}


export function resetAuthMocks() {
  isLogged = false;
}

/** Login por UI (backup) */
export async function doLogin(page: Page, email = 'demo@tgs.com', password = 'Demo123!') {
  const emailField =
    page.getByLabel(/email|correo/i)
      .or(page.getByPlaceholder(/email|correo/i))
      .or(page.locator('[data-testid="email"], input[type="email"]'))
      .first();
  await emailField.waitFor({ state: 'visible' });
  await emailField.fill(email);

  const pwdField =
    page.getByLabel(/contraseña|password|clave/i)
      .or(page.getByPlaceholder(/contraseña|password|clave/i))
      .or(page.locator('[data-testid="password"], input[type="password"]'))
      .first();
  await pwdField.fill(password);

  const loginBtnCandidates = [
    page.getByRole('button', { name: /entrar|ingresar|iniciar sesión|acceder|login/i }),
    page.locator('button[type="submit"]'),
    page.locator('[data-testid="login-btn"]'),
    page.locator('button'),
  ];

  for (const cand of loginBtnCandidates) {
    const btn = cand.first();
    try {
      await btn.waitFor({ state: 'visible', timeout: 2000 });
      await btn.click();
      break;
    } catch {}
  }

  await page.waitForLoadState('networkidle');
}


export async function loginViaApi(
  page: Page,
  email = 'demo@tgs.com',
  password = 'Demo123!'
) {
  await page.evaluate(async (data) => {
    await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    }).catch(() => {});
  }, { email, password });

  const waitMe = page.waitForResponse(
    (res) => /\/api\/(users|auth)\/me$/.test(res.url()) && res.status() === 200,
    { timeout: 8000 }
  ).catch(() => null);

  await page.goto('/', { waitUntil: 'networkidle' });

  const meWasSeen = await waitMe;
  if (!meWasSeen) {
    const secondWait = page.waitForResponse(
      (res) => /\/api\/(users|auth)\/me$/.test(res.url()) && res.status() === 200,
      { timeout: 5000 }
    ).catch(() => null);

    await page.evaluate(async () => {
      await fetch('/api/auth/me', { credentials: 'include' }).catch(() => {});
    });
    await secondWait;
  }
}


