/**
 * Servicio de autenticación
 * 
 * ✅ CORRECCIONES APLICADAS:
 * - Señales reactivas mejoradas para roles
 * - Debug mejorado para tracking de cambios
 * - Sincronización correcta de estado
 */
import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Role, User } from '../../models/user/user.model';

const API_URL = '';

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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // ✅ Estado del usuario usando Angular Signals
  private readonly userSignal = signal<User | null>(null);

  // ✅ Señales computadas con debug mejorado
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.userSignal() !== null);
  
  // ✅ CORRECCIÓN: currentRoles siempre retorna el array de roles actualizado
  readonly currentRoles = computed(() => {
    const user = this.userSignal();
    const roles = user?.roles ?? [];
    console.log('[AuthService] 🔄 Roles computed:', {
      userId: user?.id,
      username: user?.username,
      roles: roles
    });
    return roles;
  });

  readonly profileCompleteness = computed(() => {
    const user = this.userSignal();
    if (!user) return 0;

    let completed = 0;
    const total = 4;

    if (user.username) completed++;
    if (user.email) completed++;
    if (user.emailVerified) completed++;
    if ((user as any).hasPersonalInfo) completed++;

    return Math.round((completed / total) * 100);
  });

  readonly hasPersonalInfo = computed(() => (this.userSignal() as any)?.hasPersonalInfo ?? false);
  readonly emailVerified   = computed(() => this.userSignal()?.emailVerified ?? false);
  readonly isVerified      = computed(() => (this.userSignal() as any)?.isVerified ?? false);

  // BehaviorSubject para compatibilidad
  private userSubject = new BehaviorSubject<User | null>(null);
  public  user$       = this.userSubject.asObservable();

  constructor() {
    console.log('[AuthService] 🚀 Initialized with API:', API_URL);
    
    // ✅ Effect para debug de cambios en el usuario
    effect(() => {
      const user = this.userSignal();
      if (user) {
        console.log('[AuthService] 👤 User state changed:', {
          id: user.id,
          username: user.username,
          email: user.email,
          roles: user.roles,
          emailVerified: user.emailVerified,
          hasPersonalInfo: (user as any).hasPersonalInfo,
          profileCompleteness: this.profileCompleteness()
        });
      } else {
        console.log('[AuthService] 👤 User cleared');
      }
    });
  }

  public initialize(): void {
    console.log('[AuthService] 🔄 Initializing auth state...');
    this.me().subscribe({
      next: (user) => {
        console.log('[AuthService] ✅ Session restored:', user);
      },
      error: (err) => {
        console.log('[AuthService] ℹ️ No active session:', err?.message || err);
      }
    });
  }

  login(credentials: LoginRequest): Observable<User> {
    console.log('[AuthService] 🔐 Login attempt for:', credentials.email);

    return this.http.post<AuthResponse>(
      `${API_URL}/api/auth/login`,
      credentials,
      { withCredentials: true }
    ).pipe(
      map(response => {
        console.log('[AuthService] 📥 Login response:', response);
        return response.data;
      }),
      tap(user => {
        console.log('[AuthService] ✅ Login successful, setting user:', user);
        this.setUser(user);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  register(data: RegisterRequest): Observable<any> {
    console.log('[AuthService] 📝 Register attempt for:', data.email);

    return this.http.post<any>(
      `${API_URL}/api/auth/register`,
      data,
      { withCredentials: true }
    ).pipe(
      map(response => {
        console.log('[AuthService] 📥 Register response:', response);
        return response.data || response;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  logout(): Observable<void> {
    console.log('[AuthService] 🚪 Logout');

    return this.http.post<void>(
      `${API_URL}/api/auth/logout`,
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
        return of(undefined as any);
      })
    );
  }

  refresh(): Observable<User> {
    console.log('[AuthService] 🔄 Refreshing token');

    return this.http.post<AuthResponse>(
      `${API_URL}/api/auth/refresh`,
      {},
      { withCredentials: true }
    ).pipe(
      map(response => response.data),
      tap(user => {
        console.log('[AuthService] ✅ Token refreshed, user:', user);
        this.setUser(user);
      }),
      catchError(err => {
        console.error('[AuthService] ❌ Refresh failed:', err);
        this.clearUser();
        return throwError(() => err);
      })
    );
  }

  me(): Observable<User> {
    console.log('[AuthService] 👤 Fetching current user');

    return this.http.get<AuthResponse>(
      `${API_URL}/api/users/me`,
      { withCredentials: true }
    ).pipe(
      map(response => {
        console.log('[AuthService] 📥 Me response:', response);
        return response.data;
      }),
      tap(user => {
        console.log('[AuthService] ✅ Current user fetched:', user);
        this.setUser(user);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  completeProfile(data: {
    dni: string;
    name: string;
    phone: string;
    address: string;
  }): Observable<User> {
    console.log('[AuthService] 📝 Completing profile');

    return this.http.put<AuthResponse>(
      `${API_URL}/api/users/me/complete-profile`,
      data,
      { withCredentials: true }
    ).pipe(
      map(response => response.data),
      tap(user => {
        console.log('[AuthService] ✅ Profile completed:', user);
        this.setUser(user);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  // ✅ CORRECCIÓN: setUser ahora fuerza actualización de señales
  private setUser(user: User | null): void {
    console.log('[AuthService] 💾 Setting user signal:', user);
    
    // Forzar nueva referencia para trigger de señales
    const userCopy = user ? { ...user } : null;
    
    this.userSignal.set(userCopy);
    this.userSubject.next(userCopy);
    
    console.log('[AuthService] ✅ User signal updated, roles:', userCopy?.roles);
  }

  private clearUser(): void {
    console.log('[AuthService] 🗑️ Clearing user');
    this.setUser(null);
  }

  hasRole(role: Role): boolean {
    const result = this.currentRoles().includes(role);
    console.log('[AuthService] 🔍 hasRole check:', { role, result, currentRoles: this.currentRoles() });
    return result;
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
    if (!user) return false;

    // ✅ Los admins pueden comprar sin restricciones
    if ((user.roles ?? []).includes(Role.ADMIN)) {
      return true;
    }

    const hasVerifiedEmail = !!user.emailVerified;
    const hasPersonalInfo = !!(user as any).hasPersonalInfo;

    console.log('[AuthService] 🛒 canPurchase check:', {
      hasVerifiedEmail,
      hasPersonalInfo,
      result: hasVerifiedEmail && hasPersonalInfo
    });

    return hasVerifiedEmail && hasPersonalInfo;
  }

  getPurchaseRequirements(): string[] {
    const user = this.userSignal();
    const requirements: string[] = [];

    if (!user) return requirements;

    if (!user.emailVerified) {
      requirements.push('✉️ Verificar tu dirección de email');
    }

    if (!(user as any).hasPersonalInfo) {
      requirements.push('📝 Completar tu información personal (DNI, nombre, teléfono, dirección)');
    }

    return requirements;
  }

  getProfileSuggestions(): string[] {
    const user = this.userSignal();
    const suggestions: string[] = [];

    if (!user) return suggestions;

    if (!user.emailVerified) {
      suggestions.push('✉️ Verifica tu email haciendo clic en el enlace que te enviamos');
    }

    if (!(user as any).hasPersonalInfo) {
      suggestions.push('📝 Completa tu información personal (DNI, nombre, teléfono, dirección)');
    }

    if (!(user as any).isVerified && !(user.roles ?? []).includes(Role.ADMIN)) {
      suggestions.push('ℹ️ Puedes solicitar verificación manual de cuenta para beneficios adicionales');
    }

    if (!(user as any).isActive) {
      suggestions.push('⚠️ Tu cuenta está inactiva. Contacta al soporte');
    }

    return suggestions;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      console.error('[AuthService] ❌ HTTP Error:', {
        status: error.status,
        statusText: error.statusText,
        error: error.error,
        url: error.url
      });

      if (error.status === 0) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.';
      } else if (error.status === 401) {
        errorMessage = 'Credenciales inválidas o sesión expirada';
      } else if (error.status === 403) {
        const code = error.error?.errors?.[0]?.code || error.error?.code;
        if (code === 'EMAIL_VERIFICATION_REQUIRED') {
          errorMessage = 'Debes verificar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.';
        } else {
          errorMessage = error.error?.message || 'No tienes permisos para realizar esta acción';
        }
      } else if (error.status === 409) {
        errorMessage = error.error?.message || 'Conflicto: el recurso ya existe';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Error ${error.status}: ${error.statusText}`;
      }
    }

    const normalized = {
      status: error.status,
      code: error.error?.errors?.[0]?.code || error.error?.code,
      message: errorMessage
    };

    console.error('[AuthService] ❌ Error normalized:', normalized);
    return throwError(() => normalized);
  }
}