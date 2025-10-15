// src/app/pages/account/account.component.ts
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth/auth';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './account.html',
  styleUrls: ['./account.scss'],
})
export class AccountComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  // Estado local
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  ok = signal<string | null>(null);
  
  // Flag para mostrar mensaje de completar perfil
  showCompleteProfileMessage = signal(false);

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

  /**
   * Obtiene el perfil del usuario
   */
  private fetchMe(): void {
    this.loading.set(true);
    this.error.set(null);

    this.auth.me().subscribe({
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
    }).subscribe({
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