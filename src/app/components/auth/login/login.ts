// src/app/pages/login/login.component.ts
import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../services/auth/auth.js';
import { EmailVerificationService } from '../../../features/inbox/services/email.verification.js';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly emailVerificationService = inject(EmailVerificationService);
  private readonly destroy$ = new Subject<void>();

  // Estado del formulario
  email = signal('');
  password = signal('');
  loading = signal(false);
  error = signal<string | null>(null);

  // Estado de verificación de email
  needsEmailVerification = signal(false);
  resendingEmail = signal(false);
  emailSent = signal(false);
  actualEmail = signal<string | null>(null); // Email real del usuario (cuando se loguea con username)

  // Mensaje de éxito (ej: después de registro)
  successMessage = signal<string | null>(null);

  constructor() {
    // Verificar si hay mensajes de éxito en query params
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['message']) {
          this.successMessage.set(params['message']);
          // Limpiar después de 5 segundos
          setTimeout(() => this.successMessage.set(null), 5000);
        }
        if (params['verified'] === 'true') {
          this.successMessage.set('¡Email verificado correctamente! Ahora puedes iniciar sesión.');
          setTimeout(() => this.successMessage.set(null), 5000);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Maneja el envío del formulario de login
   */
  onSubmit(): void {
    // Limpiar estados previos
    this.error.set(null);
    this.needsEmailVerification.set(false);
    this.emailSent.set(false);

    // Validar campos
    if (!this.email() || !this.password()) {
      this.error.set('Por favor completa todos los campos');
      return;
    }

    // No validar formato específico - acepta email o username
    if (this.email().trim().length < 3) {
      this.error.set('El email o usuario debe tener al menos 3 caracteres');
      return;
    }

    this.loading.set(true);

    this.auth.login({
      email: this.email(),
      password: this.password()
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (user) => {
        this.loading.set(false);
        console.log('[Login] Success:', user);
        
        // Redirigir al home o a la ruta anterior
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.handleLoginError(err);
      }
    });
  }

  /**
   * Maneja errores de login con caso especial para verificación de email
   */
  private handleLoginError(error: HttpErrorResponse): void {
    console.error('[Login] Error:', error);

    // ✅ Detectar error de email no verificado usando el servicio
    if (this.emailVerificationService.isEmailVerificationError(error)) {
      this.needsEmailVerification.set(true);
      this.error.set('Debes verificar tu email antes de iniciar sesión.');

      // Extraer el email real de la respuesta (útil cuando se loguea con username)
      if (error.error?.email) {
        this.actualEmail.set(error.error.email);
      }
      return;
    }

    // Otros errores comunes
    if (error.status === 401) {
      this.error.set('Email o contraseña incorrectos');
    } else if (error.status === 404) {
      this.error.set('No existe una cuenta con este email');
    } else if (error.status === 429) {
      this.error.set('Demasiados intentos de login. Por favor espera unos minutos.');
    } else if (error.error?.message) {
      this.error.set(error.error.message);
    } else if (error.status === 0) {
      this.error.set('No se pudo conectar con el servidor. Verifica tu conexión.');
    } else {
      this.error.set('Error al iniciar sesión. Intenta nuevamente.');
    }
  }

  /**
   * Reenvía el email de verificación para usuario no verificado
   */
  resendVerificationEmail(): void {
    // Usar el email real si está disponible (cuando se loguea con username)
    // De lo contrario, usar el campo email (que puede ser email o username)
    const emailToUse = this.actualEmail() || this.email();

    if (!emailToUse) {
      this.error.set('Por favor ingresa tu email');
      return;
    }

    this.resendingEmail.set(true);
    this.error.set(null);
    this.emailSent.set(false);

    // Usar endpoint público para usuarios no autenticados
    this.emailVerificationService.resendForUnverified(emailToUse)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.resendingEmail.set(false);
          if (response.success) {
            this.emailSent.set(true);
            this.error.set(null);
            console.log('[Login] Email de verificación enviado');
          } else {
            this.error.set(response.message || 'No se pudo enviar el email.');
          }
        },
        error: (err: HttpErrorResponse) => {
          this.resendingEmail.set(false);

          // Usar helpers del servicio para detectar errores específicos
          if (this.emailVerificationService.isCooldownError(err)) {
            this.error.set('Por favor espera 2 minutos antes de reenviar el email.');
          } else if (this.emailVerificationService.isAlreadyVerifiedError(err)) {
            this.error.set('Tu email ya está verificado. Intenta iniciar sesión.');
            this.needsEmailVerification.set(false);
          } else if (err.status === 404) {
            this.error.set('No se encontró una cuenta con este email.');
          } else {
            this.error.set(err.error?.message || 'Error al enviar el email de verificación.');
          }
        }
      });
  }

  /**
   * Limpia los mensajes de error y estados
   */
  clearError(): void {
    this.error.set(null);
    this.needsEmailVerification.set(false);
    this.emailSent.set(false);
    this.actualEmail.set(null);
  }

  /**
   * Limpia el mensaje de éxito
   */
  clearSuccess(): void {
    this.successMessage.set(null);
  }
}