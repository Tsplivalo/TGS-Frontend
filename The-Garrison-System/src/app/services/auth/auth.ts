import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, switchMap, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

type UserDTO = { id: string; username: string; email: string; roles?: string[] };
type ApiResponse<T = any> = { success?: boolean; message?: string; data?: T } | T;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  readonly isLoggedIn = signal<boolean>(false);
  readonly user       = signal<UserDTO | null>(null);

  /** POST /api/auth/register */
  register(data: { username: string; email: string; password: string }) {
    return this.http.post<ApiResponse>('/api/auth/register', data, { withCredentials: true });
  }

  /**
   * POST /api/auth/login  ->  GET /api/usuarios/me
   * Así, aunque el POST no devuelva el usuario, traemos el perfil y actualizamos señales.
   */
  login(data: { email: string; password: string }): Observable<UserDTO> {
    return this.http.post<ApiResponse>('/api/auth/login', data, { withCredentials: true }).pipe(
      switchMap(() => this.http.get<ApiResponse<UserDTO>>('/api/usuarios/me', { withCredentials: true })),
      map((res: any) => ('data' in res ? res.data : res) as UserDTO),
      tap((u) => {
        if (u) {
          this.user.set(u);
          this.isLoggedIn.set(true);
        }
      })
    );
  }

  /** POST /api/auth/logout */
  logout() {
    return this.http.post<ApiResponse>('/api/auth/logout', {}, { withCredentials: true })
      .subscribe({
        next: () => {
          this.user.set(null);
          this.isLoggedIn.set(false);
          this.router.navigateByUrl('/');
        },
        error: () => {
          this.user.set(null);
          this.isLoggedIn.set(false);
          this.router.navigateByUrl('/');
        }
      });
  }

  /** GET /api/usuarios/me (intenta recuperar sesión) */
  me(): Observable<UserDTO | null> {
    return this.http.get<ApiResponse<UserDTO>>('/api/usuarios/me', { withCredentials: true }).pipe(
      map((res: any) => ('data' in res ? res.data : res) as UserDTO | null),
      tap((u) => {
        this.user.set(u ?? null);
        this.isLoggedIn.set(!!u);
      })
    );
  }

  /** Alias por compatibilidad si en algún lado llaman fetchMe() */
  fetchMe() { return this.me(); }
}
