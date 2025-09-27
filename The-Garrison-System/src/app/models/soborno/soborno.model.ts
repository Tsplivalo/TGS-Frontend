export interface SobornoDTO {
  id: number;
  monto: number;
  pagado: boolean;
  fechaCreacion?: string;

  // Relaciones (tu back popula autoridad y venta)
  autoridad?: { id: string | number; dni?: string; nombre?: string } | null;
  autoridadId?: string | number | null;
  autoridadDni?: string | null; // lo mantenemos por compatibilidad UI

  venta?: { id: number } | null;
  ventaId?: number | null;
}

export interface CreateSobornoDTO {
  // 👇 el back espera estos nombres
  monto: number;
  autoridadId: string | number; // ID de Autoridad, no DNI
  ventaId: number;
  pagado?: boolean;
}

export interface UpdateSobornoDTO {
  monto?: number;
  autoridadId?: string | number;
  ventaId?: number;
  pagado?: boolean;
  // si tu back permite tocar la fecha:
  fechaCreacion?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
