/**
 * Guards de autenticación y autorización
 * 
 * Este archivo contiene todos los guards necesarios para proteger las rutas
 * de la aplicación según diferentes criterios:
 * - Autenticación básica
 * - Verificación de roles
 * - Verificación de estado del perfil
 * - Verificación de permisos de compra
 * - Protección para usuarios no autenticados
 */
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth/auth';
import { Role } from '../models/user/user.model';

/**
 * Guard básico de autenticación
 * 
 * Verifica si el usuario está autenticado. Si no lo está,
 * redirige a la página de login manteniendo la URL de destino
 * para redirigir después del login exitoso.
 * 
 * @param route - Información de la ruta actual
 * @param state - Estado del router
 * @returns true si está autenticado, UrlTree para redirección si no
 */
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  // Redirigir a login con URL de retorno para continuar después del login
  console.warn('[authGuard] User not authenticated, redirecting to login');
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};

/**
 * Factory function para crear guard de verificación de roles
 * 
 * Crea un guard que verifica que el usuario tenga al menos uno de los roles
 * permitidos. Primero verifica autenticación y luego autorización por roles.
 * 
 * @param allowedRoles - Array de roles permitidos para acceder a la ruta
 * @returns CanActivateFn que verifica roles
 * 
 * @example
 * // Uso en configuración de rutas
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

    // 1. Verificar autenticación primero
    if (!auth.isAuthenticated()) {
      console.warn('[roleGuard] User not authenticated');
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url }
      });
    }

    // 2. Verificar si el usuario tiene alguno de los roles permitidos
    if (auth.hasAnyRole(allowedRoles)) {
      return true;
    }

    // 3. Usuario autenticado pero sin permisos suficientes
    console.warn('[roleGuard] Access denied. User roles:', auth.currentRoles(), 'Required roles:', allowedRoles);
    return router.createUrlTree(['/forbidden']);
  };
};

/**
 * Guard específico para administradores
 * 
 * Atajo para roleGuard([Role.ADMIN]) que verifica que el usuario
 * tenga el rol de administrador.
 */
export const adminGuard: CanActivateFn = roleGuard([Role.ADMIN]);

/**
 * Guard para verificar que el perfil del usuario esté completo
 * 
 * Verifica que el usuario tenga todos los datos personales necesarios
 * (100% de completitud). Útil para páginas que requieren información
 * personal completa del usuario.
 * 
 * @param route - Información de la ruta actual
 * @param state - Estado del router
 * @returns true si el perfil está completo, redirección si no
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

  // Redirigir a completar perfil con indicador de que debe completarse
  console.warn('[profileCompleteGuard] Profile incomplete, redirecting to account');
  return router.createUrlTree(['/account'], {
    queryParams: { completeProfile: true }
  });
};

/**
 * Guard para verificar que el usuario puede realizar compras
 * 
 * Verifica que el usuario cumpla con todos los requisitos para comprar:
 * - Estar autenticado
 * - Tener email verificado
 * - Tener datos personales completos
 * 
 * Redirige a la página correspondiente según lo que falte por completar.
 * 
 * @param route - Información de la ruta actual
 * @param state - Estado del router
 * @returns true si puede comprar, redirección según lo que falte
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

  // Obtener información sobre qué requisitos faltan
  const requirements = auth.getPurchaseRequirements();
  console.warn('[canPurchaseGuard] Purchase requirements not met:', requirements);

  // Redirigir según lo que falte por completar
  if (!auth.emailVerified()) {
    return router.createUrlTree(['/verify-email'], {
      queryParams: { returnUrl: state.url }
    });
  }

  if (!auth.hasPersonalInfo()) {
    return router.createUrlTree(['/account'], {
      queryParams: { completeProfile: true, returnUrl: state.url }
    });
  }

  // Fallback: redirigir a la cuenta
  return router.createUrlTree(['/account']);
};

/**
 * Guard para verificar que el email del usuario esté verificado
 * 
 * Verifica que el usuario tenga su dirección de email verificada.
 * Si no está verificado, redirige a la página de verificación de email.
 * 
 * @param route - Información de la ruta actual
 * @param state - Estado del router
 * @returns true si el email está verificado, redirección si no
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
 * Guard para rutas exclusivas de usuarios no autenticados
 * 
 * Protege rutas que solo deben ser accesibles para usuarios que NO están
 * autenticados, como las páginas de login y registro. Si el usuario ya
 * está autenticado, lo redirige a la página principal.
 * 
 * @param route - Información de la ruta actual
 * @param state - Estado del router
 * @returns true si no está autenticado, redirección a home si ya lo está
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }

  // Si ya está autenticado, redirigir a la página principal
  console.log('[guestGuard] User already authenticated, redirecting to home');
  return router.createUrlTree(['/']);
};