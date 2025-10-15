import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * Interceptor de autenticación
 * 
 * IMPORTANTE: NO inyecta AuthService para evitar dependencia circular
 * Solo maneja cookies y redirige a login en caso de 401
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Asegurar que las cookies se envíen con cada petición
  const clonedReq = req.clone({
    withCredentials: true
  });

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Solo manejar errores 401 (no autorizado)
      if (error.status === 401) {
        // Evitar bucle infinito en rutas de auth
        if (req.url.includes('/auth/login') || 
            req.url.includes('/auth/register') ||
            req.url.includes('/auth/refresh')) {
          return throwError(() => error);
        }

        console.warn('[AuthInterceptor] 401 detected, redirecting to login...');
        
        // Redirigir a login con URL de retorno
        const currentUrl = router.url;
        if (!currentUrl.includes('/login')) {
          router.navigate(['/login'], {
            queryParams: { returnUrl: currentUrl }
          });
        }
      }

      // Para otros errores, simplemente propagarlos
      return throwError(() => error);
    })
  );
};