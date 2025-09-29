import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth/auth';

/**
 * Reglas:
 * - >= 8 chars
 * - al menos 1 minúscula, 1 mayúscula, 1 número y 1 símbolo (incluye el punto '.')
 * - sin espacios en blanco
 */
const SYMBOLS = String.raw`!@#$%^&*(),.?":{}|<>_\-+=;'/\\\[\]~`;
const PASSWORD_REGEX = new RegExp(
  `^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[${SYMBOLS}])\\S{8,}$`
);

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = false;
  errorMsg: string | null = null;
  showPassword = false;

  form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [
      Validators.required,
      Validators.pattern(PASSWORD_REGEX),
    ]],
  });

  get f() { return this.form.controls; }

  toggleShowPassword() { this.showPassword = !this.showPassword; }

  submit() {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.errorMsg = null;

    const payload = {
      username: this.f.username.value!.trim(),
      email: this.f.email.value!.trim(),
      password: this.f.password.value!,
    };

    this.auth.register(payload).subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: (e) => {
        const apiMsg =
          e?.error?.message || e?.error?.mensaje || e?.error?.error ||
          (Array.isArray(e?.error?.errores) && e.error.errores[0]?.message) ||
          e?.message;
        this.errorMsg = apiMsg ? String(apiMsg) : 'No se pudo registrar. Verificá los datos.';
      }
    }).add(() => this.loading = false);
  }
}
