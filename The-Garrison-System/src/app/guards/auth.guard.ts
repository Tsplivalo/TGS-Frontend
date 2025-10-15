// src/app/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService, Role } from '../services/auth/auth';

/**
 * Guard básico: verifica si el usuario está autenticado.
 * Si no lo está, redirige a /login con returnUrl.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  // Redirigir a login con URL de retorno
  console.warn('[authGuard] User not authenticated, redirecting to login');
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};

/**
 * Guard de roles: verifica que el usuario tenga al menos uno de los roles permitidos.
 * 
 * @param allowedRoles - Array de roles permitidos
 * @returns CanActivateFn
 * 
 * @example
 * // En routes
 * {
 *   path: 'admin',
 *   component: AdminComponent,
 *   canActivate: [roleGuard([Role.ADMIN])]
 * }
 */
export const roleGuard = (allowedRoles: Role[]): CanActivateFn => {
  return (route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    // 1. Verificar autenticación
    if (!auth.isAuthenticated()) {
      console.warn('[roleGuard] User not authenticated');
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url }
      });
    }

    // 2. Verificar roles
    if (auth.hasAnyRole(allowedRoles)) {
      return true;
    }

    // 3. Usuario autenticado pero sin permisos
    console.warn('[roleGuard] Access denied. User roles:', auth.currentRoles(), 'Required roles:', allowedRoles);
    return router.createUrlTree(['/forbidden']);
  };
};

/**
 * Guard específico para admin.
 * Atajo para roleGuard([Role.ADMIN])
 */
export const adminGuard: CanActivateFn = roleGuard([Role.ADMIN]);

/**
 * Guard para verificar que el perfil esté completo (100%).
 * Útil para páginas que requieren datos personales completos.
 */
export const profileCompleteGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    console.warn('[profileCompleteGuard] User not authenticated');
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  if (auth.hasPersonalInfo()) {
    return true;
  }

  // Redirigir a completar perfil
  console.warn('[profileCompleteGuard] Profile incomplete, redirecting to account');
  return router.createUrlTree(['/account'], {
    queryParams: { completeProfile: true }
  });
};

/**
 * Guard para verificar que el usuario puede comprar.
 * Requiere: email verificado Y datos personales completos.
 */
export const canPurchaseGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    console.warn('[canPurchaseGuard] User not authenticated');
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  if (auth.canPurchase()) {
    return true;
  }

  // Mostrar qué falta
  const requirements = auth.getPurchaseRequirements();
  console.warn('[canPurchaseGuard] Purchase requirements not met:', requirements);

  // Si no tiene email verificado
  if (!auth.emailVerified()) {
    return router.createUrlTree(['/verify-email'], {
      queryParams: { returnUrl: state.url }
    });
  }

  // Si no tiene datos personales
  if (!auth.hasPersonalInfo()) {
    return router.createUrlTree(['/account'], {
      queryParams: { completeProfile: true, returnUrl: state.url }
    });
  }

  // Fallback
  return router.createUrlTree(['/account']);
};

/**
 * Guard para verificar email verificado.
 */
export const emailVerifiedGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  if (auth.emailVerified()) {
    return true;
  }

  console.warn('[emailVerifiedGuard] Email not verified');
  return router.createUrlTree(['/verify-email'], {
    queryParams: { returnUrl: state.url }
  });
};

/**
 * Guard para rutas que solo deben ser accesibles para usuarios NO autenticados
 * (por ejemplo: login, register)
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }

  // Si ya está autenticado, redirigir a home
  console.log('[guestGuard] User already authenticated, redirecting to home');
  return router.createUrlTree(['/']);
};