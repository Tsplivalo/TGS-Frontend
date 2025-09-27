// API response genérica
export interface ApiResponse<T> {
  message?: string;
  data?: T;
  error?: string;
}

// DTO principal
export interface SobornoDTO {
  id?: number;
  autoridadDni: string;
  ventaId: number;
  monto: number;
  pagado: boolean;
  // opcional: si el backend expande la relación
  venta?: { id: number };
}

// Crear
export type CreateSobornoDTO = Omit<SobornoDTO, 'id' | 'pagado' | 'venta'> & {
  pagado?: boolean; // opcional en la creación
};

// Actualizar
export type UpdateSobornoDTO = Partial<Omit<SobornoDTO, 'id'>>;

// Para endpoints de pagar (por lista de ids)
export interface PagarSobornosBody {
  ids: number | number[];
}
