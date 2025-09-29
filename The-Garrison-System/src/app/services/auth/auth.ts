import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

type UserDTO = { id: string; username: string; email: string; roles?: string[] };
type ApiResponse<T = any> = { success: boolean; message: string; data?: T };

type LoginDTO = { email: string; password: string };
type RegisterDTO = { username: string; email: string; password: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  readonly isLoggedIn = signal<boolean>(false);
  readonly user       = signal<UserDTO | null>(null);

  /** Inicia sesión y luego hidrata el perfil */
  login(payload: LoginDTO): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('/api/auth/login', payload, { withCredentials: true }).pipe(
      switchMap(() => this.me()),
      tap(() => this.isLoggedIn.set(true))
    );
  }

  /** Registro de usuario */
  register(payload: RegisterDTO): Observable<ApiResponse<UserDTO>> {
    return this.http.post<ApiResponse<UserDTO>>('/api/auth/register', payload, { withCredentials: true });
  }

  /** Cierra sesión y se suscribe internamente (para que funcione aunque el caller no se suscriba) */
  logout(): void {
    this.http.post<ApiResponse>('/api/auth/logout', {}, { withCredentials: true })
      .pipe(
        tap(() => {
          this.user.set(null);
          this.isLoggedIn.set(false);
          this.router.navigateByUrl('/login');
        })
      )
      .subscribe({ error: () => {
        // Aun si falla el endpoint, limpiamos estado local para evitar quedar "atrapados"
        this.user.set(null);
        this.isLoggedIn.set(false);
        this.router.navigateByUrl('/login');
      }});
  }

  /** Perfil actual */
  me(): Observable<ApiResponse<UserDTO>> {
    return this.http.get<ApiResponse<UserDTO>>('/api/usuarios/me', { withCredentials: true }).pipe(
      tap((res) => {
        if (res?.data) {
          this.user.set(res.data);
          this.isLoggedIn.set(true);
        } else {
          this.user.set(null);
          this.isLoggedIn.set(false);
        }
      })
    );
  }

  /** Alias */
  fetchMe() { return this.me(); }
}
