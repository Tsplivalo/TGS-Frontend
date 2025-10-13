import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth/auth';

function isLoggedInOrBypass(auth: AuthService): boolean {
  // soporte para el bypass localStorage que usaste para testear roles
  const bypass = localStorage.getItem('authBypass') === 'true';
  return !!auth.isLoggedIn() || bypass;
}

export const canActivateAuth: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return isLoggedInOrBypass(auth) ? true : router.createUrlTree(['/login']);
};

export const canMatchAuth: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return isLoggedInOrBypass(auth) ? true : router.createUrlTree(['/login']);
};
