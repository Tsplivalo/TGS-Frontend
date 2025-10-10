import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth/auth';

/**
 * LoginComponent
 *
 * Formulario mínimo de inicio de sesión con validación reactiva, indicador de carga,
 * manejo compacto de errores de API y conmutación de visibilidad de contraseña.
 * Navega a "/" tras un login exitoso.
 */
@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  // --- Inyección de dependencias ---
  private fb    = inject(FormBuilder);
  private auth  = inject(AuthService);
  private router = inject(Router);

  // --- Estado UI ---
  loading = false;                // deshabilita submit y muestra spinner
  errorMsg: string | null = null; // clave i18n o texto plano retornado por API
  showPassword = false;           // conmutador de visibilidad del campo contraseña

  // --- Formulario reactivo ---
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  // Acceso corto a los controles (plantilla/TS)
  get f() { return this.form.controls; }

  // Mostrar/ocultar contraseña
  toggleShowPassword() { this.showPassword = !this.showPassword; }

  // --- Envío del formulario ---
  submit() {
    if (this.form.invalid || this.loading) return; // evita reentradas y envíos inválidos
    this.loading = true;
    this.errorMsg = null;

    // Normalización de payload (trim en email, password tal cual)
    const payload = {
      email: this.f.email.value!.trim(),
      password: this.f.password.value!
    };

    this.auth.login(payload).subscribe({
      next: () => this.router.navigateByUrl('/'), // redirigir tras éxito
      error: (e) => {
        // Extrae mensaje útil desde varios formatos de error habituales
        const apiMsg =
          e?.error?.message || e?.error?.mensaje || e?.error?.error ||
          (Array.isArray(e?.error?.errores) && e.error.errores[0]?.message) ||
          e?.message;
        this.errorMsg = apiMsg ? String(apiMsg) : 'auth.errors.loginFailed';
      }
    }).add(() => this.loading = false); // siempre liberar loading
  }
}
