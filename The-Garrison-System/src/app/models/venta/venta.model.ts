// src/app/models/venta/venta.model.ts

/** Respuesta genérica del backend */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/** Referencias mínimas (para evitar dependencias cruzadas fuertes) */
export interface ClienteRef {
  dni: string;
  nombre?: string;
  email?: string;
}

export interface AutoridadRef {
  id: number;
  // podés agregar nombre/rango si tu backend lo devuelve
}

/** DTO principal que devuelve el backend para una venta */
export interface VentaDTO {
  id?: number;                 // lo dejo opcional por si algún endpoint no lo incluye
  descripcion?: string;
  fechaVenta: string;          // ISO string (ej: "2025-09-12T00:00:00.000Z")
  montoVenta: number;

  cliente?: ClienteRef | null; // el componente usa cliente?.dni
  autoridad?: AutoridadRef | null; // el componente usa autoridad?.id

  // Si tu backend devuelve esto, lo podés tipar después:
  // detalles?: DetalleDTO[];
}

/** Lo que envía el front para crear una venta */
export interface CreateVentaDTO {
  clienteDni: string;
  autoridadId: number;
  fechaVenta: string;   // ISO string
  montoVenta: number;
  descripcion?: string;
}

/** Update con PUT (enviar objeto completo) */
export type UpdateVentaDTO = CreateVentaDTO;

/** Update con PATCH (enviar campos parciales) */
export type PartialUpdateVentaDTO = Partial<CreateVentaDTO>;
