import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

export type PasswordResetResponse = {
  success: boolean;
  message?: string;
  email?: string;
  data?: {
    email?: string;
    resetAt?: string;
    isValid?: boolean;
    status?: string;
    expiresAt?: string;
  };
  code?: string;
  statusCode?: number;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
};

@Injectable({ providedIn: 'root' })
export class PasswordResetService {
  private http = inject(HttpClient);
  private base = '/api/password-reset';

  /**
   * Request password reset email
   */
  requestReset(email: string): Observable<PasswordResetResponse> {
    return this.http
      .post<PasswordResetResponse>(
        `${this.base}/request`,
        { email },
        {
          withCredentials: true,
        }
      )
      .pipe(catchError((err) => throwError(() => this.normalizeError(err))));
  }

  /**
   * Validate reset token
   */
  validateToken(token: string): Observable<PasswordResetResponse> {
    return this.http
      .get<PasswordResetResponse>(
        `${this.base}/validate/${encodeURIComponent(token)}`,
        {
          withCredentials: true,
        }
      )
      .pipe(catchError((err) => throwError(() => this.normalizeError(err))));
  }

  /**
   * Reset password with token
   */
  resetPassword(
    token: string,
    newPassword: string
  ): Observable<PasswordResetResponse> {
    return this.http
      .post<PasswordResetResponse>(
        `${this.base}/reset`,
        {
          token,
          newPassword,
        },
        { withCredentials: true }
      )
      .pipe(catchError((err) => throwError(() => this.normalizeError(err))));
  }

  /**
   * Get reset status
   */
  getStatus(email: string): Observable<PasswordResetResponse> {
    return this.http
      .get<PasswordResetResponse>(
        `${this.base}/status/${encodeURIComponent(email)}`,
        {
          withCredentials: true,
        }
      )
      .pipe(catchError((err) => throwError(() => this.normalizeError(err))));
  }

  /**
   * Helper to detect specific error codes
   */
  isTokenExpired(err: any): boolean {
    return err?.code === 'TOKEN_EXPIRED';
  }

  isTokenAlreadyUsed(err: any): boolean {
    return err?.code === 'TOKEN_ALREADY_USED';
  }

  isCooldownError(err: any): boolean {
    return err?.status === 429;
  }

  private normalizeError(err: any) {
    return {
      status: err?.status,
      code: err?.error?.errors?.[0]?.code || err?.error?.code,
      message: err?.error?.message || err?.message || 'Error',
    };
  }
}
