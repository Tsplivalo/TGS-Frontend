import { Role } from '../../../models/user/user.model';

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface RoleRequestUser {
  id: string;
  username: string;
  email: string;
}

export interface RoleRequestReviewer {
  id: string;
  username: string;
}

export interface RoleRequest {
  id: string;
  user: RoleRequestUser;
  requestedRole: Role;
  roleToRemove: Role | null;
  isRoleChange: boolean;
  status: RequestStatus;
  justification?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy: RoleRequestReviewer | null;
  adminComments?: string;
}

export interface CreateRoleRequestDTO {
  requestedRole: Role;
  roleToRemove?: Role;
  justification?: string;
}

export interface ReviewRoleRequestDTO {
  action: 'approve' | 'reject';
  comments?: string;
}

export interface RoleRequestSearchParams {
  status?: RequestStatus;
  requestedRole?: Role;
  userId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedRoleRequests {
  data: RoleRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}