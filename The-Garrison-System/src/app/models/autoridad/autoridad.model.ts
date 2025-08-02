export interface AutoridadDTO {
  dni: string;
  nombre: string;
  rango: number;
  zona: { nombre: string } | null;
}

export interface ApiResponse<T> {
  data: T;
}

/** Lo que envías al crear */
export interface CreateAutoridadDTO {
  dni: string;
  nombre: string;
  rango: number;
  zonaId: number;
}

/** Para reemplazo completo (PUT) */
export type UpdateAutoridadDTO = Omit<CreateAutoridadDTO, 'dni'>;

/** Para parches parciales (PATCH) */
export type PartialUpdateAutoridadDTO = Partial<UpdateAutoridadDTO>;
