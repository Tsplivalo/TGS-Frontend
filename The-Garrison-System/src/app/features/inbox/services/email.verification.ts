// src/app/services/email-verification/email.verification.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface VerificationResponse {
  success: boolean;
  message: string;
  data?: {
    email?: string;
    verifiedAt?: string;
    emailSent?: boolean;
    expiresAt?: string;
  };
}

export interface VerificationStatus {
  email: string;
  status: 'pending' | 'verified' | 'expired';
  verifiedAt?: string;
  expiresAt: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmailVerificationService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = '/api/email-verification';

  /**
   * Verifica el token de email (público - desde el link del email)
   * GET /api/email-verification/verify/:token
   */
  verifyToken(token: string): Observable<VerificationResponse> {
    return this.http.get<VerificationResponse>(
      `${this.API_URL}/verify/${token}`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Solicita verificación de email (requiere autenticación)
   * POST /api/email-verification/request
   * El backend obtiene el email del usuario autenticado automáticamente
   */
  requestVerification(): Observable<VerificationResponse> {
    return this.http.post<VerificationResponse>(
      `${this.API_URL}/request`,
      {}
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Reenvía el email de verificación para usuario autenticado
   * POST /api/email-verification/resend
   */
  resendVerification(): Observable<VerificationResponse> {
    return this.http.post<VerificationResponse>(
      `${this.API_URL}/resend`,
      {}
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Reenvía verificación para usuarios NO autenticados (público)
   * POST /api/email-verification/resend-unverified
   * Usado cuando el usuario intenta login pero no ha verificado su email
   */
  resendForUnverified(email: string): Observable<VerificationResponse> {
    return this.http.post<VerificationResponse>(
      `${this.API_URL}/resend-unverified`,
      { email }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene el estado de verificación de un email (público)
   * GET /api/email-verification/status/:email
   */
  getStatus(email: string): Observable<VerificationStatus> {
    return this.http.get<{ success: boolean; data: VerificationStatus }>(
      `${this.API_URL}/status/${email}`
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Maneja errores HTTP de forma consistente
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 0) {
        errorMessage = 'No se pudo conectar con el servidor';
      } else if (error.status === 429) {
        errorMessage = 'Demasiadas solicitudes. Por favor espera 2 minutos.';
      } else if (error.status === 401) {
        errorMessage = 'Debes iniciar sesión para realizar esta acción';
      } else if (error.status === 403) {
        errorMessage = 'No tienes permisos para realizar esta acción';
      } else if (error.status === 404) {
        errorMessage = 'No se encontró la solicitud de verificación';
      } else if (error.status === 409) {
        // Usar el mensaje específico del backend para conflictos
        errorMessage = error.error?.message || 'Email ya verificado o solicitud duplicada';
      }
    }

    console.error('[EmailVerificationService] Error:', error);
    return throwError(() => ({
      ...error,
      message: errorMessage
    }));
  }

  /**
   * Verifica si un error es de tipo "email no verificado"
   */
  isEmailVerificationError(error: any): boolean {
    return error?.status === 403 && 
           error?.error?.errors?.[0]?.code === 'EMAIL_VERIFICATION_REQUIRED';
  }

  /**
   * Verifica si un error es de cooldown activo
   */
  isCooldownError(error: any): boolean {
    return error?.status === 409 && 
           error?.error?.errors?.[0]?.code === 'VERIFICATION_COOLDOWN_ACTIVE';
  }

  /**
   * Verifica si el email ya está verificado
   */
  isAlreadyVerifiedError(error: any): boolean {
    return error?.status === 409 && 
           error?.error?.errors?.[0]?.code === 'EMAIL_ALREADY_VERIFIED';
  }

  /**
   * Verifica si el token ha expirado
   */
  isTokenExpiredError(error: any): boolean {
    return error?.status === 400 && 
           error?.error?.errors?.[0]?.code === 'TOKEN_EXPIRED';
  }

  /**
   * Verifica si es un error de propiedad del email
   */
  isEmailOwnershipError(error: any): boolean {
    return error?.status === 403 && 
           error?.error?.errors?.[0]?.code === 'EMAIL_OWNERSHIP_VIOLATION';
  }
}