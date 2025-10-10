import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth/auth';

/**
 * RegisterComponent
 *
 * Formulario de registro con validación fuerte de contraseña, manejo de estados de carga/errores
 * y navegación al login tras el alta. Comentarios centrados en decisiones de diseño y puntos de
 * mantenimiento (regex de password, normalización de inputs, i18n de errores).
 */

/**
 * Reglas de contraseña:
 * - Mínimo 8 caracteres
 * - >= 1 minúscula, 1 mayúscula, 1 número y 1 símbolo
 * - Sin espacios en blanco (\S)
 * Nota: el set de símbolos incluye el punto '.' (escapado en el regex final).
 */
const SYMBOLS = String.raw`!@#$%^&*(),.?":{}|<>_\-+=;'/\\\[\]~`;
const PASSWORD_REGEX = new RegExp(
  // lookaheads para exigir cada tipo + sin espacios y longitud mínima
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
  // --- Inyección de dependencias ---
  private fb    = inject(FormBuilder);
  private auth  = inject(AuthService);
  private router = inject(Router);

  // --- Estado UI ---
  loading = false;                // bloquea submit y muestra feedback
  errorMsg: string | null = null; // clave i18n o texto plano de API
  showPassword = false;           // alterna visibilidad del password input

  // --- Form reactivo ---
  form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [
      Validators.required,
      Validators.pattern(PASSWORD_REGEX), // aplica las reglas definidas arriba
    ]],
  });

  // Acceso directo a los controles (útil en template/TS)
  get f() { return this.form.controls; }

  // Mostrar/ocultar contraseña (UI/UX)
  toggleShowPassword() { this.showPassword = !this.showPassword; }

  // --- Submit: registro de usuario ---
  submit() {
    // Evita envíos inválidos o repetidos
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.errorMsg = null;

    // Normaliza inputs: trim de email/username; password se envía tal cual
    const payload = {
      username: this.f.username.value!.trim(),
      email: this.f.email.value!.trim(),
      password: this.f.password.value!,
    };

    this.auth.register(payload).subscribe({
      next: () => this.router.navigateByUrl('/login'), // ir a login tras éxito
      error: (e) => {
        // Intenta mapear formatos de error comunes; fallback i18n sugerido
        const apiMsg =
          e?.error?.message || e?.error?.mensaje || e?.error?.error ||
          (Array.isArray(e?.error?.errores) && e.error.errores[0]?.message) ||
          e?.message;
        this.errorMsg = apiMsg ? String(apiMsg) : 'auth.errors.registerFailed';
      }
    }).add(() => this.loading = false); // libera estado al finalizar
  }
}
