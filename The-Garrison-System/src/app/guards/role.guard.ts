import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth/auth';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const expectedRoles = route.data['roles'] as string[];

  const user = auth.user();

  if (!user) {
    router.navigateByUrl('/login');
    return false;
  }

  const userRoles = user.roles || [];

  if (userRoles.includes('admin')) return true;

  if (expectedRoles.some(role => userRoles.includes(role))) {
    return true;
  }

  router.navigateByUrl('/'); // Or a 'not-authorized' page
  return false;
};
