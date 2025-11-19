import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Notification, NotificationType, NotificationStatus } from '../../models/notification.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-notification-card',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './notification-card.html',
  styleUrls: ['./notifications.scss']
})
export class NotificationCardComponent {
  @Input() notification!: Notification;
  @Output() markAsRead = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();

  private t = inject(TranslateService);

  isExpanded: boolean = false;
  NotificationStatus = NotificationStatus;

  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
    // Auto-marcar como leída al expandir
    if (this.isExpanded && this.notification.status === NotificationStatus.UNREAD) {
      this.markAsRead.emit();
    }
  }

  getTypeIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      [NotificationType.USER_VERIFICATION_APPROVED]: '✅',
      [NotificationType.USER_VERIFICATION_REJECTED]: '❌',
      [NotificationType.ROLE_REQUEST_APPROVED]: '🎉',
      [NotificationType.ROLE_REQUEST_REJECTED]: '⚠️',
      [NotificationType.SYSTEM]: 'ℹ️',
    };
    return icons[type];
  }

  getTypeColor(type: NotificationType): string {
    const colors: Record<NotificationType, string> = {
      [NotificationType.USER_VERIFICATION_APPROVED]: 'success',
      [NotificationType.USER_VERIFICATION_REJECTED]: 'danger',
      [NotificationType.ROLE_REQUEST_APPROVED]: 'success',
      [NotificationType.ROLE_REQUEST_REJECTED]: 'warning',
      [NotificationType.SYSTEM]: 'info',
    };
    return colors[type];
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    // Tiempo relativo para notificaciones recientes
    if (diffMins < 1) {
      return this.t.instant('notifications.justNow') || 'Justo ahora';
    } else if (diffMins < 60) {
      return this.t.instant('notifications.minutesAgo', { count: diffMins }) || `Hace ${diffMins} min`;
    } else if (diffHours < 24) {
      return this.t.instant('notifications.hoursAgo', { count: diffHours }) || `Hace ${diffHours}h`;
    } else if (diffDays < 7) {
      return this.t.instant('notifications.daysAgo', { count: diffDays }) || `Hace ${diffDays}d`;
    }

    // Fecha completa para notificaciones antiguas
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  onMarkAsRead(event: Event): void {
    event.stopPropagation();
    this.markAsRead.emit();
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.delete.emit();
  }

  isUnread(): boolean {
    return this.notification.status === NotificationStatus.UNREAD;
  }

  /**
   * Verifica si hay metadata para mostrar
   */
  hasMetadata(): boolean {
    if (!this.notification.metadata) return false;
    const keys = Object.keys(this.notification.metadata);
    return keys.length > 0;
  }

  /**
   * Formatea la fecha de metadata a un formato legible
   */
  formatMetadataDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Traduce los títulos conocidos de notificaciones
   */
  getTranslatedTitle(title: string): string {
    // Si el título es un código del backend (MAYÚSCULAS_CON_GUIONES), traducirlo
    if (title && /^[A-Z_]+$/.test(title)) {
      const translated = this.t.instant(`backendMessages.${title}`);
      // Si la traducción no existe, devolver el código original
      return translated !== `backendMessages.${title}` ? translated : title;
    }

    // Mapeo de títulos conocidos del backend (legacy) a claves de traducción
    const titleMap: Record<string, string> = {
      // Español
      'Nueva solicitud de verificación de usuario': this.t.instant('notifications.titles.newUserVerification'),
      'Nueva solicitud de rol': this.t.instant('notifications.titles.newRoleRequest'),
      'Solicitud de verificación aprobada': this.t.instant('notifications.titles.verificationApproved'),
      'Solicitud de verificación rechazada': this.t.instant('notifications.titles.verificationRejected'),
      'Solicitud de rol aprobada': this.t.instant('notifications.titles.roleRequestApproved'),
      'Solicitud de rol rechazada': this.t.instant('notifications.titles.roleRequestRejected'),
      // Inglés
      'New user verification request': this.t.instant('notifications.titles.newUserVerification'),
      'New role request': this.t.instant('notifications.titles.newRoleRequest'),
      'Verification request approved': this.t.instant('notifications.titles.verificationApproved'),
      'Verification request rejected': this.t.instant('notifications.titles.verificationRejected'),
      'Role request approved': this.t.instant('notifications.titles.roleRequestApproved'),
      'Role request rejected': this.t.instant('notifications.titles.roleRequestRejected'),
    };

    // Si el título tiene traducción, usarla; sino devolver el original
    return titleMap[title] || title;
  }

  /**
   * Traduce los mensajes conocidos de notificaciones con variables
   */
  getTranslatedMessage(message: string): string {
    // Si el mensaje es un código del backend (MAYÚSCULAS_CON_GUIONES), traducirlo
    if (message && /^[A-Z_]+$/.test(message)) {
      const metadata = this.notification.metadata;
      let translated = this.t.instant(`backendMessages.${message}`);

      // Si la traducción no existe, devolver el código original
      if (translated === `backendMessages.${message}`) {
        return message;
      }

      // Interpolar variables de metadata si existen
      if (metadata) {
        // Para USER_VERIFICATION_REJECTED_MESSAGE, manejar el campo reason
        if (message === 'USER_VERIFICATION_REJECTED_MESSAGE' && metadata['reason']) {
          const reasonText = this.t.instant('backendMessages.USER_VERIFICATION_REJECTED_WITH_REASON', {
            reason: metadata['reason']
          });
          translated = translated.replace('{{reason}}', reasonText);
        } else {
          translated = translated.replace('{{reason}}', '');
        }

        // Reemplazar otras variables de metadata
        Object.keys(metadata).forEach(key => {
          const placeholder = `{{${key}}}`;
          if (translated.includes(placeholder)) {
            translated = translated.replace(placeholder, String(metadata[key]));
          }
        });
      }

      return translated;
    }

    // Patrones legacy (para compatibilidad con notificaciones antiguas)
    // Patrón para "Nombre (email) ha solicitado la verificación de su cuenta." (español)
    const verificationPatternES = /^(.+?) \((.+?)\) ha solicitado la verificación de su cuenta\.$/;
    const verificationMatchES = message.match(verificationPatternES);
    if (verificationMatchES) {
      const [, name, email] = verificationMatchES;
      return this.t.instant('notifications.messages.userVerificationRequest', { name, email });
    }

    // Patrón para "Name (email) has requested account verification." (inglés)
    const verificationPatternEN = /^(.+?) \((.+?)\) has requested account verification\.$/;
    const verificationMatchEN = message.match(verificationPatternEN);
    if (verificationMatchEN) {
      const [, name, email] = verificationMatchEN;
      return this.t.instant('notifications.messages.userVerificationRequest', { name, email });
    }

    // Patrón para "Nombre ha solicitado el rol ROL." (español)
    const roleRequestPatternES = /^(.+?) ha solicitado el rol (.+?)\.$/;
    const roleRequestMatchES = message.match(roleRequestPatternES);
    if (roleRequestMatchES) {
      const [, name, role] = roleRequestMatchES;
      return this.t.instant('notifications.messages.roleRequest', { name, role });
    }

    // Patrón para "Name has requested the ROL role." (inglés)
    const roleRequestPatternEN = /^(.+?) has requested the (.+?) role\.$/;
    const roleRequestMatchEN = message.match(roleRequestPatternEN);
    if (roleRequestMatchEN) {
      const [, name, role] = roleRequestMatchEN;
      return this.t.instant('notifications.messages.roleRequest', { name, role });
    }

    // Patrón para "Nombre ha solicitado cambiar de rol ROL_VIEJO a ROL_NUEVO." (español)
    const roleChangePatternES = /^(.+?) ha solicitado cambiar de rol (.+?) a (.+?)\.$/;
    const roleChangeMatchES = message.match(roleChangePatternES);
    if (roleChangeMatchES) {
      const [, name, oldRole, newRole] = roleChangeMatchES;
      return this.t.instant('notifications.messages.roleChange', { name, oldRole, newRole });
    }

    // Patrón para "Name has requested to change role from OLD to NEW." (inglés)
    const roleChangePatternEN = /^(.+?) has requested to change role from (.+?) to (.+?)\.$/;
    const roleChangeMatchEN = message.match(roleChangePatternEN);
    if (roleChangeMatchEN) {
      const [, name, oldRole, newRole] = roleChangeMatchEN;
      return this.t.instant('notifications.messages.roleChange', { name, oldRole, newRole });
    }

    // Si no coincide con ningún patrón, devolver el mensaje original
    return message;
  }
}
