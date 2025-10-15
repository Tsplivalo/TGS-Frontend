// ============================================
// MODELOS DE DISTRIBUIDOR - VERIFICADOS
// Sincronizado con backend
// ============================================

export type ApiResponse<T = any> = { 
  message?: string; 
  success?: boolean; 
  data?: T 
} | T;

export interface DistributorDTO {
  dni: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
  zoneId?: number | null;
  zone?: { 
    id: number; 
    name: string;
    isHeadquarters?: boolean;
  } | null;
  products?: Array<{ 
    id: number; 
    description: string;
  }>;
  sales?: any[]; // Opcional, solo viene en detailed
}

export interface CreateDistributorDTO {
  dni: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
  zoneId: number; // ← Backend lo transforma de string a number
  productsIds?: number[];
}

export interface PatchDistributorDTO {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  zoneId?: number; // ← Backend lo transforma de string a number
  productsIds?: number[];
}