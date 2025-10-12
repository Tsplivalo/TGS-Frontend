import { Injectable, inject, computed } from '@angular/core';
import { AuthService } from '../auth/auth';
import { Permission, getPermissionsForRoles } from '../../config/permissions.config';

/**
 * Service to manage user permissions based on roles
 *
 * Usage:
 * - Check single permission: permissionService.hasPermission(Permission.VIEW_PRODUCTS)
 * - Check multiple (AND): permissionService.hasAllPermissions([...])
 * - Check multiple (OR): permissionService.hasAnyPermission([...])
 * - Check role: permissionService.hasRole('admin')
 */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private auth = inject(AuthService);

  /**
   * Computed signal that returns the current user's permissions as a Set
   * Automatically updates when user changes
   */
  readonly userPermissions = computed(() => {
    const user = this.auth.user();
    if (!user || !user.roles) return new Set<Permission>();

    return getPermissionsForRoles(user.roles);
  });

  /**
   * Check if user has a specific permission
   */
  hasPermission(permission: Permission): boolean {
    return this.userPermissions().has(permission);
  }

  /**
   * Check if user has ALL of the specified permissions (AND logic)
   */
  hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every(p => this.hasPermission(p));
  }

  /**
   * Check if user has ANY of the specified permissions (OR logic)
   */
  hasAnyPermission(permissions: Permission[]): boolean {
    if (permissions.length === 0) return false;
    return permissions.some(p => this.hasPermission(p));
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: string): boolean {
    const user = this.auth.user();
    return user?.roles?.includes(role) ?? false;
  }

  /**
   * Check if user has ANY of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    if (roles.length === 0) return false;
    return roles.some(role => this.hasRole(role));
  }

  /**
   * Get all user roles
   */
  getUserRoles(): string[] {
    const user = this.auth.user();
    return user?.roles || [];
  }
}
