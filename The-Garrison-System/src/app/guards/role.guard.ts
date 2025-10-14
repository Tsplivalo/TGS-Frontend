import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth';

/** Helpers de bypass para testing sin backend */
function hasBypass(): boolean {
  try { return localStorage.getItem('authBypass') === 'true'; } catch { return false; }
}
function mockRoles(): string[] {
  try {
    const raw = localStorage.getItem('mockRoles');
    return raw
      ? raw.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
      : [];
  } catch { return []; }
}

/** Roles efectivos = mock (si existen) o reales del AuthService */
function effectiveRoles(auth: AuthService): string[] {
  const mocks = mockRoles();
  if (mocks.length) return mocks;
  return (auth.roles() || []).map(r => (r || '').toString().toUpperCase());
}

function isAuthed(auth: AuthService): boolean {
  return !!auth.isLoggedIn() || hasBypass();
}

/**
 * RoleGuard
 * Usa data: { roles: ('ADMIN'|'PARTNER'|'DISTRIBUTOR'|'CLIENT'|'SOCIO'|'DISTRIBUIDOR')[] }
 * Si no hay roles en data, deja pasar.
 * Si no está autenticado → /login.
 * Si está autenticado pero no cumple roles → /forbidden.
 */
function roleGuardCore(route: any): boolean | ReturnType<Router['parseUrl']> {
  const auth = inject(AuthService);
  const router = inject(Router);

  const expected = (route?.data?.['roles'] as string[] | undefined) ?? [];
  if (expected.length === 0) return true;

  if (!isAuthed(auth)) {
    return router.parseUrl('/login');
  }

  const userRoles = effectiveRoles(auth);
  const ok = expected.some(er => userRoles.includes(er.toUpperCase()));

  return ok ? true : router.parseUrl('/forbidden');
}

/** Export para canActivate */
export const roleGuard: CanActivateFn = (route) => roleGuardCore(route);

/** Export para canMatch (si algún día lo querés usar así) */
export const roleMatchGuard: CanMatchFn = (route) => roleGuardCore(route);
