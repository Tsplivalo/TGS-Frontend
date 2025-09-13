// src/app/models/autoridad/autoridad.model.ts

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface UsuarioRef {
  dni: string;
  nombre?: string;
  email?: string;
  direccion?: string;
  telefono?: string;
}

export interface ZonaRef {
  id: number;
  nombre?: string;
  descripcion?: string;
}

// Lo que devuelve el backend
export interface AutoridadDTO {
  id?: number;                    // opcional para tolerar endpoints que no lo envíen
  usuario?: UsuarioRef | null;
  zona?: ZonaRef | null;
  rango?: string;
}

// Lo que envía el front para crear
export interface CreateAutoridadDTO {
  usuarioDni: string;
  zonaId: number;
  rango: string;
}

/** Update con PUT (campos completos) */
export type UpdateAutoridadDTO = CreateAutoridadDTO;

/** Update con PATCH (campos parciales) —> este es el que te falta y rompe la import */
export type PartialUpdateAutoridadDTO = Partial<CreateAutoridadDTO>;
