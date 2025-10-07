export interface ZoneDTO {
  id: number;
  name: string;
  description?: string;
  isHeadquarters: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Para creación (sin id)
export type CreateZoneDTO = Omit<ZoneDTO, 'id'>;

// Para reemplazo completo (PUT)
export type UpdateZonaDTO = CreateZoneDTO;

// Para parches (PATCH)
export type PatchZonaDTO = Partial<CreateZoneDTO>;
