import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core'; // Pipe de traducción usado en el template
import { AuthService } from '../../services/auth/auth';

/**
 * AccountComponent
 *
 * Carga el perfil del usuario autenticado y permite actualizar campos básicos.
 * Mantiene estado de "loading/saving" con signals para reaccionar en la UI,
 * y expone mensajes de error/éxito (ideales para mostrarlos con i18n en el template).
 */

type MeDTO = {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
};

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule, // Necesario para el pipe |translate usado en la vista
  ],
  templateUrl: './account.html',
  styleUrls: ['./account.scss'],
})
export class AccountComponent implements OnInit {
  // --- Inyección de dependencias ---
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  // --- Estado reactivo para la UI ---
  loading = signal(false);                 // "true" mientras se carga el perfil
  saving  = signal(false);                 // "true" mientras se envían cambios
  error   = signal<string | null>(null);   // clave i18n o mensaje plano
  ok      = signal<string | null>(null);   // clave i18n o mensaje plano
  me      = signal<MeDTO | null>(null);    // datos del usuario actual

  // --- Ciclo de vida ---
  ngOnInit() {
    this.fetchMe();
  }

  // Obtiene el perfil actual del backend vía AuthService.
  private fetchMe() {
    this.loading.set(true);
    this.error.set(null);
    this.ok.set(null);

    this.auth.me().subscribe({
      next: (u) => {
        this.me.set(u as any);   // el servicio tipa el retorno; casteo defensivo
        this.loading.set(false);
      },
      error: (e) => {
        // Mensaje listo para pasar por |translate en la vista si es una key i18n
        this.error.set(e?.error?.message ?? 'account.errors.fetchFailed');
        this.loading.set(false);
      },
    });
  }

  /**
   * Guarda los cambios del perfil.
   * Recibe el <form> como HTMLFormElement desde el template: (submit)="save(formEl); $event.preventDefault()"
   * Usa FormData para mapear campos y evita enviar strings vacíos (usa "undefined").
   */
  save(formEl: HTMLFormElement) {
    if (!this.me()) return; // No hay usuario cargado

    // Construcción de payload ligera; trimming y undefined para omitir campos vacíos
    const fd = new FormData(formEl);
    const payload: Partial<MeDTO> = {
      username:  (fd.get('username')  as string || '').trim() || undefined,
      firstName: (fd.get('firstName') as string || '').trim() || undefined,
      lastName:  (fd.get('lastName')  as string || '').trim() || undefined,
      phone:     (fd.get('phone')     as string || '').trim() || undefined,
      address:   (fd.get('address')   as string || '').trim() || undefined,
    };

    this.saving.set(true);
    this.error.set(null);
    this.ok.set(null);

    // withCredentials:true para enviar cookies de sesión al mismo dominio
    this.http.patch('/api/users/me', payload, { withCredentials: true }).subscribe({
      next: () => {
        this.saving.set(false);
        this.ok.set('account.messages.saved'); // clave i18n sugerida
        this.fetchMe(); // refrescar datos tras guardar
      },
      error: (e) => {
        this.saving.set(false);
        this.error.set(e?.error?.message ?? 'account.errors.saveFailed');
      },
    });
  }
}
