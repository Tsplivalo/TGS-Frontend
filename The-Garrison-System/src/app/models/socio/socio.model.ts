export type SocioStatus = 'active' | 'inactive';

export interface SocioDTO {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  status: SocioStatus;
  // por si mañana enlazás relaciones
  linkedEntityIds?: number[];
}

// respuestas típicas de tu API (soporta con/sin meta)
export interface ApiResponse<T> {
  success?: boolean;
  message: string;
  data: T;
  meta?: {
    timestamp?: string;
    statusCode?: number;
    total?: number;
    page?: number;
    limit?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
}

export interface ListResponse<T> extends ApiResponse<T[]> {}
export interface ItemResponse<T> extends ApiResponse<T> {}
