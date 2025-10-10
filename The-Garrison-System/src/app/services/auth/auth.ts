import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, switchMap, map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export type UserDTO = {
  id: string;
  username?: string | null;
  email: string;
  roles?: string[];

  // ↓ estos son los que usa "Mi cuenta"
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  address?: string | null;
};


export type ApiResponse<T = any> =
  | { success?: boolean; message?: string; data?: T }
  | T;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  readonly isLoggedIn = signal<boolean>(false);
  readonly user       = signal<UserDTO | null>(null);

  /** POST /api/auth/register */
  register(data: { username: string; email: string; password: string }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('/api/auth/register', data, { withCredentials: true });
  }

  /**
   * POST /api/auth/login  ->  GET /api/users/me
   * Así, aunque el POST no devuelva el usuario, traemos el perfil y actualizamos señales.
   */
  login(data: { email: string; password: string }): Observable<UserDTO> {
    return this.http.post<ApiResponse>('/api/auth/login', data, { withCredentials: true }).pipe(
      switchMap(() =>
        this.http.get<ApiResponse<UserDTO>>('/api/users/me', { withCredentials: true })
      ),
      map((res: any) => ('data' in res ? (res.data as UserDTO) : (res as UserDTO))),
      tap((u) => {
        if (u) {
          this.user.set(u);
          this.isLoggedIn.set(true);
        }
      })
    );
  }

  /** POST /api/auth/logout */
  logout(): void {
    this.http.post<ApiResponse>('/api/auth/logout', {}, { withCredentials: true })
      .subscribe({
        next: () => {
          this.user.set(null);
          this.isLoggedIn.set(false);
          this.router.navigateByUrl('/');
        },
        error: () => {
          // igual limpiamos sesión en cliente
          this.user.set(null);
          this.isLoggedIn.set(false);
          this.router.navigateByUrl('/');
        },
      });
  }
  // // Variante sin subscribe interno:
  // logout$(): Observable<ApiResponse> {
  //   return this.http.post<ApiResponse>('/api/auth/logout', {}, { withCredentials: true }).pipe(
  //     tap(() => {
  //       this.user.set(null);
  //       this.isLoggedIn.set(false);
  //       this.router.navigateByUrl('/');
  //     }),
  //     catchError((e) => {
  //       this.user.set(null);
  //       this.isLoggedIn.set(false);
  //       this.router.navigateByUrl('/');
  //       return throwError(() => e);
  //     })
  //   );
  // }

  /** GET /api/users/me (intenta recuperar sesión) */
  me(): Observable<UserDTO | null> {
    return this.http.get<ApiResponse<UserDTO>>('/api/users/me', { withCredentials: true }).pipe(
      map((res: any) => ('data' in res ? (res.data as UserDTO | null) : (res as UserDTO | null))),
      tap((u) => {
        this.user.set(u ?? null);
        this.isLoggedIn.set(!!u);
      })
    );
  }

  /** Alias por compatibilidad si en algún lado llaman fetchMe() */
  fetchMe(): Observable<UserDTO | null> { return this.me(); }

  /** Helpers de roles */
  roles(): string[] {
    return this.user()?.roles ?? [];
  }
  hasRole(role: string): boolean {
    return this.roles().includes(role);
  }
  isClient(): boolean {
    return this.hasRole('CLIENT') || this.hasRole('CLIENTE');
  }
}
