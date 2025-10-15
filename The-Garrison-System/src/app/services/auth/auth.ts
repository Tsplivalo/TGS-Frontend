import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';

// ============================================================================
// INTERFACES
// ============================================================================

export enum Role {
  ADMIN = 'ADMIN',
  PARTNER = 'PARTNER',
  DISTRIBUTOR = 'DISTRIBUTOR',
  CLIENT = 'CLIENT',
  AUTHORITY = 'AUTHORITY',
}

export interface User {
  id: string;
  username: string;
  email: string;
  roles: Role[];
  isActive: boolean;
  emailVerified: boolean;
  profileCompleteness: number;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  hasPersonalInfo: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: User;
  meta: {
    timestamp: string;
    statusCode: number;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

// ============================================================================
// SERVICIO DE AUTENTICACIÓN
// ============================================================================

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  
  // Estado del usuario usando signals
  private readonly userSignal = signal<User | null>(null);
  
  // Señales computadas derivadas
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.userSignal() !== null);
  readonly currentRoles = computed(() => this.userSignal()?.roles ?? []);
  readonly profileCompleteness = computed(() => this.userSignal()?.profileCompleteness ?? 0);
  readonly hasPersonalInfo = computed(() => this.userSignal()?.hasPersonalInfo ?? false);
  readonly emailVerified = computed(() => this.userSignal()?.emailVerified ?? false);

  // BehaviorSubject para compatibilidad
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  private readonly API_BASE = '/api/auth';
  
  constructor() {
    // ⚠️ NO llamar initializeAuth aquí para evitar dependencia circular
    // Se llamará manualmente desde app.component.ts
    console.log('[AuthService] Initialized');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INICIALIZACIÓN (llamar desde app.component.ts)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Inicializa la autenticación verificando si hay una sesión activa
   * ⚠️ Debe ser llamado manualmente desde app.component.ts DESPUÉS de que
   * la app esté completamente inicializada
   */
  public initialize(): void {
    console.log('[AuthService] Initializing auth state...');
    this.me().subscribe({
      next: () => {
        console.log('[AuthService] Session restored');
      },
      error: () => {
        console.log('[AuthService] No active session');
      }
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // AUTENTICACIÓN
  // ══════════════════════════════════════════════════════════════════════════

  login(credentials: LoginRequest): Observable<User> {
    return this.http.post<AuthResponse>(
      `${this.API_BASE}/login`,
      credentials,
      { withCredentials: true }
    ).pipe(
      map(response => response.data),
      tap(user => this.setUser(user)),
      catchError(this.handleError.bind(this))
    );
  }

  register(data: RegisterRequest): Observable<User> {
    return this.http.post<AuthResponse>(
      `${this.API_BASE}/register`,
      data,
      { withCredentials: true }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError.bind(this))
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(
      `${this.API_BASE}/logout`,
      {},
      { withCredentials: true }
    ).pipe(
      tap(() => {
        this.clearUser();
        this.router.navigate(['/login']);
      }),
      catchError(err => {
        this.clearUser();
        this.router.navigate(['/login']);
        return of(undefined);
      })
    );
  }

  refresh(): Observable<User> {
    return this.http.post<AuthResponse>(
      `${this.API_BASE}/refresh`,
      {},
      { withCredentials: true }
    ).pipe(
      map(response => response.data),
      tap(user => this.setUser(user)),
      catchError(err => {
        this.clearUser();
        return throwError(() => err);
      })
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PERFIL DE USUARIO
  // ══════════════════════════════════════════════════════════════════════════

  me(): Observable<User> {
    return this.http.get<AuthResponse>(
      '/api/users/me',
      { withCredentials: true }
    ).pipe(
      map(response => response.data),
      tap(user => this.setUser(user)),
      catchError(this.handleError.bind(this))
    );
  }

  completeProfile(data: {
    dni: string;
    name: string;
    phone: string;
    address: string;
  }): Observable<User> {
    return this.http.put<AuthResponse>(
      '/api/users/me/complete-profile',
      data,
      { withCredentials: true }
    ).pipe(
      map(response => response.data),
      tap(user => this.setUser(user)),
      catchError(this.handleError.bind(this))
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GESTIÓN DE ESTADO
  // ══════════════════════════════════════════════════════════════════════════

  private setUser(user: User | null): void {
    this.userSignal.set(user);
    this.userSubject.next(user);
  }

  private clearUser(): void {
    this.setUser(null);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HELPERS - ROLES Y PERMISOS
  // ══════════════════════════════════════════════════════════════════════════

  hasRole(role: Role): boolean {
    return this.currentRoles().includes(role);
  }

  hasAnyRole(roles: Role[]): boolean {
    const userRoles = this.currentRoles();
    return roles.some(role => userRoles.includes(role));
  }

  hasAllRoles(roles: Role[]): boolean {
    const userRoles = this.currentRoles();
    return roles.every(role => userRoles.includes(role));
  }

  isAdmin(): boolean {
    return this.hasRole(Role.ADMIN);
  }

  canPurchase(): boolean {
    const user = this.userSignal();
    return !!(user?.emailVerified && user?.hasPersonalInfo);
  }

  getProfileSuggestions(): string[] {
    const user = this.userSignal();
    const suggestions: string[] = [];

    if (!user) return suggestions;

    if (!user.emailVerified) {
      suggestions.push('Verifica tu email para aumentar la completitud del perfil');
    }

    if (!user.hasPersonalInfo) {
      suggestions.push(
        'Completa tu información personal (DNI, nombre, teléfono, dirección) para habilitar compras'
      );
    }

    return suggestions;
  }

  getPurchaseRequirements(): string[] {
    const user = this.userSignal();
    const requirements: string[] = [];

    if (!user) return requirements;

    if (!user.emailVerified) {
      requirements.push('Verifica tu dirección de email');
    }

    if (!user.hasPersonalInfo) {
      requirements.push('Completa tu información personal (DNI, nombre, teléfono, dirección)');
    }

    return requirements;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ERROR HANDLING
  // ══════════════════════════════════════════════════════════════════════════

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 401) {
        errorMessage = 'Credenciales inválidas o sesión expirada';
      } else if (error.status === 403) {
        errorMessage = 'No tienes permisos para realizar esta acción';
      } else if (error.status === 409) {
        errorMessage = error.error?.message || 'Conflicto: el recurso ya existe';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Error ${error.status}: ${error.statusText}`;
      }
    }

    console.error('[AuthService] Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}