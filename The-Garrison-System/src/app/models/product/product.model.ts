// Tipado de respuestas API (acepta {data: T} o T directo)
export type ApiResponse<T = any> = { data: T } | T;

export interface ProductDTO {
  id: number;
  description?: string | null;
  price: number;
  stock: number;
  isIllegal: boolean;
  imageUrl?: string | null; // ← NUEVO
}

export interface CreateProductDTO {
  description: string;
  price: number;
  stock: number;
  isIllegal: boolean;
  imageUrl?: string | null; // ← NUEVO
}

export interface UpdateProductDTO {
  description?: string;
  price?: number;
  stock?: number;
  isIllegal?: boolean;
  imageUrl?: string | null; // ← NUEVO
}
