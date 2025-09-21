import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

interface LoginResp { token: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = '/api/auth';

  constructor(private http: HttpClient) {}

  register(nombre: string, email: string, password: string) {
    return this.http.post(`${this.apiUrl}/register`, { nombre, email, password });
  }

  login(email: string, password: string) {
    return this.http.post<LoginResp>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap(resp => localStorage.setItem('token', resp.token))
      );
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  logout() {
    localStorage.removeItem('token');
  }
}
