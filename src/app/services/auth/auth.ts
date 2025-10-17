/**
 * Servicio de autenticación
 * 
 * ✅ CORRECCIONES APLICADAS:
 * - Señales reactivas mejoradas para roles
 * - Debug mejorado para tracking de cambios
 * - Sincronización correcta de estado
 * - Cálculo de profileCompleteness sincronizado con backend
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
  /** Marca temporal del último sync exitoso con el backend */
  private _lastSyncAt = 0;

  /**
   * Fuerza un refresh de /api/users/me para obtener roles/flags actuales.
   * No altera la estética ni el flujo; actualiza las señales en background.
   */
  forceRefresh(): void {
    if (!this.isAuthenticated()) return;
    this.me().subscribe({ next: () => {}, error: () => {} });
  }

  /**
   * Refresca el usuario si pasó más de maxAgeMs desde el último sync.
   * Útil para reflejar cambios de rol aprobados por un admin sin re-login.
   */
  refreshIfStale(maxAgeMs: number = 15000): void {
    if (!this.isAuthenticated()) return;
    const now = Date.now();
    if (now - this._lastSyncAt < maxAgeMs) return;
    this._lastSyncAt = now;
    this.me().subscribe({ next: () => {}, error: () => {} });
  }

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

  // ✅ CORRECCIÓN: profileCompleteness sincronizado con el backend
  readonly profileCompleteness = computed(() => {
    const user = this.userSignal();
    if (!user) return 0;
    
    // ✅ PRIORIDAD 1: Usar el valor que viene del backend si existe
    if ((user as any).profileCompleteness !== undefined) {
      console.log('[AuthService] 📊 Using backend profileCompleteness:', (user as any).profileCompleteness);
      return (user as any).profileCompleteness;
    }
    
    // ✅ FALLBACK: Calcular manualmente (debe coincidir EXACTAMENTE con el backend)
    // Referencia: user.entity.ts - calculateProfileCompleteness()
    let completeness = 25; // Base por tener una cuenta
    
    if ((user as any).isVerified) {
      completeness += 25; // +25% por verificación del admin
    }
    
    if ((user as any).hasPersonalInfo) {
      completeness += 50; // +50% por datos personales completos
    }
    
    const result = Math.min(completeness, 100);
    
    console.log('[AuthService] 📊 Profile completeness calculated:', {
      base: 25,
      isVerified: (user as any).isVerified,
      isVerifiedBonus: (user as any).isVerified ? 25 : 0,
      hasPersonalInfo: (user as any).hasPersonalInfo,
      hasPersonalInfoBonus: (user as any).hasPersonalInfo ? 50 : 0,
      total: result
    });
    
    return result;
  });

  // ✅ Computed signals para estados importantes
  readonly hasPersonalInfo = computed(() => {
    const hasInfo = (this.userSignal() as any)?.hasPersonalInfo ?? false;
    console.log('[AuthService] 📋 hasPersonalInfo:', hasInfo);
    return hasInfo;
  });

  readonly emailVerified = computed(() => {
    const verified = this.userSignal()?.emailVerified ?? false;
    console.log('[AuthService] ✉️ emailVerified:', verified);
    return verified;
  });

  readonly isVerified = computed(() => {
    const verified = (this.userSignal() as any)?.isVerified ?? false;
    console.log('[AuthService] ✅ isVerified (by admin):', verified);
    return verified;
  });

  // ✅ NUEVO: Computed para saber si puede solicitar verificación
  readonly canRequestVerification = computed(() => {
    const user = this.userSignal();
    if (!user) return false;
    
    const hasEmail = !!user.emailVerified;
    const hasPersonal = !!(user as any).hasPersonalInfo;
    const notVerified = !(user as any).isVerified;
    const result = hasEmail && hasPersonal && notVerified;
    
    console.log('[AuthService] 🔍 Can request verification:', {
      hasEmail,
      hasPersonal,
      notVerified,
      profileCompleteness: this.profileCompleteness(),
      result
    });
    
    return result;
  });

  // BehaviorSubject para compatibilidad
  private userSubject = new BehaviorSubject<User | null>(null);
  public  user$ = this.userSubject.asObservable();

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
          isVerified: (user as any).isVerified,
          profileCompleteness: this.profileCompleteness(),
          canRequestVerification: this.canRequestVerification()
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
    console.log('[AuthService] 🔐 Register attempt for:', data.email);

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
    console.log('[AuthService] 📝 Completing profile with data:', {
      dni: data.dni,
      name: data.name,
      phone: data.phone,
      address: data.address
    });

    return this.http.put<AuthResponse>(
      `${API_URL}/api/users/me/complete-profile`,
      data,
      { withCredentials: true }
    ).pipe(
      map(response => {
        console.log('[AuthService] 📥 Profile completion response:', response);
        return response.data;
      }),
      tap(user => {
        console.log('[AuthService] ✅ Profile completed successfully:', {
          hasPersonalInfo: (user as any).hasPersonalInfo,
          profileCompleteness: (user as any).profileCompleteness
        });
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
    
    this._lastSyncAt = Date.now();
    
    if (userCopy) {
      console.log('[AuthService] ✅ User signal updated:', {
        roles: userCopy.roles,
        emailVerified: userCopy.emailVerified,
        hasPersonalInfo: (userCopy as any).hasPersonalInfo,
        isVerified: (userCopy as any).isVerified,
        profileCompleteness: (userCopy as any).profileCompleteness
      });
    }
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

    // ✅ Usuarios verificados con info personal completa pueden comprar
    const isVerified = !!(user as any).isVerified;
    const hasPersonalInfo = !!(user as any).hasPersonalInfo;

    console.log('[AuthService] 🛒 canPurchase check:', {
      isVerified,
      hasPersonalInfo,
      result: isVerified && hasPersonalInfo
    });

    return isVerified && hasPersonalInfo;
  }

  getPurchaseRequirements(): string[] {
    const user = this.userSignal();
    const requirements: string[] = [];

    if (!user) return requirements;

    if (!(user as any).isVerified) {
      requirements.push('✅ Verificar tu cuenta con un administrador');
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
      suggestions.push('ℹ️ Solicita verificación de cuenta para habilitar todas las funciones');
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