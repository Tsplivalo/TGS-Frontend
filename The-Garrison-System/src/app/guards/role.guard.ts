import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, CanMatchFn, Route, Router, UrlSegment, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth/auth';

function getRoles(): string[] {
  // roles del bypass para pruebas
  const raw = localStorage.getItem('mockRoles');
  const fromMock = raw ? raw.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) : [];
  if (fromMock.length) return fromMock;

  // roles reales desde el AuthService
  const auth = inject(AuthService);
  const rs = auth.user()?.roles ?? [];
  return Array.isArray(rs) ? rs.map(r => (r || '').toString().toUpperCase()) : [];
}

function hasAnyRole(needed: string[]): boolean {
  if (!needed?.length) return true;
  const set = new Set(getRoles());
  return needed.some(r => set.has(r.toUpperCase()));
}

function onlyClientBase(): boolean {
  const roles = new Set(getRoles());
  const isClient = roles.has('CLIENT') || roles.has('CLIENTE');
  const hasOther = roles.has('ADMIN') || roles.has('ADMINISTRATOR') || roles.has('SOCIO') || roles.has('DISTRIBUIDOR');
  return isClient && !hasOther;
}

function check(data: any): boolean {
  // data.roles: []  -> roles aceptados (ANY)
  // data.onlyClientBase: true -> exactamente cliente sin otros roles
  if (data?.onlyClientBase) return onlyClientBase();
  if (Array.isArray(data?.roles)) return hasAnyRole(data.roles);
  return true;
}

export const canActivateRole: CanActivateFn = (route) => {
  const router = inject(Router);
  if (check(route.data)) return true;
  return router.createUrlTree(['/unauthorized']);
};

export const canMatchRole: CanMatchFn = (route: Route, _: UrlSegment[]) => {
  const router = inject(Router);
  if (check(route.data)) return true;
  return router.createUrlTree(['/unauthorized']);
};
