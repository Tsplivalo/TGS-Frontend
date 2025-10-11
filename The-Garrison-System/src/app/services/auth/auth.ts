import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export type UserDTO = {
  id: string;
  email: string;
  username?: string | null;
  roles?: string[];
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
};

export interface ApiResponse<T = unknown> { data: T; message?: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  /** estado */
  readonly user = signal<UserDTO | null>(null);
  readonly isLoggedIn = signal<boolean>(false);

  /**
   * PERFIL
   * En este backend, el endpoint correcto es /api/users/me
   */
  me(): Observable<UserDTO | null> {
    return this.http.get<ApiResponse<UserDTO>>('/api/users/me', { withCredentials: true }).pipe(
      map(res => (res?.data ?? null) as UserDTO | null),
      tap(u => {
        this.user.set(u);
        this.isLoggedIn.set(!!u);
      }),
    );
  }

  /** Compat con main.ts: hidrata sesión desde cookie */
  fetchMe(): void {
    this.me().subscribe();
  }

  /** LOGIN: /api/auth/login  (objeto {email,password}) */
  login(payload: { email: string; password: string }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('/api/auth/login', payload, { withCredentials: true }).pipe(
      tap(() => this.me().subscribe())
    );
  }

  /** REGISTER: /api/auth/register */
  register(payload: { email: string; password: string; username?: string }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('/api/auth/register', payload, { withCredentials: true });
  }

  /** LOGOUT: /api/auth/logout */
  logout(): void {
    this.http.post<ApiResponse>('/api/auth/logout', {}, { withCredentials: true })
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

  /** helpers de roles */
  roles(): string[] { return this.user()?.roles ?? []; }
  hasRole(role: string): boolean { return this.roles().includes(role); }
  isAdmin(): boolean { return this.hasRole('ADMIN') || this.hasRole('ADMINISTRATOR'); }
  isPartner(): boolean { return this.hasRole('PARTNER'); }
  isDistributor(): boolean { return this.hasRole('DISTRIBUTOR'); }
  isClient(): boolean { return this.hasRole('CLIENT') || this.hasRole('CLIENTE'); }
}
