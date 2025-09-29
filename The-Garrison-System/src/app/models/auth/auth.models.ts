export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface User {
  id?: number | string;
  name?: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
