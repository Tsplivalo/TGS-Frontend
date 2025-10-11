export type RoleName = 'ADMIN' | 'PARTNER' | 'DISTRIBUTOR' | 'CLIENT';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface RoleRequestDTO {
  id: string;
  requestedRole: RoleName;
  roleToRemove?: RoleName | null;
  reason?: string | null;
  status: RequestStatus;
  user: { id: string; email: string; username?: string | null };
  reviewedBy?: { id: string; email: string } | null;
  createdAt?: string; // ISO
  updatedAt?: string; // ISO
}

export interface CreateRoleRequestDTO {
  requestedRole: RoleName;
  roleToRemove?: RoleName;
  reason?: string;
}

export interface ReviewRoleRequestDTO {
  status: Exclude<RequestStatus, 'PENDING'>;
  adminNotes?: string;
}

export interface ApiResponse<T> { data: T; message?: string; }
