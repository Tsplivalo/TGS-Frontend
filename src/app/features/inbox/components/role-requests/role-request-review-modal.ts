import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleRequest } from '../../models/role-request.model';
import { RoleRequestService } from '../../services/role-request';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-role-request-review-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './role-request-review-modal.html',
  styleUrls: ['./role-requests.scss']
})
export class RoleRequestReviewModalComponent {
  @Input() request!: RoleRequest;
  @Output() close = new EventEmitter<void>();
  @Output() reviewComplete = new EventEmitter<string | undefined>();

  action: 'approve' | 'reject' = 'approve';
  comments: string = '';
  isSubmitting: boolean = false;
  error: string | null = null;

  private t = inject(TranslateService);

  constructor(private roleRequestService: RoleRequestService) {}

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      PARTNER: 'Socio',
      DISTRIBUTOR: 'Distribuidor',
      AUTHORITY: 'Autoridad',
    };
    return labels[role] || role;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  
  // ✅ NUEVO: Obtener etiqueta del rango de autoridad
  getRankLabel(rank: string): string {
    const labels: Record<string, string> = {
      '0': 'Rango 0 - Base',
      '1': 'Rango 1 - Intermedio',
      '2': 'Rango 2 - Senior',
      '3': 'Rango 3 - Ejecutivo'
    };
    return labels[rank] || `Rango ${rank}`;
  }

  async onSubmit(): Promise<void> {
    this.error = null;

    if (this.comments.length > 500) {
      this.error = 'Los comentarios no pueden exceder 500 caracteres';
      return;
    }

    this.isSubmitting = true;

    try {
      // Revisar la solicitud en el backend
      await this.roleRequestService.reviewRequest(this.request.id, {
        action: this.action,
        comments: this.comments || undefined,
      });

      console.log('[ReviewModal] ✅ Solicitud revisada:', {
        requestId: this.request.id,
        userId: this.request.user.id,
        action: this.action
      });

      // El backend ya se encarga de crear el registro automáticamente
      // Solo emitimos el evento para que el padre actualice la lista
      this.reviewComplete.emit(this.action === 'approve' ? this.request.user.id : undefined);
      
    } catch (err: any) {
      console.error('[ReviewModal] ❌ Error:', err);
      this.error =
        err.error?.message ||
        err.error?.errors?.[0]?.message ||
        'Error al procesar la solicitud';
    } finally {
      this.isSubmitting = false;
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}