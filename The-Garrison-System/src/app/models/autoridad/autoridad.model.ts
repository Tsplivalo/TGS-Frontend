// src/app/models/autoridad/autoridad.model.ts

// Genérico de respuestas del backend (igual al que usás en otros módulos)
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Referencias mínimas para evitar dependencias cruzadas
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

// DTO principal que devuelve el backend.
// Hacemos "id" opcional para ser tolerantes si en algún endpoint no viene.
export interface AutoridadDTO {
  id?: number;
  usuario?: UsuarioRef | null;
  zona?: ZonaRef | null;
  rango?: string;
}

// Crear autoridad (lo que envía el front)
export interface CreateAutoridadDTO {
  usuarioDni: string;
  zonaId: number;
  rango: string;
}

// Update: usamos el DTO completo también para update (evita problemas de tipos con Partial)
export type UpdateAutoridadDTO = CreateAutoridadDTO;

// Si preferís PATCH con campos opcionales, cambiá la línea de arriba por:
// export type UpdateAutoridadDTO = Partial<CreateAutoridadDTO>;
