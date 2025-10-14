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

export type Role = 'ADMIN' | 'PARTNER' | 'DISTRIBUTOR' | 'CLIENT';

export interface ApiResponse<T = unknown> { data: T; message?: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  /** === Config ===
   * Si tu backend emite JWT en respuesta y querés mandarlo en Authorization,
   * seteá USE_COOKIES = false y usá setToken() en el login.
   * Actualmente usamos cookies (withCredentials: true), así que queda en true.
   */
  private static readonly USE_COOKIES = true;
  private static readonly TOKEN_KEY = 'auth_token';

  /** estado */
  readonly user = signal<UserDTO | null>(null);
  readonly isLoggedIn = signal<boolean>(false);

  // ========== Perfil ==========
  /** GET /api/users/me (con cookies) */
  me(): Observable<UserDTO | null> {
    return this.http.get<ApiResponse<UserDTO>>('/api/users/me', { withCredentials: true }).pipe(
      map(res => (res?.data ?? null) as UserDTO | null),
      tap(u => {
        this.user.set(u);
        this.isLoggedIn.set(!!u);
      }),
    );
  }

  /** Hidrata sesión desde cookie (lo llama main.ts o AppComponent) */
  fetchMe(): void {
    this.me().subscribe();
  }

  // ========== Auth ==========
  /** POST /api/auth/login  body: { email, password } */
  login(payload: { email: string; password: string }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('/api/auth/login', payload, { withCredentials: true }).pipe(
      tap((res: any) => {
        // Si alguna vez el backend devuelve token, lo guardamos (opcional)
        const token = res?.data?.token as string | undefined;
        if (token) this.setToken(token);
        // Siempre refrescamos el perfil para poblar signals
        this.me().subscribe();
      })
    );
  }

  /** POST /api/auth/register */
  register(payload: { email: string; password: string; username?: string }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('/api/auth/register', payload, { withCredentials: true });
  }

  /** POST /api/auth/logout */
  logout(): void {
    this.http.post<ApiResponse>('/api/auth/logout', {}, { withCredentials: true })
      .subscribe({
        next: () => this.clearSessionAndGoHome(),
        error: () => this.clearSessionAndGoHome()
      });
  }

  private clearSessionAndGoHome() {
    this.clearToken();
    this.user.set(null);
    this.isLoggedIn.set(false);
    this.router.navigateByUrl('/');
  }

  // ========== Token helpers (opcional JWT) ==========
  /** Devuelve el token si estás usando modo JWT; en modo cookies devuelve null. */
  token(): string | null {
    if (AuthService.USE_COOKIES) return null;
    try {
      return localStorage.getItem(AuthService.TOKEN_KEY);
    } catch {
      return null;
    }
  }

  /** Guarda el token (si usás JWT). */
  setToken(token: string | null) {
    if (AuthService.USE_COOKIES) return; // no hacemos nada en modo cookies
    try {
      if (token) localStorage.setItem(AuthService.TOKEN_KEY, token);
      else localStorage.removeItem(AuthService.TOKEN_KEY);
    } catch {}
  }

  /** Limpia token local. */
  private clearToken() {
    try { localStorage.removeItem(AuthService.TOKEN_KEY); } catch {}
  }

  // ========== Roles / helpers ==========
  roles(): string[] { return this.user()?.roles ?? []; }
  hasRole(role: string): boolean { return this.roles().includes(role); }
  isAdmin(): boolean { return this.hasRole('ADMIN') || this.hasRole('ADMINISTRATOR'); }
  isPartner(): boolean { return this.hasRole('PARTNER') || this.hasRole('SOCIO'); } // por si usás 'SOCIO'
  isDistributor(): boolean { return this.hasRole('DISTRIBUTOR') || this.hasRole('DISTRIBUIDOR'); }
  isClient(): boolean { return this.hasRole('CLIENT') || this.hasRole('CLIENTE'); }
}
