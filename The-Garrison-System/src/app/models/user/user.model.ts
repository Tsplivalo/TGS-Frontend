export enum Role {
  CLIENT = 'CLIENT',
  PARTNER = 'PARTNER',
  DISTRIBUTOR = 'DISTRIBUTOR',
  AUTHORITY = 'AUTHORITY',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  username: string;
  email: string;
  roles: Role[];
  profileCompleteness?: number;
  hasPersonalInfo?: boolean;
  createdAt: string;
  updatedAt: string;
}