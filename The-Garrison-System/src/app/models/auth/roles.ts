export type Role = 'ADMIN' | 'SOCIO' | 'DISTRIBUIDOR' | 'CLIENT' | 'CLIENTE' | 'ADMINISTRATOR';

export const ROLES = {
  ADMIN: 'ADMIN' as Role,
  SOCIO: 'SOCIO' as Role,
  DISTRIBUIDOR: 'DISTRIBUIDOR' as Role,
  CLIENT: 'CLIENT' as Role,
  CLIENTE: 'CLIENTE' as Role,
  ADMINISTRATOR: 'ADMINISTRATOR' as Role,
};

export function normalizeRoles(rs?: string[] | null): Role[] {
  return (rs ?? []).map(r => r.toUpperCase()) as Role[];
}

export function hasAnyRole(userRoles: string[] | undefined | null, required: string[]): boolean {
  const set = new Set((userRoles ?? []).map(r => r.toUpperCase()));
  return required.some(r => set.has(r.toUpperCase()));
}

// ---- Helpers para DEV (sin backend) ----
export function devBypass(): boolean {
  return typeof localStorage !== 'undefined' && localStorage.getItem('authBypass') === 'true';
}

export function getMockRoles(): Role[] {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem('mockRoles');
  const items = raw ? raw.split(',').map(s => s.trim().toUpperCase()) : [];
  return normalizeRoles(items);
}
