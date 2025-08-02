import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth/auth';
import { LoginRequest } from '../../models/auth/login.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.html',
  styleUrls: ['./auth.scss']
})
export class AuthComponent {
  loginData: LoginRequest = { email: '', password: '' };
  errorMessage = '';

  constructor(private authService: AuthService) {}

  login(): void {
    this.authService.login(this.loginData.email, this.loginData.password).subscribe({
      next: () => {
        // Redirigir o mostrar mensaje
        console.log('Login exitoso');
      },
      error: () => {
        this.errorMessage = 'Credenciales inválidas';
      }
    });
  }
}
