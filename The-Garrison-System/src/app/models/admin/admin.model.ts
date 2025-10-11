export interface AdminDTO {
  dni: string;
  name: string;
  email: string;
  phone?: string | null;
}

export interface CreateAdminDTO {
  dni: string;
  name: string;
  email: string;
  phone?: string;
}

export interface PatchAdminDTO {
  name?: string;
  email?: string;
  phone?: string;
}

export interface ApiResponse<T> { data: T; message?: string; }
