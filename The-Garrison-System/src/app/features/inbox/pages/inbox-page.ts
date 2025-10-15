import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Role } from '../../../models/user/user.model';
import { AuthService } from '../../../services/auth/auth.js';
import { AdminRoleRequestsInboxComponent } from '../components/role-requests/admin-role-requests-inbox.js';
import { UserRoleRequestsInboxComponent } from '../components/role-requests/user-role-requests-inbox';

@Component({
  selector: 'app-inbox-page',
  standalone: true,
  imports: [
    CommonModule,
    AdminRoleRequestsInboxComponent,
    UserRoleRequestsInboxComponent,
  ],
  templateUrl: './inbox-page.html',
  styleUrls: ['./inbox-page.scss']
})
export class InboxPageComponent implements OnInit {
  activeSection: 'role-requests' | 'email-verification' = 'role-requests';
  user: any = null;
  loading: boolean = true;

  Role = Role;

  constructor(private authService: AuthService) {}

  async ngOnInit(): Promise<void> {
    try {
      this.user = await this.authService.getCurrentUser();
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      this.loading = false;
    }
  }

  get isAdmin(): boolean {
    return this.user?.roles?.includes(Role.ADMIN) || false;
  }

  get hasCompleteProfile(): boolean {
    return this.user?.profileCompleteness === 100 || false;
  }

  setActiveSection(section: 'role-requests' | 'email-verification'): void {
    this.activeSection = section;
  }
}