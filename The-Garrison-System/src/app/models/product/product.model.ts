// ============================================
// MODELOS DE PRODUCTO - CORREGIDOS
// Sincronizado con backend: description, detail, price, stock, isIllegal
// ============================================

// Tipado de respuestas API
export type ApiResponse<T = any> = { data: T } | T;

// DTO que devuelve el backend
export interface ProductDTO {
  id: number;
  description: string;
  detail?: string; // ← NUEVO campo del backend
  price: number;
  stock: number;
  isIllegal: boolean;
  distributorsCount?: number;
  detailsCount?: number;
  // imageUrl es solo para el frontend (ProductImageService)
  imageUrl?: string | null;
}

// DTO para CREAR producto (lo que espera el backend)
export interface CreateProductDTO {
  description: string;
  detail: string; // ← REQUERIDO por el backend (min 3, max 200 chars)
  price: number;
  stock: number;
  isIllegal: boolean;
  // NO incluir imageUrl - el backend no lo acepta
}

// DTO para ACTUALIZAR producto (todos opcionales)
export interface UpdateProductDTO {
  description?: string;
  detail?: string; // ← NUEVO campo del backend
  price?: number;
  stock?: number;
  isIllegal?: boolean;
  // NO incluir imageUrl - el backend no lo acepta
}