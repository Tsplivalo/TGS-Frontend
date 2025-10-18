// src/app/interceptors/auth.interceptor.ts
import { inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import {
  HttpInterceptorFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { filter } from 'rxjs/operators';
import { throwError } from 'rxjs';

// Flag global para saber si ya terminó la primera navegación real
let hasNavigatedOnce = false;

function isPublicVerificationHref(href: string): boolean {
  try {
    // Acepta href absolutas o relativas del router
    const u = href.startsWith('http')
      ? new URL(href)
      : new URL(href, (typeof window !== 'undefined' ? window.location.origin : 'http://localhost'));
    const pathOk = (u.pathname === '/verify-email') || u.pathname.startsWith('/verify-email/');
    const qOk = u.searchParams.has('token'); // /verify-email?token=...
    const hashOk = new URLSearchParams(u.hash.replace(/^#/, '')).has('token'); // /verify-email#token=...
    return pathOk || qOk || hashOk;
  } catch {
    // Fallback defensivo si no se pudo parsear
    return href.includes('/verify-email');
  }
}

/**
 * Interceptor de autenticación
 *
 * - No redirige en 401 si estás en la verificación de email.
 * - No redirige durante la primera navegación (evita "pisar" la URL antes de que el Router la procese).
 * - En otros casos, deja pasar el 401 (podés agregar redirect a /login si lo querés más agresivo).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Marcar cuando haya finalizado la primera navegación real
  // (se ejecuta una sola vez por app boot)
  router.events
    .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
    .subscribe(() => { hasNavigatedOnce = true; });

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err?.status === 401) {
        // Usar la URL REAL del navegador (router.url puede ser "/" muy temprano)
        const href =
          (typeof window !== 'undefined' && window.location?.href)
            ? window.location.href
            : (router.url || '/');

        // 1) Si estamos en verificación de email, NO tocar la URL.
        if (isPublicVerificationHref(href)) {
          return throwError(() => err);
        }

        // 2) Mientras no haya terminado la primera navegación, NO fuerces redirect.
        if (!hasNavigatedOnce) {
          return throwError(() => err);
        }

        // 3) Fuera de verificación y con navegación ya establecida:
        //    podés decidir redirigir (por ejemplo, al login) o no.
        // router.navigateByUrl('/login'); // <- si querés
        return throwError(() => err);
      }

      return throwError(() => err);
    })
  );
};
