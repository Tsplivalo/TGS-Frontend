// src/app/pages/account/account.component.ts
import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth/auth';
import { EmailVerificationService } from '../../features/inbox/services/email.verification.js';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './account.html',
  styleUrls: ['./account.scss'],
})
export class AccountComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly emailVerificationService = inject(EmailVerificationService);
  private readonly destroy$ = new Subject<void>();

  // Estado local
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  ok = signal<string | null>(null);
  
  // Estado de verificación de email
  resendingEmail = signal(false);
  emailSent = signal(false);
  
  // Flag para mostrar mensaje de completar perfil
  showCompleteProfileMessage = signal(false);

  // Cooldown para reenvío
  private cooldownInterval?: ReturnType<typeof setInterval>;
  resendCooldown = signal(0);

  // Señales computadas
  me = computed(() => this.auth.user());
  profileCompleteness = computed(() => this.auth.profileCompleteness());
  hasPersonalInfo = computed(() => this.auth.hasPersonalInfo());
  canPurchase = computed(() => this.auth.canPurchase());

  ngOnInit(): void {
    // Verificar si viene con parámetro para completar perfil
    const completeProfile = this.route.snapshot.queryParams['completeProfile'];
    if (completeProfile === 'true') {
      this.showCompleteProfileMessage.set(true);
    }

    this.fetchMe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearCooldown();
  }

  /**
   * Obtiene el perfil del usuario
   */
  private fetchMe(): void {
    this.loading.set(true);
    this.error.set(null);

    this.auth.me()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading.set(false);
        },
        error: (e: HttpErrorResponse) => {
          this.loading.set(false);
          this.handleError(e, 'Error al cargar el perfil');
        },
      });
  }

  /**
   * Guarda el perfil del usuario
   * Si no tiene datos personales, usa el endpoint de completar perfil
   * Si ya tiene datos personales, NO se pueden modificar (según tu backend)
   */
  save(formEl: HTMLFormElement): void {
    const user = this.me();
    if (!user) {
      this.error.set('Usuario no encontrado');
      return;
    }

    const fd = new FormData(formEl);

    // Si no tiene información personal, completar perfil
    if (!user.hasPersonalInfo) {
      this.completeProfile(fd);
    } else {
      this.error.set('El perfil ya está completo. Los datos personales no pueden modificarse.');
    }
  }

  /**
   * Completa el perfil con datos personales
   */
  private completeProfile(fd: FormData): void {
    const dni = (fd.get('dni') as string || '').trim();
    const name = (fd.get('name') as string || '').trim();
    const phone = (fd.get('phone') as string || '').trim();
    const address = (fd.get('address') as string || '').trim();

    // Validar que todos los campos requeridos estén presentes
    if (!dni || !name || !phone || !address) {
      this.error.set('Todos los campos son requeridos para completar el perfil');
      return;
    }

    // Validar DNI
    if (dni.length < 7 || dni.length > 10) {
      this.error.set('El DNI debe tener entre 7 y 10 caracteres');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.ok.set(null);

    this.auth.completeProfile({
      dni,
      name,
      phone,
      address
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.saving.set(false);
          this.ok.set('¡Perfil completado exitosamente! 🎉');
          this.showCompleteProfileMessage.set(false);
          
          // Limpiar mensaje después de 3 segundos
          setTimeout(() => {
            if (this.ok() === '¡Perfil completado exitosamente! 🎉') {
              this.ok.set(null);
            }
          }, 3000);
        },
        error: (e: HttpErrorResponse) => {
          this.saving.set(false);
          this.handleError(e, 'Error al completar el perfil');
        }
      });
  }

  /**
   * Reenvía el email de verificación
   */
  resendVerificationEmail(): void {
    const user = this.me();
    if (!user) return;

    this.resendingEmail.set(true);
    this.error.set(null);
    this.ok.set(null);
    this.emailSent.set(false);

    this.emailVerificationService.resendVerification()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.resendingEmail.set(false);
          if (response.success) {
            this.emailSent.set(true);
            this.ok.set('✉️ Email de verificación enviado. Revisa tu bandeja de entrada.');
            this.startCooldown();
            
            // Limpiar mensaje después de 5 segundos
            setTimeout(() => {
              if (this.ok()?.includes('Email de verificación enviado')) {
                this.ok.set(null);
              }
            }, 5000);
          } else {
            this.error.set(response.message || 'No se pudo enviar el email.');
          }
        },
        error: (err: HttpErrorResponse) => {
          this.resendingEmail.set(false);
          
          // Usar helpers del servicio para detectar errores específicos
          if (this.emailVerificationService.isCooldownError(err)) {
            this.error.set('Por favor espera 2 minutos antes de reenviar el email.');
            this.startCooldown();
          } else if (this.emailVerificationService.isAlreadyVerifiedError(err)) {
            this.error.set('Tu email ya está verificado.');
            this.emailSent.set(false);
          } else {
            const errorMsg = err.error?.message || 'Error al enviar el email de verificación.';
            this.error.set(errorMsg);
          }
        }
      });
  }

  /**
   * Inicia el cooldown de 2 minutos
   */
  private startCooldown(): void {
    this.resendCooldown.set(120); // 2 minutos

    this.cooldownInterval = setInterval(() => {
      const current = this.resendCooldown();
      if (current <= 1) {
        this.clearCooldown();
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
    this.emailSent.set(false);
  }

  /**
   * Maneja errores HTTP
   */
  private handleError(error: HttpErrorResponse, fallbackMessage: string): void {
    if (error.status === 401) {
      this.error.set('No autorizado. Por favor, inicia sesión nuevamente.');
    } else if (error.status === 403) {
      this.error.set('No tienes permisos para realizar esta acción.');
    } else if (error.status === 404) {
      this.error.set('Usuario no encontrado.');
    } else if (error.status === 409) {
      const field = error.error?.field;
      if (field === 'dni') {
        this.error.set('El DNI ya está registrado.');
      } else {
        this.error.set(error.error?.message ?? 'Ya existe un registro con estos datos.');
      }
    } else if (error.error?.message) {
      this.error.set(error.error.message);
    } else {
      this.error.set(fallbackMessage);
    }
  }

  /**
   * Refresca el perfil
   */
  refresh(): void {
    this.fetchMe();
  }

  /**
   * Limpia los mensajes
   */
  clearMessages(): void {
    this.error.set(null);
    this.ok.set(null);
  }

  /**
   * Obtiene sugerencias para mejorar el perfil
   */
  getProfileSuggestions(): string[] {
    return this.auth.getProfileSuggestions();
  }

  /**
   * Obtiene requisitos para poder comprar
   */
  getPurchaseRequirements(): string[] {
    return this.auth.getPurchaseRequirements();
  }
}