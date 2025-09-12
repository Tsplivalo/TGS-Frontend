export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export type SobornoEstado = 'PENDIENTE' | 'PAGADO';

export interface SobornoPendienteDTO {
  id: number;
  autoridadId: number;      // o dni/clave que uses en el back (ajústalo si hace falta)
  monto: number;
  estado: SobornoEstado;
  fecha: string;            
  observaciones?: string;
}

// Para crear (sin id)
export type CreateSobornoDTO = Omit<SobornoPendienteDTO, 'id'>;

// Para actualizar parcial
export type UpdateSobornoDTO = Partial<SobornoPendienteDTO>;
