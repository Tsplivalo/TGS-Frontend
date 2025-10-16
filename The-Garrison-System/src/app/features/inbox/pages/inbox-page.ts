// src/app/features/inbox/pages/inbox-page.component.ts
import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth/auth';
import { Role } from '../../../models/user/user.model';
import { AdminRoleRequestsInboxComponent } from '../components/role-requests/admin-role-requests-inbox';
import { UserRoleRequestsInboxComponent } from '../components/role-requests/user-role-requests-inbox';

@Component({
  selector: 'app-inbox-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AdminRoleRequestsInboxComponent,
    UserRoleRequestsInboxComponent,
  ],
  templateUrl: './inbox-page.html',
  styleUrls: ['./inbox-page.scss']
})
export class InboxPageComponent implements OnInit {
  private authService = inject(AuthService);

  // Sección activa para ADMIN
  activeSection = signal<'role-requests' | 'email-verification'>('role-requests');

  // Computed signals desde AuthService
  user = computed(() => this.authService.user());
  loading = signal(true);
  isAdmin = computed(() => this.authService.hasRole(Role.ADMIN));
  isClient = computed(() => this.authService.hasRole(Role.CLIENT));
  hasCompleteProfile = computed(() => this.authService.profileCompleteness() === 100);
  profileCompleteness = computed(() => this.authService.profileCompleteness());
  
  // ✅ Computed para saber si es cliente base (sin otros roles)
  isOnlyClient = computed(() => {
    const user = this.user();
    if (!user) return false;
    const roles = user.roles || [];
    const hasClient = roles.includes(Role.CLIENT);
    const hasOther = roles.some(r => 
      r === Role.ADMIN || 
      r === Role.PARTNER || 
      r === Role.DISTRIBUTOR || 
      r === Role.AUTHORITY
    );
    return hasClient && !hasOther;
  });

  // ✅ Computed para pasar roles actuales al componente hijo
  currentRoles = computed(() => this.user()?.roles || []);

  readonly Role = Role;

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      console.warn('[InboxPage] User not authenticated, should redirect');
      this.loading.set(false);
      return;
    }

    this.loading.set(false);
    this.refreshUser();
  }

  private refreshUser(): void {
    this.authService.me().subscribe({
      next: (user) => {
        console.log('[InboxPage] User refreshed:', user);
      },
      error: (err) => {
        console.error('[InboxPage] Error refreshing user:', err);
      }
    });
  }

  setActiveSection(section: 'role-requests' | 'email-verification'): void {
    this.activeSection.set(section);
  }

  getUserDisplayName(): string {
    return this.user()?.username || 'Usuario';
  }

  getProfileSuggestions(): string[] {
    return this.authService.getProfileSuggestions();
  }
}