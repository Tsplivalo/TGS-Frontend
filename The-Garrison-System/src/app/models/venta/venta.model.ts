export interface VentaClienteDTO {
  dni: string;
  nombre?: string;
}

export interface VentaProductoDTO {
  id: number;
  descripcion?: string;
  precio?: number;
  stock?: number;
}

export interface VentaDetalleDTO {
  productoId: number;
  cantidad: number;
  // al leer, puede venir expandido
  producto?: VentaProductoDTO;
}

export interface VentaDTO {
  id: number;
  fecha?: string;
  cliente?: VentaClienteDTO | null;

  // Soporte legacy (venta de 1 sola línea)
  producto?: VentaProductoDTO | null;
  cantidad?: number | null;

  // Nuevo formato (multi ítems)
  detalles?: VentaDetalleDTO[];

  total?: number;
}

export interface CreateVentaDTO {
  clienteDni: string;
  detalles: VentaDetalleDTO[]; // requerido
}

export interface UpdateVentaDTO {
  clienteDni?: string;
  // edición moderna
  detalles?: VentaDetalleDTO[];
  // compatibilidad (si el back todavía lo soporta):
  productoId?: number;
  cantidad?: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
