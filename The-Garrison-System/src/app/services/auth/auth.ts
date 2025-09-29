import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ApiResponse, LoginDTO, RegisterDTO, UsuarioDTO } from '../../models/auth/auth.model';

const STORAGE_KEY = 'auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _user = signal<UsuarioDTO | null>(this.leerUsuarioLocal());
  readonly user = computed(() => this._user());
  readonly isLoggedIn = computed(() => !!this._user());

  private leerUsuarioLocal(): UsuarioDTO | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) as UsuarioDTO : null;
    } catch { return null; }
  }

  private guardarUsuarioLocal(user: UsuarioDTO | null) {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }

  /** Llama al backend: setea cookie HttpOnly (hecho por el servidor). */
  login(payload: LoginDTO) {
    return this.http.post<ApiResponse<UsuarioDTO>>('/api/auth/login', payload, { withCredentials: true })
      .subscribe({
        next: (res) => {
          this._user.set(res.data);
          this.guardarUsuarioLocal(res.data);
          this.router.navigateByUrl('/');
        },
        error: () => { /* manejar en el componente si hace falta */ }
      });
  }

  register(payload: RegisterDTO) {
    return this.http.post<ApiResponse<UsuarioDTO>>('/api/auth/register', payload, { withCredentials: true });
  }

  /** Recupera el perfil si hay cookie válida (útil al iniciar la app). */
  fetchMe() {
    return this.http.get<ApiResponse<UsuarioDTO>>('/api/usuarios/me', { withCredentials: true })
      .subscribe({
        next: (res) => { this._user.set(res.data); this.guardarUsuarioLocal(res.data); },
        error: () => { this._user.set(null); this.guardarUsuarioLocal(null); }
      });
  }

  logout() {
    return this.http.post('/api/auth/logout', {}, { withCredentials: true })
      .subscribe({
        next: () => { this._user.set(null); this.guardarUsuarioLocal(null); this.router.navigateByUrl('/login'); },
        error: () => { this._user.set(null); this.guardarUsuarioLocal(null); this.router.navigateByUrl('/login'); }
      });
  }
}
