import { Injectable, inject } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth/auth';

@Injectable()
export class HttpAuthInterceptor implements HttpInterceptor {
  private auth = inject(AuthService);
  private router = inject(Router);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.token();
    const authReq = token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(authReq).pipe(
      catchError((err: any) => {
        if (err instanceof HttpErrorResponse) {
          if (err.status === 401) {
            this.auth.logout();
            this.router.navigateByUrl('/login');
          } else if (err.status === 403) {
            this.router.navigateByUrl('/forbidden');
          }
        }
        return throwError(() => err);
    }));
  }
}
