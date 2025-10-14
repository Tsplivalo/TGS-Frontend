// Tipado de respuestas API (acepta {data: T} o T directo)
export type ApiResponse<T = any> = { data: T } | T;

export interface ProductDTO {
  id: number;
  description: string;
  detail: string;           // ← requerido por el back
  price: number;
  stock: number;
  isIllegal: boolean;
  imageUrl?: string | null; // solo front
}

export interface CreateProductDTO {
  description: string;      // min 3, max 50 (según back)
  detail: string;           // min 3, max 200 (según back)
  price: number;            // > 0
  stock: number;            // int >= 0
  isIllegal: boolean;
  imageUrl?: string | null; // solo front
}

export interface UpdateProductDTO {
  description?: string;
  detail?: string;
  price?: number;
  stock?: number;
  isIllegal?: boolean;
  imageUrl?: string | null; // solo front
}
