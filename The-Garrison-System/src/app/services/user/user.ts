import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, switchMap, throwError } from 'rxjs';
import { AuthService, UserDTO, ApiResponse } from '../auth/auth';

export type MeUpdateDTO = Partial<{
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
}>;

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  getMe() {
    return this.http.get<ApiResponse<UserDTO | null>>('/api/users/me').pipe(
      map((res: any) => ('data' in res ? res.data : res) as UserDTO | null),
    );
  }

  updateMe(payload: MeUpdateDTO) {
    // Limpia payload (evita '', null)
    const clean: Record<string, any> = {};
    Object.entries(payload).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== '') clean[k] = String(v).trim();
    });
    if (Object.keys(clean).length === 0) return throwError(() => new Error('Sin cambios'));

    // Intento PATCH /api/users/me
    return this.http.patch<ApiResponse<UserDTO>>('/api/users/me', clean).pipe(
      map((res: any) => ('data' in res ? res.data : res) as UserDTO),
      // si tu backend NO soporta update profile:
      catchError((err) => {
        if (err?.status === 404 || err?.status === 405) {
          return throwError(() => new Error(
            'Tu backend no tiene PATCH/PUT /api/users/me (no se puede guardar desde el front).'
          ));
        }
        return throwError(() => err);
      }),
      // si guardó bien: refresco el auth.user
      switchMap((updated) => {
        this.auth.user.set(updated);
        return this.auth.me(); // re-lee el perfil para mantener señales coherentes
      })
    );
  }
}
