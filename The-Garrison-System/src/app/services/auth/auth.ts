/**
 * Servicio de autenticación
 * 
 * Este servicio maneja toda la lógica de autenticación del sistema incluyendo:
 * - Login y logout de usuarios
 * - Registro de nuevos usuarios
 * - Gestión del estado de autenticación
 * - Verificación de roles y permisos
 * - Gestión del perfil de usuario
 */
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Role, User } from '../../models/user/user.model';

/**
 * URL base de la API - configurada para desarrollo local
 */
const API_URL = '';

/**
 * Interfaz para respuestas de autenticación del backend
 */
export interface AuthResponse {
  success: boolean;        // Indica si la operación fue exitosa
  message: string;         // Mensaje descriptivo de la respuesta
  data: User;             // Datos del usuario autenticado
  meta: {                 // Metadatos de la respuesta
    timestamp: string;    // Timestamp de la respuesta
    statusCode: number;   // Código de estado HTTP
  };
}

/**
 * Interfaz para solicitudes de login
 */
export interface LoginRequest {
  email: string;     // Dirección de correo electrónico del usuario
  password: string;  // Contraseña del usuario
}

/**
 * Interfaz para solicitudes de registro
 */
export interface RegisterRequest {
  username: string;  // Nombre de usuario deseado
  email: string;     // Dirección de correo electrónico
  password: string;  // Contraseña para la cuenta
}

// ============================================================================
// SERVICIO DE AUTENTICACIÓN
// ============================================================================

