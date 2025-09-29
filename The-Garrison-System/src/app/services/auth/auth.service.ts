import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '../../models/auth/auth.models';
import { Router } from '@angular/router';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = '/api/auth'; // TODO: adjust to your backend base URL

  private tokenSig = signal<string | null>(this.loadToken());
  private userSig = signal<User | null>(this.loadUser());

  readonly token = computed(() => this.tokenSig());
  readonly user = computed(() => this.userSig());
  readonly isAuthenticated = computed(() => !!this.tokenSig());

  constructor(private http: HttpClient, private router: Router) {}

  login(payload: LoginRequest) {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, payload);
  }

  register(payload: RegisterRequest) {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, payload);
  }

  setSession(resp: AuthResponse) {
    this.tokenSig.set(resp.token);
    this.userSig.set(resp.user);
    localStorage.setItem(TOKEN_KEY, resp.token);
    localStorage.setItem(USER_KEY, JSON.stringify(resp.user));
  }

  logout() {
    this.tokenSig.set(null);
    this.userSig.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.router.navigate(['/login']);
  }

  private loadToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private loadUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) as User : null;
  }
}
