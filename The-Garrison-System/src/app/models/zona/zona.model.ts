export interface ZonaDTO {
  id: number;
  nombre: string;
}

export interface ApiResponse<T> {
  data: T;
}

// Para creación (sin id)
export type CreateZonaDTO = Omit<ZonaDTO, 'id'>;

// Para reemplazo completo (PUT)
export type UpdateZonaDTO = CreateZonaDTO;

// Para parches (PATCH)
export type PatchZonaDTO = Partial<CreateZonaDTO>;