/**
 * Servicio de autenticación principal
 * 
 * Utiliza Angular Signals para gestión reactiva del estado de autenticación
 * y proporciona métodos para todas las operaciones de autenticación.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // Estado del usuario usando Angular Signals para reactividad
  private readonly userSignal = signal<User | null>(null);

  // Señales computadas derivadas del estado del usuario
  readonly user = this.userSignal.asReadonly();                    // Usuario actual (solo lectura)
  readonly isAuthenticated = computed(() => this.userSignal() !== null); // Estado de autenticación
  readonly currentRoles = computed(() => this.userSignal()?.roles ?? []); // Roles del usuario actual

  /**
   * Calcula el porcentaje de completitud del perfil del usuario
   * 
   * ✅ CÁLCULO CORRECTO DEL PORCENTAJE DE PERFIL (calculado en frontend)
   * Evalúa 6 campos principales del perfil del usuario para determinar
   * el porcentaje de completitud.
   */
  readonly profileCompleteness = computed(() => {
    const user = this.userSignal();
    if (!user) return 0;

    let completedFields = 0;
    let totalFields = 6;

    // 1. Username (siempre presente después del registro)
    if (user.username) completedFields++;

    // 2. Email (siempre presente después del registro)
    if (user.email) completedFields++;

    // 3. Email verificado
    if (user.emailVerified) completedFields++;

    // 4. Información personal completa (DNI, nombre, teléfono, dirección)
    if (user.hasPersonalInfo) completedFields++;

    // 5. Verificación de cuenta por admin
    // ✅ Los admins se consideran auto-verificados
    if (user.isVerified || user.roles.includes(Role.ADMIN)) {
      completedFields++;
    }

    // 6. Cuenta activa
    if (user.isActive) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  });

  // Señales computadas para estado específico del perfil
  readonly hasPersonalInfo = computed(() => this.userSignal()?.hasPersonalInfo ?? false);
  readonly emailVerified = computed(() => this.userSignal()?.emailVerified ?? false);
  readonly isVerified = computed(() => this.userSignal()?.isVerified ?? false);

  // BehaviorSubject para compatibilidad con código que usa observables
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor() {
    console.log('[AuthService] Initialized with API:', API_URL);
  }


  /**
   * Inicializa el estado de autenticación verificando si hay una sesión activa
   * 
   * Este método debe ser llamado desde app.component.ts para restaurar
   * la sesión del usuario al cargar la aplicación.
   */
  public initialize(): void {
    console.log('[AuthService] Initializing auth state...');
    this.me().subscribe({
      next: (user) => {
        console.log('[AuthService] Session restored:', user);
      },
      error: (err) => {
        console.log('[AuthService] No active session:', err.message);
      }
    });
  }


  /**
   * Autentica un usuario con email y contraseña
   * 
   * @param credentials - Credenciales de login (email y contraseña)
   * @returns Observable con los datos del usuario autenticado
   */
  login(credentials: LoginRequest): Observable<User> {
    console.log('[AuthService] Login attempt for:', credentials.email);

    return this.http.post<AuthResponse>(
      `${API_URL}/api/auth/login`,
      credentials,
      { withCredentials: true }
    ).pipe(
      map(response => {
        console.log('[AuthService] Login response:', response);
        return response.data;
      }),
      tap(user => {
        console.log('[AuthService] Login successful, user:', user);
        this.setUser(user);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  register(data: RegisterRequest): Observable<any> {
    console.log('[AuthService] Register attempt for:', data.email);

    return this.http.post<any>(
      `${API_URL}/api/auth/register`,
      data,
      { withCredentials: true }
    ).pipe(
      map(response => {
        console.log('[AuthService] Register response:', response);
        return response.data || response;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  logout(): Observable<void> {
    console.log('[AuthService] Logout');

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
        return of(undefined);
      })
    );
  }

  refresh(): Observable<User> {
    console.log('[AuthService] Refreshing token');

    return this.http.post<AuthResponse>(
      `${API_URL}/api/auth/refresh`,
      {},
      { withCredentials: true }
    ).pipe(
      map(response => response.data),
      tap(user => {
        console.log('[AuthService] Token refreshed, user:', user);
        this.setUser(user);
      }),
      catchError(err => {
        console.error('[AuthService] Refresh failed:', err);
        this.clearUser();
        return throwError(() => err);
      })
    );
  }


  me(): Observable<User> {
    console.log('[AuthService] Fetching current user');

    return this.http.get<AuthResponse>(
      `${API_URL}/api/users/me`,
      { withCredentials: true }
    ).pipe(
      map(response => {
        console.log('[AuthService] Me response:', response);
        return response.data;
      }),
      tap(user => {
        console.log('[AuthService] Current user:', user);
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
    console.log('[AuthService] Completing profile');

    return this.http.put<AuthResponse>(
      `${API_URL}/api/users/me/complete-profile`,
      data,
      { withCredentials: true }
    ).pipe(
      map(response => response.data),
      tap(user => {
        console.log('[AuthService] Profile completed:', user);
        this.setUser(user);
      }),
      catchError(this.handleError.bind(this))
    );
  }


  private setUser(user: User | null): void {
    console.log('[AuthService] Setting user:', user);
    this.userSignal.set(user);
    this.userSubject.next(user);
  }

  private clearUser(): void {
    console.log('[AuthService] Clearing user');
    this.setUser(null);
  }


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
    if (!user) return false;

    // Verificar que el email esté verificado Y que tenga información personal
    // Los admins se consideran auto-verificados
    const isVerifiedUser = user.isVerified || user.roles.includes(Role.ADMIN);
    return user.emailVerified && user.hasPersonalInfo && isVerifiedUser;
  }

  getProfileSuggestions(): string[] {
    const user = this.userSignal();
    const suggestions: string[] = [];

    if (!user) return suggestions;

    if (!user.emailVerified) {
      suggestions.push('✉️ Verifica tu email haciendo clic en el enlace que te enviamos');
    }

    if (!user.hasPersonalInfo) {
      suggestions.push('📝 Completa tu información personal (DNI, nombre, teléfono, dirección)');
    }

    // No mostrar sugerencia de verificación para admins
    if (!user.isVerified && !user.roles.includes(Role.ADMIN)) {
      suggestions.push('✅ Solicita la verificación de tu cuenta a un administrador');
    }

    if (!user.isActive) {
      suggestions.push('⚠️ Tu cuenta está inactiva. Contacta al soporte');
    }

    return suggestions;
  }

  getPurchaseRequirements(): string[] {
    const user = this.userSignal();
    const requirements: string[] = [];

    if (!user) return requirements;

    if (!user.emailVerified) {
      requirements.push('✉️ Verificar tu dirección de email');
    }

    if (!user.hasPersonalInfo) {
      requirements.push('📝 Completar tu información personal (DNI, nombre, teléfono, dirección)');
    }

    // No mostrar requisito de verificación para admins
    if (!user.isVerified && !user.roles.includes(Role.ADMIN)) {
      requirements.push('✅ Solicitar verificación de cuenta a un administrador');
    }

    return requirements;
  }


  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      console.error('[AuthService] HTTP Error:', {
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
        if (error.error?.errors?.[0]?.code === 'EMAIL_VERIFICATION_REQUIRED') {
          errorMessage = 'Debes verificar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.';
        } else {
          errorMessage = 'No tienes permisos para realizar esta acción';
        }
      } else if (error.status === 409) {
        errorMessage = error.error?.message || 'Conflicto: el recurso ya existe';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Error ${error.status}: ${error.statusText}`;
      }
    }

    console.error('[AuthService] Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}