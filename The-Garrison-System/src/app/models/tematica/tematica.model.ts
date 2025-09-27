export interface TematicaDTO {
  id: number;
  descripcion: string;
}

export interface CreateTematicaDTO {
  descripcion: string;
}

export interface UpdateTematicaDTO {
  descripcion?: string; // PATCH parcial
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
