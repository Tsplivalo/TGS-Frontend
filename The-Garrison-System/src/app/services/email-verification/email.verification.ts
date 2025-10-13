import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VerifyResponse { success: boolean; message?: string }
export interface ResendResponse { success: boolean; message?: string }

@Injectable({ providedIn: 'root' })
export class EmailVerificationService {
  private http = inject(HttpClient);

  // Verifica un token (p.ej. provisto por query param)
  verify(token: string): Observable<VerifyResponse> {
    // Ajustá si tu backend lo espera como GET con query
    return this.http.post<VerifyResponse>('/api/auth/verify-email', { token });
  }

  // Reenvía mail de verificación al usuario autenticado
  resend(): Observable<ResendResponse> {
    return this.http.post<ResendResponse>('/api/auth/resend-verification', {});
  }
}