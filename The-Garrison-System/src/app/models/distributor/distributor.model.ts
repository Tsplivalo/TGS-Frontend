// src/app/models/distributor/distributor.model.ts
export type ApiResponse<T = any> = { message?: string; success?: boolean; data?: T } | T;

export type DistributorDTO = {
  dni: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
  zoneId?: number | null;
  zone?: { id: number; name: string } | null;
  products?: Array<{ id: number; description: string }>;
};

export type CreateDistributorDTO = {
  dni: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
  zoneId: number;                
  productsIds?: number[];        
};

export type PatchDistributorDTO = Partial<{
  name: string;
  phone: string;
  email: string;
  address: string;
  zoneId: number;
  productsIds: number[];
}>;
