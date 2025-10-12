import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth/auth';
import { PermissionService } from '../services/permission/permission.service';
import { Permission } from '../config/permissions.config';

/**
 * Guard to check if user has required permissions
 *
 * Usage in routes:
 * {
 *   path: 'producto',
 *   canActivate: [authGuard, permissionGuard],
 *   data: {
 *     permissions: [Permission.VIEW_PRODUCTS],
 *     requireAll: true  // optional, defaults to true (AND logic)
 *   }
 * }
 *
 * - requireAll: true  -> User must have ALL permissions (AND)
 * - requireAll: false -> User must have ANY permission (OR)
 */
export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const permissionService = inject(PermissionService);
  const router = inject(Router);

  const requiredPermissions = route.data['permissions'] as Permission[];
  const requireAll = route.data['requireAll'] ?? true; // Default to AND logic

  // Check if user is authenticated
  const user = auth.user();
  if (!user) {
    router.navigateByUrl('/login');
    return false;
  }

  // If no permissions specified, allow access (authenticated only)
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  // Check permissions
  const hasPermission = requireAll
    ? permissionService.hasAllPermissions(requiredPermissions)
    : permissionService.hasAnyPermission(requiredPermissions);

  if (!hasPermission) {
    console.warn(`[PermissionGuard] Access denied to ${route.url}. Required permissions:`, requiredPermissions);
    router.navigateByUrl('/'); // Redirect to home or create /unauthorized page
    return false;
  }

  return true;
};
