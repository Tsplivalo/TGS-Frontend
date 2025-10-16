import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, switchMap, map, mapTo, catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

/** ✅ Enum real para usar como valor y tipo (Role.ADMIN, etc.) */
export enum Role {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
  PARTNER = 'PARTNER',
  DISTRIBUTOR = 'DISTRIBUTOR',
  AUTHORITY = 'AUTHORITY',
}

/** ✅ DTO con campos que usan templates/guards (opcionales) */
export type UserDTO = {
  id: string;
  username?: string | null;
  email: string;
  roles?: Role[];              // ← ahora Role[]
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  address?: string | null;

  emailVerified?: boolean;
  hasPersonalInfo?: boolean;
  isActive?: boolean;
  lastLoginAt?: string | Date | null;
  createdAt?: string | Date | null;
};

export type ApiResponse<T = any> =
  | { success?: boolean; message?: string; data?: T }
  | T;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  readonly isLoggedIn = signal<boolean>(false);
  readonly user = signal<UserDTO | null>(null);

  register(data: { username: string; email: string; password: string }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('/api/auth/register', data, { withCredentials: true });
  }

  /** POST /auth/login -> GET /users/me (encadenado) */
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

  /** ✅ ahora retorna Observable (navbar lo usa con .subscribe) */
  logout(): Observable<void> {
    return this.http.post<ApiResponse>('/api/auth/logout', {}, { withCredentials: true }).pipe(
      tap(() => {
        this.user.set(null);
        this.isLoggedIn.set(false);
        try { localStorage.removeItem('token'); } catch {}
        this.router.navigateByUrl('/');
      }),
      mapTo(void 0),
      catchError(() => {
        this.user.set(null);
        this.isLoggedIn.set(false);
        try { localStorage.removeItem('token'); } catch {}
        this.router.navigateByUrl('/');
        return of(void 0);
      })
    );
  }

  me(): Observable<UserDTO | null> {
    return this.http.get<ApiResponse<UserDTO>>('/api/users/me', { withCredentials: true }).pipe(
      map((res: any) => ('data' in res ? (res.data as UserDTO | null) : (res as UserDTO | null))),
      tap((u) => {
        this.user.set(u ?? null);
        this.isLoggedIn.set(!!u);
      })
    );
  }

  fetchMe(): Observable<UserDTO | null> { return this.me(); }

  /** ===== Adaptadores esperados por la app/guards/templates ===== */
  roles(): Role[] { return (this.user()?.roles ?? []) as Role[]; }

  /** case-insensitive por si vienen en minúsculas */
  hasRole(role: Role | string): boolean {
    const want = String(role).toUpperCase();
    return this.roles().some(r => String(r).toUpperCase() === want);
  }

  /** ✅ faltante en guards */
  hasAnyRole(allowed: (Role | string)[]): boolean {
    return allowed.some(r => this.hasRole(r));
  }

  isClient(): boolean { return this.hasRole(Role.CLIENT) || this.hasRole('CLIENTE'); }

  isAuthenticated(): boolean { return this.isLoggedIn(); }

  currentRoles(): Role[] {
    const u = this.user();
    return (u?.roles && u.roles.length ? u.roles : []) as Role[];
  }

  emailVerified(): boolean { return !!this.user()?.emailVerified; }
  hasPersonalInfo(): boolean { return !!this.user()?.hasPersonalInfo; }

  profileCompleteness(): number {
    const u = this.user();
    if (!u) return 0;
    let score = 0;
    if (u.emailVerified)   score += 40;
    if (u.hasPersonalInfo) score += 40;
    if (u.isActive)        score += 20;
    return Math.max(0, Math.min(100, score));
  }

  canPurchase(): boolean {
    return this.isAuthenticated() && this.emailVerified() && this.hasPersonalInfo();
  }

  getProfileSuggestions(): string[] {
    const tips: string[] = [];
    if (!this.emailVerified())   tips.push('Verificá tu email');
    if (!this.hasPersonalInfo()) tips.push('Completá tus datos personales');
    return tips;
  }

  getPurchaseRequirements(): string[] {
    const req: string[] = [];
    if (!this.isAuthenticated()) req.push('Iniciar sesión');
    if (!this.emailVerified())   req.push('Verificar email');
    if (!this.hasPersonalInfo()) req.push('Completar perfil');
    return req;
  }

  /** ✅ faltaba en AccountComponent */
  completeProfile(payload: {
    dni?: string; name?: string; phone?: string; address?: string;
  }): Observable<UserDTO> {
    return this.http.post<ApiResponse<UserDTO>>('/api/users/complete-profile', payload, { withCredentials: true }).pipe(
      map((res: any) => ('data' in res ? (res.data as UserDTO) : (res as UserDTO))),
      tap((u) => {
        // marcamos el flag para no romper el template
        u.hasPersonalInfo = true;
        this.user.set(u);
      })
    );
  }

  /** Se llama en app.ts; no rompe si no hay sesión */
  initialize(): void {
    this.me().pipe(catchError(() => of(null))).subscribe();
  }
}
