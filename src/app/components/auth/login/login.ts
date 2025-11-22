// src/app/pages/login/login.component.ts
import { Component, inject, signal, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../services/auth/auth.js';
import { EmailVerificationService } from '../../../features/inbox/services/email.verification.js';
import { EmailVerificationSyncService } from '../../../services/email-verification-sync.service.js';

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
  private readonly syncService = inject(EmailVerificationSyncService);
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

  // Estado de espera de verificación
  waitingForVerification = signal(false);

  // Mensaje de éxito (ej: después de registro)
  successMessage = signal<string | null>(null);

  // Estado del botón de reenvío
  resendCooldown = signal(0); // Segundos restantes para poder reenviar
  canResend = signal(false); // Si puede reenviar el email

  // Cleanup functions para los listeners
  private stopPolling?: () => void;
  private removeStorageListener?: () => void;
  private cooldownInterval?: any;

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

    // Effect para detectar cuando el email fue verificado desde otra pestaña
    effect(() => {
      const verificationEvent = this.syncService.emailVerified();
      console.log('[Login] Effect ejecutado. Verification event:', verificationEvent, 'Waiting:', this.waitingForVerification());

      if (verificationEvent) {
        console.log('[Login] ✅ Email verificado detectado!', verificationEvent);
        if (this.waitingForVerification()) {
          console.log('[Login] Procediendo con auto-login para:', verificationEvent.email);
          this.handleEmailVerifiedFromAnotherTab(verificationEvent.email);
        } else {
          console.log('[Login] No estamos esperando verificación, ignorando evento');
        }
      }
    });

    // Escuchar cambios en localStorage como fallback
    this.removeStorageListener = this.syncService.listenToStorageEvents();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Limpiar polling si está activo
    if (this.stopPolling) {
      this.stopPolling();
    }

    // Remover listener de storage
    if (this.removeStorageListener) {
      this.removeStorageListener();
    }

    // Limpiar el temporizador de cooldown
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }

    // Limpiar el servicio de sincronización
    this.syncService.reset();
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
      // Primero intentar nivel superior (error normalizado), luego error.error (directo del backend)
      let emailToVerify = this.email();
      const realEmail = (error as any)?.email || error.error?.email;

      if (realEmail) {
        console.log('[Login] ✅ Email real extraído del backend:', realEmail);
        this.actualEmail.set(realEmail);
        emailToVerify = realEmail;
      } else {
        console.warn('[Login] ⚠️ Backend NO devolvió el email real. Usando valor ingresado:', emailToVerify);
      }

      // Guardar credenciales para auto-login después de verificación
      console.log('[Login] Guardando credenciales para auto-login con email:', emailToVerify);
      localStorage.setItem('pendingAuth', JSON.stringify({
        email: emailToVerify,
        password: this.password()
      }));

      // Activar estado de espera de verificación
      this.waitingForVerification.set(true);

      // Iniciar polling para verificar el estado del email
      console.log('[Login] Iniciando polling para verificar email:', emailToVerify);
      this.stopPolling = this.syncService.startPollingVerification(emailToVerify, 3000);

      // ✅ Iniciar temporizador SIEMPRE al activar waitingForVerification
      this.startResendCooldown();

      // ✅ Enviar automáticamente el email de verificación (como en el registro)
      console.log('[Login] 📧 Intentando enviar automáticamente email de verificación para:', emailToVerify);
      this.emailVerificationService.resendForUnverified(emailToVerify)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('[Login] Respuesta del servidor:', response);
            if (response.success) {
              this.emailSent.set(true);
              console.log('[Login] ✅ Email de verificación enviado automáticamente con éxito');
              // Limpiar el error principal para que solo se muestre el mensaje de email enviado
              this.error.set('Revisa tu bandeja de entrada para verificar tu email.');
            } else {
              console.warn('[Login] ⚠️ El servidor respondió pero no fue exitoso:', response.message);
              // No marcar como enviado si el servidor dice que falló
            }
          },
          error: (err: HttpErrorResponse) => {
            console.error('[Login] ❌ Error completo al enviar email:', err);
            console.error('[Login] Error status:', err.status);
            console.error('[Login] Error message:', err.message);
            console.error('[Login] Error body:', err.error);

            // No mostrar error si ya está verificado o está en cooldown
            if (this.emailVerificationService.isAlreadyVerifiedError(err)) {
              console.log('[Login] Email ya verificado');
              this.error.set('Tu email ya está verificado. Intenta iniciar sesión nuevamente.');
            } else if (this.emailVerificationService.isCooldownError(err)) {
              console.log('[Login] Email enviado recientemente, en cooldown');
              this.emailSent.set(true); // Marcar como enviado para no confundir al usuario
              this.error.set('El email de verificación ya fue enviado. Revisa tu bandeja de entrada.');
            } else {
              console.error('[Login] Error inesperado al enviar email automáticamente');
              // No marcar como enviado si hubo un error real
              this.error.set('No se pudo enviar el email automáticamente. Usa el botón de reenvío abajo.');
            }
          }
        });

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
    console.log('[Login] 🔄 Botón de reenvío clickeado');

    // Intentar obtener el email de múltiples fuentes
    let emailToUse = this.actualEmail(); // Primero el email real (cuando se loguea con username)

    if (!emailToUse) {
      // Si no está en actualEmail, intentar desde pendingAuth en localStorage
      const pendingAuth = localStorage.getItem('pendingAuth');
      if (pendingAuth) {
        try {
          const parsed = JSON.parse(pendingAuth);
          emailToUse = parsed.email;
          console.log('[Login] Email obtenido de pendingAuth:', emailToUse);
        } catch (e) {
          console.error('[Login] Error parseando pendingAuth:', e);
        }
      }
    }

    if (!emailToUse) {
      // Fallback al campo email del formulario
      emailToUse = this.email();
      console.log('[Login] Email obtenido del formulario:', emailToUse);
    }

    if (!emailToUse) {
      console.error('[Login] ❌ No se pudo obtener el email para reenviar');
      this.error.set('Por favor ingresa tu email');
      return;
    }

    console.log('[Login] 📧 Reenviando email a:', emailToUse);
    this.resendingEmail.set(true);
    this.error.set(null);
    this.emailSent.set(false);

    // Usar endpoint público para usuarios no autenticados
    this.emailVerificationService.resendForUnverified(emailToUse)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.resendingEmail.set(false);
          console.log('[Login] Respuesta del reenvío:', response);
          if (response.success) {
            this.emailSent.set(true);
            this.error.set(null);
            console.log('[Login] ✅ Email de verificación reenviado');

            // Activar estado de espera si no está activo
            if (!this.waitingForVerification()) {
              this.waitingForVerification.set(true);

              // Iniciar polling si no está activo
              if (!this.stopPolling) {
                console.log('[Login] Iniciando polling para verificar email:', emailToUse);
                this.stopPolling = this.syncService.startPollingVerification(emailToUse, 3000);
              }
            }

            // Reiniciar temporizador de cooldown
            this.startResendCooldown();
          } else {
            console.warn('[Login] ⚠️ Reenvío no exitoso:', response.message);
            this.error.set(response.message || 'No se pudo enviar el email.');
          }
        },
        error: (err: HttpErrorResponse) => {
          this.resendingEmail.set(false);
          console.error('[Login] ❌ Error al reenviar:', err);

          // Usar helpers del servicio para detectar errores específicos
          if (this.emailVerificationService.isCooldownError(err)) {
            console.log('[Login] Error de cooldown detectado');
            const cooldownSeconds = this.emailVerificationService.getCooldownSeconds(err);
            const minutes = Math.floor(cooldownSeconds / 60);
            const seconds = cooldownSeconds % 60;

            let timeMessage = '';
            if (minutes > 0 && seconds > 0) {
              timeMessage = `${minutes} minuto${minutes > 1 ? 's' : ''} y ${seconds} segundo${seconds > 1 ? 's' : ''}`;
            } else if (minutes > 0) {
              timeMessage = `${minutes} minuto${minutes > 1 ? 's' : ''}`;
            } else {
              timeMessage = `${seconds} segundo${seconds > 1 ? 's' : ''}`;
            }

            this.error.set(`Ya enviamos un email recientemente. Por favor espera ${timeMessage} antes de reenviar.`);
            // Iniciar cooldown con el tiempo exacto del backend
            this.startResendCooldown(cooldownSeconds);
          } else if (this.emailVerificationService.isAlreadyVerifiedError(err)) {
            console.log('[Login] Email ya verificado');
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
   * Maneja cuando el email fue verificado desde otra pestaña
   */
  private handleEmailVerifiedFromAnotherTab(email: string): void {
    console.log('[Login] Intentando auto-login después de verificación:', email);

    // Obtener credenciales de pendingAuth
    const raw = localStorage.getItem('pendingAuth');
    if (!raw) {
      console.warn('[Login] No hay credenciales pendientes para auto-login');
      this.waitingForVerification.set(false);
      this.successMessage.set('Email verificado correctamente. Por favor inicia sesión.');
      return;
    }

    try {
      const { email: savedEmail, password } = JSON.parse(raw);

      // Verificar que el email coincida
      if (savedEmail.toLowerCase() !== email.toLowerCase()) {
        console.warn('[Login] El email verificado no coincide con las credenciales guardadas');
        this.waitingForVerification.set(false);
        return;
      }

      // Hacer auto-login
      this.loading.set(true);
      this.auth.login({ email: savedEmail, password })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (user) => {
            this.loading.set(false);
            this.waitingForVerification.set(false);
            console.log('[Login] Auto-login exitoso:', user);

            // Limpiar credenciales pendientes
            localStorage.removeItem('pendingAuth');

            // Detener polling si está activo
            if (this.stopPolling) {
              this.stopPolling();
              this.stopPolling = undefined;
            }

            // Mostrar animación de éxito
            this.successMessage.set('¡Email verificado! Iniciando sesión...');

            // Redirigir
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
            setTimeout(() => {
              this.router.navigateByUrl(returnUrl);
            }, 1000);
          },
          error: (err) => {
            this.loading.set(false);
            this.waitingForVerification.set(false);
            console.error('[Login] Error en auto-login:', err);
            this.error.set('Email verificado, pero ocurrió un error al iniciar sesión. Por favor intenta nuevamente.');
            localStorage.removeItem('pendingAuth');
          }
        });
    } catch (e) {
      console.error('[Login] Error parseando pendingAuth:', e);
      this.waitingForVerification.set(false);
    }
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

  /**
   * Inicia el temporizador de cooldown para poder reenviar el email
   * @param seconds Segundos de cooldown (por defecto 120 = 2 minutos)
   */
  private startResendCooldown(seconds: number = 120): void {
    this.resendCooldown.set(seconds);
    this.canResend.set(false);

    // Limpiar intervalo anterior si existe
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }

    // Iniciar cuenta regresiva
    this.cooldownInterval = setInterval(() => {
      const current = this.resendCooldown();
      if (current > 0) {
        this.resendCooldown.set(current - 1);
      } else {
        // Cuando llega a 0, habilitar el botón de reenvío
        this.canResend.set(true);
        if (this.cooldownInterval) {
          clearInterval(this.cooldownInterval);
          this.cooldownInterval = undefined;
        }
      }
    }, 1000);
  }
}