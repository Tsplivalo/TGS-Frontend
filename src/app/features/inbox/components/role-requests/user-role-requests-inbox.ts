import { Component, OnInit, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Role } from '../../../../models/user/user.model';
import { RoleRequestService } from '../../services/role-request';
import { RoleRequest } from '../../models/role-request.model';
import { RoleRequestModalComponent } from './role-request-modal';
import { RoleRequestCardComponent } from './role-request-card';
import { AuthService } from '../../../../services/auth/auth';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-user-role-requests-inbox',
  standalone: true,
  imports: [CommonModule, RoleRequestModalComponent, RoleRequestCardComponent,TranslateModule],
  templateUrl: './user-role-requests-inbox.html',
  styleUrls: ['./role-requests.scss']
})


export class UserRoleRequestsInboxComponent implements OnInit {
  private t = inject(TranslateService);
  constructor(
    private auth: AuthService,
    private roleRequestService: RoleRequestService
  ) {}
  @Input() currentRoles: Role[] = [];
  @Input() hasCompleteProfile: boolean = false;
  @Input() isVerified: boolean = false;
  @Input() userName: string = '';
  @Input() userEmail: string = '';

  requests: RoleRequest[] = [];
  loading: boolean = true;
  error: string | null = null;
  isModalOpen: boolean = false;

  readonly compatibilityRuleKeys: Array<'distributor' | 'partner' | 'authority'> = [
    'distributor',
    'partner',
    'authority',
  ];

  ngOnInit(): void {
    this.loadRequests();
  }

  async loadRequests(): Promise<void> {
    try {
      this.loading = true;
      this.error = null;
      this.requests = await this.roleRequestService.getMyRequests();
    } catch (err: any) {
      this.error = err.error?.message || 'Error al cargar tus solicitudes';
    } finally {
      this.loading = false;
    }
  }

  openModal(): void {
    // ✅ Validación adicional
    if (!this.isVerified) {
      this.error = 'Debes verificar tu cuenta antes de solicitar roles especiales';
      return;
    }
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  handleRequestSubmitted(): void {
    this.loadRequests().then(() => {
      // Buscar aprobadas y refrescar roles para reflejar el cambio sin relogin
      const hasApproved = this.requests?.some(r => r.status === 'APPROVED');
      if (hasApproved) {
        this.auth.forceRefresh();
      }
    });
    this.closeModal();
  }

  roleTranslationKey(role: Role): string {
    return `roleRequests.inbox.roleLabels.${role.toLowerCase()}`;
  }

  userInitial(): string {
    const source = this.userName || this.userEmail || '';
    return source.trim().charAt(0).toUpperCase() || 'U';
  }

  trackRole = (_: number, role: Role) => role;
}
