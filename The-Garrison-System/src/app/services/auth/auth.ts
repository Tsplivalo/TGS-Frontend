import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, switchMap, map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export type UserDTO = {
  id: string;
  username?: string | null;
  email: string;
  roles?: string[];
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  address?: string | null;
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

  // POST /auth/login -> GET /users/me (chained)
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

  logout(): void {
    this.http.post<ApiResponse>('/api/auth/logout', {}, { withCredentials: true }).subscribe({
      next: () => {
        this.user.set(null);
        this.isLoggedIn.set(false);
        this.router.navigateByUrl('/');
      },
      error: () => {
        this.user.set(null);
        this.isLoggedIn.set(false);
        this.router.navigateByUrl('/');
      },
    });
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

  roles(): string[] { return this.user()?.roles ?? []; }
  hasRole(role: string): boolean { return this.roles().includes(role); }
  isClient(): boolean { return this.hasRole('CLIENT') || this.hasRole('CLIENTE'); }
}
