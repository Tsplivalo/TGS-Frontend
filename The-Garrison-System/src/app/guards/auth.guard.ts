import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth';

/** Helpers de bypass para testing sin backend */
function hasBypass(): boolean {
  try { return localStorage.getItem('authBypass') === 'true'; } catch { return false; }
}

/** Auth “efectiva” = sesión real o bypass local */
function isAuthed(auth: AuthService): boolean {
  return !!auth.isLoggedIn() || hasBypass();
}

/** Guard genérico que sirve para canActivate y canMatch */
function authGuardCore(): boolean | ReturnType<Router['parseUrl']> {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (isAuthed(auth)) return true;
  return router.parseUrl('/login');
}

/** Export para canActivate */
export const authGuard: CanActivateFn = () => authGuardCore();

/** Export para canMatch (lo podés usar donde lo necesites sin cambiar rutas) */
export const authMatchGuard: CanMatchFn = () => authGuardCore();
