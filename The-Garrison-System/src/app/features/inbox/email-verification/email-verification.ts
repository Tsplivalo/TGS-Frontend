// src/app/pages/email-verification/email-verification.component.ts
import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { EmailVerificationService } from '../services/email.verification.js';
import { AuthService } from '../../../services/auth/auth.js'

type VerificationState = 'idle' | 'verifying' | 'success' | 'error';

@Component({
  selector: 'app-email-verification',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './email-verification.html',
  styleUrls: ['./email-verification.scss'],
})
export class EmailVerificationComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly emailService = inject(EmailVerificationService);
  private readonly auth = inject(AuthService);
  private readonly destroy$ = new Subject<void>();

  // Estado de la verificación
  state = signal<VerificationState>('idle');
  message = signal('Verificando tu email...');
  
  // Control de reenvío
  canResend = signal(false);
  resendCooldown = signal(0);
  resending = signal(false);
  
  // Token actual
  private currentToken: string | null = null;
  private cooldownInterval?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    // Escuchar cambios en los parámetros de la ruta
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const token = params['token'];
        if (token && token !== this.currentToken) {
          this.currentToken = token;
          this.verifyToken(token);
        }
      });

    // También verificar query params por compatibilidad
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const token = params['token'];
        if (token && !this.currentToken) {
          this.currentToken = token;
          this.verifyToken(token);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearCooldown();
  }

  /**
   * Verifica el token de email
   */
  private verifyToken(token: string): void {
    this.state.set('verifying');
    this.message.set('Verificando tu email...');

    this.emailService.verifyToken(token)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.handleVerificationSuccess(response);
          } else {
            this.handleVerificationError(response.message);
          }
        },
        error: (error) => {
          this.handleVerificationError(error.message);
        }
      });
  }

  /**
   * Maneja verificación exitosa
   */
  private handleVerificationSuccess(response: any): void {
    this.state.set('success');
    this.message.set('¡Email verificado correctamente! 🎉');
    
    // Si el usuario está autenticado, actualizar sus datos
    if (this.auth.isAuthenticated()) {
      // Podrías agregar un método en AuthService para refrescar el usuario
      // this.auth.refreshUser();
    }

    // Redirigir al home después de 3 segundos
    setTimeout(() => {
      this.router.navigate(['/'], { 
        queryParams: { verified: 'true' } 
      });
    }, 3000);
  }

  /**
   * Maneja errores de verificación
   */
  private handleVerificationError(errorMessage: string): void {
    this.state.set('error');
    
    // Personalizar mensaje según el tipo de error
    if (errorMessage.includes('expired') || errorMessage.includes('expirado')) {
      this.message.set('Este enlace de verificación ha expirado. Solicita uno nuevo.');
      this.canResend.set(true);
    } else if (errorMessage.includes('already verified') || errorMessage.includes('ya ha sido verificado')) {
      this.message.set('Este email ya ha sido verificado. Puedes iniciar sesión normalmente.');
      this.canResend.set(false);
    } else if (errorMessage.includes('not found') || errorMessage.includes('no encontrad')) {
      this.message.set('Token de verificación no válido o no encontrado.');
      this.canResend.set(true);
    } else {
      this.message.set(errorMessage || 'Error al verificar el email.');
      this.canResend.set(true);
    }
  }

  /**
   * Reenvía el email de verificación
   */
  resend(): void {
    if (!this.canResend() || this.resending()) {
      return;
    }

    this.resending.set(true);
    this.message.set('Enviando nuevo email de verificación...');

    // Intentar obtener el email del usuario autenticado
    const user = this.auth.user();
    const userEmail = user?.email;

    if (userEmail) {
      // Usuario autenticado: usar endpoint autenticado
      this.emailService.resendVerification()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.handleResendSuccess();
          },
          error: (error) => {
            this.handleResendError(error);
          }
        });
    } else {
      // Usuario no autenticado: mostrar mensaje
      this.resending.set(false);
      this.message.set('Por favor, inicia sesión para reenviar el email de verificación.');
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    }
  }

  /**
   * Maneja reenvío exitoso
   */
  private handleResendSuccess(): void {
    this.resending.set(false);
    this.message.set('¡Email de verificación enviado! Revisa tu bandeja de entrada.');
    this.state.set('idle');
    this.canResend.set(false);
    this.startCooldown();
  }

  /**
   * Maneja error en reenvío
   */
  private handleResendError(error: any): void {
    this.resending.set(false);
    
    if (this.emailService.isCooldownError(error)) {
      this.message.set('Debes esperar 2 minutos antes de solicitar otro email.');
      this.startCooldown();
    } else if (this.emailService.isAlreadyVerifiedError(error)) {
      this.message.set('Tu email ya está verificado. Puedes iniciar sesión normalmente.');
      this.canResend.set(false);
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    } else {
      this.message.set(error.message || 'Error al reenviar el email.');
    }
  }

  /**
   * Inicia el cooldown de 2 minutos
   */
  private startCooldown(): void {
    this.resendCooldown.set(120); // 2 minutos
    this.canResend.set(false);

    this.cooldownInterval = setInterval(() => {
      const current = this.resendCooldown();
      if (current <= 1) {
        this.clearCooldown();
        this.canResend.set(true);
      } else {
        this.resendCooldown.set(current - 1);
      }
    }, 1000);
  }

  /**
   * Limpia el intervalo de cooldown
   */
  private clearCooldown(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
      this.cooldownInterval = undefined;
    }
    this.resendCooldown.set(0);
  }

  /**
   * Formatea el tiempo de cooldown (MM:SS)
   */
  getCooldownText(): string {
    const seconds = this.resendCooldown();
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Navega al login
   */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * Navega al home
   */
  goToHome(): void {
    this.router.navigate(['/']);
  }
}