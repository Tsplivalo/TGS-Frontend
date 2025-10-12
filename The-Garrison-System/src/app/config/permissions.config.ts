export enum Permission {
  // Products
  VIEW_PRODUCTS = 'view:products',
  CREATE_PRODUCTS = 'create:products',
  UPDATE_PRODUCTS = 'update:products',
  DELETE_PRODUCTS = 'delete:products',

  // Purchases
  VIEW_OWN_PURCHASES = 'view:own:purchases',
  VIEW_ALL_PURCHASES = 'view:all:purchases',

  // Users (sensitive - admin only)
  VIEW_OWN_PROFILE = 'view:own:profile',
  UPDATE_OWN_PROFILE = 'update:own:profile',
  VIEW_USERS_LIST = 'view:users:list',
  CREATE_USERS = 'create:users',
  UPDATE_USERS = 'update:users',
  DELETE_USERS = 'delete:users',

  // Zones
  VIEW_ZONES = 'view:zones',
  CREATE_ZONES = 'create:zones',
  UPDATE_ZONES = 'update:zones',
  DELETE_ZONES = 'delete:zones',

  // Distributors
  VIEW_DISTRIBUTORS = 'view:distributors',
  CREATE_DISTRIBUTORS = 'create:distributors',
  UPDATE_DISTRIBUTORS = 'update:distributors',
  DELETE_DISTRIBUTORS = 'delete:distributors',

  // Partners (sensitive - cannot access other partners' data)
  VIEW_PARTNERS = 'view:partners',
  VIEW_OWN_PARTNER_DATA = 'view:own:partner:data',
  CREATE_PARTNERS = 'create:partners',
  UPDATE_PARTNERS = 'update:partners',
  DELETE_PARTNERS = 'delete:partners',

  // Authorities (distributor + partner can manage)
  VIEW_AUTHORITIES = 'view:authorities',
  CREATE_AUTHORITIES = 'create:authorities',
  UPDATE_AUTHORITIES = 'update:authorities',
  DELETE_AUTHORITIES = 'delete:authorities',

  // Bribes (partner only - CANNOT BE DELETED)
  VIEW_BRIBES = 'view:bribes',
  CREATE_BRIBES = 'create:bribes',
  UPDATE_BRIBES = 'update:bribes',
  // NO DELETE_BRIBES - bribes cannot be deleted

  // Strategic decisions (partner only)
  VIEW_DECISIONS = 'view:decisions',
  CREATE_DECISIONS = 'create:decisions',
  UPDATE_DECISIONS = 'update:decisions',
  DELETE_DECISIONS = 'delete:decisions',

  // Topics (partner only)
  VIEW_TOPICS = 'view:topics',
  CREATE_TOPICS = 'create:topics',
  UPDATE_TOPICS = 'update:topics',
  DELETE_TOPICS = 'delete:topics',

  // Sales (CANNOT BE DELETED)
  VIEW_SALES = 'view:sales',
  CREATE_SALES = 'create:sales',
  UPDATE_SALES = 'update:sales',
  // NO DELETE_SALES - sales cannot be deleted
}

