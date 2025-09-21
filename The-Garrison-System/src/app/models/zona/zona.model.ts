export interface ZonaDTO {
  id: number;
  nombre: string;
  descripcion?: string;
  esSedeCentral: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Para creación (sin id)
export type CreateZonaDTO = Omit<ZonaDTO, 'id'>;

// Para reemplazo completo (PUT)
export type UpdateZonaDTO = CreateZonaDTO;

// Para parches (PATCH)
export type PatchZonaDTO = Partial<CreateZonaDTO>;
