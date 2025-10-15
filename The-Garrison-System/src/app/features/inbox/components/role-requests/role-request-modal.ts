import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Role } from '../../../../models/user/user.model';
import { RoleRequestService } from '../../services/role-request';

interface RoleOption {
  value: Role;
  label: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-role-request-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './role-request-modal.html',
  styleUrls: ['./role-requests.scss']
})
export class RoleRequestModalComponent implements OnChanges {
  @Input() isOpen: boolean = false;
  @Input() currentRoles: Role[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() requestSubmitted = new EventEmitter<void>();

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

    if (!this.requestedRole) {
      this.error = 'Por favor selecciona un rol';
      return;
    }

    if (this.isRoleChange && !this.roleToRemove) {
      this.error = 'Por favor selecciona el rol que deseas remover';
      return;
    }

    if (this.justification.length < 20) {
      this.error = 'La justificación debe tener al menos 20 caracteres';
      return;
    }

    if (this.justification.length > 500) {
      this.error = 'La justificación no puede exceder 500 caracteres';
      return;
    }

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
        justification: this.justification,
      };

      if (this.isRoleChange && this.roleToRemove) {
        payload.roleToRemove = this.roleToRemove;
      }

      await this.roleRequestService.createRequest(payload);
      this.requestSubmitted.emit();
      this.resetForm();
    } catch (err: any) {
      this.error = err.error?.message || 'Error al enviar la solicitud. Por favor intenta nuevamente.';
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