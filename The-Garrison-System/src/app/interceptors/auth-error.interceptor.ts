// src/app/interceptors/auth-error.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth/auth';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth   = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        // Limpiá estado pero NO navegues a "/" para no pelear con el guard
        try { auth.logout(); } catch {}
        const current = router.routerState.snapshot.url || '/';
        router.navigate(['/login'], { queryParams: { redirect: current } });
      } else if (err.status === 403) {
        router.navigate(['/unauthorized']);
      }
      return throwError(() => err);
    })
  );
};
