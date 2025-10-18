import { Component, Input, Output, EventEmitter, OnChanges,inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Role } from '../../../../models/user/user.model';
import { RoleRequestService } from '../../services/role-request';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface RoleOption {
  value: Role;
  label: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-role-request-modal',
  standalone: true,
  imports: [CommonModule, FormsModule,TranslateModule],
  templateUrl: './role-request-modal.html',
  styleUrls: ['./role-requests.scss']
})
export class RoleRequestModalComponent implements OnChanges {
  @Input() isOpen: boolean = false;
  @Input() currentRoles: Role[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() requestSubmitted = new EventEmitter<void>();
  private t = inject(TranslateService);

  requestedRole: Role | '' = '';
  roleToRemove: Role | '' = '';
  justification: string = '';
  isSubmitting: boolean = false;
  error: string | null = null;
  isRoleChange: boolean = false;

  readonly REQUESTABLE_ROLES: RoleOption[] = [
    {
      value: Role.PARTNER,
      label: 'Socio',
      description: 'Participa activamente en el negocio como socio de la organización',
      icon: '🤝',
    },
    {
      value: Role.DISTRIBUTOR,
      label: 'Distribuidor',
      description: 'Gestiona la distribución de productos en tu zona',
      icon: '📦',
    },
    {
      value: Role.AUTHORITY,
      label: 'Autoridad',
      description: 'Figura de autoridad que facilita operaciones gubernamentales',
      icon: '⚖️',
    },
  ];

  readonly INCOMPATIBLE_ROLES: Record<string, Role[]> = {
    [Role.AUTHORITY]: [Role.PARTNER, Role.DISTRIBUTOR, Role.ADMIN],
    [Role.PARTNER]: [Role.AUTHORITY],
    [Role.DISTRIBUTOR]: [Role.AUTHORITY],
    [Role.ADMIN]: [Role.AUTHORITY],
  };

  constructor(private roleRequestService: RoleRequestService) {}

  ngOnChanges(): void {
    if (!this.isOpen) {
      this.resetForm();
    }
  }

  get removableRoles(): Role[] {
    return this.currentRoles.filter((role) =>
      [Role.PARTNER, Role.DISTRIBUTOR, Role.AUTHORITY].includes(role)
    );
  }

  get availableRoles(): RoleOption[] {
    return this.REQUESTABLE_ROLES.filter((role) => {
      if (this.currentRoles.includes(role.value)) return false;
      if (this.isRoleChange) return true;
      return this.isRoleCompatible(role.value);
    });
  }

  get selectedRoleDescription(): string | undefined {
    if (!this.requestedRole) return undefined;
    return this.REQUESTABLE_ROLES.find((r) => r.value === this.requestedRole)?.description;
  }

  get incompatibleRolesText(): string | null {
    if (!this.requestedRole) return null;
    const incompatible = this.INCOMPATIBLE_ROLES[this.requestedRole];
    return incompatible ? incompatible.join(', ') : null;
  }

  isRoleCompatible(role: Role): boolean {
    const incompatibleWith = this.INCOMPATIBLE_ROLES[role] || [];
    const rolesToCheck = this.isRoleChange && this.roleToRemove
      ? this.currentRoles.filter((r) => r !== this.roleToRemove)
      : this.currentRoles;

    return !rolesToCheck.some((currentRole) =>
      incompatibleWith.includes(currentRole)
    );
  }

  onRoleChangeToggle(checked: boolean): void {
    this.isRoleChange = checked;
    this.requestedRole = '';
    this.roleToRemove = '';
    this.error = null;
  }

  getRoleInfo(role: Role): RoleOption | undefined {
    return this.REQUESTABLE_ROLES.find((r) => r.value === role);
  }

  async onSubmit(): Promise<void> {
    this.error = null;

    // ✅ Validación básica: rol solicitado es requerido
    if (!this.requestedRole) {
      this.error = 'Por favor selecciona un rol';
      return;
    }

    // ✅ Si es cambio de rol, roleToRemove es requerido
    if (this.isRoleChange && !this.roleToRemove) {
      this.error = 'Por favor selecciona el rol que deseas remover';
      return;
    }

    // ✅ CORREGIDO: Justificación es OPCIONAL en el backend
    // Solo validamos si el usuario escribió algo
    if (this.justification.trim().length > 0) {
      if (this.justification.length < 20) {
        this.error = 'Si proporcionas una justificación, debe tener al menos 20 caracteres';
        return;
      }
      if (this.justification.length > 500) {
        this.error = 'La justificación no puede exceder 500 caracteres';
        return;
      }
    }

    // ✅ Validación de compatibilidad de roles
    if (!this.isRoleChange && !this.isRoleCompatible(this.requestedRole as Role)) {
      const incompatible = this.INCOMPATIBLE_ROLES[this.requestedRole] || [];
      const conflictingRoles = this.currentRoles.filter((r) =>
        incompatible.includes(r)
      );
      this.error = `El rol ${this.requestedRole} es incompatible con tus roles actuales: ${conflictingRoles.join(', ')}`;
      return;
    }

    this.isSubmitting = true;

    try {
      const payload: any = {
        requestedRole: this.requestedRole,
      };

      // ✅ Solo agregar roleToRemove si es cambio de rol
      if (this.isRoleChange && this.roleToRemove) {
        payload.roleToRemove = this.roleToRemove;
      }

      // ✅ Solo agregar justification si el usuario escribió algo
      if (this.justification.trim().length > 0) {
        payload.justification = this.justification.trim();
      }

      await this.roleRequestService.createRequest(payload);
      this.requestSubmitted.emit();
      this.resetForm();
    } catch (err: any) {
      console.error('Error creating role request:', err);
      
      // ✅ Mejorar manejo de errores
      if (err.error?.errors && Array.isArray(err.error.errors)) {
        this.error = err.error.errors.map((e: any) => e.message).join(', ');
      } else if (err.error?.message) {
        this.error = err.error.message;
      } else {
        this.error = 'Error al enviar la solicitud. Por favor intenta nuevamente.';
      }
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

  resetForm(): void {
    this.requestedRole = '';
    this.roleToRemove = '';
    this.justification = '';
    this.isRoleChange = false;
    this.error = null;
  }
}