/**
 * Role-based permissions mapping
 *
 * NOTES:
 * - "Managing" = Create + Update + Delete (except for bribes and sales which cannot be deleted)
 * - cliente: Base user, can view products, purchases, zones, distributors
 * - distribuidor: Can MANAGE products (create/update/delete), MANAGE authorities, CREATE/UPDATE sales
 * - socio (partner): Can MANAGE authorities, MANAGE bribes (create/update only), MANAGE strategic decisions
 * - admin: Full access to sensitive data (users, all partners, all distributors)
 *
 * IMPORTANT: distribuidor and socio CANNOT access:
 * - Other users' sensitive data
 * - Other partners' sensitive data
 * - Other distributors' sensitive data
 * - Admin user list
 *
 * RESTRICTIONS:
 * - Bribes CANNOT be deleted (no DELETE_BRIBES permission exists)
 * - Sales CANNOT be deleted (no DELETE_SALES permission exists)
 */
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  cliente: [
    // View-only permissions
    Permission.VIEW_PRODUCTS,
    Permission.VIEW_OWN_PURCHASES,
    Permission.VIEW_OWN_PROFILE,
    Permission.UPDATE_OWN_PROFILE,
    Permission.VIEW_ZONES,
    Permission.VIEW_DISTRIBUTORS,
    Permission.VIEW_PARTNERS,
  ],

  distribuidor: [
    // Inherits cliente permissions
    Permission.VIEW_PRODUCTS,
    Permission.VIEW_OWN_PURCHASES,
    Permission.VIEW_OWN_PROFILE,
    Permission.UPDATE_OWN_PROFILE,
    Permission.VIEW_ZONES,
    Permission.VIEW_DISTRIBUTORS,
    Permission.VIEW_PARTNERS,

    // Product management (full CRUD)
    Permission.CREATE_PRODUCTS,
    Permission.UPDATE_PRODUCTS,
    Permission.DELETE_PRODUCTS,

    // Authority management (full CRUD)
    Permission.VIEW_AUTHORITIES,
    Permission.CREATE_AUTHORITIES,
    Permission.UPDATE_AUTHORITIES,
    Permission.DELETE_AUTHORITIES,

    // Sales (create and update only, no delete)
    Permission.VIEW_SALES,
    Permission.CREATE_SALES,
    Permission.UPDATE_SALES,
  ],

  socio: [
    // Inherits cliente permissions
    Permission.VIEW_PRODUCTS,
    Permission.VIEW_OWN_PURCHASES,
    Permission.VIEW_OWN_PROFILE,
    Permission.UPDATE_OWN_PROFILE,
    Permission.VIEW_ZONES,
    Permission.VIEW_DISTRIBUTORS,
    Permission.VIEW_PARTNERS,
    Permission.VIEW_OWN_PARTNER_DATA,

    // Authority management (full CRUD)
    Permission.VIEW_AUTHORITIES,
    Permission.CREATE_AUTHORITIES,
    Permission.UPDATE_AUTHORITIES,
    Permission.DELETE_AUTHORITIES,

    // Bribe management (create and update only, NO delete)
    Permission.VIEW_BRIBES,
    Permission.CREATE_BRIBES,
    Permission.UPDATE_BRIBES,

    // Strategic decisions management (full CRUD)
    Permission.VIEW_DECISIONS,
    Permission.CREATE_DECISIONS,
    Permission.UPDATE_DECISIONS,
    Permission.DELETE_DECISIONS,

    // Topics management (full CRUD)
    Permission.VIEW_TOPICS,
    Permission.CREATE_TOPICS,
    Permission.UPDATE_TOPICS,
    Permission.DELETE_TOPICS,
  ],

  admin: [
    // Products (full CRUD)
    Permission.VIEW_PRODUCTS,
    Permission.CREATE_PRODUCTS,
    Permission.UPDATE_PRODUCTS,
    Permission.DELETE_PRODUCTS,

    // Purchases (view all)
    Permission.VIEW_OWN_PURCHASES,
    Permission.VIEW_ALL_PURCHASES,

    // Users (full CRUD - SENSITIVE)
    Permission.VIEW_OWN_PROFILE,
    Permission.UPDATE_OWN_PROFILE,
    Permission.VIEW_USERS_LIST,
    Permission.CREATE_USERS,
    Permission.UPDATE_USERS,
    Permission.DELETE_USERS,

    // Zones (full CRUD)
    Permission.VIEW_ZONES,
    Permission.CREATE_ZONES,
    Permission.UPDATE_ZONES,
    Permission.DELETE_ZONES,

    // Distributors (full CRUD - SENSITIVE)
    Permission.VIEW_DISTRIBUTORS,
    Permission.CREATE_DISTRIBUTORS,
    Permission.UPDATE_DISTRIBUTORS,
    Permission.DELETE_DISTRIBUTORS,

    // Partners (full CRUD - SENSITIVE)
    Permission.VIEW_PARTNERS,
    Permission.CREATE_PARTNERS,
    Permission.UPDATE_PARTNERS,
    Permission.DELETE_PARTNERS,

    // Authorities (full CRUD)
    Permission.VIEW_AUTHORITIES,
    Permission.CREATE_AUTHORITIES,
    Permission.UPDATE_AUTHORITIES,
    Permission.DELETE_AUTHORITIES,

    // Bribes (create and update only, NO delete)
    Permission.VIEW_BRIBES,
    Permission.CREATE_BRIBES,
    Permission.UPDATE_BRIBES,

    // Strategic decisions (full CRUD)
    Permission.VIEW_DECISIONS,
    Permission.CREATE_DECISIONS,
    Permission.UPDATE_DECISIONS,
    Permission.DELETE_DECISIONS,

    // Topics (full CRUD)
    Permission.VIEW_TOPICS,
    Permission.CREATE_TOPICS,
    Permission.UPDATE_TOPICS,
    Permission.DELETE_TOPICS,

    // Sales (create and update only, NO delete)
    Permission.VIEW_SALES,
    Permission.CREATE_SALES,
    Permission.UPDATE_SALES,
  ],
};

/**
 * Get all permissions for a given set of roles
 */
export function getPermissionsForRoles(roles: string[]): Set<Permission> {
  const permissions = new Set<Permission>();

  roles.forEach(role => {
    const rolePerms = ROLE_PERMISSIONS[role] || [];
    rolePerms.forEach(p => permissions.add(p));
  });

  return permissions;
}
