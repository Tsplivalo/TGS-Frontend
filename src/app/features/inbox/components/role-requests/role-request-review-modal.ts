import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleRequest } from '../../models/role-request.model.js';
import { RoleRequestService } from '../../services/role-request.js';

@Component({
  selector: 'app-role-request-review-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './role-request-review-modal.html',
  styleUrls: ['./role-requests.scss']
})
export class RoleRequestReviewModalComponent {
  @Input() request!: RoleRequest;
  @Output() close = new EventEmitter<void>();
  @Output() reviewComplete = new EventEmitter<string | undefined>(); // ✅ Emite el userId si fue aprobado

  action: 'approve' | 'reject' = 'approve';
  comments: string = '';
  isSubmitting: boolean = false;
  error: string | null = null;

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

  async onSubmit(): Promise<void> {
    this.error = null;

    if (this.comments.length > 500) {
      this.error = 'Los comentarios no pueden exceder 500 caracteres';
      return;
    }

    this.isSubmitting = true;

    try {
      await this.roleRequestService.reviewRequest(this.request.id, {
        action: this.action,
        comments: this.comments || undefined,
      });

      console.log('[ReviewModal] ✅ Solicitud revisada:', {
        requestId: this.request.id,
        userId: this.request.user.id,
        action: this.action
      });

      // ✅ Si se aprobó, emitir el userId para que el componente padre actualice al usuario
      if (this.action === 'approve') {
        this.reviewComplete.emit(this.request.user.id);
      } else {
        this.reviewComplete.emit(undefined);
      }
    } catch (err: any) {
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