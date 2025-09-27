export interface DecisionDTO {
  id: number;
  descripcion: string;
  fechaInicio: string; // ISO
  fechaFin: string;    // ISO
  tematica?: { id: number; descripcion: string } | null;
}

export interface CreateDecisionDTO {
  tematicaId: number;
  descripcion: string;
  fechaInicio: string; // yyyy-MM-dd
  fechaFin: string;    // yyyy-MM-dd
}

export interface PatchDecisionDTO {
  tematicaId?: number;
  descripcion?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
