// Ajustado al DTO que expone el backend en toDTO()
export interface AutoridadDTO {
  dni: string;
  nombre: string;
  rango: number;   // 0..3
  zona?: {
    id?: number | string;
    nombre?: string;
  } | null;
  sobornos?: any;  // el back puede devolver lista o string
}

// Body para crear (según zod schema del back)
export interface CreateAutoridadDTO {
  dni: string;
  nombre: string;
  email: string;
  direccion?: string;
  telefono?: string;
  // el back espera string '0'|'1'|'2'|'3' y lo transforma a number
  rango: '0' | '1' | '2' | '3';
  // el back espera string y lo transforma a number
  zonaId: string;
}

// Body para actualización completa (PUT)
export interface UpdateAutoridadDTO {
  nombre: string;
  rango: '0' | '1' | '2' | '3';
  zonaId: string;
}

// Body para actualización parcial (PATCH)
export interface PatchAutoridadDTO {
  nombre?: string;
  rango?: '0' | '1' | '2' | '3';
  zonaId?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
