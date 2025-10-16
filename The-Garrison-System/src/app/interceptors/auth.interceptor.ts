/**
 * Interceptor de autenticación HTTP
 * 
 * Este interceptor se encarga de:
 * - Asegurar que las cookies de autenticación se envíen con cada petición
 * - Manejar errores 401 (No autorizado) redirigiendo al login
 * - Evitar bucles infinitos en rutas de autenticación
 * 
 * IMPORTANTE: No inyecta AuthService para evitar dependencias circulares
 */
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * Interceptor de autenticación para peticiones HTTP
 * 
 * Intercepta todas las peticiones HTTP para:
 * - Añadir credenciales (cookies) a cada petición
 * - Detectar errores 401 y redirigir al login automáticamente
 * - Preservar la URL actual para redirección después del login
 * 
 * @param req - Petición HTTP original
 * @param next - Función para continuar con el siguiente interceptor
 * @returns Observable con la respuesta HTTP o error
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Clonar la petición para asegurar que las cookies se envíen
  const clonedReq = req.clone({
    withCredentials: true // Incluir cookies de autenticación
  });

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Manejar solo errores 401 (No autorizado)
      if (error.status === 401) {
        // Evitar bucle infinito en rutas de autenticación
        if (req.url.includes('/auth/login') ||
          req.url.includes('/auth/register') ||
          req.url.includes('/auth/refresh')) {
          return throwError(() => error);
        }

        console.warn('[AuthInterceptor] 401 detected, redirecting to login...');

        // Redirigir a login preservando la URL actual
        const currentUrl = router.url;
        if (!currentUrl.includes('/login')) {
          router.navigate(['/login'], {
            queryParams: { returnUrl: currentUrl }
          });
        }
      }

      // Para otros errores HTTP, simplemente propagarlos
      return throwError(() => error);
    })
  );
};