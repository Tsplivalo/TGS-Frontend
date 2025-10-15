import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { User } from '../../models/user/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = 'http://localhost:3000/api/auth';
  
  // Signal para mantener el usuario actual
  private currentUserSignal = signal<User | null>(null);
  
  constructor(private http: HttpClient) {}

  /**
   * Obtiene el usuario actualmente autenticado desde el servidor
   */
  async getCurrentUser(): Promise<User> {
    const response = await firstValueFrom(
      this.http.get<{ data: User }>(`${this.baseUrl}/me`)
    );
    this.currentUserSignal.set(response.data);
    return response.data;
  }

  /**
   * Intenta hidratar la sesión desde la cookie al iniciar la app
   * Se llama desde main.ts
   */
  async fetchMe(): Promise<void> {
    try {
      await this.getCurrentUser();
    } catch (error) {
      // Usuario no autenticado, no hacer nada
      this.currentUserSignal.set(null);
    }
  }

  /**
   * Getter del usuario actual (readonly)
   */
  get currentUser(): User | null {
    return this.currentUserSignal();
  }

  /**
   * Login
   */
  async login(email: string, password: string): Promise<User> {
    const response = await firstValueFrom(
      this.http.post<{ data: User }>(`${this.baseUrl}/login`, {
        email,
        password
      })
    );
    this.currentUserSignal.set(response.data);
    return response.data;
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    await firstValueFrom(
      this.http.post(`${this.baseUrl}/logout`, {})
    );
    this.currentUserSignal.set(null);
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.currentUserSignal() !== null;
  }
}