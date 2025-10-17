import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Role } from '../../../../models/user/user.model';
import { RoleRequestService } from '../../services/role-request';
import { RoleRequest } from '../../models/role-request.model';
import { RoleRequestModalComponent } from './role-request-modal';
import { RoleRequestCardComponent } from './role-request-card';

@Component({
  selector: 'app-user-role-requests-inbox',
  standalone: true,
  imports: [CommonModule, RoleRequestModalComponent, RoleRequestCardComponent],
  templateUrl: './user-role-requests-inbox.html',
  styleUrls: ['./role-requests.scss']
})
export class UserRoleRequestsInboxComponent implements OnInit {
  @Input() currentRoles: Role[] = [];
  @Input() hasCompleteProfile: boolean = false;

  requests: RoleRequest[] = [];
  loading: boolean = true;
  error: string | null = null;
  isModalOpen: boolean = false;

  constructor(private roleRequestService: RoleRequestService) {}

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
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  handleRequestSubmitted(): void {
    this.loadRequests();
    this.closeModal();
  }
}