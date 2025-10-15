// src/app/models/bribe/bribe.model.ts

/**
 * DTO del soborno que coincide con la respuesta del backend
 */
export interface BribeDTO {
  id: number;
  amount: number;
  paid: boolean;
  creationDate: string;
  authority: {
    dni: string;
    name: string;
  };
  sale: {
    id: number;
  };
}

/**
 * DTO para crear un soborno
 */
export interface CreateBribeDTO {
  amount: number;
  authorityId: number;
  saleId: number;
}

/**
 * DTO para actualizar un soborno
 */
export interface UpdateBribeDTO {
  amount?: number;
}

/**
 * DTO para marcar sobornos como pagados
 */
export interface PayBribesDTO {
  ids: number | number[];
}

/**
 * Respuesta al pagar sobornos
 */
export interface PayBribesResponse {
  paid: Array<{
    id: number;
    paid: boolean;
  }>;
  summary: {
    totalRequested: number;
    successfullyPaid: number;
    notFound: number;
  };
  notFoundIds?: number[];
}

/**
 * Estructura de respuesta estándar del API
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}